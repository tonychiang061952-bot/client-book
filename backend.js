// 資料層：Firebase Authentication（Google 登入）＋ Cloud Firestore
// 介面與 app.js 約定，不需要修改。Firebase 專案設定請改 config.js。
import { FIREBASE_CONFIG } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut as fbSignOut, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, collectionGroup,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});
getRedirectResult(auth).catch(() => {});

const toUser = u => u && ({ uid: u.uid, displayName: u.displayName || "", email: u.email || "", photoURL: u.photoURL || "" });
const clean = o => JSON.parse(JSON.stringify(o)); // 移除 undefined，Firestore 不接受

export const backend = {
  configured: !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !String(FIREBASE_CONFIG.apiKey).startsWith("請填")),

  onAuth(cb) { return onAuthStateChanged(auth, u => cb(toUser(u))); },

  async signIn() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try { await signInWithPopup(auth, provider); }
    catch (e) {
      if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) {
        await signInWithRedirect(auth, provider);
      } else throw e;
    }
  },

  signOut() { return fbSignOut(auth); },

  async isAdmin(uid) {
    try { return (await getDoc(doc(db, "admins", uid))).exists(); } catch (e) { return false; }
  },

  async getProfile(uid) {
    const s = await getDoc(doc(db, "users", uid));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  },

  createProfile(uid, data) {
    return setDoc(doc(db, "users", uid), { ...clean(data), status: "pending", createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
  },

  updateProfile(uid, data) {
    return updateDoc(doc(db, "users", uid), { ...clean(data), lastLoginAt: serverTimestamp() });
  },

  setStatus(uid, status) {
    return updateDoc(doc(db, "users", uid), { status, statusChangedAt: serverTimestamp() });
  },

  watchProfile(uid, cb, err) {
    return onSnapshot(doc(db, "users", uid), s => cb(s.exists() ? { id: s.id, ...s.data() } : null), err);
  },

  watchMyClients(uid, cb, err) {
    return onSnapshot(collection(db, "users", uid, "clients"),
      snap => cb(snap.docs.map(d => ({ ...d.data(), id: d.id }))), err);
  },

  saveClient(uid, c) {
    const body = clean({ ...c, ownerUid: uid });
    delete body._owner;
    return setDoc(doc(db, "users", uid, "clients", c.id), body);
  },

  deleteClient(uid, cid) { return deleteDoc(doc(db, "users", uid, "clients", cid)); },

  // ── 管理員 ──
  watchUsers(cb, err) {
    return onSnapshot(collection(db, "users"), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err);
  },

  watchAllClients(cb, err) {
    return onSnapshot(collectionGroup(db, "clients"),
      snap => cb(snap.docs.map(d => ({ ...d.data(), id: d.id, _owner: d.ref.parent.parent.id }))), err);
  }
};
