// ==UserScript==
// @name         whalePick - ابزارها (غیرفعال‌سازی بارکد، ارسال گزارش، دانلود داده‌ها)
// @namespace    wh-portal
// @version      2.1
// @description  سه کار کمکی whalePick در یک اسکریپت: ثبت غیرفعال‌سازی بارکد، ارسال گزارش به Google Sheet، دانلود دسته‌بندی و عکس‌ها
// @match        https://whstore.alcore.ir/*
// @match        http://whstore.alcore.ir/*
// @match        https://script.google.com/macros/s/*
// @connect      172.17.1.101
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @connect      salesonlinewh-svg.github.io
// @connect      github.io
// @connect      githubusercontent.com
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @noframes
// @updateURL    https://salesonlinewh-svg.github.io/PICKERAPP/whalepick-tools.user.js
// @downloadURL  https://salesonlinewh-svg.github.io/PICKERAPP/whalepick-tools.user.js
// ==/UserScript==

/* ===== ۱) پل غیرفعال‌سازی بارکد ===== */
(function(){'use strict';
if(window.__jcb||location.hostname==='script.google.com')return;window.__jcb=1;
const BASE='http://172.17.1.101',PAGE=BASE+'/login';
const reply=(id,o)=>window.postMessage(Object.assign({jcb:2,id},o),location.origin);
const gm=o=>new Promise((res,rej)=>GM_xmlhttpRequest(Object.assign({timeout:15000,
 onload:res,onerror:()=>rej(new Error('اتصال به سایت '+BASE+' برقرار نشد')),ontimeout:()=>rej(new Error('زمان اتصال به سایت تمام شد'))},o)));
const clean=h=>h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
async function deact(bc){
 // ۱) خواندن فرم (برای توکن‌ها و آدرس ثبت)
 const r1=await gm({method:'GET',url:PAGE});
 const doc=new DOMParser().parseFromString(r1.responseText,'text/html'),inp=doc.querySelector('input[name=barcode]');
 if(!inp){
  if(doc.querySelector('input[name=password]'))throw new Error('در سایت غیرفعال‌سازی وارد نشده‌اید؛ یک بار در مرورگر وارد شوید');
  throw new Error('فرم بارکد در صفحه‌ی سایت پیدا نشد (HTTP '+r1.status+')');
 }
 const f=inp.closest('form');if(!f)throw new Error('فرم بارکد پیدا نشد');
 const url=new URL(f.getAttribute('action')||'',r1.finalUrl||PAGE);
 if(url.origin!==BASE)throw new Error('آدرس ثبت فرم نامعتبر است');
 // ۲) ساخت داده‌ی فرم: همه‌ی فیلدها (توکن‌ها) + بارکد + دکمه‌ی «غیرفعال»
 const p=new URLSearchParams();
 f.querySelectorAll('input,select,textarea').forEach(e=>{const n=e.getAttribute('name');if(!n)return;
  const t=(e.getAttribute('type')||'').toLowerCase();if(['submit','button','image','file','reset'].includes(t))return;
  if((t=='checkbox'||t=='radio')&&!e.hasAttribute('checked'))return;p.set(n,e.value==null?'':e.value)});
 p.set('barcode',bc);p.set('activate','0');
 const method=(f.getAttribute('method')||'post').toUpperCase();
 const opt={method,url:url.href,headers:{'Referer':PAGE}};
 if(method=='GET'){p.forEach((v,k)=>url.searchParams.set(k,v));opt.url=url.href}
 else{opt.data=p.toString();opt.headers['Content-Type']='application/x-www-form-urlencoded'}
 // ۳) ثبت
 const r2=await gm(opt);
 const d2=new DOMParser().parseFromString(r2.responseText||'','text/html'),al=d2.querySelector('[role=alert],.alert,.toast,.message,.error,.success');
 let msg=al?al.textContent.replace(/\s+/g,' ').trim():clean(r2.responseText||'').slice(0,90);
 msg='HTTP '+r2.status+(msg?' — '+msg:'');
 return{ok:r2.status>=200&&r2.status<400,msg};
}
addEventListener('message',async e=>{
 const d=e.data;if(e.origin!==location.origin||!d||d.jcb!==1)return;
 if(d.op=='ping'){reply(d.id,{ok:true,op:'ping'});return}
 if(d.op=='deact'){
  const bc=String(d.barcode||'').replace(/\D/g,'');
  if(!/^\d{6,20}$/.test(bc)){reply(d.id,{ok:false,msg:'بارکد نامعتبر'});return}
  try{reply(d.id,await deact(bc))}catch(x){reply(d.id,{ok:false,msg:x.message||String(x)})}
 }
});
})();

/* ===== ۲) ارسال گزارش ===== */
(function () {
  'use strict';
  if (window.__jcs) return; window.__jcs = 1;
  const K = { q: 'jcs_q', cfg: 'jcs_cfg', snap: 'jcs_snap', st: 'jcs_st' };
  const get = (k, d) => { try { const v = GM_getValue(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { GM_setValue(k, JSON.stringify(v)); } catch (e) {} };
  const sender = location.hostname === 'script.google.com';
  // آدرس و کد کاربر هم در حافظه‌ی Tampermonkey و هم در یک نسخه‌ی پشتیبان ذخیره می‌شود تا برای همیشه بماند
  const BAK = 'jcs_cfg_bak';
  const loadCfg = () => { const c = get(K.cfg, {}); try { const b = JSON.parse(localStorage.getItem(BAK) || '{}'); ['url', 'token', 'dev'].forEach(k => { if (!c[k] && b[k]) c[k] = b[k]; }); } catch (e) {} return c; };
  const saveCfg = c => { set(K.cfg, c); try { localStorage.setItem(BAK, JSON.stringify({ url: c.url, token: c.token, dev: c.dev })); } catch (e) {} };
  let cfg = loadCfg();
  if (!cfg.dev || !get(K.cfg, {}).dev) { cfg.dev = 'D' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); saveCfg(cfg); }
  let busy = false;

  const post = (url, body) => new Promise((res, rej) => GM_xmlhttpRequest({
    method: 'POST', url, data: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, timeout: 25000,
    onload: res, onerror: () => rej(new Error('اتصال به اینترنت برقرار نشد')), ontimeout: () => rej(new Error('زمان اتصال تمام شد'))
  }));

  async function flushOnce() {
    cfg = loadCfg();
    if (!cfg.url) return { ok: false, msg: 'آدرس گزارش تنظیم نشده (در whalePick ← تنظیمات)' };
    const q = get(K.q, []), snap = get(K.snap, null);
    if (!q.length && !snap) return { ok: true, msg: 'چیزی برای ارسال نیست', sent: 0, left: 0 };
    const batch = q.slice(0, 100);
    const r = await post(cfg.url, { token: cfg.token || '', device: cfg.dev, recs: batch, snap });
    let j; try { j = JSON.parse(r.responseText); } catch (e) { throw new Error('پاسخ نامعتبر از سرور (HTTP ' + r.status + ')'); }
    if (!j.ok) throw new Error(j.err || 'سرور رد کرد');
    const ids = new Set(batch.map(x => x.id));
    set(K.q, get(K.q, []).filter(x => !ids.has(x.id)));
    const cur = get(K.snap, null); if (snap && cur && cur.at === snap.at) set(K.snap, null);
    set(K.st, { at: Date.now(), sent: batch.length, user: j.user || '' });
    return { ok: true, msg: 'ارسال شد: ' + batch.length + ' رکورد', sent: batch.length, left: get(K.q, []).length };
  }
  async function flush() {
    if (busy) return { ok: false, msg: 'در حال ارسال' };
    busy = true; let total = 0;
    try {
      for (let i = 0; i < 30; i++) { const r = await flushOnce(); if (!r.ok) return r; total += r.sent || 0; if (!r.left) return { ok: true, msg: total ? 'ارسال شد: ' + total + ' رکورد ✓' : r.msg, sent: total }; }
      return { ok: true, msg: 'ارسال شد: ' + total + ' رکورد (ادامه در دفعه‌ی بعد)', sent: total };
    } catch (e) {
      set(K.st, Object.assign(get(K.st, {}), { err: e.message, errAt: Date.now() }));
      return { ok: false, msg: e.message };
    } finally { busy = false; }
  }

  const reply = (id, o) => window.postMessage(Object.assign({ jcb: 4, id }, o), location.origin);
  const status = () => { const st = get(K.st, {}), c = loadCfg(); return { q: get(K.q, []).length, snap: !!get(K.snap, null), last: st.at || 0, err: st.err || '', user: st.user || '', url: c.url || '', tokenSet: !!c.token, tokenHint: c.token ? String(c.token).slice(0, 3) + '…' : '' }; };

  if (!sender) {
    addEventListener('message', async e => {
      const d = e.data; if (e.origin !== location.origin || !d || d.jcb !== 3) return;
      if (d.op === 'rec' && d.rec && d.rec.id) {
        const q = get(K.q, []); if (!q.some(x => x.id === d.rec.id)) { q.push(d.rec); set(K.q, q.slice(-5000)); }
      } else if (d.op === 'snap' && d.snap) { set(K.snap, d.snap); }
      else if (d.op === 'cfg') { cfg = Object.assign(loadCfg(), { url: String(d.url || '').trim(), token: String(d.token || '').trim() }); saveCfg(cfg); reply(d.id, Object.assign({ op: 'status' }, status())); }
      else if (d.op === 'status') reply(d.id, Object.assign({ op: 'status' }, status()));
      else if (d.op === 'flush') { const r = await flush(); reply(d.id, { op: 'flush', ok: r.ok, msg: r.msg }); reply(d.id, Object.assign({ op: 'status' }, status())); }
    });
    // تلاش بی‌صدا روی خود پنل (اگر همان لحظه اینترنت هم دارد)
    setInterval(() => { if (get(K.q, []).length || get(K.snap, null)) flush(); }, 60000);
    addEventListener('online', () => flush());
  } else {
    // صفحه‌ی ارسال: آدرس را از همین صفحه یاد می‌گیرد و صف را می‌فرستد
    document.addEventListener('DOMContentLoaded', async () => {
      if (window.__jcsRan) return; window.__jcsRan = 1;
      const b = document.createElement('div');
      b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:16px;text-align:center;font:17px Tahoma,sans-serif;direction:rtl;color:#fff;background:#0f2a5c';
      b.textContent = 'whalePick: در حال ارسال گزارش…'; document.documentElement.appendChild(b);
      if (/\/exec$/.test(location.pathname)) { cfg = loadCfg(); if (cfg.url !== location.origin + location.pathname) { cfg.url = location.origin + location.pathname; saveCfg(cfg); } }
      cfg = loadCfg();
      const show = r => { b.style.background = r.ok ? '#16a34a' : '#dc2626'; b.textContent = (r.ok ? '✓ ' : '✗ ') + r.msg + ' — در صف: ' + get(K.q, []).length; };
      const RETRY = window.__jcsRetry || 10000, net = r => /اتصال|زمان/.test(r.msg || '');
      let r = await flush(); show(r);
      // اگر اینترنت هنوز وصل نشده بود (مثلاً چند ثانیه بعد از خاموش‌شدن وای‌فای)، تا ۳ دقیقه هر ۱۰ ثانیه دوباره تلاش می‌کند
      for (let i = 0; i < 18 && !r.ok && net(r); i++) {
        b.style.background = '#b45309'; b.textContent = 'در انتظار اینترنت… (تلاش ' + (i + 1) + ') — در صف: ' + get(K.q, []).length;
        await new Promise(x => setTimeout(x, RETRY)); r = await flush(); show(r);
      }
      addEventListener('online', async () => show(await flush()));
    });
  }
})();

/* ===== ۳) دانلود داده‌ها ===== */
(function () {
  'use strict';
  // دانلود داده‌ها (دسته‌بندی + بسته‌های عکس) از آدرس سایت نصب؛ whalePick درخواست می‌دهد و این اسکریپت می‌آورد
  if (window.__jcd || location.hostname === 'script.google.com') return; window.__jcd = 1;
  const BASE = 'https://salesonlinewh-svg.github.io/PICKERAPP/data/';
  const reply = (id, o) => window.postMessage(Object.assign({ jcb: 6, id }, o), location.origin);
  const gm = (url, type) => new Promise((res, rej) => GM_xmlhttpRequest({
    method: 'GET', url, responseType: type, timeout: 120000,
    onload: r => (r.status >= 200 && r.status < 300) ? res(r) : rej(new Error('سرور داده پاسخ نداد (HTTP ' + r.status + ')')),
    onerror: () => rej(new Error('اتصال به سرور داده برقرار نشد؛ دیتای موبایل روشن است؟')), ontimeout: () => rej(new Error('زمان دانلود تمام شد'))
  }));
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x2000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x2000)); return btoa(s); };
  addEventListener('message', async e => {
    const d = e.data; if (e.origin !== location.origin || !d || d.jcb !== 5) return;
    try {
      if (d.op === 'man') {
        const r = await gm(BASE + 'manifest.json?t=' + Date.now(), 'text');
        reply(d.id, { done: 1, man: JSON.parse(r.responseText) });
      } else if (d.op === 'get') {
        const name = String(d.name || ''); if (!/^[\w.\-]+$/.test(name)) throw new Error('نام فایل نامعتبر');
        const r = await gm(BASE + name, 'arraybuffer'), u8 = new Uint8Array(r.response), STEP = 3 * 512 * 1024, n = Math.ceil(u8.length / STEP);
        for (let i = 0; i < n; i++) { reply(d.id, { part: i, b64: b64(u8.subarray(i * STEP, (i + 1) * STEP)) }); if (i % 4 === 3) await new Promise(x => setTimeout(x, 0)); }
        reply(d.id, { done: 1 });
      }
    } catch (x) { reply(d.id, { err: x.message || String(x) }); }
  });
})();
