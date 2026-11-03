// 客戶經營名單｜前端主程式
import { backend } from "./backend.js?v=20261103";
import { TEAM } from "./config.js";

// 網站剛更新時，瀏覽器可能拿到舊的 index.html 配新的程式
if(!document.getElementById("bookSeg")){const m=document.getElementById("bootMsg");if(m)m.textContent="網站剛更新，請過幾分鐘再重新整理。";throw new Error("index.html 還是舊版")}

/* ---------- option dictionaries ---------- */
let SOURCES=[["A","親戚"],["B","朋友"],["C","鄉親"],["D","同好"],["E","消費"],["F","社團"],["G","同事"],["H","同學"],["I","老師"],["J","轉介"],["K","網路客"],["L","陌生開發"]];
let SRC=Object.fromEntries(SOURCES);
const SCORE={
  income:{label:"每月收入",opts:["2萬以下","2–4萬","4–7萬","7–10萬","10萬以上"],pts:[0,5,10,15,20]},
  age:{label:"年齡",opts:["25歲以下","26–35歲","36–45歲","46歲以上"],pts:[10,15,15,20]},
  marital:{label:"婚姻",opts:["單身","交往中","已婚無子女","已婚有子女"],pts:[5,5,10,10]},
  property:{label:"房產",opts:["無房產","2年內購入","持有2–5年","持有5–10年","持有10年以上"],marks:["不加","＋","＋","＋","＋"]},
  contact:{label:"一年內聯絡（交情）",opts:["2次以下・不熟","3–7次・普通","7–11次・好朋友","12次以上・麻吉"],pts:[0,5,10,15]},
  approach:{label:"接近難易度",opts:["幾乎不可能","有點難","容易","非常容易"],pts:[0,10,15,20]}
};
const SCORE_KEYS=["income","age","marital","contact","approach"]; // 房產不計分，有房產時分級加「+」
const MAX_SCORE=100;
const ATT_PTS={"排斥保險":-15,"中立觀望":5,"認同規劃":15,"已有信任顧問":5}; // 「已有信任顧問」已從選項移除，舊資料先算中立
const ATT_LABEL="對保險的態度";
const MID_PTS={income:10,age:15,marital:5,attitude:5}; // 不清楚時先算普通；交情、接近沒有預設值
const SCORE_N=SCORE_KEYS.length+1;
let STAGES=[
  {k:"lead",t:"名單",c:"var(--muted)",b:"var(--surface-2)"},
  {k:"touched",t:"已聯繫",c:"var(--gB)",b:"var(--surface-2)"},
  {k:"booked",t:"已約訪",c:"var(--navy)",b:"var(--navy-soft)"},
  {k:"met",t:"已面談",c:"var(--navy)",b:"var(--navy-soft)"},
  {k:"proposal",t:"提案中",c:"var(--warn)",b:"var(--warn-soft)"},
  {k:"won",t:"已成交",c:"var(--ok)",b:"var(--ok-soft)"},
  {k:"referral",t:"轉介紹",c:"var(--gold)",b:"var(--gold-soft)"},
  {k:"hold",t:"暫緩",c:"var(--bad)",b:"var(--bad-soft)"}
];
let STG=Object.fromEntries(STAGES.map(s=>[s.k,s]));
const P={
  gender:["男","女"],
  jobCat:["軍公教","上班族","專業人士","醫護","業務","自營商","企業主","退休","家管","學生","其他"],
  kids:["無子女","學齡前","國小","國高中","大學","已就業"],
  parents:["無需扶養","部分分擔","主要扶養"],
  incomeType:["固定薪資","業績獎金","自營收入","租金收入","投資收益","退休金"],
  loan:["無房貸","房貸還款中","寬限期中","已還清"],
  policies:["尚無保單","僅公司團保","醫療／意外","壽險","儲蓄險","投資型","年金險","長照／失能"],
  invest:["以存款為主","基金","股票／ETF","房地產","外幣","保單"],
  risk:["保守","穩健","積極"],
  needs:["退休規劃","醫療保障","子女教育金","房貸壓力","房產活化","資產傳承／節稅","收入不穩","存不了錢","保單健檢","創業／轉職"],
  decision:["自己決定","與配偶討論","需家人同意","依賴專業建議"],
  focus:["價格","保障完整","服務與信任","資產成長"],
  attitude:["排斥保險","中立觀望","認同規劃"],
  channel:["LINE","電話","面談","簡訊"],
  timeslot:["平日白天","平日晚上","假日"],
  hobbies:["運動健身","旅遊","美食","親子","投資理財","宗教","寵物","藝文","汽車","3C 科技","登山露營","公益"],
  recruit:["無","可觀察","有興趣"]
};
const TAG_SUGGEST=["#孝順","#朋友多","#好工作","#愛家","#精打細算","#重面子","#熱心","#有影響力","#注重健康","#話題王","#夜貓子","#愛分享"];
const LOG_TYPES=["電話","LINE","面談","活動","關懷／送禮","其他"];
// 這次做到哪裡：之後依此計算工作量。舊客戶階段維持已成交，也算得到。
let LOG_STEPS=[["contact","只是聯絡",null],["appt","約到見面","booked"],["meet","見到面","met"],["prop","送出建議書","proposal"],["deal","成交（新保單或加保）","won"],["renew","車險續保",null]];
const logStepLabel=k=>(LOG_STEPS.find(x=>x[0]===k)||[])[1]||"";
// 新客戶自動往前帶階段；已成交、轉介紹不動，也不會往回退
function stageAfterStep(cur,step){const target=(LOG_STEPS.find(x=>x[0]===step)||[])[2];if(!target||cur==="won"||cur==="referral"||cur==="joined")return cur;if(cur==="hold")return target;const order=STAGES.map(s=>s.k);return order.indexOf(target)>order.indexOf(cur)?target:cur}
const AREAS=["北屯區","西屯區","南屯區","北區","西區","中區","東區","南區","大里區","太平區","烏日區","豐原區","大雅區","潭子區","霧峰區","沙鹿區","龍井區","梧棲區","清水區","大肚區","神岡區","后里區","外縣市"];

/* ---------- 增員名單定義 ---------- */
const CLIENT_DEF={SOURCES,SRC,STAGES,STG,LOG_STEPS};
const REC_SOURCES=[["A","朋友同學"],["B","同業介紹"],["C","客戶轉增員"],["D","IG 留言"],["E","說明會"],["F","其他"]];
const REC_STAGES=[
  {k:"lead",t:"名單",c:"var(--muted)",b:"var(--surface-2)"},
  {k:"touched",t:"已聯繫",c:"var(--gB)",b:"var(--surface-2)"},
  {k:"booked",t:"已約聊",c:"var(--navy)",b:"var(--navy-soft)"},
  {k:"met",t:"已聊過",c:"var(--navy)",b:"var(--navy-soft)"},
  {k:"intro",t:"了解制度",c:"var(--warn)",b:"var(--warn-soft)"},
  {k:"apply",t:"辦理加入",c:"var(--gold)",b:"var(--gold-soft)"},
  {k:"joined",t:"已加入",c:"var(--ok)",b:"var(--ok-soft)"},
  {k:"hold",t:"暫緩",c:"var(--bad)",b:"var(--bad-soft)"}
];
const REC_STEPS=[["contact","只是聯絡",null],["appt","約到見面聊","booked"],["meet","見面聊過","met"],["intro","聽完制度說明","intro"],["apply","開始辦理","apply"],["join","正式加入","joined"]];
const REC_DEF={SOURCES:REC_SOURCES,SRC:Object.fromEntries(REC_SOURCES),STAGES:REC_STAGES,STG:Object.fromEntries(REC_STAGES.map(s=>[s.k,s])),LOG_STEPS:REC_STEPS};
const REC_SCORE={
  p_push:{label:"原單位的推力",opts:["觀察中","沒有不滿","有點不滿","常在抱怨","已經想走"],pts:[20,0,30,45,60],must:1},
  p_prod:{label:"目前的業績",opts:["偏低","普通","不錯","頂尖"],pts:[0,15,30,40],mid:15},
  b_view:{label:"對保險業的看法",opts:["排斥","中立","認同"],pts:[-15,5,20],mid:5},
  b_drive:{label:"想改變現況的動力",opts:["沒想法","有點想","常在想","正在行動"],pts:[0,5,10,15],mid:5},
  b_net:{label:"認識的人多不多",opts:["很少","普通","不少","很多"],pts:[0,5,10,15],mid:5},
  b_comm:{label:"能接受沒有底薪嗎",opts:["不能","要考慮","可以"],pts:[0,5,10],mid:5},
  b_family:{label:"家人的態度",opts:["反對","沒意見","支持"],pts:[0,3,5],mid:3}
};
Object.assign(SCORE,REC_SCORE);
Object.keys(REC_SCORE).forEach(k=>{if(REC_SCORE[k].mid!=null)MID_PTS[k]=REC_SCORE[k].mid});
const REC_KEYS={"同業":["p_push","p_prod"],"白紙":["b_view","b_drive","b_net","b_comm","b_family","contact","approach"]};
const PUSH_WHY=["佣金打折、收入沒跟著長","會掉階","制度一改再改","晉升卡人力","主管搶件或壓業績","主管不教東西","人情壓力、單位文化差","業績或出席考核壓力","只能賣自家商品","早會學不到東西","被調單位、跨區打折"];
const isPeer=c=>isRec(c)&&c.rtype==="同業";
const isRec=c=>!!c&&c.book==="rec";
const recKeys=c=>REC_KEYS[c.rtype]||REC_KEYS["同業"];
const scoreN=c=>isRec(c)?recKeys(c).length:SCORE_N;
const noun=()=>Ctx.book==="rec"?"增員對象":"客戶";
function recScoreOf(c){
  let s=0,filled=0;
  for(const k of recKeys(c)){const i=c[k];if(isNum(i)&&SCORE[k].pts[i]!=null){s+=SCORE[k].pts[i];filled++}else if(MID_PTS[k]!=null)s+=MID_PTS[k]}
  if(isPeer(c)&&c.p_push===0)filled--; // 觀察中還不算評定，顯示暫定
  const ready=isPeer(c)?isNum(c.p_push):isNum(c.contact)&&isNum(c.approach);
  return {score:ready?Math.min(MAX_SCORE,Math.max(0,s)):0,filled,ready,final:ready&&filled===recKeys(c).length};
}

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today=()=>ymd(new Date());
const parseD=s=>{if(!s)return null;const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);return m?new Date(+m[1],+m[2]-1,+m[3]):null};
const dayDiff=s=>{const d=parseD(s);if(!d)return null;const t=parseD(today());return Math.round((d-t)/864e5)};
const uid=()=>"c"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const jobCatLabel=c=>c.jobCat==="其他"&&c.jobOther?c.jobOther:(c.jobCat||"");
const isNum=v=>typeof v==="number"&&!isNaN(v);
const arr=v=>Array.isArray(v)?v:[];
const tsDate=t=>{if(!t)return null;if(typeof t.toDate==="function")return t.toDate();if(typeof t==="string")return new Date(t);if(t.seconds)return new Date(t.seconds*1000);return null};
const fmtDate=t=>{const d=tsDate(t);return d&&!isNaN(d)?ymd(d):"—"};
const ICON={
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
  dl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>'
};

function ageOf(c){const d=parseD(c.birthday);if(!d)return null;const t=new Date();let a=t.getFullYear()-d.getFullYear();if(t.getMonth()<d.getMonth()||(t.getMonth()===d.getMonth()&&t.getDate()<d.getDate()))a--;return a>=0&&a<120?a:null}
function ageBand(c){const a=ageOf(c);if(a!=null)return a<=25?0:a<=35?1:a<=45?2:3;return isNum(c.age)?c.age:null}
function scoreOf(c){
  if(isRec(c))return recScoreOf(c);
  let s=0,filled=0;
  for(const k of SCORE_KEYS){const i=k==="age"?ageBand(c):c[k];if(isNum(i)&&SCORE[k].pts[i]!=null){s+=SCORE[k].pts[i];filled++}else if(MID_PTS[k]!=null)s+=MID_PTS[k]}
  if(ATT_PTS[c.attitude]!=null){s+=ATT_PTS[c.attitude];filled++}else s+=MID_PTS.attitude;
  const ready=isNum(c.contact)&&isNum(c.approach);
  return {score:ready?s:0,filled,ready,final:ready&&filled===SCORE_N};
}
function gradeOf(c){const {score,ready}=scoreOf(c);if(!ready)return "";return score>=85?"S":score>=70?"A":score>=55?"B":"C"}
const isTemp=c=>{const r=scoreOf(c);return r.ready&&!r.final};
function scoreNote(c){const {ready,final,filled}=scoreOf(c);return ready&&!final?`暫定 ${filled}/${scoreN(c)}`:final?`/ ${MAX_SCORE}`:`${filled}/${scoreN(c)}`}
const hasProperty=c=>isNum(c.property)&&c.property>=1;
function gradeLabel(c){const g=gradeOf(c);return g&&hasProperty(c)?g+"+":g}
function daysToBirthday(c){const d=parseD(c.birthday);if(!d)return null;const t=parseD(today());let n=new Date(t.getFullYear(),d.getMonth(),d.getDate());if(n<t)n=new Date(t.getFullYear()+1,d.getMonth(),d.getDate());return Math.round((n-t)/864e5)}
/* 汽車保險：到期前 30 天提醒，過期 30 天內也繼續提醒 */
const CAR_WINDOW=30;
const carsOf=c=>arr(c.cars).filter(x=>x&&x.end);
function carDueList(list){const out=[];list.forEach(c=>carsOf(c).forEach(car=>{const d=dayDiff(car.end);if(d!=null&&d<=CAR_WINDOW&&d>=-CAR_WINDOW)out.push({c,car,d})}));return out.sort((a,b)=>a.d-b.d)}
const carDueText=d=>d<0?`已過期 ${-d} 天`:d===0?"今天到期":`${d} 天後到期`;
function addYear(s){const d=parseD(s);if(!d)return "";d.setFullYear(d.getFullYear()+1);return ymd(d)}
const isActiveStage=c=>!["won","hold","joined"].includes(c.stage);
/* 增員：超過 14 天沒聯絡就提醒。從最後一筆跟進算，沒有紀錄從加入名單那天算；有排下次聯絡日就照日期 */
const REC_REMIND=14;
const IG_TOUCH="IG 互動";
function lastTouch(c){return arr(c.logs).map(l=>l.d||"").sort().pop()||String(c.createdAt||c.updatedAt||"").slice(0,10)}
function daysSinceTouch(c){const d=dayDiff(lastTouch(c));return d==null?null:-d}
function isStale(c){if(!isRec(c)||!isActiveStage(c)||c.nextDate)return false;const d=daysSinceTouch(c);return d!=null&&d>REC_REMIND}
const touchedToday=c=>arr(c.logs).some(l=>l.d===today()&&l.t===IG_TOUCH);

/* ---------- session context ---------- */
const Ctx={
  user:null,profile:null,admin:false,
  my:new Map(),myReady:false,
  team:new Map(),teamReady:false,users:[],usersReady:false,adminRoles:new Map(),
  mode:"mine",viewUid:null,book:"client",
  subs:{}
};
function stopSub(k){if(Ctx.subs[k]){try{Ctx.subs[k]()}catch(e){}delete Ctx.subs[k]}}
function stopAll(){Object.keys(Ctx.subs).forEach(stopSub)}
const readOnly=()=>Ctx.mode!=="mine";
const inBook=c=>isRec(c)===(Ctx.book==="rec");
function itemsMap(){
  if(Ctx.mode==="advisor"){const m=new Map();for(const [k,c] of Ctx.team)if(c._owner===Ctx.viewUid&&inBook(c))m.set(k,c);return m}
  return new Map([...Ctx.my].filter(([k,c])=>inBook(c)));
}
const items=()=>[...itemsMap().values()];
const ready=()=>Ctx.mode==="mine"?Ctx.myReady:Ctx.teamReady;
const userById=id=>Ctx.users.find(u=>u.id===id);
const userName=u=>u?(u.displayName||u.email||"未命名業務"):"未命名業務";
const isLeader=()=>!Ctx.admin&&Ctx.users.some(u=>u.status==="active");
const canTeam=()=>Ctx.admin||isLeader();
const downlinesOf=id=>Ctx.users.filter(u=>arr(u.uplines).includes(id));
function uplinesFrom(managerId){const out=[];const seen=new Set();let cur=managerId||null;while(cur&&!seen.has(cur)){seen.add(cur);out.push(cur);cur=(userById(cur)||{}).managerId||null}return out}
// 主管改動時，連同底下整串重算上線
function orgWrites(uid,managerId){const up=uplinesFrom(managerId);const writes=[{uid,data:{managerId:managerId||null,uplines:up}}];const walk=(pid,pup)=>{Ctx.users.filter(u=>u.managerId===pid).forEach(u=>{const nu=[pid,...pup];writes.push({uid:u.id,data:{uplines:nu}});walk(u.id,nu)})};walk(uid,up);return writes}

async function saveClient(c){
  c=JSON.parse(JSON.stringify(c));c.updatedAt=new Date().toISOString();
  try{await (isRec(c)?backend.saveRecruit:backend.saveClient)(Ctx.user.uid,c);Ctx.my.set(c.id,c);renderAll();return true}
  catch(e){toast(errMsg(e,"儲存失敗"));return false}
}
async function removeClient(id){
  try{await (isRec(Ctx.my.get(id))?backend.deleteRecruit:backend.deleteClient)(Ctx.user.uid,id);Ctx.my.delete(id);renderAll();return true}
  catch(e){toast(errMsg(e,"刪除失敗"));return false}
}
function errMsg(e,prefix){
  const code=e&&e.code||"";
  if(code.includes("permission-denied"))return prefix+"：沒有權限（帳號可能已被停用）";
  if(code.includes("unavailable"))return prefix+"：網路連線不穩，請稍後再試";
  if(code.includes("resource-exhausted"))return prefix+"：今日資料庫用量已達上限";
  return prefix+"，請稍後再試";
}

/* ---------- UI state ---------- */
const S={view:"list",q:"",grade:"all",stage:"",source:"",need:"",sort:"score",openId:null,dTab:"ins",draft:null,dirty:false,isNew:false,teamQ:"",showDisabled:false};
try{const r=JSON.parse(localStorage.getItem("clientbook.ui")||"{}");if(r.sort)S.sort=r.sort;if(r.view)S.view=r.view}catch(e){}
function rememberUI(){try{localStorage.setItem("clientbook.ui",JSON.stringify({sort:S.sort,view:S.view}))}catch(e){}}

/* ---------- screens ---------- */
function show(id){document.querySelectorAll(".screen").forEach(s=>s.hidden=s.id!==id);window.__booted=true}
document.querySelectorAll("[data-team-name]").forEach(e=>e.textContent=TEAM.name);
document.querySelectorAll("[data-team-sub]").forEach(e=>e.textContent=TEAM.subtitle);
document.querySelectorAll("[data-team-eyebrow]").forEach(e=>e.textContent=TEAM.eyebrow);
document.title=TEAM.name;

const UA=navigator.userAgent||"";
const inLine=/\bLine\//i.test(UA);
const inApp=inLine||/FBAN|FBAV|FB_IAB|Instagram|Messenger|MicroMessenger|WeChat/i.test(UA);
if(inLine&&!/openExternalBrowser=1/.test(location.search)){
  const u=new URL(location.href);u.searchParams.set("openExternalBrowser","1");location.replace(u.toString());
}
if(inApp){$("#inappWarn").hidden=false}
$("#copyLink").addEventListener("click",()=>copyText(location.origin+location.pathname,"已複製網址，請貼到 Safari 或 Chrome 開啟"));
async function copyText(t,msg){try{await navigator.clipboard.writeText(t);toast(msg||"已複製")}catch(e){toast("請手動複製："+t)}}

$("#btnLogin").addEventListener("click",async()=>{
  const b=$("#btnLogin");b.disabled=true;$("#loginErr").textContent="";
  try{await backend.signIn()}
  catch(e){
    const c=e&&e.code||"";
    $("#loginErr").textContent=c.includes("popup-closed")||c.includes("cancelled-popup")?"登入視窗已關閉，請再試一次。":
      c.includes("unauthorized-domain")?"這個網址尚未加入 Firebase 的授權網域，請通知管理員。":
      c.includes("api-key")||c.includes("invalid-api-key")?"系統尚未完成 Firebase 設定（config.js）。":
      c.includes("network")?"網路連線失敗，請檢查網路後再試。":"登入失敗："+(c||"請稍後再試");
  }finally{b.disabled=false}
});
document.querySelectorAll("[data-signout]").forEach(b=>b.addEventListener("click",()=>{if(S.dirty){showConfirm("尚未儲存的修改","登出後這次的修改會遺失。","登出",()=>{S.dirty=false;doSignOut()});return}doSignOut()}));
function doSignOut(){closeDrawer(true);stopAll();backend.signOut()}

/* ---------- auth flow ---------- */
if(!backend.configured){show("screen-setup")}
else backend.onAuth(async u=>{
  stopAll();
  Ctx.user=u;Ctx.profile=null;Ctx.admin=false;Ctx.my=new Map();Ctx.myReady=false;Ctx.team=new Map();Ctx.teamReady=false;Ctx.users=[];Ctx.usersReady=false;Ctx.adminRoles=new Map();Ctx.mode="mine";Ctx.viewUid=null;
  if(!u){show("screen-login");return}
  show("screen-boot");$("#bootMsg").textContent="正在確認帳號…";
  try{
    Ctx.admin=await backend.isAdmin(u.uid);
    let p=await backend.getProfile(u.uid);
    if(!p){await backend.createProfile(u.uid,{displayName:u.displayName,email:u.email,photoURL:u.photoURL})}
    else{backend.updateProfile(u.uid,{email:u.email,photoURL:u.photoURL}).catch(()=>{})}
    if(Ctx.admin&&(!p||p.status!=="active"))await backend.setStatus(u.uid,"active");
    Ctx.subs.profile=backend.watchProfile(u.uid,prof=>{Ctx.profile=prof;route()},err=>showFatal(err));
  }catch(err){showFatal(err)}
});
function showFatal(err){
  show("screen-error");
  const c=err&&err.code||"";
  $("#fatalMsg").textContent=c.includes("permission-denied")?"資料庫拒絕存取。請管理員確認 Firestore 權限規則已依說明發布。":"無法連線到資料庫（"+(c||"未知錯誤")+"），請稍後重新整理。";
}
function route(){
  const p=Ctx.profile;
  if(!p){show("screen-boot");return}
  if(p.status==="pending"){
    show("screen-pending");
    $("#pendName").value=p.displayName||"";$("#pendEmail").textContent=p.email||"";$("#pendUid").textContent=Ctx.user.uid;
    stopSub("my");stopSub("myRec");return;
  }
  if(p.status!=="active"){show("screen-disabled");stopSub("my");stopSub("myRec");return}
  show("screen-app");
  if(!Ctx.subs.my){
    Ctx.subs.my=backend.watchMyClients(Ctx.user.uid,list=>{Ctx.my=new Map([...[...Ctx.my].filter(([k,c])=>isRec(c)),...list.map(c=>[c.id,c])]);Ctx.myReady=true;renderAll()},err=>{toast(errMsg(err,"讀取名單失敗"));Ctx.myReady=true;renderAll()});
    Ctx.subs.myRec=backend.watchMyRecruits(Ctx.user.uid,list=>{Ctx.my=new Map([...[...Ctx.my].filter(([k,c])=>!isRec(c)),...list.map(c=>[c.id,c])]);renderAll()},err=>toast(errMsg(err,"讀取增員名單失敗")));
  }
  if(Ctx.admin&&!Ctx.subs.users){
    Ctx.subs.users=backend.watchUsers(list=>{Ctx.users=list;Ctx.usersReady=true;renderAll()},err=>toast(errMsg(err,"讀取業務名單失敗")));
    Ctx.subs.admins=backend.watchAdmins(list=>{Ctx.adminRoles=new Map(list.map(a=>[a.id,a.role||"admin"]));renderAll()},err=>console.error(err));
  }
  if(!Ctx.admin&&!Ctx.subs.users){
    Ctx.subs.users=backend.watchDownlines(Ctx.user.uid,list=>{Ctx.users=list;Ctx.usersReady=true;if(Ctx.mode!=="mine"){if(isLeader())syncLeaderClients();else setMode("mine")}renderAll()},err=>{console.error(err);Ctx.usersReady=true;renderAll()});
  }
  renderAll();
}
$("#pendSave").addEventListener("click",async()=>{
  const n=$("#pendName").value.trim();if(!n){toast("請輸入姓名");return}
  try{await backend.updateProfile(Ctx.user.uid,{displayName:n,email:Ctx.user.email});toast("已更新姓名")}catch(e){toast(errMsg(e,"更新失敗"))}
});
$("#pendCopy").addEventListener("click",()=>copyText(Ctx.user.uid,"已複製使用者 ID"));

/* ---------- mode switching (admin) ---------- */
// 主管沒有讀全團隊的權限，要逐位下線讀名單
function syncLeaderClients(){
  const want=new Set(Ctx.users.filter(u=>u.status==="active").map(u=>u.id));
  Object.keys(Ctx.subs).filter(k=>k.startsWith("tc_")&&!want.has(k.slice(3))).forEach(k=>{stopSub(k);const id=k.slice(3);stopSub("tr_"+id);for(const [key,c] of Ctx.team)if(c._owner===id)Ctx.team.delete(key)});
  const pending=[...want].filter(id=>!Ctx.subs["tc_"+id]);
  if(!pending.length&&!Ctx.teamReady){Ctx.teamReady=true;return}
  let left=pending.length;const done=()=>{if(left>0&&--left===0)Ctx.teamReady=true};
  pending.forEach(id=>{let first=true;Ctx.subs["tr_"+id]=backend.watchRecruitsOf(id,list=>{for(const [key,c] of Ctx.team)if(c._owner===id&&isRec(c))Ctx.team.delete(key);list.forEach(c=>Ctx.team.set(c.id+"@"+id,c));renderAll()},err=>console.error(err));Ctx.subs["tc_"+id]=backend.watchClientsOf(id,list=>{for(const [key,c] of Ctx.team)if(c._owner===id&&!isRec(c))Ctx.team.delete(key);list.filter(c=>!c.demo).forEach(c=>Ctx.team.set(c.id+"@"+id,c));if(first){first=false;done()}renderAll()},err=>{console.error(err);if(first){first=false;done()}toast(errMsg(err,"讀取下線名單失敗"));renderAll()})});
}
function setMode(mode,viewUid){
  if(S.dirty){showConfirm("尚未儲存的修改","切換前會放棄這次的修改。","放棄並切換",()=>{S.dirty=false;closeDrawer(true);setMode(mode,viewUid)});return}
  closeDrawer(true);
  Ctx.mode=mode;Ctx.viewUid=viewUid||null;
  if(mode!=="mine"&&!Ctx.admin)syncLeaderClients();
  if(mode!=="mine"&&Ctx.admin&&!Ctx.subs.team){
    Ctx.subs.teamRec=backend.watchAllRecruits(list=>{Ctx.team=new Map([...[...Ctx.team].filter(([k,c])=>!isRec(c)),...list.map(c=>[c.id+"@"+c._owner,c])]);renderAll()},err=>console.error(err));
    Ctx.subs.team=backend.watchAllClients(list=>{Ctx.team=new Map([...[...Ctx.team].filter(([k,c])=>isRec(c)),...list.filter(c=>!c.demo).map(c=>[c.id+"@"+c._owner,c])]);Ctx.teamReady=true;renderAll()},err=>{console.error(err);toast((err&&String(err.code).includes("failed-precondition"))?"團隊後台需要建立資料庫索引，請參考 README 常見問題":errMsg(err,"讀取團隊名單失敗"));Ctx.teamReady=true;renderAll()});
  }
  S.grade="all";S.stage=S.source=S.need=S.q="";$("#q").value="";["#fStage","#fSource","#fNeed"].forEach(s=>$(s).value="");
  [...$("#gradeSeg").children].forEach(x=>x.setAttribute("aria-pressed",x.dataset.g==="all"));
  window.scrollTo(0,0);renderAll();
}
$("#modeSeg").addEventListener("click",e=>{const b=e.target.closest("button[data-mode]");if(b)setMode(b.dataset.mode)});
$("#btnBack").addEventListener("click",()=>setMode("team"));

/* ---------- toolbar setup ---------- */
function fillSelect(el,first,list){el.innerHTML=`<option value="">${first}</option>`+list.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join("")}
fillSelect($("#fStage"),"全部階段",STAGES.map(s=>[s.k,s.t]));
fillSelect($("#fSource"),"全部來源",SOURCES.map(([k,t])=>[k,k+" "+t]));
fillSelect($("#fNeed"),"全部需求",P.needs.map(n=>[n,n]));
$("#fSort").value=S.sort;
$("#gradeSeg").innerHTML=[["all","全部"],["S","S"],["A","A"],["B","B"],["C","C"],["none","待評"]].map(([v,t])=>`<button type="button" data-g="${v}" aria-pressed="${v===S.grade}">${t}</button>`).join("");
$("#gradeSeg").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;S.grade=b.dataset.g;[...$("#gradeSeg").children].forEach(x=>x.setAttribute("aria-pressed",x===b));renderList()});
$("#q").addEventListener("input",e=>{S.q=e.target.value.trim().toLowerCase();renderList()});
[["#fStage","stage"],["#fSource","source"],["#fNeed","need"],["#fSort","sort"]].forEach(([s,k])=>$(s).addEventListener("change",e=>{S[k]=e.target.value;if(k==="sort")rememberUI();renderList()}));
document.querySelectorAll("#personal .tab").forEach(t=>t.addEventListener("click",()=>{S.view=t.dataset.view;rememberUI();renderView()}));
$("#btnNew").addEventListener("click",()=>openNew());
$("#btnImport").addEventListener("click",openImport);
$("#btnExport").addEventListener("click",()=>exportClients(items(),Ctx.mode==="advisor"?`${userName(userById(Ctx.viewUid))}_${Ctx.book==="rec"?"增員名單":"客戶名單"}`:(Ctx.book==="rec"?"我的增員名單":"我的客戶名單"),false));
$("#btnTeamExport").addEventListener("click",()=>exportClients([...Ctx.team.values()].filter(inBook),Ctx.book==="rec"?"全團隊增員名單":"全團隊客戶名單",true));
$("#teamQ").addEventListener("input",e=>{S.teamQ=e.target.value.trim().toLowerCase();renderTeam()});
$("#showDisabled").addEventListener("change",e=>{S.showDisabled=e.target.checked;renderTeam()});
$("#userChip").addEventListener("click",openProfileEdit);

/* ---------- 客戶／增員切換 ---------- */
const FOOT_CLIENT=$(".foot-note").textContent;
const FOOT_REC="增員評分分同業、白紙兩套：85 分以上為 S、70–84 為 A、55–69 為 B、未滿 55 為 C。兩套都是滿分 100。同業看推力和業績，推力沒選為待評，選「觀察中」顯示暫定。白紙看五項加交情和接近難易度，交情或接近難易度沒選為待評。有不清楚的項目時先算普通，顯示為暫定。超過 14 天沒有跟進紀錄、也沒排下次聯絡日的人會被提醒，IG 互動也算聯絡；暫緩和已加入不提醒。兩套看的東西不同，同樣分數不代表同一件事，比較時請先用類型篩選。";
function setBook(b){
  if(S.dirty){showConfirm("尚未儲存的修改","切換前會放棄這次的修改。","放棄並切換",()=>{S.dirty=false;closeDrawer(true);setBook(b)});return}
  closeDrawer(true);
  Ctx.book=b;
  const D=b==="rec"?REC_DEF:CLIENT_DEF;
  SOURCES=D.SOURCES;SRC=D.SRC;STAGES=D.STAGES;STG=D.STG;LOG_STEPS=D.LOG_STEPS;
  const rec=b==="rec";
  fillSelect($("#fStage"),rec?"全部階段":"全部階段",STAGES.map(s=>[s.k,s.t]));
  fillSelect($("#fSource"),"全部來源",SOURCES.map(([k,t])=>[k,k+" "+t]));
  if(rec)fillSelect($("#fNeed"),"同業＋白紙",[["同業","同業"],["白紙","白紙"]]);
  else fillSelect($("#fNeed"),"全部需求",P.needs.map(n=>[n,n]));
  S.grade="all";S.stage=S.source=S.need=S.q="";$("#q").value="";
  [...$("#gradeSeg").children].forEach(x=>x.setAttribute("aria-pressed",x.dataset.g==="all"));
  $("#q").placeholder=rec?"搜尋姓名、工作、推力、備註":"搜尋姓名、職業、#標籤、備註";
  document.querySelectorAll("#screen-app .brand [data-team-name]").forEach(e=>e.textContent=rec?"增員名單":TEAM.name);
  document.querySelectorAll("#screen-app .brand [data-team-sub]").forEach(e=>e.textContent=rec?"保家佳團隊｜同業與白紙分開評分 × 跟進紀錄":TEAM.subtitle);
  $("#btnNew").lastChild.textContent=rec?"新增增員對象":"新增客戶";
  $("#btnImport").hidden=rec;$("#btnFromClient").hidden=!rec;
  $("#fNeed").setAttribute("aria-label",rec?"類型":"需求");
  $("#thWon").textContent=rec?"已加入":"成交／轉介";
  $(".foot-note").textContent=rec?FOOT_REC:FOOT_CLIENT;
  $("#drawer").setAttribute("aria-label",rec?"增員對象資料":"客戶資料");
  [...$("#bookSeg").children].forEach(x=>x.setAttribute("aria-pressed",x.dataset.book===b));
  renderAll();
}
$("#bookSeg").addEventListener("click",e=>{const x=e.target.closest("button[data-book]");if(x&&x.dataset.book!==Ctx.book)setBook(x.dataset.book)});
function openFromClient(){
  const added=new Set([...Ctx.my.values()].filter(isRec).map(r=>r.clientId));
  const list=[...Ctx.my.values()].filter(c=>!isRec(c)&&!added.has(c.id)).sort((a,b)=>(a.name||"").localeCompare(b.name||"","zh-Hant"));
  $("#modalRoot").innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-box"><h3>從客戶名單加入</h3><p>姓名、電話、LINE、職業、居住區域、交情和接近難易度會帶過來，不用重打。</p><input class="inp" id="pickQ" type="search" placeholder="搜尋客戶姓名" aria-label="搜尋客戶姓名" autocomplete="off" style="margin-bottom:10px"><ul class="alist" id="pickList">${list.map(c=>`<li data-n="${esc(c.name||"")}"><button type="button" data-pick="${esc(c.id)}"><span class="an">${esc(c.name)}<small>${esc(c.job||jobCatLabel(c)||"")}</small></span><span class="ad"><span class="due">選這位</span></span></button></li>`).join("")}</ul><div class="modal-actions"><button class="btn" type="button" id="mNo">關閉</button></div></div></div>`;
  $("#mNo").onclick=()=>$("#modalRoot").innerHTML="";
  $("#pickQ").oninput=e=>{const q=e.target.value.trim();document.querySelectorAll("#pickList li").forEach(li=>li.hidden=!!q&&!li.dataset.n.includes(q))};
  $("#modalRoot .modal").onclick=e=>{if(e.target.classList.contains("modal"))$("#modalRoot").innerHTML="";const p=e.target.closest("[data-pick]");if(!p)return;const c=Ctx.my.get(p.dataset.pick);$("#modalRoot").innerHTML="";openNew();Object.assign(S.draft,{name:c.name,phone:c.phone||"",line:c.line||"",job:c.job||jobCatLabel(c)||"",area:c.area||"",contact:c.contact,approach:c.approach,source:"C",rtype:"白紙",alsoClient:true,clientId:c.id});S.dirty=true;renderDrawer()};
}
$("#btnFromClient").addEventListener("click",openFromClient);

/* ---------- render: header & modes ---------- */
function renderHeader(){
  const p=Ctx.profile||{},u=Ctx.user||{};
  const name=p.displayName||u.displayName||u.email||"";
  const photo=p.photoURL||u.photoURL;
  $("#userChip").innerHTML=`<span class="avatar">${photo?`<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer">`:esc((name||"?").slice(0,1))}</span><span class="uname">${esc(name)}</span>${Ctx.admin?'<span class="role">管理員</span>':isLeader()?'<span class="role">主管</span>':""}`;
  $("#modeSeg").hidden=!canTeam();
  const pend=Ctx.users.filter(x=>x.status==="pending").length;
  [...$("#modeSeg").children].forEach(b=>{b.setAttribute("aria-pressed",b.dataset.mode===Ctx.mode||(b.dataset.mode==="team"&&Ctx.mode==="advisor"))});
  $("#pendDot").hidden=!pend;$("#pendDot").textContent=pend;
  $("#mineActions").hidden=Ctx.mode!=="mine";
  $("#personal").hidden=Ctx.mode==="team";
  $("#teamView").hidden=Ctx.mode!=="team";
  $("#roBanner").hidden=Ctx.mode!=="advisor";
  if(Ctx.mode==="advisor"){const a=userById(Ctx.viewUid);$("#roName").textContent=userName(a);$("#roMeta").textContent=(a&&a.email||"")+(a&&a.status==="disabled"?" ・ 已停用":"")}
}
function renderAll(){
  if($("#screen-app").hidden)return;
  renderHeader();
  if(Ctx.mode==="team"){renderTeam();return}
  renderSummary();renderList();renderView();
  if(S.openId&&!S.dirty&&itemsMap().has(S.openId)&&S.dTab!=="edit")renderDrawer();
}

/* ---------- render: summary ---------- */
function renderSummary(){
  if(Ctx.book==="rec"){renderRecSummary();return}
  $("#summary").classList.remove("rec7");
  const all=items();const n=all.length;
  const g={S:0,A:0,B:0,C:0,"":0};all.forEach(c=>g[gradeOf(c)]++);
  const due=all.filter(c=>{const d=dayDiff(c.nextDate);return d!=null&&d<=7&&isActiveStage(c)}).length;
  const over=all.filter(c=>{const d=dayDiff(c.nextDate);return d!=null&&d<0&&isActiveStage(c)}).length;
  const bd=all.filter(c=>{const d=daysToBirthday(c);return d!=null&&d<=30}).length;
  const won=all.filter(c=>c.stage==="won"||c.stage==="referral").length;
  const carN=carDueList(all).length;
  const seg=k=>n?`<span style="width:${g[k]/n*100}%;background:var(--g${k})"></span>`:"";
  $("#summary").innerHTML=`
    <div class="stat"><div class="k">名單總數 ・ 分級分佈</div><div class="v num">${n}<small>位</small></div>
      <div class="dist">${seg("S")}${seg("A")}${seg("B")}${seg("C")}</div>
      <div class="dist-legend"><span><b style="color:var(--gS)">${g.S}</b>S</span><span><b style="color:var(--gA)">${g.A}</b>A</span><span><b style="color:var(--gB)">${g.B}</b>B</span><span><b style="color:var(--gC)">${g.C}</b>C</span>${g[""]?`<span><b>${g[""]}</b>待評</span>`:""}</div></div>
    <div class="stat"><div class="k">7 天內待跟進</div><div class="v num">${due}<small>位</small></div></div>
    <div class="stat"><div class="k">已逾期未聯絡</div><div class="v num ${over?"alert":""}">${over}<small>位</small></div></div>
    <button type="button" class="stat stat-btn" data-act="bday"><div class="k">30 天內壽星</div><div class="v num">${bd}<small>位</small></div>${bd?'<div class="more">查看名單 ›</div>':""}</button>
    <button type="button" class="stat stat-btn" data-act="car" id="carTile"><div class="k">車險快到期</div><div class="v num ${carN?"alert":""}">${carN}<small>台</small></div>${carN?'<div class="more">查看名單 ›</div>':""}</button>
    <div class="stat"><div class="k">成交／轉介紹</div><div class="v num">${won}<small>位</small></div></div>`;
  const ac=$("#actCnt");ac.textContent=due;ac.classList.toggle("hot",over>0);
}

function renderRecSummary(){
  const all=items();const n=all.length;
  const g={S:0,A:0,B:0,C:0,"":0};all.forEach(c=>g[gradeOf(c)]++);
  const due=all.filter(c=>{const d=dayDiff(c.nextDate);return d!=null&&d<=7&&isActiveStage(c)}).length;
  const over=all.filter(c=>{const d=dayDiff(c.nextDate);return d!=null&&d<0&&isActiveStage(c)}).length;
  const talking=all.filter(c=>["booked","met","intro","apply"].includes(c.stage)).length;
  const joined=all.filter(c=>c.stage==="joined").length;
  const peer=all.filter(c=>c.rtype==="同業").length;
  const stale=all.filter(isStale).length;
  const seg=k=>n?`<span style="width:${g[k]/n*100}%;background:var(--g${k})"></span>`:"";
  $("#summary").classList.add("rec7");
  $("#summary").innerHTML=`
    <div class="stat"><div class="k">增員名單 ・ 分級分佈</div><div class="v num">${n}<small>位</small></div>
      <div class="dist">${seg("S")}${seg("A")}${seg("B")}${seg("C")}</div>
      <div class="dist-legend"><span><b style="color:var(--gS)">${g.S}</b>S</span><span><b style="color:var(--gA)">${g.A}</b>A</span><span><b style="color:var(--gB)">${g.B}</b>B</span><span><b style="color:var(--gC)">${g.C}</b>C</span>${g[""]?`<span><b>${g[""]}</b>待評</span>`:""}</div></div>
    <div class="stat"><div class="k">同業／白紙</div><div class="v num">${peer}<small>／</small>${n-peer}</div></div>
    <div class="stat"><div class="k">已逾期未聯絡</div><div class="v num ${over?"alert":""}">${over}<small>位</small></div></div>
    <button type="button" class="stat stat-btn" data-act="stale"><div class="k">超過 ${REC_REMIND} 天沒聯絡</div><div class="v num ${stale?"alert":""}">${stale}<small>位</small></div>${stale?'<div class="more">查看名單 ›</div>':""}</button>
    <div class="stat"><div class="k">正在談的人</div><div class="v num">${talking}<small>位</small></div></div>
    <div class="stat"><div class="k">已加入</div><div class="v num">${joined}<small>位</small></div></div>`;
  const ac=$("#actCnt");ac.textContent=due;ac.classList.toggle("hot",over>0);
}

/* ---------- render: list ---------- */
function filtered(){
  let list=items();
  if(S.grade!=="all")list=list.filter(c=>S.grade==="none"?gradeOf(c)==="":gradeOf(c)===S.grade);
  if(S.stage)list=list.filter(c=>(c.stage||"lead")===S.stage);
  if(S.source)list=list.filter(c=>c.source===S.source);
  if(S.need)list=list.filter(c=>isRec(c)?c.rtype===S.need:arr(c.needs).includes(S.need));
  if(S.q){list=list.filter(c=>[arr(c.p_pushWhy).join(" "),c.rtype,c.company,c.ig,c.name,c.job,c.jobCat,c.jobOther,c.area,c.note,c.referrer,arr(c.tags).join(" "),arr(c.needs).join(" "),arr(c.hobbies).join(" "),arr(c.cars).map(x=>x.plate).join(" ")].join(" ").toLowerCase().includes(S.q))}
  const by={
    score:(a,b)=>scoreOf(b).score-scoreOf(a).score||hasProperty(b)-hasProperty(a)||(a.no||0)-(b.no||0),
    next:(a,b)=>(a.nextDate||"9999")<(b.nextDate||"9999")?-1:(a.nextDate||"9999")>(b.nextDate||"9999")?1:0,
    updated:(a,b)=>(b.updatedAt||"")<(a.updatedAt||"")?-1:1,
    no:(a,b)=>(a.no||0)-(b.no||0)
  };
  return list.sort(by[S.sort]||by.score);
}
function dueHtml(c){
  if(isRec(c)&&c.stage==="joined")return `<span class="due" style="color:var(--muted)">${ICON.cal}已加入團隊</span>`;
  if(isRec(c)&&c.stage==="hold")return `<span class="due" style="color:var(--muted)">${ICON.cal}暫緩中</span>`;
  if(isStale(c))return `<span class="due over">${ICON.cal}${daysSinceTouch(c)} 天沒聯絡</span>`;
  if(!c.nextDate)return `<span class="due" style="color:var(--muted)">${ICON.cal}未排下次聯絡</span>`;
  const d=dayDiff(c.nextDate);const cls=d<0?"over":d<=3?"soon":"";
  const txt=d<0?`逾期 ${-d} 天`:d===0?"今天聯絡":d===1?"明天聯絡":`${c.nextDate.slice(5).replace("-","/")} 聯絡`;
  return `<span class="due ${cls}">${ICON.cal}${txt}</span>`;
}
function stageHtml(k){const s=STG[k||"lead"]||STG.lead;return `<span class="stage" style="color:${s.c};background:${s.b}">${s.t}</span>`}
function metaLine(c){if(isRec(c))return [c.rtype,c.source?`${c.source} ${SRC[c.source]||""}`:"",(isPeer(c)?c.company:c.job)||"",c.area||""].filter(Boolean).join(" ・ ");const a=ageOf(c);return [c.source?`${c.source} ${SRC[c.source]||""}`:"",a!=null?a+"歲":(isNum(c.age)?SCORE.age.opts[c.age]:""),c.job||jobCatLabel(c),c.area||""].filter(Boolean).join(" ・ ")}
function keyOf(c){return Ctx.mode==="advisor"?c.id+"@"+c._owner:c.id}
function cardHtml(c){
  const g=gradeOf(c);const {score,ready}=scoreOf(c);
  const needs=isRec(c)?`${arr(c.p_pushWhy).slice(0,1).map(x=>`<span class="pill">推：${esc(x)}</span>`).join("")}${c.alsoClient?'<span class="pill need">也是客戶</span>':""}`:arr(c.needs).slice(0,3).map(n=>`<span class="pill need">${esc(n)}</span>`).join("");
  const tags=arr(c.tags).slice(0,3).map(t=>`<span class="pill tag">${esc(t)}</span>`).join("");
  const carPill=carDueList([c]).map(({car,d})=>`<span class="pill car ${d<0?"over":""}">車險 ${carDueText(d)}${car.plate?"・"+esc(car.plate):""}</span>`).join("");
  return `<button type="button" class="card" data-id="${esc(keyOf(c))}">
    ${readOnly()?"":`<span class="card-del" data-del-client="${esc(c.id)}" role="button" aria-label="刪除 ${esc(c.name||"這筆資料")}" title="刪除">×</span>`}
    <div class="card-head">
      <div class="grade" data-g="${g}" data-temp="${isTemp(c)?1:0}">${gradeLabel(c)||"待評"}</div>
      <div class="who"><div class="name">${esc(c.name||"（未命名）")}${isPeer(c)&&c.ig?`<span class="ig">${esc(c.ig)}</span>`:""}<span class="no">No.${esc(c.no||"-")}</span>${c.demo?'<span class="demo-flag">示範</span>':""}</div><div class="meta">${esc(metaLine(c))||"&nbsp;"}</div></div>
      <div class="score"><b class="num">${ready?score:"–"}</b><span>${scoreNote(c)}</span></div>
    </div>
    <div class="bar"><i style="width:${Math.max(0,Math.min(100,score/MAX_SCORE*100))}%"></i></div>
    ${(carPill||needs||tags)?`<div class="chips">${carPill}${needs}${tags}</div>`:""}
    <div class="card-foot">${stageHtml(c.stage)}${isRec(c)&&isActiveStage(c)&&!readOnly()?(touchedToday(c)?'<span class="touch done">今天已互動</span>':`<span class="touch" data-touch="${esc(c.id)}" role="button" aria-label="記錄今天和 ${esc(c.name||"他")} 在 IG 互動過">今天互動過</span>`):""}${dueHtml(c)}</div>
  </button>`;
}
function renderList(){
  const area=$("#listArea");
  if(!ready()){area.innerHTML=`<div class="empty"><h3>正在載入名單</h3><p>連線到資料庫中…</p></div>`;$("#resultLine").textContent="";return}
  const total=items().length;
  if(total===0){
    area.innerHTML=readOnly()?`<div class="empty"><h3>這位業務還沒有建立名單</h3><p>示範資料不會列入團隊後台。</p></div>`:
      Ctx.book==="rec"?`<div class="empty"><h3>還沒有增員對象</h3><p>按右上角「新增增員對象」，或從客戶名單加入。</p></div>`:`<div class="empty"><h3>建立你的第一份經營名單</h3><p>可以直接匯入原本的「客戶名單」Excel 範本，或手動新增。想先看看系統怎麼運作，也可以載入 6 筆示範名單，之後一鍵清除。</p>
      <div class="row"><button class="btn primary" type="button" data-act="new">新增客戶</button><button class="btn" type="button" data-act="import">匯入 Excel</button><button class="btn ghost" type="button" data-act="demo">載入示範名單</button></div></div>`;
    $("#resultLine").textContent="";return;
  }
  const list=filtered();
  const demoN=items().filter(c=>c.demo).length;
  $("#resultLine").innerHTML=`顯示 ${list.length} / ${total} 位`+(demoN&&!readOnly()?` ・ 含 ${demoN} 筆示範資料 <button class="btn ghost" style="padding:2px 8px;font-size:12px" type="button" data-act="cleardemo">清除示範</button>`:"");
  area.innerHTML=list.length?`<div class="grid">${list.map(cardHtml).join("")}</div>`:`<div class="empty"><h3>沒有符合條件的${noun()}</h3><p>調整搜尋字詞或篩選條件看看。</p></div>`;
}
async function recordTouch(id){
  const c=Ctx.my.get(id);if(!c||touchedToday(c))return;
  const c2=JSON.parse(JSON.stringify(c));
  c2.logs=arr(c2.logs).concat([{id:uid(),d:today(),t:IG_TOUCH,p:"contact",x:"IG 互動（按讚、留言或回限動）"}]).slice(-200);c2.lastContact=today();
  if(await saveClient(c2))toast("已記錄 IG 互動");
}
document.addEventListener("click",e=>{
  const logDel=e.target.closest("[data-log-del]");
  if(logDel){const id=logDel.dataset.logDel,c=Ctx.my.get(logDel.dataset.logOwner);if(!c)return;showConfirm("刪除這筆紀錄？","刪除後無法復原。","刪除",async()=>{const c2=JSON.parse(JSON.stringify(c));c2.logs=arr(c2.logs).filter(l=>l.id!==id);c2.lastContact=arr(c2.logs).map(l=>l.d||"").sort().pop()||"";if(await saveClient(c2))toast("已刪除")},true);return}
  const logOpen=e.target.closest("[data-log-open]");
  if(logOpen){openClient(logOpen.dataset.logOpen,"log");return}
  if(e.target.closest("#actLogMore")){logShow+=30;renderRecLogs();return}
  const touch=e.target.closest("[data-touch]");
  if(touch){recordTouch(touch.dataset.touch);return}
  const del=e.target.closest("[data-del-client]");
  if(del){const id=del.dataset.delClient,c=Ctx.my.get(id);showConfirm("刪除「"+(c&&c.name||"這筆資料")+"」？",noun()+"資料與所有跟進紀錄都會刪除，無法復原。","確認刪除",async()=>{if(await removeClient(id))toast("已刪除")},true);return}
  const card=e.target.closest(".card[data-id], .alist button[data-id]");
  if(card){if(card.closest("#modalRoot"))$("#modalRoot").innerHTML="";openClient(card.dataset.id,"ins");return}
  const row=e.target.closest("tr[data-uid]");
  if(row&&!e.target.closest("button,select")){setMode("advisor",row.dataset.uid);return}
  const a=e.target.closest("[data-act]");if(!a)return;
  const act=a.dataset.act;
  if(act==="new")openNew();else if(act==="import")openImport();else if(act==="demo")loadDemo();else if(act==="cleardemo")clearDemo();else if(act==="car")openCarList();else if(act==="bday")openBdayList();else if(act==="stale")openStaleList();
  else if(act==="approve")approveUser(a.dataset.uid);
  else if(act==="enable")setStatus(a.dataset.uid,"active","已恢復");
  else if(act==="setadmin"){const u=userById(a.dataset.uid);showConfirm(`把「${userName(u)}」設為管理員？`,"管理員可以檢視全部成員的名單、開通或停用帳號、調整組織。","確認",async()=>{try{await backend.setAdmin(a.dataset.uid);toast("已設為管理員")}catch(e){toast(errMsg(e,"設定失敗"))}})}
  else if(act==="unadmin"){const u=userById(a.dataset.uid);showConfirm(`取消「${userName(u)}」的管理員？`,"對方之後只能看自己的名單與自己底下的成員。","確認",async()=>{try{await backend.removeAdmin(a.dataset.uid);toast("已取消管理員")}catch(e){toast(errMsg(e,"取消失敗"))}})}
  else if(act==="reject"||act==="disable"){const u=userById(a.dataset.uid);showConfirm(act==="reject"?`拒絕「${userName(u)}」的申請？`:`停用「${userName(u)}」？`,act==="reject"?"對方將無法使用系統。之後仍可在「顯示已停用帳號」中恢復。":"停用後對方無法登入使用名單，但他建立的名單會保留，你仍可在後台檢視與匯出。","確認",()=>setStatus(a.dataset.uid,"disabled",act==="reject"?"已拒絕":"已停用"),true)}
  else if(act==="view")setMode("advisor",a.dataset.uid);
});
async function approveUser(id){
  const sel=document.querySelector(`select[data-pend-mgr="${CSS.escape(id)}"]`);const mid=sel&&sel.value||null;
  try{await backend.updateUsers([{uid:id,status:true,data:{status:"active",managerId:mid,uplines:uplinesFrom(mid)}}]);toast("已開通")}catch(e){toast(errMsg(e,"開通失敗"))}
}
async function changeManager(id,mid){
  if(mid===id||downlinesOf(id).some(u=>u.id===mid)){toast("不能選自己或自己底下的人當主管");renderAll();return}
  const writes=orgWrites(id,mid);
  try{await backend.updateUsers(writes);toast(writes.length>1?`已更新，底下 ${writes.length-1} 位一起搬移`:"已更新直屬主管")}catch(e){toast(errMsg(e,"更新失敗"));renderAll()}
}
document.addEventListener("change",e=>{const t=e.target.closest("select[data-mgr-uid]");if(t)changeManager(t.dataset.mgrUid,t.value||null)});
function mgrOptions(forId,current){
  const banned=new Set([forId,...(forId?downlinesOf(forId).map(u=>u.id):[])]);
  const opts=Ctx.users.filter(u=>u.status==="active"&&!banned.has(u.id)).sort((a,b)=>userName(a).localeCompare(userName(b),"zh-Hant"));
  return `<option value="">（未指定）</option>`+opts.map(u=>`<option value="${esc(u.id)}" ${u.id===current?"selected":""}>${esc(userName(u))}</option>`).join("");
}
async function setStatus(id,st,msg){try{await backend.setStatus(id,st);toast(msg)}catch(e){toast(errMsg(e,"更新失敗"))}}

/* ---------- render: actions ---------- */
function aItem(c,right){const g=gradeOf(c);return `<li><button type="button" data-id="${esc(keyOf(c))}"><span class="grade g" data-g="${g}" data-temp="${isTemp(c)?1:0}">${gradeLabel(c)||"–"}</span><span class="an">${esc(c.name)}<small>${esc(metaLine(c))}</small></span><span class="ad">${right}</span></button></li>`}
function bdayItems(){
  const bd=items().map(c=>[c,daysToBirthday(c)]).filter(([c,d])=>d!=null&&d<=30).sort((a,b)=>a[1]-b[1]);
  return bd.length?bd.map(([c,d])=>aItem(c,`<span class="due ${d<=3?"soon":""}">${d===0?"今天生日":d+" 天後・"+c.birthday.slice(5).replace("-","/")}</span>`)).join(""):`<li class="none">30 天內沒有壽星</li>`;
}
function carItems(){const l=carDueList(items());return l.length?l.map(({c,car,d})=>aItem(c,`<span class="due ${d<0?"over":d<=7?"soon":""}">${esc(car.plate||"未填車牌")}・${carDueText(d)}</span>`)).join(""):`<li class="none">目前沒有快到期的車險</li>`}
function openCarList(){
  $("#modalRoot").innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-box"><h3>車險快到期</h3><p>到期前 30 天和過期 30 天內的車險，點名字可以打開客戶資料。</p><ul class="alist" id="carModal">${carItems()}</ul><div class="modal-actions"><button class="btn" type="button" id="mNo">關閉</button></div></div></div>`;
  $("#mNo").onclick=()=>$("#modalRoot").innerHTML="";
  $("#modalRoot .modal").onclick=e=>{if(e.target.classList.contains("modal"))$("#modalRoot").innerHTML=""};
}
function openBdayList(){
  $("#modalRoot").innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-box"><h3>30 天內壽星</h3><p>依生日先後排列，點名字可以打開客戶資料。</p><ul class="alist">${bdayItems()}</ul><div class="modal-actions"><button class="btn" type="button" id="mNo">關閉</button></div></div></div>`;
  $("#mNo").onclick=()=>$("#modalRoot").innerHTML="";
  $("#modalRoot .modal").onclick=e=>{if(e.target.classList.contains("modal"))$("#modalRoot").innerHTML=""};
}
function setPanel(id,h,s){const p=$(id).parentElement;p.querySelector("h3").textContent=h;p.querySelector(".sub").textContent=s}
function staleItems(){
  const l=items().filter(isStale).sort((a,b)=>scoreOf(b).score-scoreOf(a).score||daysSinceTouch(b)-daysSinceTouch(a));
  return l.length?l.map(c=>aItem(c,`<span class="due over">${daysSinceTouch(c)} 天</span>`)).join(""):`<li class="none">目前沒有</li>`;
}
function openStaleList(){
  $("#modalRoot").innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-box"><h3>超過 ${REC_REMIND} 天沒聯絡</h3><p>沒有排下次聯絡日的人，分數高的排前面。點名字可以打開資料。</p><ul class="alist">${staleItems()}</ul><div class="modal-actions"><button class="btn" type="button" id="mNo">關閉</button></div></div></div>`;
  $("#mNo").onclick=()=>$("#modalRoot").innerHTML="";
  $("#modalRoot .modal").onclick=e=>{if(e.target.classList.contains("modal"))$("#modalRoot").innerHTML=""};
}
let logShow=30;
function renderRecLogs(){
  const rows=[];items().forEach(c=>arr(c.logs).forEach((l,i)=>rows.push({c,l,i})));
  rows.sort((a,b)=>(b.l.d||"").localeCompare(a.l.d||"")||b.i-a.i);
  $("#actLogSub").textContent=rows.length?`最新的在最上面，共 ${rows.length} 筆。點一筆可以打開那個人的跟進紀錄。`:(readOnly()?"這位業務還沒有互動紀錄。":"按「今天互動過」或新增跟進紀錄後，會出現在這裡。");
  $("#actLogs").innerHTML=rows.length?rows.slice(0,logShow).map(({c,l})=>`<li class="log-row"><button type="button" data-log-open="${esc(keyOf(c))}"><span class="an">${esc(c.name||"（未命名）")}<small>${esc(l.t||"")}${l.p&&l.p!=="contact"?"・"+esc(logStepLabel(l.p)):""}${l.x&&!l.x.startsWith(l.t||"\u0000")?"・"+esc(l.x):""}</small></span><span class="ad"><span class="num">${esc((l.d||"").replace(/-/g,"/"))}</span></span></button>${readOnly()?"":`<button type="button" class="log-del" data-log-del="${esc(l.id||"")}" data-log-owner="${esc(c.id)}" aria-label="刪除 ${esc(c.name||"")} ${esc(l.d||"")} 這筆紀錄" title="刪除">×</button>`}</li>`).join(""):`<li class="none">還沒有互動紀錄</li>`;
  const more=$("#actLogMore");more.hidden=rows.length<=logShow;more.textContent=`再顯示 ${Math.min(30,rows.length-logShow)} 筆`;
}
function renderAct(){
  const all=items();
  $("#actLogPanel").hidden=Ctx.book!=="rec";
  if(Ctx.book==="rec"){
    renderRecLogs();
    setPanel("#actDue","待跟進","已逾期與未來 14 天內的預定聯絡");
    setPanel("#actCar",`超過 ${REC_REMIND} 天沒聯絡`,"沒有排下次聯絡日的人，分數高的排前面");
    setPanel("#actBday","還沒開始聯絡","加進名單後一筆紀錄都沒有");
    setPanel("#actIdle","高分未排程","S／A 級但尚未設定下次聯絡日");
    const due=all.filter(c=>isActiveStage(c)&&c.nextDate&&dayDiff(c.nextDate)<=14).sort((a,b)=>a.nextDate<b.nextDate?-1:1);
    $("#actDue").innerHTML=due.length?due.map(c=>aItem(c,dueHtml(c))).join(""):`<li class="none">目前沒有待跟進的人</li>`;
    $("#actCar").innerHTML=staleItems();
    const never=all.filter(c=>isActiveStage(c)&&!arr(c.logs).length&&!isStale(c));
    $("#actBday").innerHTML=never.length?never.map(c=>aItem(c,`<span class="due">開始</span>`)).join(""):`<li class="none">目前沒有</li>`;
    const idle2=all.filter(c=>["S","A"].includes(gradeOf(c))&&!c.nextDate&&isActiveStage(c));
    $("#actIdle").innerHTML=idle2.length?idle2.map(c=>aItem(c,`<span class="num">${scoreOf(c).score} 分</span>`)).join(""):`<li class="none">高分名單都已排程</li>`;
    return;
  }
  setPanel("#actDue","待跟進","已逾期與未來 14 天內的預定聯絡");
  setPanel("#actCar","車險快到期","到期前 30 天和過期 30 天內，提前聯絡續保");
  setPanel("#actBday","近期壽星","未來 30 天生日，適合關懷問候");
  setPanel("#actIdle","高分未排程","S／A 級但尚未設定下次聯絡日");
  const due=all.filter(c=>isActiveStage(c)&&c.nextDate&&dayDiff(c.nextDate)<=14).sort((a,b)=>a.nextDate<b.nextDate?-1:1);
  $("#actDue").innerHTML=due.length?due.map(c=>aItem(c,dueHtml(c))).join(""):`<li class="none">目前沒有待跟進的客戶</li>`;
  $("#actBday").innerHTML=bdayItems();
  $("#actCar").innerHTML=carItems();
  const idle=all.filter(c=>["S","A"].includes(gradeOf(c))&&!c.nextDate&&isActiveStage(c)).sort((a,b)=>scoreOf(b).score-scoreOf(a).score);
  $("#actIdle").innerHTML=idle.length?idle.map(c=>aItem(c,`<span class="num">${scoreOf(c).score} 分</span>`)).join(""):`<li class="none">高分名單都已排程</li>`;
}

/* ---------- render: analysis ---------- */
function renderAna(){
  const all=items();
  const src=SOURCES.map(([k,t])=>{const l=all.filter(c=>c.source===k);const g={S:0,A:0,B:0,C:0};l.forEach(c=>{const x=gradeOf(c);if(x)g[x]++});return {k,t,n:l.length,g}}).filter(x=>x.n);
  const mx=Math.max(1,...src.map(x=>x.n));
  $("#anaSource").innerHTML=src.length?src.map(x=>`<div class="hbar"><span>${x.k} ${x.t}</span><span class="t" style="width:${x.n/mx*100}%">${["S","A","B","C"].map(k=>x.g[k]?`<i style="flex:${x.g[k]};background:var(--g${k})"></i>`:"").join("")}<i style="flex:${x.n-x.g.S-x.g.A-x.g.B-x.g.C};background:var(--line-2)"></i></span><span class="c">${x.n}</span></div>`).join(""):`<p class="sub">尚無資料</p>`;
  const st=STAGES.map(s=>({t:s.t,n:all.filter(c=>(c.stage||"lead")===s.k).length}));const ms=Math.max(1,...st.map(x=>x.n));
  $("#anaStage").innerHTML=st.map(x=>`<div class="hbar"><span>${x.t}</span><span class="t"><i style="width:${x.n/ms*100}%"></i></span><span class="c">${x.n}</span></div>`).join("");
  const rec=Ctx.book==="rec";
  setPanel("#anaStage",rec?"增員漏斗":"經營漏斗","各階段人數");
  const needPanel=$("#anaNeed").parentElement;needPanel.hidden=rec;needPanel.parentElement.classList.toggle("cols-2",rec);
  const nd=P.needs.map(n=>({t:n,n:all.filter(c=>arr(c.needs).includes(n)).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n);const mn=Math.max(1,...nd.map(x=>x.n));
  $("#anaNeed").innerHTML=nd.length?nd.map(x=>`<div class="hbar"><span>${x.t}</span><span class="t"><i style="width:${x.n/mn*100}%;background:var(--gold-2)"></i></span><span class="c">${x.n}</span></div>`).join(""):`<p class="sub">尚未標記需求</p>`;
}
function renderView(){
  document.querySelectorAll("#personal .tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.view===S.view));
  $("#view-list").hidden=S.view!=="list";$("#view-act").hidden=S.view!=="act";$("#view-ana").hidden=S.view!=="ana";
  if(S.view==="act")renderAct();if(S.view==="ana")renderAna();
}

/* ---------- render: team back office ---------- */
function advisorStats(uidv){
  const l=[...Ctx.team.values()].filter(c=>c._owner===uidv&&inBook(c));
  const g={S:0,A:0,B:0,C:0,"":0};l.forEach(c=>g[gradeOf(c)]++);
  const wk=ymd(new Date(Date.now()-7*864e5));
  let logs7=0,last="";
  l.forEach(c=>{arr(c.logs).forEach(x=>{if((x.d||"")>=wk)logs7++});if((c.updatedAt||"")>last)last=c.updatedAt||""});
  return {n:l.length,g,
    over:l.filter(c=>isActiveStage(c)&&c.nextDate&&dayDiff(c.nextDate)<0).length,
    due:l.filter(c=>isActiveStage(c)&&c.nextDate&&dayDiff(c.nextDate)>=0&&dayDiff(c.nextDate)<=7).length,
    won:l.filter(c=>c.stage==="won"||c.stage==="referral"||c.stage==="joined").length,
    sa:g.S+g.A,logs7,last};
}
function renderTeam(){
  const users=Ctx.users;
  const pending=users.filter(u=>u.status==="pending").sort((a,b)=>(tsDate(a.createdAt)||0)-(tsDate(b.createdAt)||0));
  const active=users.filter(u=>u.status==="active");
  const all=[...Ctx.team.values()].filter(inBook);
  const leader=!Ctx.admin;
  $("#btnTeamExport").hidden=leader;$("#showDisabledWrap").hidden=leader;
  $("#teamIntro").textContent=leader?"這裡只有你底下所有層級的成員。點選任一位，以唯讀模式查看他的名單。":(Ctx.book==="rec"?"點選任一位業務，以唯讀模式查看他的增員名單與跟進紀錄。":"點選任一位業務，以唯讀模式查看他的名單、經營建議與跟進紀錄。示範資料不列入統計。");
  renderOrg();
  const over=all.filter(c=>isActiveStage(c)&&c.nextDate&&dayDiff(c.nextDate)<0).length;
  const sa=all.filter(c=>["S","A"].includes(gradeOf(c))).length;
  const loading=!Ctx.teamReady||!Ctx.usersReady;
  $("#teamSummary").innerHTML=`
    <div class="stat"><div class="k">${leader?"我的組織人數":"已開通業務"}</div><div class="v num">${active.length}<small>位</small></div></div>
    <div class="stat"><div class="k">${Ctx.book==="rec"?"團隊增員名單":"團隊名單總數"}</div><div class="v num">${loading?"–":all.length}<small>位</small></div></div>
    <div class="stat"><div class="k">S／A 級名單</div><div class="v num">${loading?"–":sa}<small>位</small></div></div>
    <div class="stat"><div class="k">逾期未聯絡</div><div class="v num ${over?"alert":""}">${loading?"–":over}<small>位</small></div></div>
    ${leader?"":`<div class="stat"><div class="k">待開通申請</div><div class="v num ${pending.length?"alert":""}">${pending.length}<small>位</small></div></div>`}`;
  $("#pendPanel").hidden=leader||!pending.length;
  $("#pendList").innerHTML=pending.map(u=>`<li><span class="avatar">${u.photoURL?`<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`:esc(userName(u).slice(0,1))}</span><span class="an">${esc(userName(u))}<small>${esc(u.email||"")} ・ 申請於 ${fmtDate(u.createdAt)}</small></span><span class="pend-act"><label class="mgr-pick">直屬主管<select class="inp" data-pend-mgr="${esc(u.id)}">${mgrOptions(u.id,null)}</select></label><button class="btn" type="button" data-act="reject" data-uid="${esc(u.id)}">拒絕</button><button class="btn primary" type="button" data-act="approve" data-uid="${esc(u.id)}">開通</button></span></li>`).join("");
  let rows=users.filter(u=>u.status==="active"||(S.showDisabled&&u.status==="disabled"));
  if(S.teamQ)rows=rows.filter(u=>(userName(u)+" "+(u.email||"")).toLowerCase().includes(S.teamQ));
  const st=Object.fromEntries(rows.map(u=>[u.id,advisorStats(u.id)]));
  rows.sort((a,b)=>(a.status===b.status?0:a.status==="active"?-1:1)||st[b.id].n-st[a.id].n);
  const wk=d=>{if(!d)return '<span class="muted">尚無</span>';const days=Math.floor((Date.now()-new Date(d))/864e5);return days<=0?"今天":days+" 天前"};
  $("#teamBody").innerHTML=rows.length?rows.map(u=>{const s=st[u.id];const stale=s.last&&(Date.now()-new Date(s.last))/864e5>14;
    return `<tr data-uid="${esc(u.id)}" class="${u.status==="disabled"?"off":""}">
      <td><div class="tname"><span class="avatar">${u.photoURL?`<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`:esc(userName(u).slice(0,1))}</span><span>${esc(userName(u))}${u.id===Ctx.user.uid?' <em class="you">你</em>':""}${Ctx.adminRoles.get(u.id)==="owner"?' <em class="you">擁有者</em>':Ctx.adminRoles.has(u.id)?' <em class="you">管理員</em>':""}<small>${esc(u.email||"")}</small></span></div></td>
      <td>${leader?esc(u.managerId===Ctx.user.uid?userName(Ctx.profile):userName(userById(u.managerId))):`<select class="inp mgr-sel" data-mgr-uid="${esc(u.id)}" aria-label="${esc(userName(u))}的直屬主管">${mgrOptions(u.id,u.managerId)}</select>`}</td>
      <td class="num r"><b>${s.n}</b></td>
      <td><div class="mini">${s.n?["S","A","B","C"].map(k=>s.g[k]?`<span style="flex:${s.g[k]};background:var(--g${k})"></span>`:"").join("")+(s.g[""]?`<span style="flex:${s.g[""]};background:var(--line-2)"></span>`:""):""}</div><div class="mini-l num">S ${s.g.S} ・ A ${s.g.A} ・ B ${s.g.B} ・ C ${s.g.C}</div></td>
      <td class="num r ${s.over?"bad":""}">${s.over}</td>
      <td class="num r">${s.due}</td>
      <td class="num r">${s.won}</td>
      <td class="num r">${s.logs7}</td>
      <td class="${stale?"bad":""}">${wk(s.last)}</td>
      <td class="r nowrap"> ${leader?"":(u.id===Ctx.user.uid||Ctx.adminRoles.get(u.id)==="owner"?"":Ctx.adminRoles.has(u.id)?`<button class="btn ghost sm" type="button" data-act="unadmin" data-uid="${esc(u.id)}">取消管理員</button>`:u.status==="active"?`<button class="btn ghost sm" type="button" data-act="setadmin" data-uid="${esc(u.id)}">設為管理員</button>`:"")}${leader?"":(u.status==="disabled"?`<button class="btn ghost sm" type="button" data-act="enable" data-uid="${esc(u.id)}">恢復</button>`:(u.id!==Ctx.user.uid&&Ctx.adminRoles.get(u.id)!=="owner"?`<button class="btn ghost sm" type="button" data-act="disable" data-uid="${esc(u.id)}">停用</button>`:""))}<button class="btn sm" type="button" data-act="view" data-uid="${esc(u.id)}">查看名單</button></td>
    </tr>`}).join(""):`<tr><td colspan="10" class="empty-row">${loading?"載入中…":"目前沒有已開通的業務。業務用 Google 帳號登入後，會出現在上方「待開通」。"}</td></tr>`;
}
/* ---------- render: org chart ---------- */
function renderOrg(){
  const me=Ctx.user.uid;const leader=!Ctx.admin;
  const people=Ctx.users.filter(u=>u.status==="active");
  const p=Ctx.profile||{};
  const self=leader?{id:me,displayName:userName(p),email:p.email,photoURL:p.photoURL||Ctx.user.photoURL,managerId:null,uplines:[]}:null;
  const nodes=self?[self,...people]:people;
  const ids=new Set(nodes.map(u=>u.id));
  const byName=(a,b)=>userName(a).localeCompare(userName(b),"zh-Hant");
  const kids=id=>nodes.filter(u=>u.managerId===id).sort(byName);
  const roots=self?[self]:nodes.filter(u=>!u.managerId||!ids.has(u.managerId)).sort(byName);
  const statOf=id=>{if(leader&&id===me){const l=[...Ctx.my.values()].filter(c=>!c.demo&&inBook(c));return {n:l.length,sa:l.filter(c=>["S","A"].includes(gradeOf(c))).length}}return advisorStats(id)};
  const stats=new Map(nodes.map(u=>[u.id,statOf(u.id)]));
  const card=u=>{const c=kids(u.id).length;const team=nodes.filter(x=>arr(x.uplines).includes(u.id));const teamN=team.reduce((a,x)=>a+stats.get(x.id).n,0);const st=stats.get(u.id);const role=Ctx.adminRoles.get(u.id);
    const badges=`${u.id===me?'<em class="you">你</em>':""}${role==="owner"?'<em class="org-b admin">擁有者</em>':role?'<em class="org-b admin">管理員</em>':""}${c?'<em class="org-b lead">主管</em>':""}`;
    return `<button type="button" class="org-card" data-org="${esc(u.id)}"><span class="avatar">${u.photoURL?`<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`:esc(userName(u).slice(0,1))}</span><span class="org-info"><span class="org-name"><b>${esc(userName(u))}</b>${badges}</span><span class="org-stat num">名單 ${st.n} ・ S/A ${st.sa}</span>${c?`<span class="org-team num">團隊 ${team.length} 人 ・ 名單 ${teamN} 位</span>`:""}</span></button>`};
  const render=list=>`<ul>${list.map(u=>{const c=kids(u.id);return `<li>${card(u)}${c.length?render(c):""}</li>`}).join("")}</ul>`;
  $("#orgTree").innerHTML=nodes.length?render(roots):`<p class="sub">還沒有已開通的成員。</p>`;
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-org]");if(!b)return;if(!Ctx.admin&&b.dataset.org===Ctx.user.uid)setMode("mine");else setMode("advisor",b.dataset.org)});

/* ---------- insights engine ---------- */
const DECISION_TIP={
  "與配偶討論":"下次面談邀請配偶一起出席，避免一方轉述失真。",
  "需家人同意":"準備一頁式摘要讓他帶回給家人看，必要時安排家庭說明。",
  "依賴專業建議":"展現專業背書（RFA 認證、過往案例），給明確建議而非一堆選項。",
  "自己決定":"直接向本人說明即可，重點放在他自己的目標。"
};
const NEED_HOOK={
  "退休規劃":"用退休缺口試算開場：目前存款與月支出，推算退休後每月缺口。",
  "醫療保障":"從保單健檢切入，整理現有醫療與意外保障的缺口。",
  "子女教育金":"以子女年齡推算教育金需求與準備期間，搭配定期定額情境試算。",
  "房貸壓力":"檢視房貸利率、寬限期與還款結構，先處理現金流壓力。",
  "房產活化":"可用「房產活化聯動模型」試算：房貸增貸搭配保單帳戶的月現金流情境。",
  "資產傳承／節稅":"從遺產與贈與稅基本觀念切入，說明保險在傳承上的指定受益人功能。",
  "收入不穩":"先建立 6 個月緊急預備金，再談長期規劃。",
  "存不了錢":"用「逆向儲蓄」與 72 法則的觀念，先存再花。",
  "保單健檢":"請他帶現有保單，免費整理保障表，自然帶出缺口。",
  "創業／轉職":"可能是增員對象：分享自己的「為何而來」，了解他的職涯想法。"
};
function insights(c){
  const out=[];const a=ageOf(c);const band=ageBand(c);
  let segName="尚未設定年齡",segText="填入生日或年齡區間後，系統會依服務架構建議切入主軸。";
  const ageForSeg=a!=null?a:(band===0?24:band===1?30:band===2?40:band===3?50:null);
  if(ageForSeg!=null){
    if(ageForSeg<30){segName="20–30 歲 ・ 逆向儲蓄／定期定額";segText="收入剛起步、時間是最大資產。主軸放在建立儲蓄紀律與長期定期定額，保費占收入比例保守設定。"}
    else if(ageForSeg<=50){segName="30–50 歲 ・ 資產活化／財務減壓";segText="家庭責任與房貸最重的階段。先盤點現金流與負債結構，再談保障缺口與資產配置。"}
    else{segName="50 歲以上 ・ 房產活化／長期壽險";segText="退休倒數與傳承議題浮現。重點在退休月現金流、房產活化與資產傳承安排。"}
  }
  if(c.contact===0)out.push(["交情","warn","交情尚淺，先暖身","一年聯絡不到 2 次，先恢復互動（節日問候、分享財經解讀），3 次接觸後再提約訪。"]);
  if(c.approach===0)out.push(["接近度","warn","接觸難度高，放長線","目前幾乎不可能約到，先維持關懷與內容分享，等待生活事件（換工作、結婚、買房）再切入。"]);
  if(c.attitude==="排斥保險")out.push(["態度","warn","避免一開始談商品","以財務規劃與觀念分享為主，先提供價值，讓他主動問。"]);
  if(c.attitude==="已有信任顧問")out.push(["態度","","定位成第二意見","不批評既有規劃，以保單健檢、資產整理的角度提供客觀參考。"]);
  if(c.decision&&DECISION_TIP[c.decision])out.push(["決策","","決策方式："+c.decision,DECISION_TIP[c.decision]]);
  arr(c.needs).filter(n=>NEED_HOOK[n]).slice(0,3).forEach(n=>out.push(["切入點","",n,NEED_HOOK[n]]));
  if(isNum(c.property)&&c.property>=3&&(ageForSeg||0)>=40&&!arr(c.needs).includes("房產活化"))out.push(["機會","","可評估房產活化","持有房產 5 年以上且年齡 40+，若有退休現金流需求，可試算房產活化情境。"]);
  if(c.recruit==="有興趣"&&!arr(c.needs).includes("創業／轉職"))out.push(["增員","","具增員潛力","分享自己的「為何而來」，邀請參加說明會，先了解他的職涯目標。"]);
  const ch=arr(c.channel),ts=arr(c.timeslot);
  if(ch.length||ts.length)out.push(["聯絡","","偏好聯絡方式",[ch.join("、"),ts.join("、")].filter(Boolean).join(" ・ ")+(arr(c.hobbies).length?`。可聊的話題：${arr(c.hobbies).join("、")}。`:"")]);
  const bd=daysToBirthday(c);if(bd!=null&&bd<=30)out.push(["關懷","",bd===0?"今天生日":`${bd} 天後生日`,"準備生日問候或小禮物，是不談商品也能自然接觸的時機。"]);
  carDueList([c]).forEach(({car,d})=>out.unshift(["車險","warn",`車險${carDueText(d)}`,`車牌 ${car.plate||"未填"}，保險期間 ${car.start||"未填"} 到 ${car.end}。提前聯絡，討論續保。`]));
  const nd=dayDiff(c.nextDate);if(nd!=null&&nd<0&&isActiveStage(c))out.unshift(["提醒","warn",`已逾期 ${-nd} 天未聯絡`,"原定 "+c.nextDate+" 聯絡，建議今天補上並更新下次聯絡日。"]);
  return {segName,segText,tips:out};
}

/* ---------- drawer ---------- */
function blank(){
  const no=items().reduce((m,c)=>Math.max(m,+c.no||0),0)+1;
  return {id:uid(),no,name:"",stage:"lead",...(Ctx.book==="rec"?{book:"rec",rtype:"同業"}:{}),tags:[],needs:[],policies:[],invest:[],incomeType:[],channel:[],timeslot:[],hobbies:[],kids:[],logs:[],createdAt:new Date().toISOString()};
}
function openClient(key,tab){const c=itemsMap().get(key);if(!c)return;S.openId=key;S.draft=JSON.parse(JSON.stringify(c));S.dirty=false;S.dTab=tab||"ins";S.isNew=false;showDrawer()}
function openNew(){if(readOnly())return;S.draft=blank();S.openId=null;S.isNew=true;S.dirty=false;S.dTab="edit";showDrawer()}
function showDrawer(){renderDrawer();$("#drawer").classList.add("on");$("#scrim").classList.add("on");$("#drawer").setAttribute("aria-hidden","false");setTimeout(()=>{const f=$("#dBody input#f-name");if(S.isNew&&f)f.focus()},260)}
function closeDrawer(force){
  if(S.dirty&&!force){showConfirm("尚未儲存的修改","關閉後這次的修改會遺失。","放棄修改",()=>closeDrawer(true));return}
  $("#drawer").classList.remove("on");$("#scrim").classList.remove("on");$("#drawer").setAttribute("aria-hidden","true");S.openId=null;S.draft=null;S.dirty=false;
}
$("#scrim").addEventListener("click",()=>closeDrawer());
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if($("#modalRoot").firstChild){$("#modalRoot").innerHTML="";return}if($("#drawer").classList.contains("on"))closeDrawer()}});

function renderHead(){
  const c=S.draft;const g=gradeOf(c);const {score,filled,ready}=scoreOf(c);const ro=readOnly();
  const rec=isRec(c);const tabs=[!S.isNew&&(rec?ro&&["ins","增員資料"]:["ins","經營建議"]),!ro&&["edit",rec?"增員資料":"客戶資料"],!S.isNew&&["log",`跟進紀錄<span class="cnt">${arr(c.logs).length}</span>`]].filter(Boolean);
  $("#dHead").innerHTML=`<div class="d-top"><div class="grade" data-g="${g}" data-temp="${isTemp(c)?1:0}" id="dGrade">${gradeLabel(c)||"待評"}</div>
    <div style="min-width:0;flex:1"><h2>${esc(c.name||(S.isNew?"新增"+noun():"（未命名）"))}</h2><div class="meta">${esc(metaLine(c))||"No."+c.no}</div></div>
    <div class="score"><b class="num" id="dScore">${ready?score:"–"}</b><span id="dFilled">${isTemp(c)?scoreNote(c):filled+"/"+scoreN(c)+" 項已評"}</span></div>
    <button class="btn ghost d-close" type="button" id="dClose" aria-label="關閉">${ICON.close}</button></div>
    <div class="d-tabs tabs">${tabs.map(([k,t])=>`<button class="tab" type="button" data-dt="${k}" aria-selected="${S.dTab===k}">${t}</button>`).join("")}</div>`;
  $("#dClose").onclick=()=>closeDrawer();
  $("#dHead").querySelectorAll("[data-dt]").forEach(b=>b.onclick=()=>{
    if(S.dirty&&b.dataset.dt!=="edit"){showConfirm("尚未儲存的修改","切換分頁前要先儲存嗎？","儲存並切換",async()=>{if(await saveDraft())openClient(S.openId,b.dataset.dt)});return}
    S.dTab=b.dataset.dt;renderDrawer()});
}
function liveHead(){const c=S.draft;const g=gradeOf(c);const {score,filled,ready}=scoreOf(c);const ge=$("#dGrade");ge.dataset.g=g;ge.dataset.temp=isTemp(c)?1:0;ge.textContent=gradeLabel(c)||"待評";$("#dScore").textContent=ready?score:"–";$("#dFilled").textContent=isTemp(c)?scoreNote(c):filled+"/"+scoreN(c)+" 項已評"}
function renderDrawer(){
  if(!S.draft)return;
  if(!S.isNew&&S.openId&&!S.dirty){const fresh=itemsMap().get(S.openId);if(fresh)S.draft=JSON.parse(JSON.stringify(fresh))}
  if(readOnly()&&S.dTab==="edit")S.dTab="ins";
  if(isRec(S.draft)&&!readOnly()&&S.dTab==="ins")S.dTab="edit";
  renderHead();
  const body=$("#dBody"),foot=$("#dFoot");
  if(S.dTab==="ins"){
    body.innerHTML=insHtml(S.draft);
    foot.innerHTML=`<span class="msg">最後更新 ${S.draft.updatedAt?S.draft.updatedAt.slice(0,10):"—"}${readOnly()?" ・ 唯讀檢視":""}</span>${readOnly()?"":'<button class="btn primary" type="button" id="goEdit">編輯資料</button>'}`;
    const ge=$("#goEdit");if(ge)ge.onclick=()=>{S.dTab="edit";renderDrawer()};
  }
  else if(S.dTab==="log"){renderLog()}
  else{renderForm()}
  body.scrollTop=0;
}
function recViewHtml(c){
  const bdItem=(pt,k,v,miss)=>`<div class="bd ${miss?"miss":""}"><span class="p">${pt}</span><div class="k">${k}</div><div class="v">${v}</div></div>`;
  const bd=recKeys(c).map(k=>{const i=c[k];const label=SCORE[k].label.replace("（交情）","");if(isNum(i))return bdItem(SCORE[k].pts[i],label,SCORE[k].opts[i],false);return MID_PTS[k]!=null?bdItem(MID_PTS[k],label,"不清楚，先算普通",true):bdItem("–",label,"未填",true)}).join("");
  const row=(k,v)=>v?`<dt>${k}</dt><dd>${esc(v)}</dd>`:"";
  const prof=[row("類型",c.rtype),row("增員階段",(STG[c.stage||"lead"]||{}).t),row("名單來源",c.source?c.source+" "+SRC[c.source]+(c.referrer?`（${c.referrer} 介紹）`:""):""),...(isPeer(c)?[row("目前服務的公司",c.company),row("居住區域",c.area),row("Instagram 名稱",c.ig)]:[row("現在的工作",c.job),row("居住區域",c.area),row("電話",c.phone)]),row("LINE",c.line),row("推力是什麼",arr(c.p_pushWhy).join("、")),row("備註",c.note)].join("");
  return `<div class="sec" style="padding-bottom:14px"><div class="sec-h"><h4>${esc(c.rtype)}評分</h4><span>滿分 100</span></div><div class="breakdown">${bd}</div></div><div class="sec" style="padding-bottom:14px"><div class="sec-h"><h4>對象資料</h4></div><dl class="kv">${prof||"<dt>—</dt><dd>尚無資料</dd>"}</dl></div>`;
}
function insHtml(c){
  if(isRec(c))return recViewHtml(c);
  const I=insights(c);
  const bdItem=(pt,k,v,miss)=>`<div class="bd ${miss?"miss":""}"><span class="p">${pt}</span><div class="k">${k}</div><div class="v">${v}</div></div>`;
  const bd=SCORE_KEYS.map(k=>{const i=k==="age"?ageBand(c):c[k];const ok=isNum(i);const label=SCORE[k].label.replace("（交情）","");if(ok)return bdItem(SCORE[k].pts[i],label,SCORE[k].opts[i],false);return MID_PTS[k]!=null?bdItem(MID_PTS[k],label,"不清楚，先算普通",true):bdItem("–",label,"未填",true)}).join("")
    +(ATT_PTS[c.attitude]!=null?bdItem(ATT_PTS[c.attitude],ATT_LABEL,esc(c.attitude),false):bdItem(MID_PTS.attitude,ATT_LABEL,"不清楚，先算普通",true))
    +(()=>{const i=c.property;const ok=isNum(i);return bdItem(ok?(i>=1?"＋":"0"):"–","房產加分",ok?SCORE.property.opts[i]:"未填",!ok)})();
  const tips=I.tips.length?I.tips.map(([l,cls,h,p])=>`<div class="tip ${cls}"><span class="lbl">${esc(l)}</span><h5>${esc(h)}</h5><p>${esc(p)}</p></div>`).join(""):`<div class="tip"><span class="lbl">提示</span><h5>補上客戶習性</h5><p>在「客戶資料」填入決策方式與需求，這裡會產生具體的接觸建議。</p></div>`;
  const row=(k,v)=>v&&(Array.isArray(v)?v.length:true)?`<dt>${k}</dt><dd>${esc(Array.isArray(v)?v.join("、"):v)}</dd>`:"";
  const prof=[row("經營階段",(STG[c.stage||"lead"]||{}).t),row("名單來源",c.source?c.source+" "+SRC[c.source]+(c.referrer?`（${c.referrer} 介紹）`:""):""),row("生日",c.birthday),row("職業",[jobCatLabel(c),c.job].filter(Boolean).join("・")),row("居住區域",c.area),row("電話",c.phone),row("LINE",c.line),row("子女",c.kids),row("扶養父母",c.parents),row("收入型態",c.incomeType),row("房貸狀態",c.loan),row("汽車保險",arr(c.cars).map(x=>`${x.plate||"未填車牌"}（${x.start||"未填"} 到 ${x.end||"未填"}）`)),row("既有保單",c.policies),row("理財經驗",c.invest),row("風險屬性",c.risk),row("最在意",c.focus),row("對保險態度",c.attitude),row("增員潛力",c.recruit),row("Hashtag",c.tags),row("備註",c.note)].join("");
  return `<div class="ins-hero"><div class="eyebrow">服務主軸</div><div class="seg-name">${esc(I.segName)}</div><p>${esc(I.segText)}</p><div class="breakdown">${bd}</div></div>
    <div class="tips">${tips}</div>
    <div class="sec" style="margin-top:14px;padding-bottom:14px"><div class="sec-h"><h4>客戶輪廓</h4><span>${c.demo?"示範資料":""}</span></div><dl class="kv">${prof||'<dt>—</dt><dd>尚無資料</dd>'}</dl></div>`;
}

/* form */
function optGroup(key,list,{multi=false,scored=null,notes=null}={}){
  const v=S.draft[key];
  return `<div class="opts" data-key="${key}" data-multi="${multi?1:0}">${list.map((o,i)=>{
    const val=scored?i:o;const on=multi?arr(v).includes(val):v===val;
    return `<button type="button" class="opt ${scored?"scored":""}" data-v="${esc(String(val))}" aria-pressed="${on}">${esc(o)}${scored?`<small>${typeof scored[i]==="number"?scored[i]+"分":scored[i]}</small>`:notes?`<small>${notes[i]}</small>`:""}</button>`}).join("")}</div>`;
}
function scoreField(k){
  if(k==="attitude"){const old=S.draft.attitude==="已有信任顧問";return `<div class="field"><div class="lab">${ATT_LABEL}<em>${old?"舊資料：已有信任顧問，先算中立":"不清楚可先不選，算 5 分"}</em></div>${optGroup("attitude",P.attitude,{notes:P.attitude.map(a=>ATT_PTS[a]+"分")})}</div>`}
  const s=SCORE[k];
  if(k==="age"){const a=ageOf(S.draft);return `<div class="field" id="ageField"><div class="lab">${s.label}<em>${a!=null?`依生日自動計算：${a} 歲`:"或填生日自動計算"}</em></div>${a!=null?`<div class="opts">${s.opts.map((o,i)=>`<span class="opt scored" aria-pressed="${ageBand(S.draft)===i}" style="cursor:default">${o}<small>${s.pts[i]}分</small></span>`).join("")}</div>`:optGroup("age",s.opts,{scored:s.pts})}</div>`}
  if(k==="property")return `<div class="field"><div class="lab">${s.label}<em>不計分，有房產者分級加「+」</em></div>${optGroup(k,s.opts,{scored:s.marks})}</div>`;
  const must=(k==="contact"||k==="approach")&&S.isNew;
  const hint=REC_SCORE[k]?(s.must?"<em>沒選就是待評</em>":`<em>不清楚可先不選，算 ${s.mid} 分</em>`):"";
  return `<div class="field"><div class="lab">${s.label}${must?"<em>必填</em>":hint}</div>${optGroup(k,s.opts,{scored:s.pts})}</div>`;
}
function carRows(){return arr(S.draft.cars).map((x,i)=>{const d=dayDiff(x.end);const inWin=d!=null&&d<=CAR_WINDOW&&d>=-CAR_WINDOW;
  return `<div class="car-row"><div class="f3"><label class="field"><span class="lab">車牌</span><input class="inp" id="car-plate-${i}" data-car="${i}" data-field="plate" type="text" value="${esc(x.plate||"")}" placeholder="ABC-1234" autocomplete="off"></label><label class="field"><span class="lab">保險起日</span><input class="inp" id="car-start-${i}" data-car="${i}" data-field="start" type="date" value="${esc(x.start||"")}"></label><label class="field"><span class="lab">保險迄日</span><input class="inp" id="car-end-${i}" data-car="${i}" data-field="end" type="date" value="${esc(x.end||"")}"></label></div><div class="car-foot"><span class="car-st ${inWin?(d<0?"over":"soon"):""}">${d==null?"填迄日後會自動提醒":inWin?carDueText(d):d<0?`已過期 ${-d} 天`:`還有 ${d} 天到期`}</span><span class="car-btns">${x.end?`<button class="btn ghost sm" type="button" data-car-act="renew" data-i="${i}">續保一年</button>`:""}<button class="btn ghost sm" type="button" data-car-act="del" data-i="${i}">刪除</button></span></div></div>`}).join("")}
document.addEventListener("input",e=>{const t=e.target.closest("input[data-car]");if(!t||!S.draft)return;const x=arr(S.draft.cars)[+t.dataset.car];if(!x)return;x[t.dataset.field]=t.value;S.dirty=true});
document.addEventListener("change",e=>{const t=e.target.closest("input[data-car]");if(!t||!S.draft||t.type!=="date")return;const x=arr(S.draft.cars)[+t.dataset.car];if(!x)return;if(t.dataset.field==="start"&&x.start&&!x.end)x.end=addYear(x.start);$("#carList").innerHTML=carRows()});
document.addEventListener("click",e=>{const b=e.target.closest("[data-car-act]");if(!b||!S.draft)return;const act=b.dataset.carAct;if(act==="add"){S.draft.cars=[...arr(S.draft.cars),{id:uid(),plate:"",start:"",end:""}]}else{const i=+b.dataset.i;const list=arr(S.draft.cars).slice();if(act==="del")list.splice(i,1);if(act==="renew"&&list[i]){list[i]={...list[i],start:list[i].end,end:addYear(list[i].end)};toast("已續保一年，記得按儲存")}S.draft.cars=list}S.dirty=true;$("#carList").innerHTML=carRows()});
function pushOptions(){const out=[...PUSH_WHY];[...Ctx.my.values(),S.draft].forEach(c=>arr(c&&c.p_pushWhy).forEach(x=>{if(!out.includes(x))out.push(x)}));return out}
function addPushWhy(){
  const el=$("#f-pushNew");const v=(el.value||"").trim();if(!v){el.focus();return}
  const a=arr(S.draft.p_pushWhy).slice();if(!a.includes(v))a.push(v);S.draft.p_pushWhy=a;S.dirty=true;
  const t=$("#dBody").scrollTop;renderForm();$("#dBody").scrollTop=t;$("#f-pushNew").focus();
}
document.addEventListener("click",e=>{if(e.target.closest("#pushAdd"))addPushWhy()});
document.addEventListener("keydown",e=>{if(e.target.id==="f-pushNew"&&e.key==="Enter"){if(e.isComposing||e.keyCode===229)return;e.preventDefault();addPushWhy()}});
function renderRecForm(){
  const c=S.draft;
  const f=(label,inner)=>`<div class="field"><div class="lab">${label}</div>${inner}</div>`;
  const inp=(key,type="text",ph="")=>`<input class="inp" id="f-${key}" data-in="${key}" type="${type}" value="${esc(c[key]||"")}" placeholder="${esc(ph)}">`;
  $("#dBody").innerHTML=`
  ${c.stage==="joined"&&!S.isNew?`<div class="join-box"><b>${esc(c.name)} 已加入</b><p>請他用 Google 登入名單工具，再請管理員開通，直屬主管選你。</p></div>`:""}
  <div class="sec"><div class="sec-h"><h4>基本資料</h4><span>姓名為必填</span></div>
    ${f("類型<em>同業和白紙的評分項目不同</em>",optGroup("rtype",["同業","白紙"]))}
    <div class="f2">${f("姓名",inp("name","text","姓名"))}${f("增員階段",`<select class="inp" id="f-stage" data-in="stage">${STAGES.map(s=>`<option value="${s.k}" ${c.stage===s.k?"selected":""}>${s.t}</option>`).join("")}</select>`)}
    ${isPeer(c)?f("Instagram 名稱",inp("ig","text","例：@xxxxx")):f("電話",inp("phone","tel","09xx-xxx-xxx"))}${f("LINE ID",inp("line"))}
    ${isPeer(c)?f("目前服務的公司",inp("company","text","例：○○人壽")):f("現在的工作",inp("job","text","例：科技業工程師"))}${f("居住區域",inp("area","text","例：北屯區"))}
    ${f("下次聯絡日",inp("nextDate","date"))}${f("介紹人",inp("referrer","text","選填"))}</div>
    ${f("名單來源",`<div class="opts" data-key="source" data-multi="0">${SOURCES.map(([k,t])=>`<button type="button" class="opt" data-v="${k}" aria-pressed="${c.source===k}">${k} ${t}</button>`).join("")}</div>`)}
  </div>
  <div class="sec"><div class="sec-h"><h4>${esc(c.rtype)}評分</h4><span>${recKeys(c).length} 項計分・滿分 100</span></div>
    ${isPeer(c)?scoreField("p_push")+f("推力是什麼<em>可複選・不計分</em>",optGroup("p_pushWhy",pushOptions(),{multi:true})+`<div class="add-why"><input class="inp" id="f-pushNew" type="text" placeholder="清單沒有的原因，自己填" aria-label="自己填推力原因"><button class="btn" type="button" id="pushAdd">新增項目</button></div>`)+scoreField("p_prod"):recKeys(c).map(scoreField).join("")}
  </div>
  <div class="sec"><div class="sec-h"><h4>備註</h4></div>
    <div class="field"><textarea class="inp" id="f-note" data-in="note" aria-label="備註" placeholder="他最近的狀況、聊過什麼">${esc(c.note||"")}</textarea></div>
  </div>`;
  renderFormFoot();
}
function renderForm(){
  if(isRec(S.draft)){renderRecForm();return}
  const c=S.draft;
  const f=(label,inner,cls="")=>`<div class="field ${cls}"><div class="lab">${label}</div>${inner}</div>`;
  const inp=(key,type="text",ph="",extra="")=>`<input class="inp" id="f-${key}" data-in="${key}" type="${type}" value="${esc(c[key]||"")}" placeholder="${esc(ph)}" ${extra}>`;
  $("#dBody").innerHTML=`
  <div class="sec"><div class="sec-h"><h4>基本資料</h4><span>姓名為必填</span></div>
    <div class="f2">${f("姓名",inp("name","text","客戶姓名"))}${f("經營階段",`<select class="inp" id="f-stage" data-in="stage">${STAGES.map(s=>`<option value="${s.k}" ${c.stage===s.k?"selected":""}>${s.t}</option>`).join("")}</select>`)}
    ${f("生日",inp("birthday","date"))}${f("下次聯絡日",inp("nextDate","date"))}
    ${f("電話",inp("phone","tel","09xx-xxx-xxx"))}${f("LINE ID",inp("line","text",""))}
    ${f("職業（細項）",inp("job","text","例：國中老師、牙醫、餐廳老闆"))}${f("居住區域",inp("area","text","例：北屯區","list=\"areaList\""))}</div>
    <div class="car-box" id="carSec"><div class="car-h"><b>汽車保險</b><span>到期前 30 天會提醒</span></div><div id="carList">${carRows()}</div><button class="btn" type="button" id="carAdd" data-car-act="add">＋ 新增一台車</button></div>
    ${f("性別",optGroup("gender",P.gender))}
    ${f("職業類別",optGroup("jobCat",P.jobCat)+`<input class="inp" id="f-jobOther" data-in="jobOther" type="text" value="${esc(c.jobOther||"")}" placeholder="請輸入職業類別，例如：農漁業、宗教人員、自由接案" style="margin-top:8px" ${c.jobCat==="其他"?"":"hidden"}>`)}
    ${f("名單來源",`<div class="opts" data-key="source" data-multi="0">${SOURCES.map(([k,t])=>`<button type="button" class="opt" data-v="${k}" aria-pressed="${c.source===k}">${k} ${t}</button>`).join("")}</div>`)}
    <div class="f2">${f("介紹人",inp("referrer","text","轉介紹來源（選填）"))}${f("增員潛力",optGroup("recruit",P.recruit))}</div>
  </div>
  <div class="sec"><div class="sec-h"><h4>名單評分</h4><span>六項計分・滿分 100・房產為加分項</span></div>
    ${[...SCORE_KEYS,"attitude","property"].map(scoreField).join("")}
  </div>
  <div class="sec"><div class="sec-h"><h4>家庭與財務</h4><span>不計分・用於需求分析</span></div>
    ${f("子女階段（可複選）",optGroup("kids",P.kids,{multi:true}))}
    ${f("扶養父母",optGroup("parents",P.parents))}
    ${f("收入型態（可複選）",optGroup("incomeType",P.incomeType,{multi:true}))}
    ${f("房貸狀態",optGroup("loan",P.loan))}
    ${f("既有保單（可複選）",optGroup("policies",P.policies,{multi:true}))}
    ${f("理財經驗（可複選）",optGroup("invest",P.invest,{multi:true}))}
    ${f("風險屬性",optGroup("risk",P.risk))}
  </div>
  <div class="sec"><div class="sec-h"><h4>需求與痛點</h4><span>會產生對應的切入建議</span></div>
    ${f("需求（可複選）",optGroup("needs",P.needs,{multi:true}))}
  </div>
  <div class="sec"><div class="sec-h"><h4>溝通習性</h4><span>業務觀察紀錄</span></div>
    ${f("決策方式",optGroup("decision",P.decision))}
    ${f("最在意",optGroup("focus",P.focus))}
    ${f("偏好聯絡管道（可複選）",optGroup("channel",P.channel,{multi:true}))}
    ${f("方便聯絡時段（可複選）",optGroup("timeslot",P.timeslot,{multi:true}))}
    ${f("興趣嗜好（可複選）",optGroup("hobbies",P.hobbies,{multi:true}))}
  </div>
  <div class="sec"><div class="sec-h"><h4>Hashtag 與備註</h4><span>點選快速加入，或自行輸入</span></div>
    ${f("Hashtag",`<input class="inp" id="f-tags" data-in="tags" type="text" value="${esc(arr(c.tags).join(" "))}" placeholder="#孝順 #朋友多"><div class="opts" style="margin-top:8px" id="tagSug">${TAG_SUGGEST.map(t=>`<button type="button" class="opt" data-tag="${esc(t)}" aria-pressed="${arr(c.tags).includes(t)}">${esc(t)}</button>`).join("")}</div>`)}
    ${f("備註",`<textarea class="inp" id="f-note" data-in="note" placeholder="家庭狀況、近期生活事件、上次聊到的話題…">${esc(c.note||"")}</textarea>`)}
  </div>
  <datalist id="areaList">${AREAS.map(a=>`<option value="${a}">`).join("")}</datalist>`;
  renderFormFoot();
}
function renderFormFoot(){
  $("#dFoot").innerHTML=`${S.isNew?'<span class="msg">新增後可記錄跟進</span>':'<button class="btn danger" type="button" id="btnDel">刪除</button>'}<div style="display:flex;gap:8px"><button class="btn" type="button" id="btnCancel">${S.isNew?"取消":"還原"}</button><button class="btn primary" type="button" id="btnSave">${S.isNew?"新增"+noun():"儲存"}</button></div>`;
  $("#btnSave").onclick=saveDraft;
  $("#btnCancel").onclick=()=>{if(S.isNew){S.dirty=false;closeDrawer(true)}else{S.dirty=false;openClient(S.openId,"edit")}};
  const del=$("#btnDel");if(del)del.onclick=()=>showConfirm("刪除「"+(S.draft.name||"這筆資料")+"」？",noun()+"資料與所有跟進紀錄都會刪除，無法復原。","確認刪除",async()=>{const id=S.openId;S.dirty=false;closeDrawer(true);if(await removeClient(id))toast("已刪除")},true);
}
$("#dBody").addEventListener("click",e=>{
  if(S.dTab!=="edit"||readOnly())return;
  const t=e.target.closest(".opt[data-tag]");
  if(t){const tags=arr(S.draft.tags).slice();const v=t.dataset.tag;const i=tags.indexOf(v);i>=0?tags.splice(i,1):tags.push(v);S.draft.tags=tags;$("#f-tags").value=tags.join(" ");t.setAttribute("aria-pressed",i<0);S.dirty=true;return}
  const b=e.target.closest("button.opt");if(!b)return;
  const g=b.closest(".opts");const key=g.dataset.key;const multi=g.dataset.multi==="1";
  let v=b.dataset.v;if(SCORE[key])v=+v;
  if(multi){const a=arr(S.draft[key]).slice();const i=a.indexOf(v);i>=0?a.splice(i,1):a.push(v);S.draft[key]=a;b.setAttribute("aria-pressed",i<0)}
  else{const on=S.draft[key]===v;S.draft[key]=on?null:v;g.querySelectorAll(".opt").forEach(x=>x.setAttribute("aria-pressed",!on&&x===b));
    if(key==="jobCat"){const jo=$("#f-jobOther");if(jo){jo.hidden=S.draft.jobCat!=="其他";if(!jo.hidden)jo.focus()}}}
  if(key==="rtype"){if(!S.draft.rtype)S.draft.rtype=v;const t=$("#dBody").scrollTop;S.dirty=true;renderHead();renderForm();$("#dBody").scrollTop=t;return}
  S.dirty=true;liveHead();
});
$("#dBody").addEventListener("input",e=>{
  const el=e.target.closest("[data-in]");if(!el||S.dTab!=="edit")return;
  const k=el.dataset.in;
  if(k==="tags"){S.draft.tags=el.value.split(/[\s,，]+/).filter(Boolean).map(t=>/^[#＃]/.test(t)?"#"+t.slice(1):"#"+t);document.querySelectorAll("#tagSug .opt").forEach(b=>b.setAttribute("aria-pressed",S.draft.tags.includes(b.dataset.tag)))}
  else S.draft[k]=el.value;
  S.dirty=true;
  if(k==="birthday"){liveHead();const host=$("#ageField");if(host)host.outerHTML=scoreField("age")}
  if(k==="name"){$("#dHead h2").textContent=el.value||"新增"+noun()}
});
$("#dBody").addEventListener("change",e=>{const el=e.target.closest("[data-in]");if(el&&el.tagName==="SELECT"){S.draft[el.dataset.in]=el.value;S.dirty=true}});
async function saveDraft(){
  const c=S.draft;c.name=(c.name||"").trim();
  if(!c.name){toast("請先填寫姓名");const n=$("#f-name");if(n)n.focus();return false}
  if(S.isNew&&!isPeer(c)&&(!isNum(c.contact)||!isNum(c.approach))){toast("請選擇交情和接近難易度");const o=document.querySelector(`.opts[data-key="${isNum(c.contact)?"approach":"contact"}"]`);if(o)o.scrollIntoView({block:"center"});return false}
  if(ageOf(c)!=null)c.age=ageBand(c);
  if(c.jobCat!=="其他")delete c.jobOther;else c.jobOther=(c.jobOther||"").trim();
  if(arr(c.cars).some(x=>x.start&&x.end&&x.end<x.start)){toast("車險迄日不能早於起日");const o=$("#carSec");if(o)o.scrollIntoView({block:"center"});return false}
  if(c.cars)c.cars=arr(c.cars).map(x=>({...x,plate:String(x.plate||"").trim().toUpperCase()})).filter(x=>x.plate||x.start||x.end);
  const btn=$("#btnSave");if(btn){btn.disabled=true;btn.textContent="儲存中…"}
  const ok=await saveClient(c);
  if(btn)btn.disabled=false;
  if(ok){const wasNew=S.isNew;S.dirty=false;S.isNew=false;S.openId=c.id;toast(wasNew?"已新增 "+c.name:"已儲存");S.dTab="ins";renderDrawer()}
  else if(btn)btn.textContent="儲存";
  return ok;
}

/* logs */
function renderLog(){
  const c=S.draft;const ro=readOnly();const logs=arr(c.logs).slice().sort((a,b)=>(b.d||"")<(a.d||"")?-1:1);
  $("#dBody").innerHTML=(ro?"":`<div class="log-add">
    <div class="f2"><div class="field"><div class="lab">日期</div><input class="inp" type="date" id="lg-d" value="${today()}"></div>
    <div class="field"><div class="lab">方式</div><select class="inp" id="lg-t">${(isRec(c)?[IG_TOUCH,...LOG_TYPES]:LOG_TYPES).map(t=>`<option>${t}</option>`).join("")}</select></div></div>
    <div class="field"><div class="lab">內容</div><textarea class="inp" id="lg-x" placeholder="${isRec(c)?"聊了什麼、他的反應、下一步…":"聊了什麼、客戶的反應、下一步…"}"></textarea></div>
    <div class="field"><div class="lab">這次做到哪裡${isRec(c)?"":"<em>會計入工作量</em>"}</div><select class="inp" id="lg-p">${LOG_STEPS.map(([k,t])=>`<option value="${k}">${t}</option>`).join("")}</select></div>
    <div class="f2"><div class="field"><div class="lab">下次聯絡日<em>選填，會同步更新</em></div><input class="inp" type="date" id="lg-n" value="${esc(c.nextDate||"")}"></div>
    <div class="field"><div class="lab">更新階段</div><select class="inp" id="lg-s">${STAGES.map(s=>`<option value="${s.k}" ${(c.stage||"lead")===s.k?"selected":""}>${s.t}</option>`).join("")}</select></div></div>
  </div>`)+
  (logs.length?`<ul class="timeline">${logs.map(l=>`<li><div class="lt"><span class="num">${esc(l.d)}</span><span class="pill">${esc(l.t)}</span>${l.p&&l.p!=="contact"?`<span class="pill need">${esc(logStepLabel(l.p))}</span>`:""}${ro?"":`<button class="del" type="button" data-del="${esc(l.id)}" aria-label="刪除此筆">刪除</button>`}</div><div class="lx">${esc(l.x)}</div></li>`).join("")}</ul>`:`<p class="hint" style="text-align:center;padding:20px 0">${ro?"還沒有跟進紀錄。":"還沒有跟進紀錄。每次接觸後花 30 秒記下重點，下次聯絡就有話題。"}</p>`);
  $("#dFoot").innerHTML=`<span class="msg">共 ${logs.length} 筆紀錄${ro?" ・ 唯讀檢視":""}</span>${ro?"":'<button class="btn primary" type="button" id="lgAdd">新增紀錄</button>'}`;
  if(ro)return;
  $("#lg-p").onchange=e=>{$("#lg-s").value=stageAfterStep(c.stage||"lead",e.target.value)};
  $("#lgAdd").onclick=async()=>{
    const x=$("#lg-x").value.trim();if(!x){toast("請填寫紀錄內容");$("#lg-x").focus();return}
    const c2=JSON.parse(JSON.stringify(S.draft));
    c2.logs=arr(c2.logs).concat([{id:uid(),d:$("#lg-d").value||today(),t:$("#lg-t").value,p:$("#lg-p").value,x}]).slice(-200);
    c2.nextDate=$("#lg-n").value||"";c2.stage=$("#lg-s").value;c2.lastContact=$("#lg-d").value||today();
    $("#lgAdd").disabled=true;
    if(await saveClient(c2)){S.draft=c2;toast("已記錄");renderDrawer()}else $("#lgAdd").disabled=false;
  };
  $("#dBody").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>showConfirm("刪除這筆紀錄？","刪除後無法復原。","刪除",async()=>{const c2=JSON.parse(JSON.stringify(S.draft));c2.logs=arr(c2.logs).filter(l=>l.id!==b.dataset.del);if(await saveClient(c2)){S.draft=c2;renderDrawer()}},true));
}

/* ---------- modal + toast ---------- */
function showConfirm(title,text,okText,onOk,danger){
  $("#modalRoot").innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-box"><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="modal-actions"><button class="btn" type="button" id="mNo">取消</button><button class="btn ${danger?"danger":"primary"}" type="button" id="mOk">${esc(okText)}</button></div></div></div>`;
  $("#mNo").onclick=()=>$("#modalRoot").innerHTML="";
  $("#mOk").onclick=()=>{$("#modalRoot").innerHTML="";onOk()};
  $("#modalRoot .modal").onclick=e=>{if(e.target.classList.contains("modal"))$("#modalRoot").innerHTML=""};
}
let tt;function toast(m){let el=$(".toast");if(!el){el=document.createElement("div");el.className="toast";el.setAttribute("role","status");document.body.appendChild(el)}el.textContent=m;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>{el.hidden=true},2800)}
function openProfileEdit(){
  const p=Ctx.profile||{};
  $("#modalRoot").innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-box"><h3>我的帳號</h3><p>${esc(p.email||"")}${Ctx.admin?" ・ 管理員":""}</p>
    <div class="field"><div class="lab">顯示名稱<em>主管後台看到的名稱</em></div><input class="inp" id="pfName" value="${esc(p.displayName||"")}"></div>
    <div class="modal-actions"><button class="btn danger" type="button" data-signout2>登出</button><span style="flex:1"></span><button class="btn" type="button" id="mNo">取消</button><button class="btn primary" type="button" id="pfSave">儲存</button></div></div></div>`;
  $("#mNo").onclick=()=>$("#modalRoot").innerHTML="";
  $("[data-signout2]").onclick=()=>{$("#modalRoot").innerHTML="";if(S.dirty){showConfirm("尚未儲存的修改","登出後這次的修改會遺失。","登出",()=>{S.dirty=false;doSignOut()});return}doSignOut()};
  $("#pfSave").onclick=async()=>{const n=$("#pfName").value.trim();if(!n){toast("請輸入名稱");return}try{await backend.updateProfile(Ctx.user.uid,{displayName:n,email:Ctx.user.email});$("#modalRoot").innerHTML="";toast("已更新")}catch(e){toast(errMsg(e,"更新失敗"))}};
}

/* ---------- import ---------- */
let pending=[];
function openImport(){
  if(readOnly())return;pending=[];
  $("#modalRoot").innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-box"><h3>匯入 Excel 名單</h3>
    <p>支援兩種格式：原本的「客戶名單」直式範本（每一欄一位客戶、勾選 1 計分），以及本系統匯出的 Excel。名單內已有同名客戶會略過。</p>
    <label class="drop" for="impFile" id="impDrop">點此選擇 .xlsx 檔案，或把檔案拖到這裡</label><input type="file" id="impFile" accept=".xlsx,.xls,.csv" hidden>
    <div id="impRes" style="margin-top:12px;font-size:13px"></div>
    <div class="modal-actions"><button class="btn" type="button" id="impNo">取消</button><button class="btn primary" type="button" id="impOk" disabled>匯入</button></div></div></div>`;
  $("#impNo").onclick=()=>$("#modalRoot").innerHTML="";
  $("#impFile").onchange=e=>{if(e.target.files[0])readFile(e.target.files[0])};
  const d=$("#impDrop");d.ondragover=e=>{e.preventDefault();d.style.borderColor="var(--gold)"};d.ondrop=e=>{e.preventDefault();if(e.dataTransfer.files[0])readFile(e.dataTransfer.files[0])};
  $("#impOk").onclick=doImport;
}
function readFile(file){
  if(typeof XLSX==="undefined"){$("#impRes").textContent="Excel 解析元件尚未載入，請重新整理頁面後再試。";return}
  const r=new FileReader();
  r.onload=()=>{
    try{
      const wb=XLSX.read(new Uint8Array(r.result),{type:"array",cellDates:true});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null});
      pending=String(rows[0]&&rows[0][0]||"").includes("來源種類")?parseTemplate(rows):parseFlat(XLSX.utils.sheet_to_json(ws,{raw:true,defval:""}));
      const names=new Set([...Ctx.my.values()].filter(c=>!isRec(c)).map(c=>c.name));
      const dup=pending.filter(c=>names.has(c.name)).length;pending=pending.filter(c=>!names.has(c.name));
      $("#impRes").innerHTML=pending.length?`找到 <b>${pending.length}</b> 位可匯入的客戶${dup?`（另有 ${dup} 位同名已略過）`:""}：${esc(pending.slice(0,6).map(c=>c.name).join("、"))}${pending.length>6?"…":""}`:`沒有找到可匯入的客戶${dup?`（${dup} 位同名已存在）`:""}。請確認是原始範本或本系統匯出的檔案。`;
      $("#impOk").disabled=!pending.length;
    }catch(err){$("#impRes").textContent="無法讀取這個檔案，請確認是 Excel 格式。"}
  };
  r.readAsArrayBuffer(file);
}
function toYmd(v){if(v instanceof Date&&!isNaN(v))return ymd(v);if(typeof v==="number"){const d=XLSX.SSF.parse_date_code(v);return d?d.y+"-"+pad(d.m)+"-"+pad(d.d):""}if(typeof v==="string"){const m=/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(v);if(m)return m[1]+"-"+pad(m[2])+"-"+pad(m[3])}return ""}
function nextNo(){return [...Ctx.my.values()].filter(c=>!isRec(c)).reduce((m,c)=>Math.max(m,+c.no||0),0)}
function parseTemplate(rows){
  const R=n=>rows[n-1]||[];const out=[];const width=Math.max(...rows.map(r=>r?r.length:0));
  const ranges={income:[9,14],age:[14,18],marital:[18,22],property:[22,27],contact:[27,31],approach:[31,35]};
  let base=nextNo();
  for(let col=4;col<width;col++){
    const name=R(3)[col];if(name==null||String(name).trim()===""||String(name).trim()==="範例")continue;
    const c=blank();c.name=String(name).trim();c.no=++base;
    const src=String(R(2)[col]||"").trim().toUpperCase().charAt(0);if(SRC[src])c.source=src;
    c.birthday=toYmd(R(7)[col]);if(c.birthday==="2025-01-01")c.birthday="";
    const job=R(8)[col];if(job)c.job=String(job).trim();
    for(const k in ranges){const [a,b]=ranges[k];for(let r=a;r<b;r++){const v=R(r)[col];if(v!==null&&v!==""&&v!==0&&v!=="0")c[k]=r-a}}
    const tg=R(35)[col];if(tg)c.tags=String(tg).split(/[\n\s,，]+/).map(t=>t.replace(/^[#＃]/,"")).filter(Boolean).map(t=>"#"+t);
    if(ageOf(c)!=null)c.age=ageBand(c);
    out.push(c);
  }
  return out;
}
const FLAT=[["編號","no"],["姓名","name"],["經營階段","stage"],["來源","source"],["介紹人","referrer"],["生日","birthday"],["性別","gender"],["職業類別","jobCat"],["職業","job"],["居住區域","area"],["電話","phone"],["LINE","line"],["每月收入","income"],["年齡","age"],["婚姻","marital"],["房產","property"],["交情","contact"],["接近難易度","approach"],["分數","_score"],["分級","_grade"],["子女階段","kids"],["扶養父母","parents"],["收入型態","incomeType"],["房貸狀態","loan"],["既有保單","policies"],["理財經驗","invest"],["風險屬性","risk"],["需求","needs"],["決策方式","decision"],["最在意","focus"],["對保險態度","attitude"],["聯絡管道","channel"],["聯絡時段","timeslot"],["興趣嗜好","hobbies"],["增員潛力","recruit"],["Hashtag","tags"],["下次聯絡日","nextDate"],["最近聯絡","lastContact"],["備註","note"],["車牌","_carPlate"],["車險起日","_carStart"],["車險到期日","_carEnd"],["跟進紀錄","_logs"]];
const MULTI=["kids","incomeType","policies","invest","needs","channel","timeslot","hobbies","tags"];
function parseFlat(objs){
  const out=[];let base=nextNo();
  objs.forEach(o=>{
    const name=String(o["姓名"]||"").trim();if(!name)return;
    const c=blank();c.no=++base;
    FLAT.forEach(([h,k])=>{let v=o[h];if(v===""||v==null||k.startsWith("_"))return;
      if(SCORE[k]){const i=SCORE[k].opts.indexOf(String(v));if(i>=0)c[k]=i}
      else if(MULTI.includes(k))c[k]=String(v).split(/[、,，]\s*|\s+(?=#)/).map(s=>s.trim()).filter(Boolean);
      else if(k==="jobCat"){const t=String(v).trim();if(P.jobCat.includes(t))c.jobCat=t;else{c.jobCat="其他";c.jobOther=t}}
      else if(k==="stage"){const s=STAGES.find(s=>s.t===String(v));c.stage=s?s.k:"lead"}
      else if(k==="source"){const ch=String(v).trim().charAt(0).toUpperCase();if(SRC[ch])c.source=ch}
      else if(k==="birthday"||k==="nextDate"||k==="lastContact")c[k]=toYmd(v);
      else if(k==="no")c.no=+v||c.no;
      else c[k]=String(v);
    });
    const carCol=v=>v==null||v===""?[]:typeof v==="string"?v.split(/[、,，]\s*/):[v];
    const ps=carCol(o["車牌"]),ss=carCol(o["車險起日"]),es=carCol(o["車險到期日"]);
    if(ps.length||es.length){c.cars=Array.from({length:Math.max(ps.length,es.length)},(_,i)=>({id:uid(),plate:String(ps[i]||"").trim().toUpperCase(),start:ss[i]?toYmd(ss[i]):"",end:es[i]?toYmd(es[i]):""}))}
    c.name=name;out.push(c);
  });
  return out;
}
async function doImport(){
  const b=$("#impOk");b.disabled=true;let n=0;
  for(const c of pending){b.textContent=`匯入中 ${n+1}/${pending.length}`;c.updatedAt=new Date().toISOString();try{await backend.saveClient(Ctx.user.uid,c);n++}catch(e){toast(errMsg(e,"匯入中斷"));break}}
  $("#modalRoot").innerHTML="";toast(`已匯入 ${n} 位客戶`);pending=[];
}

/* ---------- export ---------- */
function recRow(c,withOwner){
  const o={};if(withOwner){const u=userById(c._owner);o["負責業務"]=userName(u);o["業務 Email"]=u&&u.email||""}
  const sc=scoreOf(c);const opt=k=>isNum(c[k])?SCORE[k].opts[c[k]]:"";
  Object.assign(o,{"編號":c.no||"","姓名":c.name||"","類型":c.rtype||"","增員階段":(STG[c.stage||"lead"]||STG.lead).t,"來源":c.source?c.source+" "+(SRC[c.source]||""):"","介紹人":c.referrer||"","目前服務的公司":c.company||"","現在的工作":c.job||"","居住區域":c.area||"","電話":c.phone||"","Instagram 名稱":c.ig||"","LINE":c.line||"","分數":sc.ready?sc.score:"","分級":gradeOf(c)});
  Object.keys(REC_SCORE).forEach(k=>o[REC_SCORE[k].label]=opt(k));
  Object.assign(o,{"交情":opt("contact"),"接近難易度":opt("approach"),"推力是什麼":arr(c.p_pushWhy).join("、"),"也是客戶":c.alsoClient?"是":"","下次聯絡日":c.nextDate||"","最近聯絡":c.lastContact||"","備註":c.note||"","跟進紀錄":arr(c.logs).slice().sort((a,b)=>a.d<b.d?-1:1).map(l=>`${l.d} ${l.t}${l.p&&l.p!=="contact"?`（${logStepLabel(l.p)}）`:""}：${l.x}`).join("\n")});
  return o;
}
function exportClients(list,label,withOwner){
  if(!list.length){toast("沒有可匯出的資料");return}
  if(typeof XLSX==="undefined"){toast("Excel 元件尚未載入，請重新整理後再試");return}
  list=list.slice().sort((a,b)=>withOwner?(userName(userById(a._owner)).localeCompare(userName(userById(b._owner)),"zh-Hant")||(a.no||0)-(b.no||0)):(a.no||0)-(b.no||0));
  const rows=Ctx.book==="rec"?list.map(c=>recRow(c,withOwner)):list.map(c=>{const o={};if(withOwner){const u=userById(c._owner);o["負責業務"]=userName(u);o["業務 Email"]=u&&u.email||""}
    const sc=scoreOf(c);FLAT.forEach(([h,k])=>{let v=c[k];
    if(k==="_carPlate")v=arr(c.cars).map(x=>x.plate||"").join("、");else if(k==="_carStart")v=arr(c.cars).map(x=>x.start||"").join("、");else if(k==="_carEnd")v=arr(c.cars).map(x=>x.end||"").join("、");else if(k==="_score")v=sc.ready?sc.score:"";else if(k==="_grade")v=sc.ready?gradeLabel(c)+(sc.final?"":"（暫定）"):"待評";
    else if(k==="_logs")v=arr(c.logs).slice().sort((a,b)=>a.d<b.d?-1:1).map(l=>`${l.d} ${l.t}${l.p&&l.p!=="contact"?`（${logStepLabel(l.p)}）`:""}：${l.x}`).join("\n");
    else if(k==="age"){const i=ageBand(c);v=isNum(i)?SCORE.age.opts[i]:""}
    else if(SCORE[k])v=isNum(v)?SCORE[k].opts[v]:"";
    else if(k==="jobCat")v=jobCatLabel(c);
    else if(k==="stage")v=(STG[v||"lead"]||STG.lead).t;
    else if(k==="source")v=v?v+" "+SRC[v]:"";
    else if(Array.isArray(v))v=v.join(k==="tags"?" ":"、");
    o[h]=v==null?"":v});return o});
  const ws=XLSX.utils.json_to_sheet(rows);
  ws["!cols"]=Object.keys(rows[0]).map(h=>({wch:["備註","跟進紀錄","需求","既有保單","興趣嗜好","業務 Email"].includes(h)?30:12}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,Ctx.book==="rec"?"增員名單":"客戶名單");
  const out=XLSX.write(wb,{type:"array",bookType:"xlsx"});
  const url=URL.createObjectURL(new Blob([out],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
  const a=document.createElement("a");a.href=url;a.download=`${label}_${today()}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  toast("已匯出 Excel");
}

/* ---------- demo data ---------- */
function shiftDate(n){const d=new Date();d.setDate(d.getDate()+n);return ymd(d)}
function bdayIn(n,age){const d=new Date();d.setDate(d.getDate()+n);d.setFullYear(d.getFullYear()-age);return ymd(d)}
async function loadDemo(){
  let base=nextNo();
  const D=[
    {name:"陳志明（示範）",source:"B",birthday:bdayIn(120,48),gender:"男",jobCat:"企業主",job:"五金行老闆",area:"北屯區",income:4,marital:3,property:4,contact:3,approach:3,kids:["大學"],parents:"部分分擔",incomeType:["自營收入","租金收入"],loan:"已還清",policies:["醫療／意外","壽險"],invest:["房地產","股票／ETF"],risk:"穩健",needs:["退休規劃","房產活化","資產傳承／節稅"],decision:"自己決定",focus:"資產成長",attitude:"認同規劃",channel:["LINE","面談"],timeslot:["平日晚上"],hobbies:["登山露營","汽車"],recruit:"無",stage:"proposal",nextDate:shiftDate(2),tags:["#朋友多","#有影響力"],note:"名下兩戶，一戶自住一戶出租。希望 60 歲退休後每月有穩定現金流。"},
    {name:"林怡君（示範）",source:"G",birthday:bdayIn(9,33),gender:"女",jobCat:"上班族",job:"科技業 PM",area:"西屯區",income:3,marital:3,property:1,contact:2,approach:2,kids:["學齡前"],parents:"無需扶養",incomeType:["固定薪資","業績獎金"],loan:"寬限期中",policies:["僅公司團保"],invest:["基金","以存款為主"],risk:"穩健",needs:["子女教育金","房貸壓力","醫療保障"],decision:"與配偶討論",focus:"保障完整",attitude:"中立觀望",channel:["LINE"],timeslot:["平日晚上","假日"],hobbies:["親子","美食"],recruit:"無",stage:"met",nextDate:shiftDate(-3),tags:["#愛家","#精打細算"]},
    {name:"黃建宏（示範）",source:"H",birthday:bdayIn(200,27),gender:"男",jobCat:"業務",job:"汽車業務",area:"南屯區",income:2,marital:1,property:0,contact:2,approach:3,parents:"無需扶養",incomeType:["業績獎金"],loan:"無房貸",policies:["醫療／意外"],invest:["股票／ETF"],risk:"積極",needs:["存不了錢","收入不穩","創業／轉職"],decision:"自己決定",focus:"資產成長",attitude:"認同規劃",channel:["LINE","電話"],timeslot:["平日晚上"],hobbies:["運動健身","3C 科技"],recruit:"有興趣",stage:"booked",nextDate:shiftDate(5),tags:["#話題王"]},
    {name:"張淑芬（示範）",source:"A",birthday:bdayIn(22,58),gender:"女",jobCat:"軍公教",job:"國小老師",area:"烏日區",income:2,marital:3,property:4,contact:1,approach:2,kids:["已就業"],parents:"主要扶養",incomeType:["固定薪資"],loan:"已還清",policies:["壽險","儲蓄險"],invest:["以存款為主"],risk:"保守",needs:["醫療保障","退休規劃","保單健檢"],decision:"需家人同意",focus:"服務與信任",attitude:"已有信任顧問",channel:["電話","面談"],timeslot:["假日"],hobbies:["宗教","藝文"],recruit:"無",stage:"touched",tags:["#孝順"]},
    {name:"吳家豪（示範）",source:"K",birthday:bdayIn(300,38),gender:"男",jobCat:"專業人士",job:"牙醫師",area:"西區",income:4,marital:2,property:2,contact:0,approach:1,parents:"部分分擔",incomeType:["固定薪資","投資收益"],loan:"房貸還款中",policies:["醫療／意外","投資型"],invest:["股票／ETF","外幣","基金"],risk:"積極",needs:["資產傳承／節稅","退休規劃"],decision:"依賴專業建議",focus:"資產成長",attitude:"中立觀望",channel:["LINE"],timeslot:["平日白天"],hobbies:["旅遊","投資理財"],recruit:"無",stage:"lead",tags:["#好工作"]},
    {name:"劉美玲（示範）",source:"L",birthday:bdayIn(90,44),gender:"女",jobCat:"家管",area:"大里區",income:1,marital:3,property:3,contact:0,approach:0,kids:["國高中"],loan:"房貸還款中",policies:["尚無保單"],invest:["以存款為主"],risk:"保守",needs:["子女教育金"],decision:"與配偶討論",focus:"價格",attitude:"排斥保險",channel:["簡訊"],timeslot:["平日白天"],hobbies:["親子","寵物"],recruit:"可觀察",stage:"hold",tags:["#精打細算"]}
  ];
  for(const d of D){const c=Object.assign(blank(),d,{no:++base,demo:true,updatedAt:new Date().toISOString()});c.age=ageBand(c);c.logs=d.stage==="lead"||d.stage==="hold"?[]:[{id:uid(),d:shiftDate(-10),t:"面談",x:"示範紀錄：初次面談，了解家庭結構與目前保單。"}];try{await backend.saveClient(Ctx.user.uid,c)}catch(e){toast(errMsg(e,"載入失敗"));return}}
  toast("已載入 6 筆示範名單");
}
async function clearDemo(){for(const c of [...Ctx.my.values()].filter(c=>c.demo)){if(!(await removeClient(c.id)))break}toast("已清除示範資料")}

setBook("client");
