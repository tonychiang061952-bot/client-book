// 客戶經營名單｜前端主程式
import { backend } from "./backend.js";
import { TEAM } from "./config.js";

/* ---------- option dictionaries ---------- */
const SOURCES=[["A","親戚"],["B","朋友"],["C","鄉親"],["D","同好"],["E","消費"],["F","社團"],["G","同事"],["H","同學"],["I","老師"],["J","轉介"],["K","網路客"],["L","陌生開發"]];
const SRC=Object.fromEntries(SOURCES);
const SCORE={
  income:{label:"每月收入",opts:["2萬以下","2–4萬","4–7萬","7–10萬","10萬以上"],pts:[0,10,15,20,25]},
  age:{label:"年齡",opts:["25歲以下","26–35歲","36–45歲","46歲以上"],pts:[5,10,10,5]},
  marital:{label:"婚姻",opts:["單身","交往中","已婚無子女","已婚有子女"],pts:[5,10,10,15]},
  property:{label:"房產",opts:["無房產","2年內購入","持有2–5年","持有5–10年","持有10年以上"],pts:[0,5,10,15,20]},
  contact:{label:"一年內聯絡（交情）",opts:["2次以下・不熟","3–7次・普通","7–11次・好朋友","12次以上・麻吉"],pts:[5,10,15,20]},
  approach:{label:"接近難易度",opts:["幾乎不可能","有點難","容易","非常容易"],pts:[0,5,10,15]}
};
const SCORE_KEYS=["income","age","marital","property","contact","approach"];
const MAX_SCORE=105;
const STAGES=[
  {k:"lead",t:"名單",c:"var(--muted)",b:"var(--surface-2)"},
  {k:"touched",t:"已聯繫",c:"var(--gB)",b:"var(--surface-2)"},
  {k:"booked",t:"已約訪",c:"var(--navy)",b:"var(--navy-soft)"},
  {k:"met",t:"已面談",c:"var(--navy)",b:"var(--navy-soft)"},
  {k:"proposal",t:"提案中",c:"var(--warn)",b:"var(--warn-soft)"},
  {k:"won",t:"已成交",c:"var(--ok)",b:"var(--ok-soft)"},
  {k:"referral",t:"轉介紹",c:"var(--gold)",b:"var(--gold-soft)"},
  {k:"hold",t:"暫緩",c:"var(--bad)",b:"var(--bad-soft)"}
];
const STG=Object.fromEntries(STAGES.map(s=>[s.k,s]));
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
  disc:["D 主導型","I 社交型","S 穩健型","C 分析型"],
  decision:["自己決定","與配偶討論","需家人同意","依賴專業建議"],
  focus:["價格","保障完整","服務與信任","資產成長"],
  attitude:["排斥保險","中立觀望","認同規劃","已有信任顧問"],
  channel:["LINE","電話","面談","簡訊"],
  timeslot:["平日白天","平日晚上","假日"],
  hobbies:["運動健身","旅遊","美食","親子","投資理財","宗教","寵物","藝文","汽車","3C 科技","登山露營","公益"],
  recruit:["無","可觀察","有興趣"]
};
const TAG_SUGGEST=["#孝順","#朋友多","#好工作","#愛家","#精打細算","#重面子","#熱心","#有影響力","#注重健康","#話題王","#夜貓子","#愛分享"];
const LOG_TYPES=["電話","LINE","面談","活動","關懷／送禮","其他"];
const AREAS=["北屯區","西屯區","南屯區","北區","西區","中區","東區","南區","大里區","太平區","烏日區","豐原區","大雅區","潭子區","霧峰區","沙鹿區","龍井區","梧棲區","清水區","大肚區","神岡區","后里區","外縣市"];

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
function scoreOf(c){let s=0,filled=0;for(const k of SCORE_KEYS){const i=k==="age"?ageBand(c):c[k];if(isNum(i)&&SCORE[k].pts[i]!=null){s+=SCORE[k].pts[i];filled++}}return {score:s,filled}}
function gradeOf(c){const {score,filled}=scoreOf(c);if(filled===0||score===0)return "";return score>94?"S":score>=75?"A":score>=60?"B":"C"}
function daysToBirthday(c){const d=parseD(c.birthday);if(!d)return null;const t=parseD(today());let n=new Date(t.getFullYear(),d.getMonth(),d.getDate());if(n<t)n=new Date(t.getFullYear()+1,d.getMonth(),d.getDate());return Math.round((n-t)/864e5)}
const isActiveStage=c=>!["won","hold"].includes(c.stage);

/* ---------- session context ---------- */
const Ctx={
  user:null,profile:null,admin:false,
  my:new Map(),myReady:false,
  team:new Map(),teamReady:false,users:[],usersReady:false,
  mode:"mine",viewUid:null,
  subs:{}
};
function stopSub(k){if(Ctx.subs[k]){try{Ctx.subs[k]()}catch(e){}delete Ctx.subs[k]}}
function stopAll(){Object.keys(Ctx.subs).forEach(stopSub)}
const readOnly=()=>Ctx.mode!=="mine";
function itemsMap(){
  if(Ctx.mode==="advisor"){const m=new Map();for(const [k,c] of Ctx.team)if(c._owner===Ctx.viewUid)m.set(k,c);return m}
  return Ctx.my;
}
const items=()=>[...itemsMap().values()];
const ready=()=>Ctx.mode==="mine"?Ctx.myReady:Ctx.teamReady;
const userById=id=>Ctx.users.find(u=>u.id===id);
const userName=u=>u?(u.displayName||u.email||"未命名業務"):"未命名業務";

async function saveClient(c){
  c=JSON.parse(JSON.stringify(c));c.updatedAt=new Date().toISOString();
  try{await backend.saveClient(Ctx.user.uid,c);Ctx.my.set(c.id,c);renderAll();return true}
  catch(e){toast(errMsg(e,"儲存失敗"));return false}
}
async function removeClient(id){
  try{await backend.deleteClient(Ctx.user.uid,id);Ctx.my.delete(id);renderAll();return true}
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
const S={view:"list",q:"",grade:"all",stage:"",source:"",need:"",disc:"",sort:"score",openId:null,dTab:"ins",draft:null,dirty:false,isNew:false,teamQ:"",showDisabled:false};
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
  Ctx.user=u;Ctx.profile=null;Ctx.admin=false;Ctx.my=new Map();Ctx.myReady=false;Ctx.team=new Map();Ctx.teamReady=false;Ctx.users=[];Ctx.usersReady=false;Ctx.mode="mine";Ctx.viewUid=null;
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
    stopSub("my");return;
  }
  if(p.status!=="active"){show("screen-disabled");stopSub("my");return}
  show("screen-app");
  if(!Ctx.subs.my){
    Ctx.subs.my=backend.watchMyClients(Ctx.user.uid,list=>{Ctx.my=new Map(list.map(c=>[c.id,c]));Ctx.myReady=true;renderAll()},err=>{toast(errMsg(err,"讀取名單失敗"));Ctx.myReady=true;renderAll()});
  }
  if(Ctx.admin&&!Ctx.subs.users){
    Ctx.subs.users=backend.watchUsers(list=>{Ctx.users=list;Ctx.usersReady=true;renderAll()},err=>toast(errMsg(err,"讀取業務名單失敗")));
  }
  renderAll();
}
$("#pendSave").addEventListener("click",async()=>{
  const n=$("#pendName").value.trim();if(!n){toast("請輸入姓名");return}
  try{await backend.updateProfile(Ctx.user.uid,{displayName:n,email:Ctx.user.email});toast("已更新姓名")}catch(e){toast(errMsg(e,"更新失敗"))}
});
$("#pendCopy").addEventListener("click",()=>copyText(Ctx.user.uid,"已複製使用者 ID"));

/* ---------- mode switching (admin) ---------- */
function setMode(mode,viewUid){
  if(S.dirty){showConfirm("尚未儲存的修改","切換前會放棄這次的修改。","放棄並切換",()=>{S.dirty=false;closeDrawer(true);setMode(mode,viewUid)});return}
  closeDrawer(true);
  Ctx.mode=mode;Ctx.viewUid=viewUid||null;
  if(mode!=="mine"&&!Ctx.subs.team){
    Ctx.subs.team=backend.watchAllClients(list=>{Ctx.team=new Map(list.filter(c=>!c.demo).map(c=>[c.id+"@"+c._owner,c]));Ctx.teamReady=true;renderAll()},err=>{console.error(err);toast((err&&String(err.code).includes("failed-precondition"))?"團隊後台需要建立資料庫索引，請參考 README 常見問題":errMsg(err,"讀取團隊名單失敗"));Ctx.teamReady=true;renderAll()});
  }
  S.grade="all";S.stage=S.source=S.need=S.disc=S.q="";$("#q").value="";["#fStage","#fSource","#fNeed","#fDisc"].forEach(s=>$(s).value="");
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
fillSelect($("#fDisc"),"全部個性",P.disc.map(n=>[n,n]));
$("#fSort").value=S.sort;
$("#gradeSeg").innerHTML=[["all","全部"],["S","S"],["A","A"],["B","B"],["C","C"],["none","未評"]].map(([v,t])=>`<button type="button" data-g="${v}" aria-pressed="${v===S.grade}">${t}</button>`).join("");
$("#gradeSeg").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;S.grade=b.dataset.g;[...$("#gradeSeg").children].forEach(x=>x.setAttribute("aria-pressed",x===b));renderList()});
$("#q").addEventListener("input",e=>{S.q=e.target.value.trim().toLowerCase();renderList()});
[["#fStage","stage"],["#fSource","source"],["#fNeed","need"],["#fDisc","disc"],["#fSort","sort"]].forEach(([s,k])=>$(s).addEventListener("change",e=>{S[k]=e.target.value;if(k==="sort")rememberUI();renderList()}));
document.querySelectorAll("#personal .tab").forEach(t=>t.addEventListener("click",()=>{S.view=t.dataset.view;rememberUI();renderView()}));
$("#btnNew").addEventListener("click",()=>openNew());
$("#btnImport").addEventListener("click",openImport);
$("#btnExport").addEventListener("click",()=>exportClients(items(),Ctx.mode==="advisor"?`${userName(userById(Ctx.viewUid))}_客戶名單`:"我的客戶名單",false));
$("#btnTeamExport").addEventListener("click",()=>exportClients([...Ctx.team.values()],"全團隊客戶名單",true));
$("#teamQ").addEventListener("input",e=>{S.teamQ=e.target.value.trim().toLowerCase();renderTeam()});
$("#showDisabled").addEventListener("change",e=>{S.showDisabled=e.target.checked;renderTeam()});
$("#userChip").addEventListener("click",openProfileEdit);

/* ---------- render: header & modes ---------- */
function renderHeader(){
  const p=Ctx.profile||{},u=Ctx.user||{};
  const name=p.displayName||u.displayName||u.email||"";
  const photo=p.photoURL||u.photoURL;
  $("#userChip").innerHTML=`<span class="avatar">${photo?`<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer">`:esc((name||"?").slice(0,1))}</span><span class="uname">${esc(name)}</span>${Ctx.admin?'<span class="role">管理員</span>':""}`;
  $("#modeSeg").hidden=!Ctx.admin;
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
  const all=items();const n=all.length;
  const g={S:0,A:0,B:0,C:0,"":0};all.forEach(c=>g[gradeOf(c)]++);
  const due=all.filter(c=>{const d=dayDiff(c.nextDate);return d!=null&&d<=7&&isActiveStage(c)}).length;
  const over=all.filter(c=>{const d=dayDiff(c.nextDate);return d!=null&&d<0&&isActiveStage(c)}).length;
  const bd=all.filter(c=>{const d=daysToBirthday(c);return d!=null&&d<=30}).length;
  const won=all.filter(c=>c.stage==="won"||c.stage==="referral").length;
  const seg=k=>n?`<span style="width:${g[k]/n*100}%;background:var(--g${k})"></span>`:"";
  $("#summary").innerHTML=`
    <div class="stat"><div class="k">名單總數 ・ 分級分佈</div><div class="v num">${n}<small>位</small></div>
      <div class="dist">${seg("S")}${seg("A")}${seg("B")}${seg("C")}</div>
      <div class="dist-legend"><span><b style="color:var(--gS)">${g.S}</b>S</span><span><b style="color:var(--gA)">${g.A}</b>A</span><span><b style="color:var(--gB)">${g.B}</b>B</span><span><b style="color:var(--gC)">${g.C}</b>C</span>${g[""]?`<span><b>${g[""]}</b>未評</span>`:""}</div></div>
    <div class="stat"><div class="k">7 天內待跟進</div><div class="v num">${due}<small>位</small></div></div>
    <div class="stat"><div class="k">已逾期未聯絡</div><div class="v num ${over?"alert":""}">${over}<small>位</small></div></div>
    <button type="button" class="stat stat-btn" data-act="bday"><div class="k">30 天內壽星</div><div class="v num">${bd}<small>位</small></div>${bd?'<div class="more">查看名單 ›</div>':""}</button>
    <div class="stat"><div class="k">成交／轉介紹</div><div class="v num">${won}<small>位</small></div></div>`;
  const ac=$("#actCnt");ac.textContent=due;ac.classList.toggle("hot",over>0);
}

/* ---------- render: list ---------- */
function filtered(){
  let list=items();
  if(S.grade!=="all")list=list.filter(c=>S.grade==="none"?gradeOf(c)==="":gradeOf(c)===S.grade);
  if(S.stage)list=list.filter(c=>(c.stage||"lead")===S.stage);
  if(S.source)list=list.filter(c=>c.source===S.source);
  if(S.need)list=list.filter(c=>arr(c.needs).includes(S.need));
  if(S.disc)list=list.filter(c=>c.disc===S.disc);
  if(S.q){list=list.filter(c=>[c.name,c.job,c.jobCat,c.jobOther,c.area,c.note,c.referrer,arr(c.tags).join(" "),arr(c.needs).join(" "),arr(c.hobbies).join(" ")].join(" ").toLowerCase().includes(S.q))}
  const by={
    score:(a,b)=>scoreOf(b).score-scoreOf(a).score||(a.no||0)-(b.no||0),
    next:(a,b)=>(a.nextDate||"9999")<(b.nextDate||"9999")?-1:(a.nextDate||"9999")>(b.nextDate||"9999")?1:0,
    updated:(a,b)=>(b.updatedAt||"")<(a.updatedAt||"")?-1:1,
    no:(a,b)=>(a.no||0)-(b.no||0)
  };
  return list.sort(by[S.sort]||by.score);
}
function dueHtml(c){
  if(!c.nextDate)return `<span class="due" style="color:var(--muted)">${ICON.cal}未排下次聯絡</span>`;
  const d=dayDiff(c.nextDate);const cls=d<0?"over":d<=3?"soon":"";
  const txt=d<0?`逾期 ${-d} 天`:d===0?"今天聯絡":d===1?"明天聯絡":`${c.nextDate.slice(5).replace("-","/")} 聯絡`;
  return `<span class="due ${cls}">${ICON.cal}${txt}</span>`;
}
function stageHtml(k){const s=STG[k||"lead"]||STG.lead;return `<span class="stage" style="color:${s.c};background:${s.b}">${s.t}</span>`}
function metaLine(c){const a=ageOf(c);return [c.source?`${c.source} ${SRC[c.source]||""}`:"",a!=null?a+"歲":(isNum(c.age)?SCORE.age.opts[c.age]:""),c.job||jobCatLabel(c),c.area||""].filter(Boolean).join(" ・ ")}
function keyOf(c){return Ctx.mode==="advisor"?c.id+"@"+c._owner:c.id}
function cardHtml(c){
  const g=gradeOf(c);const {score}=scoreOf(c);
  const needs=arr(c.needs).slice(0,3).map(n=>`<span class="pill need">${esc(n)}</span>`).join("");
  const disc=c.disc?`<span class="pill disc">${esc(c.disc)}</span>`:"";
  const tags=arr(c.tags).slice(0,3).map(t=>`<span class="pill tag">${esc(t)}</span>`).join("");
  return `<button type="button" class="card" data-id="${esc(keyOf(c))}">
    ${readOnly()?"":`<span class="card-del" data-del-client="${esc(c.id)}" role="button" aria-label="刪除 ${esc(c.name||"此客戶")}" title="刪除">×</span>`}
    <div class="card-head">
      <div class="grade" data-g="${g}">${g||"未評"}</div>
      <div class="who"><div class="name">${esc(c.name||"（未命名）")}<span class="no">No.${esc(c.no||"-")}</span>${c.demo?'<span class="demo-flag">示範</span>':""}</div><div class="meta">${esc(metaLine(c))||"&nbsp;"}</div></div>
      <div class="score"><b class="num">${score}</b><span>/ ${MAX_SCORE}</span></div>
    </div>
    <div class="bar"><i style="width:${Math.min(100,score/MAX_SCORE*100)}%"></i></div>
    ${(needs||disc||tags)?`<div class="chips">${disc}${needs}${tags}</div>`:""}
    <div class="card-foot">${stageHtml(c.stage)}${dueHtml(c)}</div>
  </button>`;
}
function renderList(){
  const area=$("#listArea");
  if(!ready()){area.innerHTML=`<div class="empty"><h3>正在載入名單</h3><p>連線到資料庫中…</p></div>`;$("#resultLine").textContent="";return}
  const total=items().length;
  if(total===0){
    area.innerHTML=readOnly()?`<div class="empty"><h3>這位業務還沒有建立名單</h3><p>示範資料不會列入團隊後台。</p></div>`:
      `<div class="empty"><h3>建立你的第一份經營名單</h3><p>可以直接匯入原本的「客戶名單」Excel 範本，或手動新增。想先看看系統怎麼運作，也可以載入 6 筆示範名單，之後一鍵清除。</p>
      <div class="row"><button class="btn primary" type="button" data-act="new">新增客戶</button><button class="btn" type="button" data-act="import">匯入 Excel</button><button class="btn ghost" type="button" data-act="demo">載入示範名單</button></div></div>`;
    $("#resultLine").textContent="";return;
  }
  const list=filtered();
  const demoN=items().filter(c=>c.demo).length;
  $("#resultLine").innerHTML=`顯示 ${list.length} / ${total} 位`+(demoN&&!readOnly()?` ・ 含 ${demoN} 筆示範資料 <button class="btn ghost" style="padding:2px 8px;font-size:12px" type="button" data-act="cleardemo">清除示範</button>`:"");
  area.innerHTML=list.length?`<div class="grid">${list.map(cardHtml).join("")}</div>`:`<div class="empty"><h3>沒有符合條件的客戶</h3><p>調整搜尋字詞或篩選條件看看。</p></div>`;
}
document.addEventListener("click",e=>{
  const del=e.target.closest("[data-del-client]");
  if(del){const id=del.dataset.delClient,c=Ctx.my.get(id);showConfirm("刪除「"+(c&&c.name||"此客戶")+"」？","客戶資料與所有跟進紀錄都會刪除，無法復原。","確認刪除",async()=>{if(await removeClient(id))toast("已刪除")},true);return}
  const card=e.target.closest(".card[data-id], .alist button[data-id]");
  if(card){if(card.closest("#modalRoot"))$("#modalRoot").innerHTML="";openClient(card.dataset.id,"ins");return}
  const row=e.target.closest("tr[data-uid]");
  if(row&&!e.target.closest("button")){setMode("advisor",row.dataset.uid);return}
  const a=e.target.closest("[data-act]");if(!a)return;
  const act=a.dataset.act;
  if(act==="new")openNew();else if(act==="import")openImport();else if(act==="demo")loadDemo();else if(act==="cleardemo")clearDemo();else if(act==="bday")openBdayList();
  else if(act==="approve"||act==="enable")setStatus(a.dataset.uid,"active",act==="approve"?"已開通":"已恢復");
  else if(act==="reject"||act==="disable"){const u=userById(a.dataset.uid);showConfirm(act==="reject"?`拒絕「${userName(u)}」的申請？`:`停用「${userName(u)}」？`,act==="reject"?"對方將無法使用系統。之後仍可在「顯示已停用帳號」中恢復。":"停用後對方無法登入使用名單，但他建立的名單會保留，你仍可在後台檢視與匯出。","確認",()=>setStatus(a.dataset.uid,"disabled",act==="reject"?"已拒絕":"已停用"),true)}
  else if(act==="view")setMode("advisor",a.dataset.uid);
});
async function setStatus(id,st,msg){try{await backend.setStatus(id,st);toast(msg)}catch(e){toast(errMsg(e,"更新失敗"))}}

/* ---------- render: actions ---------- */
function aItem(c,right){const g=gradeOf(c);return `<li><button type="button" data-id="${esc(keyOf(c))}"><span class="grade g" data-g="${g}">${g||"–"}</span><span class="an">${esc(c.name)}<small>${esc(metaLine(c))}</small></span><span class="ad">${right}</span></button></li>`}
function bdayItems(){
  const bd=items().map(c=>[c,daysToBirthday(c)]).filter(([c,d])=>d!=null&&d<=30).sort((a,b)=>a[1]-b[1]);
  return bd.length?bd.map(([c,d])=>aItem(c,`<span class="due ${d<=3?"soon":""}">${d===0?"今天生日":d+" 天後・"+c.birthday.slice(5).replace("-","/")}</span>`)).join(""):`<li class="none">30 天內沒有壽星</li>`;
}
function openBdayList(){
  $("#modalRoot").innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-box"><h3>30 天內壽星</h3><p>依生日先後排列，點名字可以打開客戶資料。</p><ul class="alist">${bdayItems()}</ul><div class="modal-actions"><button class="btn" type="button" id="mNo">關閉</button></div></div></div>`;
  $("#mNo").onclick=()=>$("#modalRoot").innerHTML="";
  $("#modalRoot .modal").onclick=e=>{if(e.target.classList.contains("modal"))$("#modalRoot").innerHTML=""};
}
function renderAct(){
  const all=items();
  const due=all.filter(c=>isActiveStage(c)&&c.nextDate&&dayDiff(c.nextDate)<=14).sort((a,b)=>a.nextDate<b.nextDate?-1:1);
  $("#actDue").innerHTML=due.length?due.map(c=>aItem(c,dueHtml(c))).join(""):`<li class="none">目前沒有待跟進的客戶</li>`;
  $("#actBday").innerHTML=bdayItems();
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
  const nd=P.needs.map(n=>({t:n,n:all.filter(c=>arr(c.needs).includes(n)).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n);const mn=Math.max(1,...nd.map(x=>x.n));
  $("#anaNeed").innerHTML=nd.length?nd.map(x=>`<div class="hbar"><span>${x.t}</span><span class="t"><i style="width:${x.n/mn*100}%;background:var(--gold-2)"></i></span><span class="c">${x.n}</span></div>`).join(""):`<p class="sub">尚未標記需求</p>`;
  const dc=P.disc.map(n=>({t:n,n:all.filter(c=>c.disc===n).length}));const md=Math.max(1,...dc.map(x=>x.n));
  $("#anaDisc").innerHTML=dc.map(x=>`<div class="hbar"><span>${x.t}</span><span class="t"><i style="width:${x.n/md*100}%;background:var(--navy)"></i></span><span class="c">${x.n}</span></div>`).join("");
}
function renderView(){
  document.querySelectorAll("#personal .tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.view===S.view));
  $("#view-list").hidden=S.view!=="list";$("#view-act").hidden=S.view!=="act";$("#view-ana").hidden=S.view!=="ana";
  if(S.view==="act")renderAct();if(S.view==="ana")renderAna();
}

/* ---------- render: team back office ---------- */
function advisorStats(uidv){
  const l=[...Ctx.team.values()].filter(c=>c._owner===uidv);
  const g={S:0,A:0,B:0,C:0,"":0};l.forEach(c=>g[gradeOf(c)]++);
  const wk=ymd(new Date(Date.now()-7*864e5));
  let logs7=0,last="";
  l.forEach(c=>{arr(c.logs).forEach(x=>{if((x.d||"")>=wk)logs7++});if((c.updatedAt||"")>last)last=c.updatedAt||""});
  return {n:l.length,g,
    over:l.filter(c=>isActiveStage(c)&&c.nextDate&&dayDiff(c.nextDate)<0).length,
    due:l.filter(c=>isActiveStage(c)&&c.nextDate&&dayDiff(c.nextDate)>=0&&dayDiff(c.nextDate)<=7).length,
    won:l.filter(c=>c.stage==="won"||c.stage==="referral").length,
    sa:g.S+g.A,logs7,last};
}
function renderTeam(){
  const users=Ctx.users;
  const pending=users.filter(u=>u.status==="pending").sort((a,b)=>(tsDate(a.createdAt)||0)-(tsDate(b.createdAt)||0));
  const active=users.filter(u=>u.status==="active");
  const all=[...Ctx.team.values()];
  const over=all.filter(c=>isActiveStage(c)&&c.nextDate&&dayDiff(c.nextDate)<0).length;
  const sa=all.filter(c=>["S","A"].includes(gradeOf(c))).length;
  const loading=!Ctx.teamReady||!Ctx.usersReady;
  $("#teamSummary").innerHTML=`
    <div class="stat"><div class="k">已開通業務</div><div class="v num">${active.length}<small>位</small></div></div>
    <div class="stat"><div class="k">團隊名單總數</div><div class="v num">${loading?"–":all.length}<small>位</small></div></div>
    <div class="stat"><div class="k">S／A 級名單</div><div class="v num">${loading?"–":sa}<small>位</small></div></div>
    <div class="stat"><div class="k">逾期未聯絡</div><div class="v num ${over?"alert":""}">${loading?"–":over}<small>位</small></div></div>
    <div class="stat"><div class="k">待開通申請</div><div class="v num ${pending.length?"alert":""}">${pending.length}<small>位</small></div></div>`;
  $("#pendPanel").hidden=!pending.length;
  $("#pendList").innerHTML=pending.map(u=>`<li><span class="avatar">${u.photoURL?`<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`:esc(userName(u).slice(0,1))}</span><span class="an">${esc(userName(u))}<small>${esc(u.email||"")} ・ 申請於 ${fmtDate(u.createdAt)}</small></span><span class="pend-act"><button class="btn" type="button" data-act="reject" data-uid="${esc(u.id)}">拒絕</button><button class="btn primary" type="button" data-act="approve" data-uid="${esc(u.id)}">開通</button></span></li>`).join("");
  let rows=users.filter(u=>u.status==="active"||(S.showDisabled&&u.status==="disabled"));
  if(S.teamQ)rows=rows.filter(u=>(userName(u)+" "+(u.email||"")).toLowerCase().includes(S.teamQ));
  const st=Object.fromEntries(rows.map(u=>[u.id,advisorStats(u.id)]));
  rows.sort((a,b)=>(a.status===b.status?0:a.status==="active"?-1:1)||st[b.id].n-st[a.id].n);
  const wk=d=>{if(!d)return '<span class="muted">尚無</span>';const days=Math.floor((Date.now()-new Date(d))/864e5);return days<=0?"今天":days+" 天前"};
  $("#teamBody").innerHTML=rows.length?rows.map(u=>{const s=st[u.id];const stale=s.last&&(Date.now()-new Date(s.last))/864e5>14;
    return `<tr data-uid="${esc(u.id)}" class="${u.status==="disabled"?"off":""}">
      <td><div class="tname"><span class="avatar">${u.photoURL?`<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`:esc(userName(u).slice(0,1))}</span><span>${esc(userName(u))}${u.id===Ctx.user.uid?' <em class="you">你</em>':""}<small>${esc(u.email||"")}</small></span></div></td>
      <td class="num r"><b>${s.n}</b></td>
      <td><div class="mini">${s.n?["S","A","B","C"].map(k=>s.g[k]?`<span style="flex:${s.g[k]};background:var(--g${k})"></span>`:"").join("")+(s.g[""]?`<span style="flex:${s.g[""]};background:var(--line-2)"></span>`:""):""}</div><div class="mini-l num">S ${s.g.S} ・ A ${s.g.A} ・ B ${s.g.B} ・ C ${s.g.C}</div></td>
      <td class="num r ${s.over?"bad":""}">${s.over}</td>
      <td class="num r">${s.due}</td>
      <td class="num r">${s.won}</td>
      <td class="num r">${s.logs7}</td>
      <td class="${stale?"bad":""}">${wk(s.last)}</td>
      <td class="r nowrap">${u.status==="disabled"?`<button class="btn ghost sm" type="button" data-act="enable" data-uid="${esc(u.id)}">恢復</button>`:(u.id!==Ctx.user.uid?`<button class="btn ghost sm" type="button" data-act="disable" data-uid="${esc(u.id)}">停用</button>`:"")}<button class="btn sm" type="button" data-act="view" data-uid="${esc(u.id)}">查看名單</button></td>
    </tr>`}).join(""):`<tr><td colspan="9" class="empty-row">${loading?"載入中…":"目前沒有已開通的業務。業務用 Google 帳號登入後，會出現在上方「待開通」。"}</td></tr>`;
}

/* ---------- insights engine ---------- */
const DISC_TIP={
  "D 主導型":["先講結論與數字","開場直接說明這次能幫他解決什麼，準備 2–3 個方案讓他自己選。會面控制在 30 分鐘內，避免冗長鋪陳。"],
  "I 社交型":["先聊人，再聊數字","從生活、興趣切入建立好感，用真實案例故事說明。會後用 LINE 傳一頁重點，避免他熱度過後忘記細節。"],
  "S 穩健型":["放慢節奏，不催促","強調穩定、家人保障與長期陪伴。分多次接觸累積信任，給他時間和家人商量，不要當場要求決定。"],
  "C 分析型":["準備完整的試算依據","帶齊條款、費率與情境試算表，數字要經得起追問。給他比較的時間，事後主動提供補充資料。"]
};
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
  if(c.disc&&DISC_TIP[c.disc])out.push(["溝通",""].concat(DISC_TIP[c.disc]));
  if(c.decision&&DECISION_TIP[c.decision])out.push(["決策","","決策方式："+c.decision,DECISION_TIP[c.decision]]);
  arr(c.needs).filter(n=>NEED_HOOK[n]).slice(0,3).forEach(n=>out.push(["切入點","",n,NEED_HOOK[n]]));
  if(isNum(c.property)&&c.property>=3&&(ageForSeg||0)>=40&&!arr(c.needs).includes("房產活化"))out.push(["機會","","可評估房產活化","持有房產 5 年以上且年齡 40+，若有退休現金流需求，可試算房產活化情境。"]);
  if(c.recruit==="有興趣"&&!arr(c.needs).includes("創業／轉職"))out.push(["增員","","具增員潛力","分享自己的「為何而來」，邀請參加說明會，先了解他的職涯目標。"]);
  const ch=arr(c.channel),ts=arr(c.timeslot);
  if(ch.length||ts.length)out.push(["聯絡","","偏好聯絡方式",[ch.join("、"),ts.join("、")].filter(Boolean).join(" ・ ")+(arr(c.hobbies).length?`。可聊的話題：${arr(c.hobbies).join("、")}。`:"")]);
  const bd=daysToBirthday(c);if(bd!=null&&bd<=30)out.push(["關懷","",bd===0?"今天生日":`${bd} 天後生日`,"準備生日問候或小禮物，是不談商品也能自然接觸的時機。"]);
  const nd=dayDiff(c.nextDate);if(nd!=null&&nd<0&&isActiveStage(c))out.unshift(["提醒","warn",`已逾期 ${-nd} 天未聯絡`,"原定 "+c.nextDate+" 聯絡，建議今天補上並更新下次聯絡日。"]);
  return {segName,segText,tips:out};
}

/* ---------- drawer ---------- */
function blank(){
  const no=Ctx.my.size?[...Ctx.my.values()].reduce((m,c)=>Math.max(m,+c.no||0),0)+1:1;
  return {id:uid(),no,name:"",stage:"lead",tags:[],needs:[],policies:[],invest:[],incomeType:[],channel:[],timeslot:[],hobbies:[],kids:[],logs:[],createdAt:new Date().toISOString()};
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
  const c=S.draft;const g=gradeOf(c);const {score,filled}=scoreOf(c);const ro=readOnly();
  const tabs=[!S.isNew&&["ins","經營建議"],!ro&&["edit","客戶資料"],!S.isNew&&["log",`跟進紀錄<span class="cnt">${arr(c.logs).length}</span>`]].filter(Boolean);
  $("#dHead").innerHTML=`<div class="d-top"><div class="grade" data-g="${g}" id="dGrade">${g||"未評"}</div>
    <div style="min-width:0;flex:1"><h2>${esc(c.name||(S.isNew?"新增客戶":"（未命名）"))}</h2><div class="meta">${esc(metaLine(c))||"No."+c.no}</div></div>
    <div class="score"><b class="num" id="dScore">${score}</b><span id="dFilled">${filled}/6 項已評</span></div>
    <button class="btn ghost d-close" type="button" id="dClose" aria-label="關閉">${ICON.close}</button></div>
    <div class="d-tabs tabs">${tabs.map(([k,t])=>`<button class="tab" type="button" data-dt="${k}" aria-selected="${S.dTab===k}">${t}</button>`).join("")}</div>`;
  $("#dClose").onclick=()=>closeDrawer();
  $("#dHead").querySelectorAll("[data-dt]").forEach(b=>b.onclick=()=>{
    if(S.dirty&&b.dataset.dt!=="edit"){showConfirm("尚未儲存的修改","切換分頁前要先儲存嗎？","儲存並切換",async()=>{if(await saveDraft())openClient(S.openId,b.dataset.dt)});return}
    S.dTab=b.dataset.dt;renderDrawer()});
}
function liveHead(){const c=S.draft;const g=gradeOf(c);const {score,filled}=scoreOf(c);const ge=$("#dGrade");ge.dataset.g=g;ge.textContent=g||"未評";$("#dScore").textContent=score;$("#dFilled").textContent=filled+"/6 項已評"}
function renderDrawer(){
  if(!S.draft)return;
  if(!S.isNew&&S.openId&&!S.dirty){const fresh=itemsMap().get(S.openId);if(fresh)S.draft=JSON.parse(JSON.stringify(fresh))}
  if(readOnly()&&S.dTab==="edit")S.dTab="ins";
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
function insHtml(c){
  const I=insights(c);
  const bd=SCORE_KEYS.map(k=>{const i=k==="age"?ageBand(c):c[k];const ok=isNum(i);return `<div class="bd ${ok?"":"miss"}"><span class="p">${ok?SCORE[k].pts[i]:"–"}</span><div class="k">${SCORE[k].label.replace("（交情）","")}</div><div class="v">${ok?SCORE[k].opts[i]:"未填"}</div></div>`}).join("");
  const tips=I.tips.length?I.tips.map(([l,cls,h,p])=>`<div class="tip ${cls}"><span class="lbl">${esc(l)}</span><h5>${esc(h)}</h5><p>${esc(p)}</p></div>`).join(""):`<div class="tip"><span class="lbl">提示</span><h5>補上客戶習性</h5><p>在「客戶資料」填入個性類型、決策方式與需求，這裡會產生具體的接觸建議。</p></div>`;
  const row=(k,v)=>v&&(Array.isArray(v)?v.length:true)?`<dt>${k}</dt><dd>${esc(Array.isArray(v)?v.join("、"):v)}</dd>`:"";
  const prof=[row("經營階段",(STG[c.stage||"lead"]||{}).t),row("名單來源",c.source?c.source+" "+SRC[c.source]+(c.referrer?`（${c.referrer} 介紹）`:""):""),row("生日",c.birthday),row("職業",[jobCatLabel(c),c.job].filter(Boolean).join("・")),row("居住區域",c.area),row("電話",c.phone),row("LINE",c.line),row("子女",c.kids),row("扶養父母",c.parents),row("收入型態",c.incomeType),row("房貸狀態",c.loan),row("既有保單",c.policies),row("理財經驗",c.invest),row("風險屬性",c.risk),row("最在意",c.focus),row("對保險態度",c.attitude),row("增員潛力",c.recruit),row("Hashtag",c.tags),row("備註",c.note)].join("");
  return `<div class="ins-hero"><div class="eyebrow">服務主軸</div><div class="seg-name">${esc(I.segName)}</div><p>${esc(I.segText)}</p><div class="breakdown">${bd}</div></div>
    <div class="tips">${tips}</div>
    <div class="sec" style="margin-top:14px;padding-bottom:14px"><div class="sec-h"><h4>客戶輪廓</h4><span>${c.demo?"示範資料":""}</span></div><dl class="kv">${prof||'<dt>—</dt><dd>尚無資料</dd>'}</dl></div>`;
}

/* form */
function optGroup(key,list,{multi=false,scored=null}={}){
  const v=S.draft[key];
  return `<div class="opts" data-key="${key}" data-multi="${multi?1:0}">${list.map((o,i)=>{
    const val=scored?i:o;const on=multi?arr(v).includes(val):v===val;
    return `<button type="button" class="opt ${scored?"scored":""}" data-v="${esc(String(val))}" aria-pressed="${on}">${esc(o)}${scored?`<small>${scored[i]}分</small>`:""}</button>`}).join("")}</div>`;
}
function scoreField(k){
  const s=SCORE[k];
  if(k==="age"){const a=ageOf(S.draft);return `<div class="field" id="ageField"><div class="lab">${s.label}<em>${a!=null?`依生日自動計算：${a} 歲`:"或填生日自動計算"}</em></div>${a!=null?`<div class="opts">${s.opts.map((o,i)=>`<span class="opt scored" aria-pressed="${ageBand(S.draft)===i}" style="cursor:default">${o}<small>${s.pts[i]}分</small></span>`).join("")}</div>`:optGroup("age",s.opts,{scored:s.pts})}</div>`}
  return `<div class="field"><div class="lab">${s.label}</div>${optGroup(k,s.opts,{scored:s.pts})}</div>`;
}
function renderForm(){
  const c=S.draft;
  const f=(label,inner,cls="")=>`<div class="field ${cls}"><div class="lab">${label}</div>${inner}</div>`;
  const inp=(key,type="text",ph="",extra="")=>`<input class="inp" id="f-${key}" data-in="${key}" type="${type}" value="${esc(c[key]||"")}" placeholder="${esc(ph)}" ${extra}>`;
  $("#dBody").innerHTML=`
  <div class="sec"><div class="sec-h"><h4>基本資料</h4><span>姓名為必填</span></div>
    <div class="f2">${f("姓名",inp("name","text","客戶姓名"))}${f("經營階段",`<select class="inp" id="f-stage" data-in="stage">${STAGES.map(s=>`<option value="${s.k}" ${c.stage===s.k?"selected":""}>${s.t}</option>`).join("")}</select>`)}
    ${f("生日",inp("birthday","date"))}${f("下次聯絡日",inp("nextDate","date"))}
    ${f("電話",inp("phone","tel","09xx-xxx-xxx"))}${f("LINE ID",inp("line","text",""))}
    ${f("職業（細項）",inp("job","text","例：國中老師、牙醫、餐廳老闆"))}${f("居住區域",inp("area","text","例：北屯區","list=\"areaList\""))}</div>
    ${f("性別",optGroup("gender",P.gender))}
    ${f("職業類別",optGroup("jobCat",P.jobCat)+`<input class="inp" id="f-jobOther" data-in="jobOther" type="text" value="${esc(c.jobOther||"")}" placeholder="請輸入職業類別，例如：農漁業、宗教人員、自由接案" style="margin-top:8px" ${c.jobCat==="其他"?"":"hidden"}>`)}
    ${f("名單來源",`<div class="opts" data-key="source" data-multi="0">${SOURCES.map(([k,t])=>`<button type="button" class="opt" data-v="${k}" aria-pressed="${c.source===k}">${k} ${t}</button>`).join("")}</div>`)}
    <div class="f2">${f("介紹人",inp("referrer","text","轉介紹來源（選填）"))}${f("增員潛力",optGroup("recruit",P.recruit))}</div>
  </div>
  <div class="sec"><div class="sec-h"><h4>名單評分</h4><span>沿用原 Excel 六大指標・滿分 105</span></div>
    ${SCORE_KEYS.map(scoreField).join("")}
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
  <div class="sec"><div class="sec-h"><h4>個性與溝通習性</h4><span>業務觀察紀錄</span></div>
    ${f("個性類型（DISC）",optGroup("disc",P.disc)+`<div class="hint">D 果斷重效率 ・ I 熱情愛交流 ・ S 溫和重安全感 ・ C 謹慎重細節</div>`)}
    ${f("決策方式",optGroup("decision",P.decision))}
    ${f("最在意",optGroup("focus",P.focus))}
    ${f("對保險態度",optGroup("attitude",P.attitude))}
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
  $("#dFoot").innerHTML=`${S.isNew?'<span class="msg">新增後可記錄跟進</span>':'<button class="btn danger" type="button" id="btnDel">刪除</button>'}<div style="display:flex;gap:8px"><button class="btn" type="button" id="btnCancel">${S.isNew?"取消":"還原"}</button><button class="btn primary" type="button" id="btnSave">${S.isNew?"新增客戶":"儲存"}</button></div>`;
  $("#btnSave").onclick=saveDraft;
  $("#btnCancel").onclick=()=>{if(S.isNew){S.dirty=false;closeDrawer(true)}else{S.dirty=false;openClient(S.openId,"edit")}};
  const del=$("#btnDel");if(del)del.onclick=()=>showConfirm("刪除「"+(S.draft.name||"此客戶")+"」？","客戶資料與所有跟進紀錄都會刪除，無法復原。","確認刪除",async()=>{const id=S.openId;S.dirty=false;closeDrawer(true);if(await removeClient(id))toast("已刪除")},true);
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
  S.dirty=true;liveHead();
});
$("#dBody").addEventListener("input",e=>{
  const el=e.target.closest("[data-in]");if(!el||S.dTab!=="edit")return;
  const k=el.dataset.in;
  if(k==="tags"){S.draft.tags=el.value.split(/[\s,，]+/).filter(Boolean).map(t=>/^[#＃]/.test(t)?"#"+t.slice(1):"#"+t);document.querySelectorAll("#tagSug .opt").forEach(b=>b.setAttribute("aria-pressed",S.draft.tags.includes(b.dataset.tag)))}
  else S.draft[k]=el.value;
  S.dirty=true;
  if(k==="birthday"){liveHead();const host=$("#ageField");if(host)host.outerHTML=scoreField("age")}
  if(k==="name"){$("#dHead h2").textContent=el.value||"新增客戶"}
});
$("#dBody").addEventListener("change",e=>{const el=e.target.closest("[data-in]");if(el&&el.tagName==="SELECT"){S.draft[el.dataset.in]=el.value;S.dirty=true}});
async function saveDraft(){
  const c=S.draft;c.name=(c.name||"").trim();
  if(!c.name){toast("請先填寫客戶姓名");const n=$("#f-name");if(n)n.focus();return false}
  if(ageOf(c)!=null)c.age=ageBand(c);
  if(c.jobCat!=="其他")delete c.jobOther;else c.jobOther=(c.jobOther||"").trim();
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
    <div class="field"><div class="lab">方式</div><select class="inp" id="lg-t">${LOG_TYPES.map(t=>`<option>${t}</option>`).join("")}</select></div></div>
    <div class="field"><div class="lab">內容</div><textarea class="inp" id="lg-x" placeholder="聊了什麼、客戶的反應、下一步…"></textarea></div>
    <div class="f2"><div class="field"><div class="lab">下次聯絡日<em>選填，會同步更新</em></div><input class="inp" type="date" id="lg-n" value="${esc(c.nextDate||"")}"></div>
    <div class="field"><div class="lab">更新階段</div><select class="inp" id="lg-s">${STAGES.map(s=>`<option value="${s.k}" ${(c.stage||"lead")===s.k?"selected":""}>${s.t}</option>`).join("")}</select></div></div>
  </div>`)+
  (logs.length?`<ul class="timeline">${logs.map(l=>`<li><div class="lt"><span class="num">${esc(l.d)}</span><span class="pill">${esc(l.t)}</span>${ro?"":`<button class="del" type="button" data-del="${esc(l.id)}" aria-label="刪除此筆">刪除</button>`}</div><div class="lx">${esc(l.x)}</div></li>`).join("")}</ul>`:`<p class="hint" style="text-align:center;padding:20px 0">${ro?"還沒有跟進紀錄。":"還沒有跟進紀錄。每次接觸後花 30 秒記下重點，下次聯絡就有話題。"}</p>`);
  $("#dFoot").innerHTML=`<span class="msg">共 ${logs.length} 筆紀錄${ro?" ・ 唯讀檢視":""}</span>${ro?"":'<button class="btn primary" type="button" id="lgAdd">新增紀錄</button>'}`;
  if(ro)return;
  $("#lgAdd").onclick=async()=>{
    const x=$("#lg-x").value.trim();if(!x){toast("請填寫紀錄內容");$("#lg-x").focus();return}
    const c2=JSON.parse(JSON.stringify(S.draft));
    c2.logs=arr(c2.logs).concat([{id:uid(),d:$("#lg-d").value||today(),t:$("#lg-t").value,x}]).slice(-200);
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
      const names=new Set([...Ctx.my.values()].map(c=>c.name));
      const dup=pending.filter(c=>names.has(c.name)).length;pending=pending.filter(c=>!names.has(c.name));
      $("#impRes").innerHTML=pending.length?`找到 <b>${pending.length}</b> 位可匯入的客戶${dup?`（另有 ${dup} 位同名已略過）`:""}：${esc(pending.slice(0,6).map(c=>c.name).join("、"))}${pending.length>6?"…":""}`:`沒有找到可匯入的客戶${dup?`（${dup} 位同名已存在）`:""}。請確認是原始範本或本系統匯出的檔案。`;
      $("#impOk").disabled=!pending.length;
    }catch(err){$("#impRes").textContent="無法讀取這個檔案，請確認是 Excel 格式。"}
  };
  r.readAsArrayBuffer(file);
}
function toYmd(v){if(v instanceof Date&&!isNaN(v))return ymd(v);if(typeof v==="number"){const d=XLSX.SSF.parse_date_code(v);return d?d.y+"-"+pad(d.m)+"-"+pad(d.d):""}if(typeof v==="string"){const m=/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(v);if(m)return m[1]+"-"+pad(m[2])+"-"+pad(m[3])}return ""}
function nextNo(){return [...Ctx.my.values()].reduce((m,c)=>Math.max(m,+c.no||0),0)}
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
const FLAT=[["編號","no"],["姓名","name"],["經營階段","stage"],["來源","source"],["介紹人","referrer"],["生日","birthday"],["性別","gender"],["職業類別","jobCat"],["職業","job"],["居住區域","area"],["電話","phone"],["LINE","line"],["每月收入","income"],["年齡","age"],["婚姻","marital"],["房產","property"],["交情","contact"],["接近難易度","approach"],["分數","_score"],["分級","_grade"],["子女階段","kids"],["扶養父母","parents"],["收入型態","incomeType"],["房貸狀態","loan"],["既有保單","policies"],["理財經驗","invest"],["風險屬性","risk"],["需求","needs"],["個性類型","disc"],["決策方式","decision"],["最在意","focus"],["對保險態度","attitude"],["聯絡管道","channel"],["聯絡時段","timeslot"],["興趣嗜好","hobbies"],["增員潛力","recruit"],["Hashtag","tags"],["下次聯絡日","nextDate"],["最近聯絡","lastContact"],["備註","note"],["跟進紀錄","_logs"]];
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
function exportClients(list,label,withOwner){
  if(!list.length){toast("沒有可匯出的資料");return}
  if(typeof XLSX==="undefined"){toast("Excel 元件尚未載入，請重新整理後再試");return}
  list=list.slice().sort((a,b)=>withOwner?(userName(userById(a._owner)).localeCompare(userName(userById(b._owner)),"zh-Hant")||(a.no||0)-(b.no||0)):(a.no||0)-(b.no||0));
  const rows=list.map(c=>{const o={};if(withOwner){const u=userById(c._owner);o["負責業務"]=userName(u);o["業務 Email"]=u&&u.email||""}
    const sc=scoreOf(c);FLAT.forEach(([h,k])=>{let v=c[k];
    if(k==="_score")v=sc.score;else if(k==="_grade")v=gradeOf(c);
    else if(k==="_logs")v=arr(c.logs).slice().sort((a,b)=>a.d<b.d?-1:1).map(l=>`${l.d} ${l.t}：${l.x}`).join("\n");
    else if(k==="age"){const i=ageBand(c);v=isNum(i)?SCORE.age.opts[i]:""}
    else if(SCORE[k])v=isNum(v)?SCORE[k].opts[v]:"";
    else if(k==="jobCat")v=jobCatLabel(c);
    else if(k==="stage")v=(STG[v||"lead"]||STG.lead).t;
    else if(k==="source")v=v?v+" "+SRC[v]:"";
    else if(Array.isArray(v))v=v.join(k==="tags"?" ":"、");
    o[h]=v==null?"":v});return o});
  const ws=XLSX.utils.json_to_sheet(rows);
  ws["!cols"]=Object.keys(rows[0]).map(h=>({wch:["備註","跟進紀錄","需求","既有保單","興趣嗜好","業務 Email"].includes(h)?30:12}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"客戶名單");
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
    {name:"陳志明（示範）",source:"B",birthday:bdayIn(120,48),gender:"男",jobCat:"企業主",job:"五金行老闆",area:"北屯區",income:4,marital:3,property:4,contact:3,approach:3,kids:["大學"],parents:"部分分擔",incomeType:["自營收入","租金收入"],loan:"已還清",policies:["醫療／意外","壽險"],invest:["房地產","股票／ETF"],risk:"穩健",needs:["退休規劃","房產活化","資產傳承／節稅"],disc:"D 主導型",decision:"自己決定",focus:"資產成長",attitude:"認同規劃",channel:["LINE","面談"],timeslot:["平日晚上"],hobbies:["登山露營","汽車"],recruit:"無",stage:"proposal",nextDate:shiftDate(2),tags:["#朋友多","#有影響力"],note:"名下兩戶，一戶自住一戶出租。希望 60 歲退休後每月有穩定現金流。"},
    {name:"林怡君（示範）",source:"G",birthday:bdayIn(9,33),gender:"女",jobCat:"上班族",job:"科技業 PM",area:"西屯區",income:3,marital:3,property:1,contact:2,approach:2,kids:["學齡前"],parents:"無需扶養",incomeType:["固定薪資","業績獎金"],loan:"寬限期中",policies:["僅公司團保"],invest:["基金","以存款為主"],risk:"穩健",needs:["子女教育金","房貸壓力","醫療保障"],disc:"C 分析型",decision:"與配偶討論",focus:"保障完整",attitude:"中立觀望",channel:["LINE"],timeslot:["平日晚上","假日"],hobbies:["親子","美食"],recruit:"無",stage:"met",nextDate:shiftDate(-3),tags:["#愛家","#精打細算"]},
    {name:"黃建宏（示範）",source:"H",birthday:bdayIn(200,27),gender:"男",jobCat:"業務",job:"汽車業務",area:"南屯區",income:2,marital:1,property:0,contact:2,approach:3,parents:"無需扶養",incomeType:["業績獎金"],loan:"無房貸",policies:["醫療／意外"],invest:["股票／ETF"],risk:"積極",needs:["存不了錢","收入不穩","創業／轉職"],disc:"I 社交型",decision:"自己決定",focus:"資產成長",attitude:"認同規劃",channel:["LINE","電話"],timeslot:["平日晚上"],hobbies:["運動健身","3C 科技"],recruit:"有興趣",stage:"booked",nextDate:shiftDate(5),tags:["#話題王"]},
    {name:"張淑芬（示範）",source:"A",birthday:bdayIn(22,58),gender:"女",jobCat:"軍公教",job:"國小老師",area:"烏日區",income:2,marital:3,property:4,contact:1,approach:2,kids:["已就業"],parents:"主要扶養",incomeType:["固定薪資"],loan:"已還清",policies:["壽險","儲蓄險"],invest:["以存款為主"],risk:"保守",needs:["醫療保障","退休規劃","保單健檢"],disc:"S 穩健型",decision:"需家人同意",focus:"服務與信任",attitude:"已有信任顧問",channel:["電話","面談"],timeslot:["假日"],hobbies:["宗教","藝文"],recruit:"無",stage:"touched",tags:["#孝順"]},
    {name:"吳家豪（示範）",source:"K",birthday:bdayIn(300,38),gender:"男",jobCat:"專業人士",job:"牙醫師",area:"西區",income:4,marital:2,property:2,contact:0,approach:1,parents:"部分分擔",incomeType:["固定薪資","投資收益"],loan:"房貸還款中",policies:["醫療／意外","投資型"],invest:["股票／ETF","外幣","基金"],risk:"積極",needs:["資產傳承／節稅","退休規劃"],disc:"C 分析型",decision:"依賴專業建議",focus:"資產成長",attitude:"中立觀望",channel:["LINE"],timeslot:["平日白天"],hobbies:["旅遊","投資理財"],recruit:"無",stage:"lead",tags:["#好工作"]},
    {name:"劉美玲（示範）",source:"L",birthday:bdayIn(90,44),gender:"女",jobCat:"家管",area:"大里區",income:1,marital:3,property:3,contact:0,approach:0,kids:["國高中"],loan:"房貸還款中",policies:["尚無保單"],invest:["以存款為主"],risk:"保守",needs:["子女教育金"],disc:"S 穩健型",decision:"與配偶討論",focus:"價格",attitude:"排斥保險",channel:["簡訊"],timeslot:["平日白天"],hobbies:["親子","寵物"],recruit:"可觀察",stage:"hold",tags:["#精打細算"]}
  ];
  for(const d of D){const c=Object.assign(blank(),d,{no:++base,demo:true,updatedAt:new Date().toISOString()});c.age=ageBand(c);c.logs=d.stage==="lead"||d.stage==="hold"?[]:[{id:uid(),d:shiftDate(-10),t:"面談",x:"示範紀錄：初次面談，了解家庭結構與目前保單。"}];try{await backend.saveClient(Ctx.user.uid,c)}catch(e){toast(errMsg(e,"載入失敗"));return}}
  toast("已載入 6 筆示範名單");
}
async function clearDemo(){for(const c of [...Ctx.my.values()].filter(c=>c.demo)){if(!(await removeClient(c.id)))break}toast("已清除示範資料")}
