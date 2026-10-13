// ==UserScript==
// @name         whalePick - دسته‌بندی (خودکار)
// @namespace    wh-portal
// @version      3.12
// @description  سفارش‌ها خودکار از پنل خوانده می‌شوند؛ سفارش‌های دسته‌بندی‌شده با رنگ هر مشتری
// @match        https://whstore.alcore.ir/*
// @match        http://whstore.alcore.ir/*
// @run-at       document-idle
// @updateURL    https://salesonlinewh-svg.github.io/PICKERAPP/whalepick.user.js
// @downloadURL  https://salesonlinewh-svg.github.io/PICKERAPP/whalepick.user.js
// @grant        none
// ==/UserScript==
(function(){'use strict';
if(window.top!==window.self||window.__jc2)return;window.__jc2=1;
const CFG={user:'',pass:'',poll:30,max:400,days:1,maxPages:30,full:180};   // days: چند روز اخیر (۱ = فقط امروز) | maxPages: سقف صفحه‌ها | full: هر چند ثانیه سینک کامل (بقیه فقط صفحه‌ی اول)
const CL={b:['#2f6fe4','#dbe7fb','#fff'],r:['#d83b3b','#fadcdc','#fff'],y:['#f2c230','#fbf0c4','#14181d']};
let S={o:{},sel:{},sc:{}},pOpen=false,tab='o',CAT=null,M=null,st={t:'در حال شروع…',k:''};
try{S=Object.assign(S,JSON.parse(localStorage.jc2))}catch(e){}
try{if(!(S.gs&&S.gs.url)){const g=JSON.parse(localStorage.jc_gs||'null');if(g&&g.url)S.gs=g}}catch(e){}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
S.sc=S.sc||{};S.cl=S.cl||{};S.tr=S.tr||{};S.cs=S.cs||{};S.dq=(S.dq||[]).map(x=>x.st=='r'?Object.assign(x,{st:'p'}):x);
const save=()=>{try{localStorage.jc2=JSON.stringify(S);if(S.gs&&S.gs.url)localStorage.jc_gs=JSON.stringify(S.gs)}catch(e){}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const nb=s=>String(s||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g,'').replace(/^0+/,'');
const num=s=>parseInt(String(s||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g,''),10)||0;
const pc=c=>c&&!/,\s*0\)$/.test(c)?c:'#fff';
async function waitFor(f,t=15000){const t0=Date.now();while(Date.now()-t0<t){try{const v=f();if(v)return v}catch(e){}await sleep(150)}return null}
// ---- iframe پنل
const fr=document.createElement('iframe');fr.style.cssText='position:fixed;left:0;top:0;width:1000px;height:900px;opacity:0;pointer-events:none;border:0;z-index:-1';document.documentElement.appendChild(fr);
const fd=()=>{try{return fr.contentDocument}catch(e){return null}},fl=()=>{try{return fr.contentWindow.location.href}catch(e){return''}};
let chain=Promise.resolve();const enq=f=>{const p=chain.then(f,f);chain=p.catch(()=>{});return p};
const nav=p=>new Promise(r=>{fr.onload=()=>r();fr.src=p;setTimeout(r,15000)});
function setVal(el,v){Object.getOwnPropertyDescriptor(el.ownerDocument.defaultView.HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))}
async function load(p){await nav(p);await sleep(100);let d=fd();if(!d)throw new Error('پنل در iframe باز نشد');
 if(d.querySelector('input[name=password]')){if(!CFG.user)throw new Error('وارد پنل نشده‌اید؛ یک بار وارد شوید');
  setVal(d.querySelector('input[name=username]'),CFG.user);setVal(d.querySelector('input[name=password]'),CFG.pass);
  const b=d.querySelector('a[href="/login"]')||d.querySelector('button[type=submit]');b&&b.click();await sleep(2500);await nav(p);await sleep(500);
  if(fd().querySelector('input[name=password]'))throw new Error('ورود به پنل ناموفق بود')}}
const parseList=doc=>[...doc.querySelectorAll('.table-body .row')].map(r=>{const o={};r.querySelectorAll('.property').forEach(p=>{const h=p.querySelector('.property-header'),b=p.querySelector('.property-body');if(h&&b)o[h.textContent.trim()]=b.textContent.trim()});o.__color=doc.defaultView.getComputedStyle(r).backgroundColor;return o});
const parseProducts=doc=>[...doc.querySelectorAll('[class*="_productCard_"]')].map(c=>{const p={title:'',qty:'',scanned:'',price:'',barcodes:[]};const h=c.querySelector('h4');if(h)p.title=h.textContent.trim();
 c.querySelectorAll('[class*="_row_"]').forEach(r=>{const sp=r.querySelectorAll(':scope > span');if(!sp.length)return;const l=sp[0].textContent,v=sp[1]?sp[1].textContent.trim():'';if(l.includes('اسکن'))p.scanned=v;else if(l.includes('تعداد'))p.qty=v;else if(l.includes('قیمت'))p.price=v;else if(l.includes('بارکد'))p.barcodes=[...r.querySelectorAll('li')].map(x=>x.textContent.trim())});return p});
function merge(rows,partial){const seen=new Set(),fresh=[];rows.forEach((r,i)=>{const c=r['کد سفارش'];if(!c||seen.has(c))return;seen.add(c);let o=S.o[c];if(!o){o=S.o[c]={code:c};fresh.push(c)}delete o.gone;
 Object.assign(o,{col:normCol(r),date:r['تاریخ']||'',time:r['ساعت']||'',buyer:r['خریدار']||'',status:r['وضعیت']||'',channel:r['کانال']||'',color:r.__color||'',sort:String(i).padStart(4,'0')})});
 if(partial){for(const c of Object.keys(S.o))if(!seen.has(c)){const o=S.o[c];if(o.sort!==undefined)o.sort=String((+o.sort||0)+fresh.length).padStart(4,'0')}}
 else for(const c of Object.keys(S.o))if(!seen.has(c)){if(S.sel[c])S.o[c].gone=1;else delete S.o[c]}
 if(S.seeded&&fresh.length){const nw=fresh.filter(c=>!/فاکتور|کنسل|نیاز به تماس/.test(S.o[c].status||''));if(nw.length){ding();toast('سفارش جدید: '+nw.map(c=>S.o[c].buyer||c).join('، '))}}
 S.seeded=true;save();colSend()}
const pgLinks=d=>[...d.querySelectorAll('.pagination .page-link')];
async function clickWait(el){const first=(parseList(fd())[0]||{})['کد سفارش'];realClick(el);return !!await waitFor(()=>{const r=parseList(fd())[0];return r&&r['کد سفارش']!==first},8000)}
async function goPage(p){const d=fd(),a=pgLinks(d).find(e=>normD(e.textContent.trim())==String(p));if(a)return clickWait(a);
 const c=[...d.querySelectorAll('a,button,li,span,div')].filter(e=>!e.children.length&&!e.closest('.table-body')&&normD(e.textContent.trim())==String(p)).pop();return c?clickWait(c):false}
async function nextPage(){const d=fd(),nx=d.querySelector('.pagination a.page-link[aria-label="Next"]');if(!nx||nx.closest('.page-item.disabled'))return false;return clickWait(nx)}
async function findRow(code){const has=()=>[...fd().querySelectorAll('.table-body .row')].find(r=>r.textContent.includes(code));
 if(fl().includes('/newOrders')&&fd().querySelector('.table-body .row')){const r=has();if(r)return r}
 await load('/newOrders');await waitFor(()=>fd().querySelector('.table-body .row'),15000);await sleep(300);let r=has();if(r)return r;
 for(let p=2;p<=CFG.maxPages;p++){if(!await nextPage())break;await sleep(300);r=has();if(r)return r}return null}
async function readList(){const t0=Date.now();let last='',same=0,rows=[],tr=0;
 while(Date.now()-t0<10000){const d=fd();rows=d?parseList(d):[];const sig=JSON.stringify(rows.map(r=>[r['کد سفارش'],r['وضعیت'],r.__color]));
  if(rows.length&&!tr)tr=Date.now();
  if(sig==last&&(rows.length?Date.now()-tr>600:Date.now()-t0>6000)){if(++same>=2)break}else same=0;last=sig;await sleep(250)}
 return rows}
let lastFull=0;
const todayU=()=>{const n=new Date();return Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())};
function inWin(r){const m=normD((r['تاریخ']||'')+' '+(r['ساعت']||'')).match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);if(!m||+m[1]<1700)return true;const t=Date.UTC(+m[1],+m[2]-1,+m[3]),T=todayU();return t<=T+864e5&&T-t<=(CFG.days-1)*864e5}
function sync(full){return enq(async()=>{if(pOpen)return;const t0=Date.now(),fullNow=full===true||!lastFull||t0-lastFull>CFG.full*1000;try{st={t:fullNow?'در حال سینک کامل…':'در حال سینک…',k:''};(tab=='o'||tab=='s')&&Rs();
 await load('/newOrders');
 if(!await waitFor(()=>fd().querySelector('.table-body'),15000)&&!(fl().includes('/newOrders')&&fd().body&&fd().body.innerText.trim().length>20))throw new Error('لیست سفارش‌ها پیدا نشد');
 let page=await readList(),all=[...page],n=1;
 while(fullNow&&n<CFG.maxPages&&page.some(inWin)&&await nextPage()){n++;page=await readList();if(!page.length)break;all.push(...page)}
 merge(all.filter(inWin).slice(0,CFG.max),!fullNow);if(fullNow){lastFull=Date.now();const ds=Object.values(S.o);gsPost({op:'snap',snap:{total:ds.length,fin:ds.filter(o=>/فاکتور/.test(o.status||'')).length,at:Date.now()}})}
 st={t:'متصل',k:'ok',at:new Date().toLocaleTimeString('fa-IR'),ms:Date.now()-t0,pg:fullNow?n:0}}catch(e){st={t:'خطا: '+e.message,k:'err'}}(tab=='o'||tab=='s')&&Rs()})}
const normD=s=>String(s==null?'':s).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const faF=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'UTC'}),faT=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
const jd=s=>{const m=s.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);if(!m||+m[1]<1700)return s;try{return faF.format(new Date(Date.UTC(+m[1],+m[2]-1,+m[3],12)))}catch(e){return s}};
const cardBg=o=>{const c=o.color||'',m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/),t=o.status||'';if(m&&(m[4]===undefined||parseFloat(m[4])>0.05))return c;return t.includes('فاکتور')?'#acaafe':t.includes('باز شده')?'#ffc6be':t.includes('کنسل')?'#fecaca':'#ffffff'};
let AC=null;const unlock=()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.state=='suspended'&&AC.resume()}catch(e){}};addEventListener('pointerdown',unlock,{passive:true});
function ding(){try{navigator.vibrate&&navigator.vibrate([120,60,120])}catch(e){}if(S.mute)return;try{unlock();if(!AC)return;const t=AC.currentTime;[[880,0],[1175,.16]].forEach(([f,d])=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.3,t+d+.02);g.gain.exponentialRampToValueAtTime(.001,t+d+.4);o.start(t+d);o.stop(t+d+.45)})}catch(e){}}
// ---- گزارش عملکرد (به اسکریپت «ارسال گزارش» می‌رود)
const gsPost=m=>{try{window.postMessage(Object.assign({jcb:3,id:Date.now()},m),location.origin)}catch(e){}};
let GS=null,gsRestored=0;const gsAsk=()=>gsPost({op:'status'});setTimeout(gsAsk,2500);setTimeout(gsAsk,7000);
addEventListener('message',e=>{const d=e.data;if(e.origin!==location.origin||!d||d.jcb!==4)return;if(d.op=='status'){GS=d;if(!d.url&&S.gs&&S.gs.url&&gsRestored<4){gsRestored++;gsPost({op:'cfg',url:S.gs.url,token:S.gs.token||''})}if(tab=='s')Rs()}else if(d.op=='flush'){toast(d.msg,5000)}});

// ---- جمع‌آوری‌کننده (از ستون پنل: «نام (موبایل)») و مبلغ سفارش
const normCol=r=>{const k=Object.keys(r).find(x=>/کننده/.test(x)),v=k?String(r[k]||'').trim():'';if(!v)return null;const m=v.match(/^(.*?)\s*\(([^)]*)\)\s*$/);return{n:(m?m[1]:v).trim(),p:m?normD(m[2]).replace(/\D/g,''):''}};
const orderAmt=o=>(o.products||[]).reduce((s,p)=>s+num(p.price)*(num(p.qty)||1),0);
function colSend(){if(!GS||!GS.url)return;let n=0;
 for(const o of Object.values(S.o)){if(!o.col||!o.col.n)continue;const a=orderAmt(o),sig=[o.col.n,o.col.p,a,o.status||''].join('|');if(S.cs[o.code]===sig)continue;if(++n>150)break;S.cs[o.code]=sig;
  if(o.fin)S.me=o.col;
  gsPost({op:'rec',rec:{id:'col|'+o.code+'|'+Date.now(),kind:'col',order:o.code,name:o.col.n,phone:o.col.p,ch:o.channel||'',st:o.status||'',amt:a,at:Date.now(),mine:o.fin?1:0}})}
 if(n)save()}
function track(c){const n=Date.now(),r=S.tr[c]||(S.tr[c]={t0:n,last:n,act:0}),g=n-r.last;if(g>0&&g<180000)r.act+=g;r.last=n}
function rec(c,res){const o=S.o[c]||{},r=S.tr[c]||{},ps=o.products||[],n=Date.now();
 const items=ps.length?ps.reduce((s,p)=>s+Math.min(sc(c,pk(p)),qtyOf(p)),0):Object.values(S.sc[c]||{}).reduce((a,b)=>a+b,0);
 if(res=='rel'&&!items){delete S.tr[c];return}
 gsPost({op:'rec',rec:{id:c+'|'+res+'|'+Math.floor(n/1000),order:c,start:r.t0||n,end:n,items,act:Math.round((r.act||0)/1000),res,amt:orderAmt(o),ch:o.channel||'',col:o.col||S.me||null}});delete S.tr[c]}
const rel=c=>rec(c,'rel');
const dt=o=>{const t=normD((o.date||'')+' '+(o.time||'')),m=t.match(/\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}/),h=t.match(/\d{1,2}:\d{2}(?::\d{2})?/);return[m?jd(m[0]):'',h?h[0].replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):''].filter(Boolean).join(' ')},isDone=o=>o.fin||o.gone||/فاکتور|کنسل/.test(o.status||''),qtyOf=p=>num(p.qty)||1,sc=(c,k)=>(S.sc[c]||{})[k]||0,pk=p=>nb((p.barcodes||[])[0])||p.title;
async function ensureId(o){if(o.id)return;const row=await findRow(o.code);if(!row)throw new Error('سفارش در لیست پنل پیدا نشد');
 row.click();let m=await waitFor(()=>fl().match(/\/orders\/([0-9a-f]{12,})/),8000);
 if(!m){const p=row.querySelector('.property');p&&p.click();m=await waitFor(()=>fl().match(/\/orders\/([0-9a-f]{12,})/),8000)}
 if(!m)throw new Error('شناسه‌ی سفارش پیدا نشد');o.id=m[1]}
async function openOrder(o){await ensureId(o);if(!(fl().includes('/orders/'+o.id)&&fd()&&fd().querySelector('[class*="_productCard_"]')))await load('/orders/'+o.id);await waitFor(()=>fd().querySelector('[class*="_productCard_"]'),15000);await sleep(250)}
function details(code){return enq(async()=>{const o=S.o[code];if(pOpen||!o||(o.products&&o.products.length&&o.products[0].price!==undefined))return;
 try{await openOrder(o);o.products=parseProducts(fd());delete o.err}catch(e){o.err=e.message}save();Rs()})}
// ---- ثبت اسکن و تایید در پنل
const pscan=p=>{const n=String(p.scanned||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).match(/\d+/g)||[];if(!n.length)return 0;const a=+n[0],b=n.length>1?+n[1]:null,q=qtyOf(p);if(b===null||b===q)return a;if(a===q)return b;return a};
const tv=(el,v)=>{setVal(el,'');setVal(el,v)};let strat=0;
async function addScan(d,i,p,bc){const card=()=>d.querySelectorAll('[class*="_productCard_"]')[i],cnt=()=>pscan(parseProducts(d)[i]||p);
 const inp=()=>{const c=card();return c&&(c.querySelector('[class*="_bardcodeInput_"] input')||c.querySelector('input[placeholder="بارکد"]'))};const before=cnt();
 const X=[async()=>{const e=inp();if(!e)return;tv(e,bc);await sleep(350)},
 async()=>{const e=inp();if(!e)return;tv(e,bc);for(const t of['keydown','keypress','keyup'])e.dispatchEvent(new KeyboardEvent(t,{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true}))},
 async()=>{const e=inp();if(!e)return;tv(e,bc);const sv=e.parentElement&&e.parentElement.querySelector('svg');if(sv){sv.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));sv.parentElement&&sv.parentElement.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))}const f=e.closest('form');f&&f.requestSubmit&&f.requestSubmit()},
 async()=>{const g=d.querySelector('input[name=barcode]');if(!g)return;tv(g,bc);const f=g.closest('form');if(f&&f.requestSubmit)f.requestSubmit();else if(f)f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))}];
 for(let k=0;k<4;k++){const x=(strat+k)%4;try{await X[x]()}catch(e){}if(await waitFor(()=>cnt()>before,1600)){strat=x;return true}}return false}
function push(code){return enq(async()=>{const o=S.o[code];await openOrder(o);const d=fd(),list=parseProducts(d),bad=[];let sent=0;
 for(let i=0;i<list.length;i++){const p=list[i],bc=(p.barcodes||[])[0],target=Math.min(sc(code,pk(p)),qtyOf(p));let have=pscan(p);if(!bc||have>=target)continue;
  while(have<target){if(!await addScan(d,i,p,bc)){bad.push(p.title);break}have++;sent++}}
 await sleep(400);o.products=parseProducts(fd());save();return{sent,bad}})}
function realClick(el){el.scrollIntoView&&el.scrollIntoView({block:'center'});const w=el.ownerDocument.defaultView,r=el.getBoundingClientRect(),o={bubbles:true,cancelable:true,view:w,clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:0};
 const f=(T,t,x)=>{try{el.dispatchEvent(new w[T](t,Object.assign({},o,x||{})))}catch(e){}};
 f('PointerEvent','pointerdown',{pointerType:'touch',isPrimary:true});f('MouseEvent','mousedown');f('PointerEvent','pointerup',{pointerType:'touch',isPrimary:true});f('MouseEvent','mouseup');f('MouseEvent','click')}
function act(code,label,show){return enq(async()=>{const o=S.o[code];
 if(!(o.id&&fl().includes(o.id)&&fd()&&fd().querySelector('[class*="_productCard_"]')))await openOrder(o);
 const find=()=>[...fd().querySelectorAll('a,button')].find(b=>b.textContent.includes(label));let b=find();
 if(!b)throw new Error('دکمه‌ی «'+label+'» در پنل پیدا نشد');
 if(/_disabled_/.test(b.className)){await waitFor(()=>{b=find();return b&&!/_disabled_/.test(b.className)},8000);b=find();if(!b||/_disabled_/.test(b.className)){if(show)showPanel();throw new Error('«'+label+'» در پنل هنوز فعال نیست؛ شمارنده‌ها را بررسی کنید')}}
 const u0=fl(),t0=fd().body.innerText.length,d0=fd();realClick(b);await sleep(1500);
 let ch=false;try{ch=fl()!==u0||fd()!==d0||Math.abs(fd().body.innerText.length-t0)>3||!find()}catch(e){ch=true}
 if(show)showPanel();return ch})}
const FH=fr.style.cssText;
function showPanel(){pOpen=true;fr.style.cssText='position:fixed;left:0;top:52px;width:100%;height:calc(100% - 52px);opacity:1;pointer-events:auto;border:0;z-index:2147483646;background:#fff';$('#a').classList.remove('on');$('#f').style.display='none';$('#pb').style.display='flex'}
function hidePanel(){pOpen=false;fr.style.cssText=FH;$('#pb').style.display='none';$('#f').style.display='';$('#a').classList.add('on');applyK();R();sync()}
// ---- قفل پورتال: فقط whalePick دیده می‌شود و صفحه‌ی پنل پشتش پنهان است (جز صفحه‌ی ورود)
const KS=document.createElement('style');KS.id='jclk';KS.textContent='body{display:none!important}html{background:#14181d!important;overflow:hidden!important}';
const kOn=()=>S.kiosk!==false&&!document.querySelector('input[name=password]');
function applyK(){const on=kOn();if(on&&!KS.isConnected)(document.head||document.documentElement).appendChild(KS);if(!on&&KS.isConnected)KS.remove();
 const f=$('#f'),x=sh.querySelector('.top [data-t="x"]'),a=$('#a');if(!f||!a)return;if(x)x.style.display=on?'none':'';
 if(on&&!pOpen){a.classList.add('on');f.style.display='none'}else if(!on&&!pOpen&&!a.classList.contains('on'))f.style.display=''}
async function doPush(code){const n=Object.values(S.sc[code]||{}).reduce((a,b)=>a+b,0);if(!n){toast('هنوز چیزی اسکن نشده');return}
 try{toast('در حال ثبت در پنل…');const r=await push(code);toast(r.bad.length?'ثبت کامل نشد: '+r.bad.join('، '):r.sent?r.sent+' اسکن در پنل ثبت شد':'پنل از قبل همین تعداد اسکن داشت');R()}catch(e){toast(e.message)}}
let fErr='';
async function finalize0(code,quiet){if(hasCl(code)){toast('این سفارش درخواست تماس دارد؛ ابتدا آن را ثبت کنید');return false}const o=S.o[code],ps=o.products||[],need=ps.reduce((s,p)=>s+qtyOf(p),0),got=ps.reduce((s,p)=>s+Math.min(sc(code,pk(p)),qtyOf(p)),0);
 if(!quiet&&!confirm(got<need?'فقط '+got+' از '+need+' قلم اسکن شده. باز هم نهایی شود؟':'سفارش «'+(o.buyer||code)+'» نهایی شود؟'))return false;
 try{if(!quiet)toast('در حال ثبت اسکن‌ها و تایید در پنل…');const r=await push(code);if(r.bad.length){fErr='ثبت کامل نشد: '+r.bad.join('، ');toast(fErr);return false}
  if(!await act(code,'تایید نهایی',false)){fErr='تغییری دیده نشد؛ در پنل بررسی کنید';toast('«'+(o.buyer||code)+'»: '+fErr);return false}
  rec(code,'fin');o.fin=1;delete S.sel[code];delete S.sc[code];save();if(!quiet){toast('«'+(o.buyer||code)+'» نهایی شد ✓');sync()}R();return true}
 catch(e){fErr=e.message;toast(fErr);return false}}
async function finalize(code,quiet){if(busy.has(code))return false;busy.add(code);Rs();try{return await finalize0(code,quiet)}finally{busy.delete(code);R()}}
async function finalizeAll(){if(allBusy)return;allBusy=true;R();try{await finalizeAll0()}finally{allBusy=false;R()}}
async function finalizeAll0(){const cs=Object.keys(S.sel).filter(c=>!hasCl(c));if(!cs.length)return;
 const inc=cs.filter(c=>(S.o[c].products||[]).some(p=>sc(c,pk(p))<qtyOf(p))).length;
 if(!confirm(cs.length+' سفارش نهایی شود؟'+(inc?'\n'+inc+' سفارش هنوز کامل اسکن نشده.':'')))return;
 let ok=0;const bad=[];for(const c of cs){const nm=S.o[c].buyer||c;toast('در حال نهایی‌سازی «'+nm+'»…');if(await finalize(c,true))ok++;else bad.push(nm+' ('+fErr+')')}
 toast(ok+' از '+cs.length+' سفارش نهایی شد'+(bad.length?' — ناموفق: '+bad.join('، '):''));R();sync()}
// ---- نیاز به تماس (v3.2): ثبت درخواست تماس برای هر بارکد در بچ بسته‌بندی
const REASONS=['کالا یا برند مورد نظر موجود نیست','کالا یا برند انتخاب شده به تعداد کافی موجود نیست','تاریخ انقضا کالا تمام شده است','قیمت کالا نادرست است','عدم سرویس دهی مجموعه'],REASONS_S=['موجود نیست','تعداد کافی نیست','انقضا تمام شده','قیمت نادرست','عدم سرویس‌دهی'];
const nz=s=>normD(s).replace(/[\s\u200c\u200e\u200f]/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک');
const isCall=o=>/نیاز به تماس/.test(o.status||'')||!!(o.calledAt&&Date.now()-o.calledAt<120000);
const hasCl=c=>!!(S.cl[c]&&S.cl[c].items.length);
const FLG=(c,k)=>{const x=S.cl[c];return x&&x.items.find(i=>i.k==k)};
const CLBTN=(c,k)=>{const f=FLG(c,k);return`<button class="cl ${f?'on':''}" data-l="${esc(c)}|${esc(k)}">${IC('phone')}${f?'تماس: '+REASONS_S[S.cl[c].reason]:'نیاز به تماس'}</button>`};
const CLB=(o,c,bz,full)=>{const cl=S.cl[o.code];
 if(cl&&cl.items.length)return`<div class="warn">درخواست تماس: ${cl.items.length} قلم — ${esc(REASONS[cl.reason])}${cl.items.map(i=>'<br>• '+esc(i.t)+' ← '+esc(i.alt)).join('')}</div><button class="btn" style="background:#d97706" data-a="cs" data-c="${c}" ${bz?'disabled':''}>${bz?'در حال پردازش…':IC('phone')+'ثبت درخواست تماس در پنل'}</button>`;
 return`${full?'':'<div class="warn">این سفارش کامل اسکن نشده است.</div>'}<button class="btn" data-a="ok" data-c="${c}" ${bz?'disabled':''}>${bz?'در حال پردازش…':IC('check')+'ثبت و تایید نهایی'}</button>`};
// انتخاب یک گزینه در react-select (کلیک روی کنترل؛ در صورت شکست تایپ کردن متن)
let RSD=[];const dbg=()=>RSD.length?' — گزینه‌های پنل: '+RSD.slice(0,3).join(' | '):' — منوی پنل باز نشد';
async function rsPick(box,test,hint,verify){
 RSD=[];
 if(!box)return false;
 const ctl=()=>box.querySelector('[class*="-control"]'),inp=()=>box.querySelector('input[role=combobox]'),
 opts=()=>{let a=[...fd().querySelectorAll('[role=option]')];if(!a.length)a=[...fd().querySelectorAll('[id*="-option-"]')];return a},
 sv=()=>{const e=box.querySelector('[class*="singleValue"]');return e?e.textContent.trim():''};
 if(sv()&&verify(sv()))return true;
 for(let t=0;t<3;t++){
  try{
   if(t==1){const i=inp();if(i){i.focus();tv(i,hint||'')}}
   else if(!opts().length){const c=ctl();c&&realClick(c)}
   if(await waitFor(()=>opts().length,2500)){RSD=opts().map(e=>e.textContent.trim().slice(0,45));const o=opts().find(e=>test(e.textContent));
    if(o){realClick(o);if(await waitFor(()=>sv()&&verify(sv()),1500))return true}}
  }catch(e){}
  try{const i=inp();i&&tv(i,'');await sleep(200)}catch(e){}
 }
 return false}
function callPanel(code){return enq(async()=>{
 const o=S.o[code],c=S.cl[code];if(!o||!c||!c.items.length)throw new Error('کالایی برای تماس ثبت نشده');
 if(c.items.some(i=>!i.alt))throw new Error('برای همه‌ی اقلام باید بارکد جایگزین ثبت شود');
 await ensureId(o);await load('/orders/'+o.id);
 if(!await waitFor(()=>fd().querySelector('[class*="_productCard_"]'),15000))throw new Error('صفحه‌ی سفارش در پنل باز نشد');
 await sleep(300);
 const D=()=>fd(),dlg=()=>{const d=D();return d&&d.querySelector('.react-responsive-modal-modal,[role=dialog]')},
 q=s=>{const m=dlg();return m&&m.querySelector(s)},
 fail=m=>{const e=new Error(m);e.panel=1;return e};
 const b=[...D().querySelectorAll('a,button')].find(x=>!x.closest('[role=dialog]')&&x.textContent.includes('نیاز به تماس'));
 if(!b)throw new Error('دکمه‌ی «نیاز به تماس» در پنل پیدا نشد');
 if(/_disabled_/.test(b.className))throw new Error('«نیاز به تماس» در پنل فعال نیست');
 realClick(b);
 if(!await waitFor(()=>q('[class*="_reasonSection_"]'),6000))throw new Error('پنجره‌ی نیاز به تماس باز نشد');
 await sleep(300);
 // ۱) دلیل
 const want=REASONS[c.reason];
 if(!await rsPick(q('[class*="_reasonSection_"] [class*="_select_"]'),x=>nz(x)==nz(want),want,s=>nz(s)==nz(want)))throw fail('انتخاب دلیل در پنل ناموفق بود'+dbg());
 const rb=q('[class*="_reasonSection_"] button');if(!rb)throw fail('دکمه‌ی تایید دلیل پیدا نشد');
 realClick(rb);await sleep(700);
 if(!q('[class*="_barCodeSection_"]')){const f=q('form[class*="_reasonSection_"]');f&&f.requestSubmit&&f.requestSubmit();await waitFor(()=>q('[class*="_barCodeSection_"]'),3000)}
 if(!q('[class*="_barCodeSection_"]'))throw fail('بخش بارکد مشکل‌دار باز نشد');
 // ۲) هر بارکد مشکل‌دار + جایگزین
 for(const it of c.items){
  const bks=it.bks||[],tt=nz(it.t),mt=x=>{const t=String(x),f=nb(t.split('-')[0]),n=nz(t),nm=nz(t.split('-').slice(1).join('-'));return bks.includes(f)||bks.some(b=>b&&n.includes(b))||(tt.length>3&&(n.includes(tt)||(nm.length>3&&tt.includes(nm))))};
  if(!await rsPick(q('[class*="_barCodeSection_"] [class*="_select_"]'),mt,bks[0]||it.t,mt))throw fail('بارکد «'+(bks[0]||it.t)+'» در لیست پنل پیدا نشد'+dbg());
  {const sv=q('[class*="_barCodeSection_"] [class*="singleValue"]');it.pb=sv?normD(sv.textContent.split('-')[0]).replace(/\D/g,''):''}
  await sleep(300);
  if(!await waitFor(()=>q('[class*="_replacementSection_"]'),3000))throw fail('بخش بارکد جایگزین باز نشد');
  const rep=()=>q('[class*="_replacementSection_"]'),ai=()=>rep().querySelector('input[type=text]'),cb=()=>rep().querySelector('[class*="_replacementCheckBox_"] input[type=checkbox]');
  if(cb()&&cb().checked)cb().click();tv(ai(),it.alt)
  await sleep(300);
  const rows=()=>[...(dlg()?dlg().querySelectorAll('[class*="_tableSection_"] [col-id=barcode]'):[])].filter(e=>e.classList.contains('ag-cell')).map(e=>nb(e.textContent)),n0=rows().length;
  const sb=rep().querySelector('[class*="_submitButton_"]');if(!sb)throw fail('دکمه‌ی تایید بارکد جایگزین پیدا نشد');
  realClick(sb);
  if(!await waitFor(()=>rows().length>n0,4000)){sb.click();if(!await waitFor(()=>rows().length>n0,3000))throw fail('افزودن «'+(bks[0]||it.t)+'» به جدول پنل انجام نشد')}
 }
 // ۳) ثبت درخواست
 const sub=()=>[...(dlg()?dlg().querySelectorAll('[class*="_bottonsSection_"] button'):[])].find(x=>x.textContent.includes('ثبت'));
 if(!await waitFor(()=>{const x=sub();return x&&!x.disabled},4000))throw fail('دکمه‌ی «ثبت درخواست» فعال نشد');
 const u0=fl(),d0=D();realClick(sub());
 if(!await waitFor(()=>{try{return !dlg()||fl()!==u0||fd()!==d0}catch(e){return true}},10000))throw fail('پاسخ پنل مشخص نیست؛ وضعیت را در پنل بررسی کنید');
 return c.items.map(i=>i.pb||'')})}
async function sendCall(code){const c=S.cl[code],o=S.o[code];if(busy.has(code)||!c||!c.items.length)return;
 if(!confirm('درخواست تماس برای «'+(o.buyer||code)+'» ('+c.items.length+' قلم) ثبت شود؟'))return;
 busy.add(code);Rs();
 try{toast('در حال ثبت درخواست تماس در پنل…');const bcs=await callPanel(code);
  let okS=false;for(let i=0;i<2&&!okS;i++){await sync();okS=/نیاز به تماس/.test((S.o[code]||{}).status||'');if(!okS)await sleep(3000)}
  if(!okS)throw new Error('پنل وضعیت سفارش را «نیاز به تماس» نکرد؛ ثبت انجام نشده است');
  rec(code,'call');o.calledAt=Date.now();o.status='نیاز به تماس توسط فروشگاه';delete S.sel[code];delete S.sc[code];delete S.cl[code];save();c.items.forEach((it,i)=>dqAdd(bcs[i]||it.raw||(it.bks||[])[0],it.t,o.buyer));
  toast('درخواست تماس «'+(o.buyer||code)+'» ثبت شد ✓');sync()}
 catch(e){toast(e.message,9000);if(e.panel)showPanel()}
 finally{busy.delete(code);R()}}
// ---- برگه‌ی انتخاب دلیل و بارکد جایگزین
let CS=null;
function sheetOpen(code,k){const o=S.o[code],p=o&&(o.products||[]).find(p=>pk(p)==k);if(!p)return;
 const c=S.cl[code],ex=c&&c.items.find(i=>i.k==k);
 CS={code,k,p,reason:c?c.reason:null,alt:ex&&ex.alt?ex.alt:'',ex:!!ex};RSH();setTimeout(()=>{const i=$('#csa');i&&i.focus()},60)}
function RSH(){const el=$('#cs');if(!CS){el.style.display='none';el.innerHTML='';return}
 const c=S.cl[CS.code],lock=!!(c&&c.items.some(i=>i.k!=CS.k)),o=S.o[CS.code],p=CS.p,bc=(p.barcodes||[])[0]||'';
 el.innerHTML=`<div class="csb"><div class="csh"><b>نیاز به تماس</b><button class="ib dk" data-x="1">${IC('x')}</button></div><div class="kv"><span>سفارش</span><b>${esc(o.buyer||o.code)}</b></div><div class="nm" style="font-size:16px;margin:6px 0 2px">${esc(p.title)}</div><div class="bcd" style="font-weight:800;font-size:17px;text-align:right">${esc(bc)}</div><div class="ct" style="margin-top:12px">دلیل${lock?' (برای همه‌ی اقلام این سفارش یکسان است)':''}</div>${REASONS.map((r,i)=>`<button class="rs ${CS.reason===i?'on':''}" data-r="${i}" ${lock&&CS.reason!==i?'disabled':''}>${esc(r)}</button>`).join('')}<div class="ct" style="margin-top:12px">بارکد جایگزین</div><input class="srch" id="csa" inputmode="numeric" autocomplete="off" placeholder="اسکن یا تایپ کنید" value="${esc(CS.alt)}" style="direction:ltr;margin-bottom:8px"><button class="btn" data-ok="1">${CS.ex?'ذخیره':'افزودن به درخواست تماس'}</button>${CS.ex?'<button class="btn sec" data-del="1">حذف از درخواست</button>':''}</div>`;
 el.style.display='flex'}
function csSave(){const{code,k,p}=CS;if(CS.reason==null){toast('دلیل را انتخاب کنید');return}
 const alt=nb(CS.alt);if(!alt){toast('بارکد جایگزین را وارد کنید');return}
 let c=S.cl[code];if(!c)c=S.cl[code]={reason:CS.reason,items:[]};
 if(!c.items.some(i=>i.k!=k))c.reason=CS.reason;
 const bks=(p.barcodes||[]).map(nb).filter(Boolean),it={k,t:p.title,bks,raw:normD((p.barcodes||[])[0]||'').replace(/\D/g,''),alt},i=c.items.findIndex(x=>x.k==k);
 i<0?c.items.push(it):c.items[i]=it;
 save();CS=null;RSH();R();toast('به درخواست تماس اضافه شد')}
// ---- تب «غیرفعال»: غیرفعال‌سازی بارکدهای نیاز به تماس در سایت 172.17.1.101 (از طریق فایل پل)
const DPAGE='http://172.17.1.101/login',BR={ok:null};let brId=0,dqBusy=false;const brW=new Map();
addEventListener('message',e=>{const d=e.data;if(e.origin!==location.origin||!d||d.jcb!==2)return;const f=brW.get(d.id);if(f){brW.delete(d.id);f(d)}});
function bridge(op,data,ms){return new Promise(res=>{const id=++brId,t=setTimeout(()=>{brW.delete(id);res({ok:false,msg:'پاسخی از پل نیامد'})},ms||30000);
 brW.set(id,r=>{clearTimeout(t);res(r)});window.postMessage(Object.assign({jcb:1,op,id},data||{}),location.origin)})}
function dqAdd(bc,t,by,force){bc=String(bc||'').replace(/\D/g,'');if(!bc)return;S.dq=S.dq||[];
 if(S.dq.some(x=>x.bc==bc&&(x.st=='p'||x.st=='r')))return;
 S.dq.push({id:'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),bc,t:t||'',by:by||'',st:'p',at:Date.now()});
 S.dq=S.dq.slice(-200);save();Rs();if(force||S.dauto!==false)dqRun()}
async function dqRun(){if(dqBusy)return;dqBusy=true;
 try{const todo=()=>(S.dq||[]).find(x=>x.st=='p');if(!todo())return;
  const pg=await bridge('ping',{},1500);BR.ok=!!pg.ok;
  if(!BR.ok){toast('پل غیرفعال‌سازی نصب نیست یا پاسخ نمی‌دهد؛ بارکدها در صف می‌مانند',6000);Rs();return}
  let x;while(x=todo()){x.st='r';x.msg='';save();Rs();
   const r=await bridge('deact',{barcode:x.bc},30000);
   x.st=r.ok?'ok':'e';x.msg=r.msg||'';save();Rs();await sleep(300)}
  toast((S.dq||[]).some(x=>x.st=='e')?'برخی بارکدها غیرفعال نشد؛ تب «غیرفعال» را ببینید':'غیرفعال‌سازی انجام شد',4500)}
 finally{dqBusy=false}}
async function dAct(s){const i=s.indexOf('|'),a=i<0?s:s.slice(0,i),id=i<0?'':s.slice(i+1);S.dq=S.dq||[];
 if(a=='ping'){const r=await bridge('ping',{},1500);BR.ok=!!r.ok;Rs();toast(BR.ok?'پل متصل است':'پل نصب نیست؛ فایل jorchin-bridge را در Tampermonkey نصب کنید',5000);return}
 if(a=='auto'){S.dauto=S.dauto===false;save();R();return}
 if(a=='run'){dqRun();return}
 if(a=='clr'){S.dq=S.dq.filter(x=>x.st!='ok');save();R();return}
 if(a=='del'){S.dq=S.dq.filter(x=>x.id!=id);save();R();return}
 if(a=='retry'){const x=S.dq.find(x=>x.id==id);if(x){x.st='p';x.msg='';save();R();dqRun()}return}
 if(a=='add'){const e=$('#dbi'),v=normD(e?e.value:'').replace(/\D/g,'');if(!v){toast('بارکد را وارد کنید');return}if(e)e.value='';dqAdd(v,'(دستی)','',true)}}
function DVIEW(){const q=S.dq||[],auto=S.dauto!==false,pend=q.filter(x=>x.st=='p').length;
 const bd=x=>x.st=='ok'?['ok','غیرفعال شد']:x.st=='e'?['er','خطا']:x.st=='r'?['in','در حال انجام']:['wr','در صف'];
 return`<div class="card"><div class="ct">پل اتصال به سایت غیرفعال‌سازی</div><div class="pill ${BR.ok==null?'':BR.ok?'ok':'err'}"><i></i>${BR.ok==null?'بررسی نشده':BR.ok?'متصل':'نصب نیست / پاسخ نمی‌دهد'}</div><button class="btn sec" data-d="ping">${IC('sync')}بررسی اتصال</button><a class="btn sec" href="${DPAGE}" target="_blank" rel="noopener" style="text-decoration:none">باز کردن سایت</a></div>
<div class="card"><div class="ct">غیرفعال‌سازی خودکار بعد از ثبت نیاز به تماس</div><div class="kv"><span>وضعیت</span><b>${auto?'روشن':'خاموش'}</b></div><button class="btn sec" data-d="auto">${auto?'خاموش کردن':'روشن کردن'}</button></div>
<div class="card"><div class="ct">غیرفعال‌سازی دستی</div><input class="srch" id="dbi" inputmode="numeric" autocomplete="off" placeholder="بارکد را اسکن یا تایپ کنید" style="direction:ltr;margin-bottom:0"><button class="btn" data-d="add">${IC('ban')}غیرفعال کن</button></div>
<h3>صف (${q.length})</h3>`+(q.length?`<button class="btn" data-d="run" style="margin:0 0 10px">اجرای بارکدهای در صف (${pend})</button>`:'')+
 (q.slice().reverse().map(x=>{const b=bd(x);return`<div class="card" style="padding:12px"><div class="fh"><b class="bcd">${esc(x.bc)}</b><span class="bd ${b[0]}">${b[1]}</span></div><div class="dt">${esc(x.t||'')}${x.by?' · '+esc(x.by):''} · ${esc(new Date(x.at).toLocaleTimeString('fa-IR'))}</div>${x.msg?`<div class="${x.st=='e'?'warn':'dt'}">${esc(x.msg)}</div>`:''}<div class="ac" style="grid-template-columns:repeat(2,1fr)">${x.st=='r'?'':`<button data-d="retry|${esc(x.id)}">تلاش مجدد</button>`}<button data-d="del|${esc(x.id)}">حذف</button></div></div>`}).join('')||'<div class="em">صف خالی است.</div>')+(q.some(x=>x.st=='ok')?'<button class="btn sec" data-d="clr">پاک کردن انجام‌شده‌ها</button>':'')}
// ---- داده‌ی دسته‌بندی (یک بار از فایل cats.js)
let DBP;const db=()=>DBP||(DBP=new Promise((res,rej)=>{const r=indexedDB.open('jc',2);r.onupgradeneeded=()=>{const d=r.result;for(const n of['k','img'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n)};r.onsuccess=()=>res(r.result);r.onerror=rej}));
const idb=(m,v)=>db().then(d=>new Promise((res,rej)=>{const st=d.transaction('k',m=='get'?'readonly':'readwrite').objectStore('k'),q=m=='get'?st.get('cat'):st.put(v,'cat');q.onsuccess=()=>res(q.result);q.onerror=rej}));
// ---- عکس کالاها (بسته‌های pack_images.py → IndexedDB)
const IMG={},TRY=new Set();let NEED=[],imgN=+localStorage.jc_imgn||0,Q='',CH='all',VIEWC=null,allBusy=false;const busy=new Set();
async function ensureImgs(keys){const miss=[...new Set(keys)].filter(k=>k&&!(k in IMG)&&!TRY.has(k));if(!miss.length)return;miss.forEach(k=>TRY.add(k));const d=await db();let any=false;
 await Promise.all(miss.map(k=>new Promise(r=>{const q=d.transaction('img').objectStore('img').get(k);q.onsuccess=()=>{if(q.result){IMG[k]=URL.createObjectURL(q.result);any=true}r()};q.onerror=()=>r()})));
 if(any)Rs()}
function idx(){if(M)return M;if(!CAT)return null;M=new Map();const b=CAT.b;for(const k in b){const a=b[k].split(' '),s=+k;for(let i=0;i<a.length;i++)M.set(a[i],s)}return M}
// ---- عکس باکیفیت از پوشه‌ی کامپیوتر (File System Access API؛ فقط Chrome/Edge کامپیوتر)
const thb=(im,bks)=>im?`<img src="${im}" data-z="${im}" data-zb="${esc(bks.join(','))}">`:`<span data-z="" data-zb="${esc(bks.join(','))}" style="display:grid;place-items:center;width:100%;height:100%">${IC('img')}</span>`;
let DIR=null,HIX=null,zq=0;const HI={};
const dkv=(m,v)=>db().then(d=>new Promise((res,rej)=>{const st=d.transaction('k',m=='get'?'readonly':'readwrite').objectStore('k'),q=m=='get'?st.get('dir'):st.put(v,'dir');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}));
dkv('get').then(h=>{if(h&&h.kind=='directory'){DIR=h;Rs()}}).catch(()=>{});
async function scanDir(dir,ix,depth){for await(const[name,h] of dir.entries()){
 if(h.kind=='directory'){if(depth<3)await scanDir(h,ix,depth+1);continue}
 if(!/\.(webp|jpe?g|png|gif|avif|bmp)$/i.test(name))continue;
 const m=name.replace(/\.[^.]+$/,'').match(/\d{6,}/);if(!m)continue;const k=nb(m[0]);if(k&&!ix.has(k))ix.set(k,h)}}
async function ensureHix(force){if(HIX&&!force)return HIX;const ix=new Map();await scanDir(DIR,ix,0);HIX=ix;return ix}
async function hiRes(bks){if(!DIR)return null;
 try{if(DIR.requestPermission&&await DIR.requestPermission({mode:'read'})!=='granted')return null;
  for(const k of bks)if(HI[k])return HI[k];
  const ix=await ensureHix();
  for(const k of bks){const h=ix.get(k);if(h){const f=h.getFile?await h.getFile():h;return HI[k]=URL.createObjectURL(f)}}
 }catch(e){}return null}
async function pickDir(){if(!window.showDirectoryPicker){$('#fd').click();return}
 try{const h=await window.showDirectoryPicker({mode:'read'});DIR=h;HIX=null;for(const k in HI){URL.revokeObjectURL(HI[k]);delete HI[k]}
  await dkv('put',h);toast('در حال خواندن پوشه…');const ix=await ensureHix(true);toast('پوشه انتخاب شد: '+ix.size+' عکس');R()}
 catch(e){if(e&&e.name!='AbortError')toast('خطا: '+(e.message||e),5000)}}
const ZI={};
async function zImg(bks){try{const d=await db();for(const k of bks){if(ZI[k])return ZI[k];const b=await new Promise(r=>{const q=d.transaction('img').objectStore('img').get('z:'+k);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)});if(b)return ZI[k]=URL.createObjectURL(b)}}catch(e){}return null}
async function openZoom(src,bks){const zi=$('#zi'),zc=$('#zc'),zm=$('#zm'),my=++zq;
 zi.removeAttribute('src');if(src)zi.src=src;zc.className='zc';zc.textContent='';zm.style.display='flex';
 const z=await zImg(bks);if(my!=zq||zm.style.display!='flex')return;
 if(z){zi.src=z;zc.className='zc hi';zc.textContent='کیفیت خوب';return}
 if(!DIR){if(!src){zm.style.display='none';toast('عکسی برای این کالا نیست؛ بسته‌ی عکس بزرگ یا پوشه‌ی عکس را در «تنظیمات» اضافه کنید')}else zc.textContent='کم‌کیفیت — بسته‌ی عکس بزرگ یا پوشه‌ی عکس اضافه نشده';return}
 zc.textContent='در حال بارگذاری عکس باکیفیت…';const u=await hiRes(bks);if(my!=zq||zm.style.display!='flex')return;
 if(u){zi.src=u;zc.className='zc hi';zc.textContent='کیفیت بالا'}else zc.textContent=src?'در پوشه پیدا نشد — نسخه‌ی کم‌کیفیت':'عکس این کالا در پوشه پیدا نشد'}
// ---- رابط کاربری
const IP={list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',layers:'<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',check:'<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',sync:'<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',img:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',print:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',eye:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',scan:'<path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14"/>',ban:'<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>'};
const IC=n=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IP[n]||''}</svg>`;
const host=document.createElement('div');host.style.cssText='all:initial;position:fixed;z-index:2147483647;left:0;top:0';document.documentElement.appendChild(host);const sh=host.attachShadow({mode:'open'});
sh.innerHTML=`<style>
:host{--navy:#0f2a5c;--blue:#1d4ed8;--bg:#eef2f8;--ink:#0f172a;--mut:#64748b;--ln:#e2e8f0;--ok:#16a34a;--wr:#d97706;--er:#dc2626;--sh:0 2px 10px rgba(15,42,92,.08);--r:16px}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;font-family:Vazirmatn,Tahoma,system-ui,sans-serif}
button{font:inherit;border:0;cursor:pointer;color:inherit;background:none}button:active{transform:scale(.97)}svg{display:block}
.fab{position:fixed;left:14px;bottom:84px;width:56px;height:56px;border-radius:50%;background:var(--navy);color:#fff;display:grid;place-items:center;box-shadow:0 6px 18px rgba(15,42,92,.4)}
.app{position:fixed;inset:0;background:var(--bg);color:var(--ink);font-size:16px;line-height:1.5;direction:rtl;overflow:auto;display:none;-webkit-overflow-scrolling:touch}.app.on{display:block}
.top{position:sticky;top:0;z-index:3;background:linear-gradient(135deg,#0b1f46,var(--navy) 60%,#1e40af);color:#fff;display:flex;align-items:center;gap:10px;padding:max(14px,env(safe-area-inset-top)) 16px 14px}
.ttl{flex:1;font-size:20px;font-weight:800}.dot{width:10px;height:10px;border-radius:50%;background:#94a3b8}.dot.ok{background:#4ade80}.dot.err{background:#f87171}
.ib{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.14);color:#fff;display:grid;place-items:center}.ib.dk{background:var(--navy)}
main{padding:14px 14px calc(104px + env(safe-area-inset-bottom));max-width:680px;margin:auto}
.bn{position:fixed;left:0;right:0;bottom:0;z-index:4;background:#fff;border-top:1px solid var(--ln);display:flex;padding:6px 6px max(8px,env(safe-area-inset-bottom));box-shadow:0 -4px 16px rgba(15,42,92,.08)}
.bn button{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 2px;border-radius:14px;color:var(--mut);font-size:12px;font-weight:700}.bn button.on{color:var(--blue);background:#e8efff}
.hdr{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.pill{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--ln);border-radius:99px;padding:7px 14px;font-size:14px;font-weight:700;box-shadow:var(--sh)}.pill i{width:9px;height:9px;border-radius:50%;background:#94a3b8}.pill.ok i{background:var(--ok)}.pill.err i{background:var(--er)}
.sum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}.sum div{background:#fff;border-radius:var(--r);padding:10px;text-align:center;box-shadow:var(--sh)}.sum b{display:block;font-size:22px;color:var(--navy)}.sum span{font-size:12px;color:var(--mut)}
.srch{width:100%;padding:13px 16px;border:1px solid var(--ln);border-radius:14px;font:inherit;margin-bottom:12px;background:#fff;box-shadow:var(--sh);outline:0}
.o{display:flex;align-items:center;gap:12px;width:100%;background:#fff;border:2px solid transparent;border-radius:var(--r);padding:12px 14px;margin-bottom:10px;text-align:right;box-shadow:var(--sh)}.o .rk{width:6px;align-self:stretch;border-radius:6px;background:var(--ln)}
.o.sel{border-color:var(--ck);border-width:3px}.o.sel .rk{background:var(--ck);width:12px}
.ob{flex:1;min-width:0}.ob b{font-size:17px}.dt{color:var(--mut);font-size:13px}.mt{display:flex;gap:10px;font-size:13px;color:var(--mut);margin-top:2px}.bcd{font-family:monospace;direction:ltr}
.bd{font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px;background:#e2e8f0;color:#334155;white-space:nowrap}.bd.ok{background:#dcfce7;color:#166534}.bd.wr{background:#fef3c7;color:#92400e}.bd.er{background:#fee2e2;color:#991b1b}.bd.in{background:#dbeafe;color:#1e40af}
.scanbox{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid var(--blue);border-radius:var(--r);padding:4px 14px;margin-bottom:12px;color:var(--blue);box-shadow:var(--sh)}
.sci{flex:1;border:0;outline:0;padding:13px 0;font-size:19px;direction:ltr;background:none;color:var(--ink)}
.lg{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.lc{display:flex;align-items:center;gap:8px;background:var(--ck);color:var(--cx);padding:6px 12px;border-radius:99px;font-size:15px}.lc span{font-weight:800;font-size:13px}.lc small{font-size:12px;opacity:.85}
h2{font-size:19px;margin:18px 0 6px;padding:8px 14px;background:var(--navy);color:#fff;border-radius:12px}h3{font-size:16px;color:var(--navy);margin:10px 4px 6px}
.p{display:flex;align-items:center;gap:12px;background:var(--ct);border:2px solid var(--ck);border-inline-start:9px solid var(--ck);border-radius:var(--r);padding:12px;margin-bottom:10px;box-shadow:var(--sh)}.p.k{opacity:.5}
.th{width:84px;height:84px;border-radius:14px;background:#fff;border:1.5px dashed #cbd5e1;display:grid;place-items:center;color:#94a3b8;flex:none;overflow:hidden}.th img{width:100%;height:100%;object-fit:cover}
.px{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.nm{font-size:18px;line-height:1.5}.bc{font:800 20px monospace;direction:ltr;text-align:right;color:var(--ink);letter-spacing:.5px}.pr{font-size:16px;font-weight:700;color:#334155}.who{align-self:flex-start;background:var(--ck);color:var(--cx,#fff);padding:2px 12px;border-radius:99px;font-weight:700;font-size:14px}.chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:10px}.chip{flex:none;padding:8px 14px;border-radius:99px;background:#fff;border:1px solid var(--ln);font-weight:700;font-size:14px;box-shadow:var(--sh)}.chip.on{background:var(--navy);color:#fff;border-color:var(--navy)}.today{font-size:15px;font-weight:700;color:var(--navy);margin-bottom:10px}
.bar{height:7px;background:rgba(15,42,92,.1);border-radius:7px;overflow:hidden;margin-top:4px}.bar i{display:block;height:100%;background:var(--ck,var(--ok));transition:width .2s}
.c{min-width:66px;height:58px;border-radius:16px;background:var(--ck);color:var(--cx);font-size:21px;font-weight:800;flex:none}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:12px;padding:15px;border-radius:14px;background:var(--navy);color:#fff;font-size:17px;font-weight:800;box-shadow:var(--sh)}.btn.sec{background:#fff;color:var(--navy);border:1.5px solid var(--navy)}.btn.all{background:var(--ok)}.btn:disabled{opacity:.55}
.fc{background:var(--ct);border:2px solid var(--ck);border-radius:18px;padding:14px;margin-bottom:12px}.fh{display:flex;justify-content:space-between;align-items:center;font-size:18px}
.kv{display:flex;justify-content:space-between;padding:6px 0;font-size:15px;color:var(--mut)}.kv b{color:var(--ink)}.warn{background:#fef3c7;color:#92400e;border-radius:10px;padding:8px 12px;font-size:14px;margin-top:6px}
.ac{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.ac button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;background:#fff;border:1px solid var(--ln);border-radius:12px;font-size:12px;font-weight:700;color:var(--navy)}
.card{background:#fff;border-radius:18px;padding:16px;margin-bottom:12px;box-shadow:var(--sh)}.ct{font-weight:800;font-size:17px;margin-bottom:8px;color:var(--navy)}.ver{text-align:center;color:var(--mut);font-size:12px;margin-top:8px}
.em{text-align:center;color:var(--mut);padding:44px 12px;line-height:2}
.pb{position:fixed;left:0;right:0;top:0;height:52px;background:var(--navy);display:none;align-items:center;padding:0 12px;direction:rtl}.pb button{display:flex;align-items:center;gap:6px;background:var(--er);color:#fff;padding:9px 14px;border-radius:10px;font-weight:700}
.tt{position:fixed;left:50%;transform:translateX(-50%);bottom:110px;max-width:92%;background:var(--navy);color:#fff;padding:12px 18px;border-radius:14px;display:none;text-align:center;z-index:9;direction:rtl;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.zm{position:fixed;inset:0;background:#000d;display:none;flex-direction:column;gap:10px;align-items:center;justify-content:center;z-index:8}.zm img{width:min(250px,92vw);height:min(250px,92vw);object-fit:contain;border-radius:14px;background:#fff}.zc{color:#fff;font-size:13px;direction:rtl;text-align:center;opacity:.9}.zc.hi{color:#86efac}
.cs{position:fixed;inset:0;z-index:7;background:#0009;display:none;align-items:flex-end;justify-content:center;direction:rtl}.csb{background:#fff;width:100%;max-width:680px;max-height:92%;overflow:auto;border-radius:22px 22px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom));color:var(--ink)}.csh{display:flex;align-items:center;justify-content:space-between;font-size:19px;margin-bottom:8px}.rs{display:block;width:100%;text-align:right;padding:12px 14px;margin-bottom:8px;border:1.5px solid var(--ln);border-radius:12px;background:#fff;font-size:15px;font-weight:700}.rs.on{border-color:var(--wr);background:#fef3c7;color:#92400e}.rs:disabled{opacity:.4}.ck{display:flex;align-items:center;gap:10px;font-size:16px;margin:4px 0 6px}.ck input{width:22px;height:22px}.cl{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:10px;background:#fff;border:1px solid var(--wr);color:#92400e;font-size:13px;font-weight:700}.cl svg{width:16px;height:16px}.cl.on{background:var(--wr);color:#fff}.p.fl{border-color:var(--wr);border-inline-start-color:var(--wr)}
.th{width:clamp(56px,20vw,84px);height:clamp(56px,20vw,84px)}
.p{gap:clamp(6px,2.4vw,12px);padding:clamp(8px,2.6vw,12px)}.px{overflow:hidden}
.nm{font-size:clamp(15px,4.4vw,18px);overflow-wrap:anywhere}
.bc{font-size:clamp(13px,4.6vw,20px);letter-spacing:0;max-width:100%;overflow-wrap:anywhere;word-break:break-all;line-height:1.3}
.pr{font-size:clamp(13px,3.8vw,16px)}
.c{min-width:clamp(50px,16vw,66px);height:clamp(46px,14vw,58px);font-size:clamp(16px,5.2vw,21px)}
.zm img{width:min(250px,92vw,55vh);height:min(250px,92vw,55vh)}
@media(max-width:340px){main{padding-inline:8px}.bn button span{font-size:10px}.who{font-size:12px}.sci{font-size:16px}.nm{font-size:14px}}
@media(min-width:700px){.th{width:96px;height:96px}.bc{font-size:22px}}
</style><button class="fab" id="f">${IC('layers')}</button><div class="app" id="a"><div class="top"><div class="ttl">whalePick</div><span class="dot" id="cd"></span><button class="ib" data-t="x">${IC('x')}</button></div><main id="v"></main><nav class="bn"><button data-t="o" id="t0">${IC('list')}<span>سفارش‌ها</span></button><button data-t="b" id="t1">${IC('layers')}<span>دسته‌بندی</span></button><button data-t="f" id="t2">${IC('check')}<span>نهایی‌سازی</span></button><button data-t="s" id="t3">${IC('sliders')}<span>تنظیمات</span></button></nav><input type="file" id="fi" style="display:none"></div><div class="pb" id="pb"><button id="pcl">${IC('x')}بستن پنل</button></div><div class="tt" id="tt"></div><div class="zm" id="zm"><img id="zi"><div class="zc" id="zc"></div></div><div class="cs" id="cs"></div><input type="file" id="fp" multiple style="display:none"><input type="file" id="fd" webkitdirectory multiple style="display:none">`;
const $=s=>sh.querySelector(s);let ttm;const toast=(m,ms)=>{const t=$('#tt');t.textContent=m;t.style.display='block';clearTimeout(ttm);ttm=setTimeout(()=>t.style.display='none',ms||3500)};
const GSC=()=>`<div class="card"><div class="ct">ارسال گزارشات</div>${GS?`<div class="kv"><span>آدرس</span><b>${GS.url?'ذخیره‌شده ✓':'—'}</b></div><div class="kv"><span>در صف ارسال</span><b>${GS.q}</b></div><div class="kv"><span>آخرین ارسال موفق</span><b>${GS.last?esc(new Date(GS.last).toLocaleString('fa-IR')):'—'}</b></div>${GS.err?`<div class="warn">${esc(GS.err)}</div>`:''}`:'<div class="warn">اسکریپت «ابزارها» نصب نیست یا پاسخ نداد.</div>'}<button class="btn" data-t="gf">ارسال گزارش</button></div>`;
let unlocked=false;const hp=x=>{let h=5381;for(const c of String(x))h=(h*33^c.charCodeAt(0))>>>0;return 'p'+h};
function askPw(){if(unlocked)return true;if(!S.pw){const a=prompt('برای قفل کردن تنظیمات یک رمز تعیین کنید');if(!a||!a.trim())return false;const b=prompt('رمز را دوباره وارد کنید');if(a!==b){toast('رمزها یکسان نیست');return false}S.pw=hp(a.trim());save();unlocked=true;toast('رمز تنظیمات ذخیره شد ✓');return true}
const p=prompt('رمز تنظیمات');if(p==null)return false;if(hp(p.trim())===S.pw){unlocked=true;return true}toast('رمز اشتباه است');return false}
const Rs=()=>{const a=sh.activeElement;if(a&&(a.id=='bci'||a.id=='q'||a.id=='dbi'))return;R()};
idb('get').then(d=>{if(d){CAT=d;M=null}}).catch(()=>{});
async function loadCats(f,quiet){try{const t=await f.text(),j=JSON.parse(t.slice(t.indexOf('{')));delete j.demo;if(!j.c||!j.s||!j.b)throw 0;await idb('put',j);CAT=j;M=null;R()}catch(x){if(quiet)throw new Error('فایل دسته‌بندی معتبر نیست');alert('فایل معتبر نیست؛ cats.js را انتخاب کنید')}}
$('#fi').onchange=async e=>{const f=e.target.files[0];if(!f)return;await loadCats(f,false);e.target.value=''};
const badge=(o,c)=>o.err?['er','خطا']:o.gone?['wr','در پنل نیست']:(o.fin||/فاکتور/.test(o.status||''))?['ok','نهایی‌شده']:/کنسل/.test(o.status||'')?['er','کنسل']:isCall(o)?['wr','نیاز به تماس']:c?((o.products&&o.products.length)?['in','آماده']:['wr','در حال خواندن']):/باز شده/.test(o.status||'')?['in','در حال جمع‌آوری']:['mu',o.status||'جدید'];
const tot=o=>{const ps=o.products||[];return[ps.reduce((s,p)=>s+Math.min(sc(o.code,pk(p)),qtyOf(p)),0),ps.reduce((s,p)=>s+qtyOf(p),0)]};
function view(){NEED=[];for(const k in S.sel)if(!S.o[k])delete S.sel[k];for(const k in S.cl)if(!S.o[k])delete S.cl[k];
 const all=Object.values(S.o).sort((a,b)=>(a.sort||'').localeCompare(b.sort||'')),sel=all.filter(o=>S.sel[o.code]);
 const ms=st.ms?' ('+(st.ms/1000).toFixed(1)+'ث'+(st.pg>1?' · '+st.pg+' صفحه':'')+')':'';
 if(tab=='v'){const o=S.o[VIEWC];if(!o){tab='o';return view()}const ps=o.products||[],[bc,bt]=badge(o,false);
  const h=`<button class="btn sec" data-t="o" style="margin:0 0 12px">${IC('list')}بازگشت به سفارش‌ها</button><div class="card" style="background:${esc(cardBg(o))}"><div class="fh"><b>${esc(o.buyer||o.code)}</b><span class="bd ${bc}">${esc(bt)}</span></div><div class="kv"><span>کد سفارش</span><b class="bcd">${esc(o.code)}</b></div><div class="kv"><span>کانال</span><b>${esc(o.channel)}</b></div><div class="kv"><span>تاریخ</span><b>${esc(dt(o))}</b></div>${o.col?`<div class="kv"><span>جمع‌آوری‌کننده</span><b>${esc(o.col.n)}${o.col.p?' — '+esc(o.col.p):''}</b></div>`:''}${orderAmt(o)?`<div class="kv"><span>جمع قیمت اقلام</span><b>${orderAmt(o).toLocaleString('fa-IR')}</b></div>`:''}</div>`;
  if(!ps.length)return h+`<div class="em">${o.err?esc(o.err):'در حال خواندن اقلام…'}</div>`;
  return h+ps.map(p=>{const bks=(p.barcodes||[]).map(nb).filter(Boolean);NEED.push(...bks);const im=bks.map(k=>IMG[k]).find(Boolean);
   return`<div class="p" style="--ck:#94a3b8;--ct:#fff"><div class="th">${thb(im,bks)}</div><div class="px"><b class="nm">${esc(p.title)}</b><div class="bc">${esc((p.barcodes||[])[0]||'')}</div>${p.price?`<div class="pr">قیمت: ${esc(p.price)}</div>`:''}<div class="kv" style="padding:0"><span>تعداد: ${qtyOf(p)}</span><span>${p.scanned?'اسکن در پنل: '+esc(p.scanned):''}</span></div></div></div>`}).join('')}
 if(tab=='d')return DVIEW();
 if(tab=='s')return`<div class="card"><div class="ct">وضعیت اتصال به پنل</div><div class="pill ${st.k}"><i></i>${esc(st.t)}</div><div class="kv"><span>آخرین همگام‌سازی</span><b>${esc(st.at||'—')}${ms}</b></div><div class="kv"><span>تعداد سفارش‌ها</span><b>${all.length}</b></div><button class="btn" data-t="sync">${IC('sync')}همگام‌سازی دستی</button></div><div class="card"><div class="ct">دانلود یکجای داده‌ها</div><div class="kv"><span>دسته‌بندی</span><b>${CAT?'روی گوشی ✓':'نیست'}</b></div><div class="kv"><span>عکس‌ها</span><b>${imgN?imgN+' عکس ✓':'نیست'}</b></div><div class="kv"><span>نسخه‌ی داده</span><b>${esc(DL.v||'—')}</b></div>${DL.t?`<div class="kv"><span>وضعیت</span><b>${esc(DL.t)}${DL.on?' — '+Math.round(DL.p*100)+'٪':''}</b></div>`:''}<button class="btn" data-t="dl" ${DL.on?'disabled':''}>دانلود / به‌روزرسانی داده‌ها</button></div><div class="card"><div class="ct">دسته‌بندی کالاها</div><div class="kv"><span>وضعیت</span><b>${CAT?'بارگذاری شده':'بارگذاری نشده'}</b></div><button class="btn sec" data-t="ld">${IC('list')}انتخاب فایل cats.js</button></div><div class="card"><div class="ct">تصاویر کالاها</div><div class="kv"><span>تعداد در گوشی</span><b>${imgN}</b></div><button class="btn sec" data-t="img">${IC('img')}افزودن بسته‌های عکس</button></div><div class="card"><div class="ct">پوشه‌ی عکس باکیفیت (کامپیوتر)</div><div class="kv"><span>وضعیت</span><b>${DIR?esc(DIR.name)+(HIX?' — '+HIX.size+' عکس':''):'انتخاب نشده'}</b></div><button class="btn sec" data-t="dir">${IC('img')}${DIR?'تغییر / بازخوانی پوشه':'انتخاب پوشه'}</button></div><div class="card"><div class="ct">صدای سفارش جدید</div><div class="kv"><span>وضعیت</span><b>${S.mute?'خاموش':'روشن'}</b></div><button class="btn sec" data-t="snd">${S.mute?'روشن کردن صدا':'خاموش کردن صدا'}</button></div><div class="card"><div class="ct">غیرفعال‌سازی بارکد</div><button class="btn sec" data-t="d">${IC('ban')}صف و تنظیمات غیرفعال‌سازی</button></div><div class="card"><div class="ct">آدرس گزارش (Google Sheet)</div><div class="kv"><span>آدرس</span><b>${GS?(GS.url?'ذخیره‌شده ✓':'—'):(S.gs&&S.gs.url?'ذخیره‌شده ✓':'—')}</b></div><div class="kv"><span>کلید تیم (اختیاری)</span><b>${S.gs&&S.gs.token?esc(String(S.gs.token).slice(0,3))+'… ✓':'—'}</b></div><div class="kv"><span>شما در گزارش</span><b>${S.me?esc(S.me.n):'بعد از اولین نهایی‌سازی مشخص می‌شود'}</b></div><button class="btn sec" data-t="gs">تنظیم آدرس گزارش</button></div><div class="card"><div class="ct">قفل پورتال</div><div class="kv"><span>وضعیت</span><b>${S.kiosk===false?'خاموش (پنل دیده می‌شود)':'روشن (فقط whalePick)'}</b></div><button class="btn sec" data-t="kk">${S.kiosk===false?'روشن کردن قفل':'خاموش کردن قفل'}</button></div><div class="card"><div class="ct">رمز تنظیمات</div><button class="btn sec" data-t="pw">تغییر رمز</button></div><div class="ver">whalePick نسخه‌ی 3.12</div>`;
 if(tab=='o'){const q=Q.trim().toLowerCase(),L=['دیجی','اسنپ','آلدی'],chs=[...new Set(all.map(o=>o.channel).filter(Boolean))].sort((a,b)=>{const x=L.indexOf(a),y=L.indexOf(b);return(x<0?9:x)-(y<0?9:y)});
  const rows=all.filter(o=>(CH=='all'||o.channel==CH)&&(!q||[o.buyer,o.code,o.channel,o.col&&o.col.n].join(' ').toLowerCase().includes(q))),nd=all.filter(isDone).length;
  const h=KLB()+DLB()+`<div class="today">${esc(faT.format(new Date()))}</div><div class="hdr"><div class="pill ${st.k}"><i></i>${esc(st.t)}${st.at?' · '+st.at:''}${ms}</div><button class="ib dk" data-t="sync">${IC('sync')}</button></div><div class="sum"><div><b>${all.length}</b><span>سفارش</span></div><div><b>${sel.length}/3</b><span>انتخاب‌شده</span></div><div><b>${nd}</b><span>نهایی‌شده</span></div></div><div class="chips"><button class="chip ${CH=='all'?'on':''}" data-h="all">همه ${all.length}</button>${chs.map(c=>`<button class="chip ${CH==c?'on':''}" data-h="${esc(c)}">${esc(c)} ${all.filter(o=>o.channel==c).length}</button>`).join('')}</div><input class="srch" id="q" value="${esc(Q)}" placeholder="جستجو: نام، کد سفارش، کانال">`;
  if(!all.length)return h+'<div class="em">هنوز سفارشی خوانده نشده.</div>';
  return h+rows.map(o=>{const c=S.sel[o.code],k=c&&CL[c],[bc,bt]=badge(o,c);
   return`<button class="o ${c?'sel':''}" data-c="${esc(o.code)}" style="background:${esc(cardBg(o))};${k?`--ck:${k[0]};--ct:${k[1]}`:''}"><span class="rk"></span><div class="ob"><b>${esc(o.buyer||o.code)}</b><div class="dt">${esc(dt(o))}</div><div class="mt"><span class="bcd">${esc(o.code)}</span><span>${esc(o.channel)}</span>${o.col?`<span>جمع‌آوری: ${esc(o.col.n)}</span>`:''}</div></div><span class="bd ${bc}">${esc(bt)}</span></button>`}).join('')}
 if(tab=='f'){if(!sel.length)return'<div class="em">سفارشی برای نهایی‌سازی نیست.</div>'+GSC();let h='';
  for(const o of sel){const k=CL[S.sel[o.code]],[g,n]=tot(o),c=esc(o.code),bz=busy.has(o.code),full=n&&g>=n;
   h+=`<div class="fc" style="--ck:${k[0]};--ct:${k[1]};--cx:${k[2]}"><div class="fh"><b>${esc(o.buyer||o.code)}</b><span class="bd ${full?'ok':'wr'}">${full?'کامل':'ناقص'}</span></div><div class="dt">${esc(dt(o))}</div><div class="bar"><i style="width:${n?Math.round(100*g/n):0}%"></i></div><div class="kv"><span>اقلام اسکن‌شده</span><b>${g} از ${n}</b></div>${CLB(o,c,bz,full)}<div class="ac"><button data-a="call" data-c="${c}">${IC('phone')}نیاز به تماس</button><button data-a="print" data-c="${c}">${IC('print')}چاپ فاکتور</button>${kOn()?'':`<button data-a="open" data-c="${c}">${IC('eye')}باز کردن در پنل</button>`}</div></div>`}
  return h+(sel.filter(o=>!hasCl(o.code)).length>1?`<button class="btn all" data-a="all" ${allBusy?'disabled':''}>${allBusy?'در حال پردازش…':IC('check')+'تایید نهایی همه‌ی سفارش‌ها ('+sel.filter(o=>!hasCl(o.code)).length+')'}</button>`:'')+'<button class="btn sec" data-t="next">بستن دسته‌بندی و شروع بعدی</button>'+GSC()}
 if(!CAT)return'<div class="em">فایل دسته‌بندی هنوز بارگذاری نشده.<button class="btn" data-t="ld">انتخاب فایل cats.js</button></div>';
 const rd=sel.filter(o=>o.products&&o.products.length);
 if(!rd.length)return'<div class="em">'+(sel.length?'در حال خواندن اقلام سفارش‌ها…':'سفارشی انتخاب نشده.<br>در «سفارش‌ها» تا ۳ سفارش را انتخاب کنید.')+'</div>';
 const m=idx(),g=new Map();
 for(const o of rd)for(const p of o.products){let s=1e9;const bs=p.barcodes||[];for(const b of bs){const v=m.get(nb(b));if(v!=null){s=v;break}}
  const key=nb(bs[0])||p.title;let e=g.get(s);if(!e)g.set(s,e=new Map());const mk=key+'#'+o.code;let r=e.get(mk);if(!r)e.set(mk,r={t:p.title,bks:bs.map(nb).filter(Boolean),bc:bs[0]||'',pr:p.price||'',q:{},k:key});r.q[o.code]=(r.q[o.code]||0)+(num(p.qty)||1)}
 let h=`<div class="scanbox">${IC('scan')}<input class="sci" id="bci" inputmode="numeric" placeholder="بارکد را اسکن یا تایپ کنید" autocomplete="off"></div><div class="lg">`+rd.map(o=>{const k=CL[S.sel[o.code]],[g2,n2]=tot(o);return`<div class="lc" style="--ck:${k[0]};--cx:${k[2]}"><b>${esc(o.buyer||o.code)}</b><span>${g2}/${n2}</span><small>${esc(dt(o))}</small></div>`}).join('')+'</div>',lc=-2;
 for(const s of[...g.keys()].sort((a,b)=>a-b)){const sg=s==1e9?null:CAT.s[s],ci=sg?sg[0]:-1;
  if(ci!=lc){lc=ci;h+=`<h2>${sg?esc(CAT.c[ci]):'بدون دسته'}</h2>`}if(sg)h+=`<h3>${esc(sg[1])}</h3>`;
  for(const r of [...g.get(s).values()].sort((a,b)=>a.t.localeCompare(b.t,'fa')||(a.k<b.k?-1:a.k>b.k?1:0))){const o0=rd.find(o=>r.q[o.code]),k0=CL[S.sel[o0.code]],n=sc(o0.code,r.k),q=r.q[o0.code],im=r.bks.map(k=>IMG[k]).find(Boolean);NEED.push(...r.bks);
   h+=`<div class="p ${n>=q?'k':''} ${FLG(o0.code,r.k)?'fl':''}" style="--ck:${k0[0]};--ct:${k0[1]};--cx:${k0[2]}"><div class="th">${thb(im,r.bks)}</div><div class="px"><b class="nm">${esc(r.t)}</b><div class="bc">${esc(r.bc)}</div>${r.pr?`<div class="pr">قیمت: ${esc(r.pr)}</div>`:''}<div class="who">${esc(o0.buyer||o0.code)}</div>${CLBTN(o0.code,r.k)}<div class="bar"><i style="width:${Math.min(100,Math.round(100*n/q))}%"></i></div></div><button class="c" data-s="${esc(o0.code)}|${esc(r.k)}|${q}">${n}/${q}</button></div>`}}
 return h+'<button class="btn" data-t="end">پایان دسته‌بندی و نهایی‌سازی</button>'}
function R(){if(!$('#a').classList.contains('on'))return;['o','b','f','s'].forEach((t,i)=>{$('#t'+i).className=(tab==t||(t=='o'&&tab=='v')||(t=='s'&&tab=='d'))?'on':''});$('#cd').className='dot '+(st.k||'');
 const sy=$('#a').scrollTop,ae=sh.activeElement,had=ae&&ae.id=='bci';$('#v').innerHTML=view();$('#a').scrollTop=sy;if(had){const i=$('#bci');i&&i.focus({preventScroll:true})}if(NEED.length)ensureImgs(NEED)}
$('#f').onclick=()=>{$('#a').classList.add('on');R();if(Date.now()-(st.t0||0)>10000)sync()};
$('#a').onclick=e=>{const t=e.target.closest('[data-t],[data-c],[data-a],[data-s],[data-z],[data-h],[data-l],[data-d]');if(!t)return;const d=t.dataset;
 if(d.d){dAct(d.d);return}
 if(d.l){const i=d.l.indexOf('|');sheetOpen(d.l.slice(0,i),d.l.slice(i+1));return}
 if(d.z!==undefined){openZoom(d.z,(d.zb||'').split(',').filter(Boolean));return}
 if(d.h){CH=d.h;R();return}
 if(d.t=='snd'){S.mute=!S.mute;save();if(!S.mute)ding();R();return}
 if(d.a){if(d.a=='ok')finalize(d.c);else if(d.a=='cs')sendCall(d.c);else if(d.a=='all')finalizeAll();else if(d.a=='push')doPush(d.c);else if(d.a=='open')enq(async()=>{await openOrder(S.o[d.c]);showPanel()}).catch(x=>toast(x.message));else act(d.c,d.a=='call'?'نیاز به تماس':'چاپ فاکتور',true).catch(x=>toast(x.message));return}
 if(d.s){const[c,k,q]=d.s.split('|');(S.sc[c]=S.sc[c]||{})[k]=(sc(c,k)+1)%(+q+1);track(c);save();R();return}
 if(d.t=='gs'){if(!askPw())return;const u=prompt('آدرس گزارش Google (با /exec تمام می‌شود)',(S.gs&&S.gs.url)||(GS&&GS.url)||'');if(!u)return;if(!/^https:\/\/script\.google\.com\/macros\/s\/[^\/\s]+\/exec$/.test(u.trim())){alert('آدرس درست نیست؛ باید با https://script.google.com/macros/s/ شروع شود و به /exec ختم شود');return}const k=prompt('کلید تیم (اختیاری؛ اگر مدیر نداده خالی بگذارید)',(S.gs&&S.gs.token)||'');if(k===null)return;S.gs={url:u.trim(),token:(k||'').trim()};save();gsPost({op:'cfg',url:S.gs.url,token:S.gs.token});setTimeout(()=>toast(GS&&GS.url?'ذخیره شد ✓ (برای همیشه)':'ذخیره نشد؛ اسکریپت «ابزارها» نصب نیست؟',4000),900);return}
 if(d.t=='gf'){toast('در حال ارسال…');gsPost({op:'flush'});return}
 if(d.t=='sync'){toast('در حال سینک کامل…');sync(true).then(()=>toast('سینک شد'));return}
 if(d.t=='dir'){pickDir();return}
 if(d.t=='dl'){dlRun();return}
 if(d.t=='klogin'){location.href='/login';return}
 if(d.t=='kk'){if(!askPw())return;S.kiosk=S.kiosk===false;save();applyK();R();toast(S.kiosk===false?'قفل پورتال خاموش شد؛ پنل دیده می‌شود':'قفل پورتال روشن شد ✓',4000);return}
 if(d.t=='img'){$('#fp').click();return}
 if(d.t=='ld'){$('#fi').click();return}
 if(d.t=='x'){$('#a').classList.remove('on');return}
 if(d.t=='end'){tab='f';R();return}
 if(d.t=='next'){const left=Object.keys(S.sel).length;if(left&&!confirm(left+' سفارش هنوز نهایی نشده؛ دسته‌بندی بسته شود؟'))return;Object.keys(S.sel).forEach(c=>rel(c));S.sel={};S.sc={};S.cl={};S.tr={};tab='o';save();R();return}
 if(d.t=='s'&&!askPw())return;if(d.t=='pw'){const o=prompt('رمز فعلی');if(o==null||hp(o.trim())!==S.pw){toast('رمز اشتباه است');return}const a=prompt('رمز جدید');if(!a||!a.trim())return;S.pw=hp(a.trim());save();toast('رمز تغییر کرد ✓');return}
 if(d.t){tab=d.t;if(d.t=='s'||d.t=='f')gsAsk();R();return}
 if(d.c){if(S.sel[d.c]){rel(d.c);delete S.sel[d.c];delete S.cl[d.c]}else{if(isDone(S.o[d.c])||isCall(S.o[d.c])){VIEWC=d.c;tab='v';details(d.c);R();return}const u=Object.values(S.sel);if(u.length>=3)return;const f=['b','r','y'].filter(x=>!u.includes(x));S.sel[d.c]=f[Math.random()*f.length|0];details(d.c)}save();R()}};
$('#a').addEventListener('keydown',e=>{if(e.key!='Enter'||e.target.id!='bci')return;const v=nb(e.target.value);e.target.value='';if(!v)return;
 for(const o of Object.values(S.o).filter(o=>S.sel[o.code]&&o.products)){const p=o.products.find(p=>(p.barcodes||[]).some(b=>nb(b)==v));if(!p)continue;const k=pk(p);if(sc(o.code,k)<qtyOf(p)){(S.sc[o.code]=S.sc[o.code]||{})[k]=sc(o.code,k)+1;track(o.code);save();R();const i=$('#bci');i&&i.focus({preventScroll:true});return}}
 toast('این بارکد در این دسته‌بندی نیست یا کامل شده')});
$('#pcl').onclick=hidePanel;
$('#a').addEventListener('input',e=>{if(e.target.id!='q')return;Q=e.target.value;R();const i=$('#q');if(i){i.focus();i.setSelectionRange(Q.length,Q.length)}});
$('#zm').onclick=()=>{$('#zm').style.display='none'};
$('#cs').onclick=e=>{if(e.target.id=='cs'){CS=null;RSH();return}const t=e.target.closest('[data-x],[data-r],[data-ok],[data-del]');if(!t)return;const d=t.dataset;
 if(d.x){CS=null;RSH();return}
 if(d.r!==undefined){CS.reason=+d.r;RSH();return}
 if(d.del){const c=S.cl[CS.code];if(c){c.items=c.items.filter(i=>i.k!=CS.k);if(!c.items.length)delete S.cl[CS.code]}save();CS=null;RSH();R();return}
 if(d.ok)csSave()};
$('#cs').addEventListener('input',e=>{if(e.target.id=='csa')CS.alt=e.target.value});
$('#a').addEventListener('keydown',e=>{if(e.key=='Enter'&&e.target.id=='dbi'){e.preventDefault();dAct('add')}});
setTimeout(()=>{dqRun()},4000);
$('#cs').addEventListener('keydown',e=>{if(e.key=='Enter'&&e.target.id=='csa'){e.preventDefault();csSave()}});

// مرورگرهای بدون showDirectoryPicker (مثل Firefox): انتخاب پوشه با input؛ فهرست فقط تا بستن/رفرش صفحه در حافظه می‌ماند
$('#fd').onchange=e=>{const all=[...e.target.files],fs=all.filter(f=>/\.(webp|jpe?g|png|gif|avif|bmp)$/i.test(f.name)),ix=new Map();
 for(const f of fs){const m=f.name.replace(/\.[^.]+$/,'').match(/\d{6,}/);if(!m)continue;const k=nb(m[0]);if(k&&!ix.has(k))ix.set(k,f)}
 e.target.value='';if(!all.length)return;
 for(const k in HI){URL.revokeObjectURL(HI[k]);delete HI[k]}
 DIR={name:((all[0].webkitRelativePath||'').split('/')[0])||'پوشه',fallback:true};HIX=ix;
 toast(ix.size?'پوشه انتخاب شد: '+ix.size+' عکس (بعد از رفرش دوباره انتخاب کنید)':'عکسی با نام بارکد در این پوشه پیدا نشد',5000);R()};
async function importPacks(fs,quiet){try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(x){}
 const d=await db();let tot=0;
 for(let i=0;i<fs.length;i++){const f=fs[i];if(/^image\//.test(f.type)){toast('این‌ها عکس معمولی‌اند، نه بسته‌ی عکس؛ از «انتخاب پوشه» در بخش «پوشه‌ی عکس باکیفیت» استفاده کنید',6000);return}try{const hl=new DataView(await f.slice(0,4).arrayBuffer()).getUint32(0),h=JSON.parse(await f.slice(4,4+hl).text()),base=4+hl;
  await new Promise((res,rej)=>{const tx=d.transaction('img','readwrite'),st=tx.objectStore('img');for(let j=0;j<h.k.length;j++)st.put(f.slice(base+h.o[j],base+h.o[j]+h.n[j],'image/webp'),(h.z?'z:':'')+h.k[j]);tx.oncomplete=res;tx.onerror=tx.onabort=()=>rej(tx.error)});
  tot+=h.k.length;if(!quiet)toast('فایل '+(i+1)+' از '+fs.length+' — '+tot+' عکس')}catch(x){if(quiet)throw new Error('خطا در '+f.name+': '+(x&&x.message||x));toast('خطا در '+f.name+': '+(x&&x.message||x));return}}
 imgN=await new Promise(r=>{const q=d.transaction('img').objectStore('img').count(IDBKeyRange.upperBound('A'));q.onsuccess=()=>r(q.result);q.onerror=()=>r(0)});const zn=await new Promise(r=>{const q=d.transaction('img').objectStore('img').count(IDBKeyRange.lowerBound('z:'));q.onsuccess=()=>r(q.result);q.onerror=()=>r(0)});localStorage.jc_imgn=imgN;TRY.clear();for(const k in ZI)delete ZI[k];if(!quiet)toast('تمام شد: '+imgN+' عکس کوچک'+(zn?' + '+zn+' عکس بزرگ':'')+' در گوشی');R()}
$('#fp').onchange=async e=>{const fs=[...e.target.files];if(!fs.length)return;await importPacks(fs,false);e.target.value=''};
// ---- دانلود یکجای داده‌ها (دسته‌بندی + عکس‌ها) از طریق اسکریپت «ابزارها»
const DL={on:0,t:'',p:0,v:localStorage.jc_dv||'',nv:''};
const dlReq=(op,extra,ms)=>new Promise((res,rej)=>{const id='d'+Date.now()+Math.random().toString(36).slice(2,6),parts=[];let to;
 const off=()=>{clearTimeout(to);removeEventListener('message',h)},fail=m=>{off();rej(new Error(m))},arm=t=>{clearTimeout(to);to=setTimeout(()=>fail('پاسخی از اسکریپت «ابزارها» نرسید؛ نصب است و اینترنت دارید؟'),t)};
 const h=e=>{const d=e.data;if(e.origin!==location.origin||!d||d.jcb!==6||d.id!==id)return;arm(60000);
  if(d.err)return fail(d.err);
  if(d.part!==undefined){const bin=atob(d.b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);parts[d.part]=u;return}
  if(d.done){off();res(d.man||parts)}};
 addEventListener('message',h);arm(ms||30000);window.postMessage(Object.assign({jcb:5,id,op},extra||{}),location.origin)});
async function dlRun(){if(DL.on)return;DL.on=1;DL.t='در حال بررسی…';DL.p=0;Rs();
 try{const man=await dlReq('man',{},30000);if(!man||!man.files||!man.files.length)throw new Error('فهرست داده‌ها خالی است');
  const fs=man.files,tot=fs.reduce((a,f)=>a+(f.size||1),0);let done=0;
  for(let i=0;i<fs.length;i++){const f=fs[i];DL.t='دانلود '+f.name+' ('+(i+1)+' از '+fs.length+')';Rs();
   const file=new File(await dlReq('get',{name:f.name},60000),f.name);
   if(/\.pack$/i.test(f.name))await importPacks([file],true);else await loadCats(file,true);
   done+=f.size||1;DL.p=done/tot;Rs()}
  localStorage.jc_dv=man.v||'1';DL.v=man.v||'1';DL.nv=DL.v;DL.t='تمام شد ✓';toast('دسته‌بندی و عکس‌ها روی گوشی ذخیره شد ✓',4000)
 }catch(e){DL.t='خطا: '+e.message;toast(DL.t,7000)}finally{DL.on=0;Rs()}}
const KLB=()=>/وارد پنل|ورود به پنل/.test(st.t||'')?`<div class="warn">نشست پنل تمام شده؛ یک بار وارد شوید.<button class="btn" data-t="klogin">رفتن به صفحه‌ی ورود</button></div>`:'';
const DLB=()=>DL.on?`<div class="warn">${esc(DL.t)} — ${Math.round(DL.p*100)}٪</div>`:((!CAT||!imgN)?`<div class="warn">دسته‌بندی و عکس‌ها هنوز روی گوشی نیست (حدود ۳۵ مگابایت، با دیتای موبایل).<button class="btn" data-t="dl">دانلود یکجا</button></div>`:(DL.nv&&DL.nv!==DL.v?`<div class="warn">نسخه‌ی جدید داده‌ها آماده است.<button class="btn sec" data-t="dl">به‌روزرسانی</button></div>`:''));
setTimeout(()=>{if(document.hidden)return;dlReq('man',{},12000).then(m=>{if(m&&m.v){DL.nv=m.v;Rs()}}).catch(()=>{})},9000);
setInterval(()=>{if(!host.isConnected)document.documentElement.appendChild(host);if(!fr.isConnected)document.documentElement.appendChild(fr);applyK()},1500);applyK();
// ---- شروع: سینک خودکار
(async()=>{await sleep(1500);for(;;){if(!document.hidden)await sync();await sleep(($('#a').classList.contains('on')?20:90)*1000)}})();
})();
