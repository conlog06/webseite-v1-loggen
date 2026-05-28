/* ═══════════════════════════════════════════════════════
   Dr. Loggen Praxis-System
═══════════════════════════════════════════════════════ */

/* ── CURSOR ── */
const cr=document.getElementById('cr'),crr=document.getElementById('crr');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cr.style.left=mx+'px';cr.style.top=my+'px';});
(function loop(){rx+=(mx-rx)*.15;ry+=(my-ry)*.15;crr.style.left=rx+'px';crr.style.top=ry+'px';requestAnimationFrame(loop);})();
document.addEventListener('mouseover',e=>{
  const isClickable=e.target.closest('a,button,.card,.gal,.slot.available,.treatment-item,.smtp-provider,.cal-day.open');
  cr.style.transform=isClickable?'translate(-50%,-50%) scale(2.2)':'translate(-50%,-50%) scale(1)';
  cr.style.opacity=isClickable?'.5':'1';
});

/* ── NAVBAR SCROLL ── */
window.addEventListener('scroll',()=>document.getElementById('navbar')?.classList.toggle('scrolled',scrollY>20),{passive:true});

/* ── HAMBURGER ── */
document.getElementById('ham')?.addEventListener('click',()=>document.getElementById('navlinks')?.classList.toggle('open'));

/* ════════════════════════════════════════
   COOKIE BANNER
════════════════════════════════════════ */
function initCookies(){
  const banner=document.getElementById('cookie-banner');
  if(!banner) return;
  const saved=safeLS('get','dl_cookies');
  if(saved){applyConsent(JSON.parse(saved));return;}
  requestAnimationFrame(()=>{ setTimeout(()=>banner.classList.add('show'),600); });
  document.getElementById('ck-accept')?.addEventListener('click',()=>saveConsent({necessary:true,analytics:true}));
  document.getElementById('ck-reject')?.addEventListener('click',()=>saveConsent({necessary:true,analytics:false}));
  document.getElementById('ck-settings')?.addEventListener('click',()=>{cookieSettingsModal();});
}
function saveConsent(c){
  safeLS('set','dl_cookies',JSON.stringify(c));
  applyConsent(c);
  const b=document.getElementById('cookie-banner');
  if(b){b.classList.remove('show');setTimeout(()=>{b.style.display='none';},500);}
}
function applyConsent(c){ /* analytics hooks go here */ }
function cookieSettingsModal(){
  const saved=safeLS('get','dl_cookies');
  const c=saved?JSON.parse(saved):{necessary:true,analytics:false};
  modal(`<h2 style="margin-bottom:1rem">Cookie-Einstellungen</h2>
    <div style="display:flex;flex-direction:column;gap:0">
      ${[['Notwendige Cookies','Session & Sicherheit — immer aktiv',true,true],
         ['Analyse-Cookies','Anonyme Statistiken zur Verbesserung der Website',false,c.analytics],
        ].map(([n,d,dis,chk])=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 0;border-bottom:1px solid var(--border)">
          <div><div style="font-weight:600;font-size:.92rem">${n}</div><div style="font-size:.8rem;color:var(--muted);margin-top:.2rem">${d}</div></div>
          <label class="toggle"><input type="checkbox" ${chk?'checked':''} ${dis?'disabled':''} data-cookie="${n}"/><span class="toggle-slider"></span></label>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:.8rem;margin-top:1.5rem">
      <button class="btn btn-prim" onclick="
        const a=document.querySelector('[data-cookie=\\'Analyse-Cookies\\']');
        saveConsent({necessary:true,analytics:a?a.checked:false});
        closeModal();
      ">Auswahl speichern</button>
      <button class="btn btn-ghost" onclick="closeModal()">Abbrechen</button>
    </div>`);
}
function safeLS(op,key,val){try{if(op==='get')return localStorage.getItem(key);if(op==='set')localStorage.setItem(key,val);}catch(e){}}

/* ════════════════════════════════════════
   RECAPTCHA
════════════════════════════════════════ */
let rcDone=false;
function renderRC(id){
  rcDone=false;
  const el=document.getElementById(id);
  if(!el) return;
  el.innerHTML=`<div class="recaptcha-wrap" id="rc-box">
    <div class="rc-checkbox" id="rc-cb"></div>
    <span class="rc-label">Ich bin kein Roboter</span>
    <div class="rc-logo"><div class="rc-logo-icon">🛡️</div><div class="rc-logo-text">reCAPTCHA<br>Datenschutz · AGB</div></div>
  </div>`;
  document.getElementById('rc-cb').addEventListener('click',()=>{
    if(rcDone) return;
    const cb=document.getElementById('rc-cb'),box=document.getElementById('rc-box');
    cb.innerHTML='<div style="width:14px;height:14px;border:2px solid rgba(46,125,138,.4);border-top-color:var(--ac);border-radius:50%;animation:rcSpin .6s linear infinite"></div>';
    setTimeout(()=>{
      cb.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="3.5"><path d="M20 6L9 17l-5-5"/></svg>';
      cb.style.cssText='background:var(--ac);border-color:var(--ac);box-shadow:0 2px 8px rgba(46,125,138,.35)';
      box.classList.add('verified');
      rcDone=true;
    },800+Math.random()*700);
  });
}
function checkRC(){
  if(rcDone) return true;
  const box=document.getElementById('rc-box');
  if(box){box.style.borderColor='var(--danger)';box.style.animation='shake .35s ease';setTimeout(()=>{box.style.animation='';box.style.borderColor='';},400);}
  return false;
}

/* ════════════════════════════════════════
   ROUTER
════════════════════════════════════════ */
const PAGES={home:'p-home',praxis:'p-praxis',vita:'p-vita',leistungen:'p-leistungen',
  kontakt:'p-kontakt',termin:'p-termin',impressum:'p-impressum',
  datenschutz:'p-datenschutz','admin-login':'p-admin-login',admin:'p-admin'};
let curPage='home';

function goTo(name){
  if(name==='admin'){checkAuth().then(ok=>_goTo(ok?'admin':'admin-login'));return;}
  _goTo(name);
}
function _goTo(name){
  if(!PAGES[name]) name='home';
  for(const id of Object.values(PAGES)){const el=document.getElementById(id);if(el){el.classList.remove('active');el.style.display='none';}}
  const t=document.getElementById(PAGES[name]);
  if(!t) return;
  t.style.display='block';
  requestAnimationFrame(()=>{ requestAnimationFrame(()=>t.classList.add('active')); });
  document.querySelectorAll('.nav-links a[data-page]').forEach(a=>a.classList.toggle('active',a.dataset.page===name));
  window.scrollTo({top:0,behavior:'smooth'});
  document.getElementById('navlinks')?.classList.remove('open');
  curPage=name;
  setTimeout(initReveal,80);
  if(name==='termin') renderBooking();
  if(name==='admin')  showAdmin('dashboard');
  if(name==='admin-login') initLogin();
}

/* Single click handler — clear precedence */
document.addEventListener('click',e=>{
  /* data-admin links (sidebar) — check FIRST and return early */
  const adLink=e.target.closest('[data-admin]');
  if(adLink){
    e.preventDefault();
    e.stopPropagation();
    showAdmin(adLink.dataset.admin);
    return;
  }
  /* data-page links */
  const pgLink=e.target.closest('[data-page]');
  if(pgLink){
    e.preventDefault();
    goTo(pgLink.dataset.page);
  }
});

/* ── REVEAL ── */
let ro;
function initReveal(){
  if(ro) ro.disconnect();
  ro=new IntersectionObserver(en=>en.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target);}}),{threshold:.08});
  document.querySelectorAll('.page.active .r:not(.in)').forEach(el=>ro.observe(el));
}

/* ── TOOTH ANIMATION ── */
function initTooth(){
  const box=document.getElementById('tooth-scroll');
  if(!box) return;
  let last=-1;
  function open(v){
    if(Math.abs(v-last)<.004) return; last=v;
    [['al-lip-top',-v*30],['al-lip-bot',v*30],['al-gum-top',-v*22],['al-gum-bot',v*22],
     ['al-teeth-top',-v*18],['al-teeth-bot',v*18]].forEach(([id,y])=>{
      const el=document.getElementById(id);if(el) el.setAttribute('transform',`translate(0,${y})`);
    });
    const mb=document.getElementById('al-mouth-bg');if(mb) mb.setAttribute('opacity',(v*.85).toFixed(3));
  }
  window.addEventListener('scroll',()=>{
    if(curPage!=='home') return;
    const r=box.getBoundingClientRect();
    const raw=Math.min(Math.max(1-(r.top+r.height*.3)/(innerHeight*.7),0),1);
    const eased=raw<.5?2*raw*raw:1-(-2*raw+2)**2/2;
    open(eased);
  },{passive:true});
  open(0);
}

/* ── INIT ── */
document.querySelectorAll('.page').forEach(p=>p.style.display='none');
document.getElementById('p-home').style.display='block';
setTimeout(()=>{initReveal();initTooth();initCookies();},120);
document.getElementById('admin-logout')?.addEventListener('click',e=>{e.preventDefault();apiFetch('/api/admin/logout',{method:'POST'}).then(()=>_goTo('home'));});

/* ════════════════════════════════════════
   BOOKING WIZARD
════════════════════════════════════════ */
let bk={step:1,date:null,time:null,tid:null,tname:'',calY:null,calM:null,cid:null};
async function renderBooking(){
  const root=document.getElementById('booking-root');if(!root) return;
  const now=new Date();
  if(!bk.calY) bk.calY=now.getFullYear();
  if(!bk.calM) bk.calM=now.getMonth()+1;
  const steps=[{n:1,l:'Behandlung'},{n:2,l:'Datum & Zeit'},{n:3,l:'Ihre Daten'},{n:4,l:'Bestätigung'}];
  root.innerHTML=`<div class="booking-wrap">
    <div class="booking-steps">
      ${steps.map((s,i)=>`<div class="step ${bk.step>s.n?'done':bk.step===s.n?'active':''}"><div class="step-num">${bk.step>s.n?'✓':s.n}</div><span class="step-label">${s.l}</span></div>${i<3?'<div class="step-line"></div>':''}`).join('')}
    </div><div id="bkc"></div></div>`;
  ({1:bkS1,2:bkS2,3:bkS3,4:bkS4}[bk.step])?.();
}
async function bkS1(){
  const tt=await apiFetch('/api/treatments');
  const c=document.getElementById('bkc');
  c.innerHTML=`<div class="booking-panel"><h2>Welche Behandlung benötigen Sie?</h2>
    <div class="treatment-grid">${tt.map(t=>`<div class="treatment-item${bk.tid===t.id?' selected':''}" data-tid="${t.id}" data-tn="${esc(t.name)}"><span class="t-dot" style="background:${t.color}"></span><div class="t-info"><strong>${esc(t.name)}</strong><span>${t.duration} Min.</span></div></div>`).join('')}</div>
  </div><div style="display:flex;justify-content:flex-end;padding:0 0 2rem"><button class="btn btn-prim" id="s1n" ${bk.tid?'':'disabled'}>Weiter →</button></div>`;
  c.querySelectorAll('.treatment-item').forEach(el=>el.addEventListener('click',()=>{bk.tid=+el.dataset.tid;bk.tname=el.dataset.tn;c.querySelectorAll('.treatment-item').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');document.getElementById('s1n').disabled=false;}));
  document.getElementById('s1n').addEventListener('click',()=>{bk.step=2;renderBooking();});
}
async function bkS2(){
  document.getElementById('bkc').innerHTML=`
    <div class="booking-panel"><h2>Datum wählen</h2><div id="calw"></div></div>
    <div class="booking-panel" id="slotsp" style="display:none"><h2>Uhrzeit wählen</h2><div id="slotsw"></div></div>
    <div style="display:flex;justify-content:space-between;padding:0 0 2rem">
      <button class="btn btn-ghost" id="s2b">← Zurück</button>
      <button class="btn btn-prim" id="s2n" disabled>Weiter →</button>
    </div>`;
  document.getElementById('s2b').addEventListener('click',()=>{bk.step=1;renderBooking();});
  document.getElementById('s2n').addEventListener('click',()=>{bk.step=3;renderBooking();});
  await renderCal();
}
async function renderCal(){
  const y=bk.calY,m=bk.calM;
  const av=await apiFetch(`/api/availability/${y}/${m}`);
  const nd=new Date(y,m,0).getDate(),off=(new Date(`${y}-${String(m).padStart(2,'0')}-01T12:00:00`).getDay()+6)%7,td=todayStr();
  const MN=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  let cells=Array(off).fill('<div class="cal-day empty"></div>').join('');
  for(let d=1;d<=nd;d++){
    const ds=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const st=av[ds]||'closed',past=ds<td;
    cells+=`<div class="cal-day ${past?'past':st}${ds===td?' today':''}${ds===bk.date?' selected':''}" data-date="${ds}">${d}</div>`;
  }
  const w=document.getElementById('calw');if(!w) return;
  w.innerHTML=`<div class="cal-header"><button class="cal-nav" id="cprev">←</button><span class="cal-title">${MN[m-1]} ${y}</span><button class="cal-nav" id="cnext">→</button></div>
    <div class="cal-grid">${['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}${cells}</div>`;
  document.getElementById('cprev').addEventListener('click',()=>{bk.calM--;if(bk.calM<1){bk.calM=12;bk.calY--;}renderCal();});
  document.getElementById('cnext').addEventListener('click',()=>{bk.calM++;if(bk.calM>12){bk.calM=1;bk.calY++;}renderCal();});
  w.querySelectorAll('.cal-day.open,.cal-day.special').forEach(el=>el.addEventListener('click',async()=>{
    bk.date=el.dataset.date;bk.time=null;
    w.querySelectorAll('.cal-day').forEach(d=>d.classList.remove('selected'));el.classList.add('selected');
    await renderSlots();
    const n=document.getElementById('s2n');if(n) n.disabled=!bk.time;
  }));
}
async function renderSlots(){
  const p=document.getElementById('slotsp'),w=document.getElementById('slotsw');if(!p||!w) return;
  p.style.display='block';w.innerHTML='<div style="padding:1rem;color:var(--muted)">Lade Zeiten…</div>';
  const {slots=[]}=await apiFetch(`/api/slots/${bk.date}`);
  const ds=new Date(bk.date+'T12:00:00').toLocaleDateString('de-DE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  if(!slots.length){w.innerHTML=`<p style="color:var(--muted)">Keine freien Termine an diesem Tag.</p>`;return;}
  w.innerHTML=`<p style="color:var(--sub);font-size:.9rem;margin-bottom:1rem">${ds}</p>
    <div class="slots-grid">${slots.map(s=>`<div class="slot ${s.available?'available':'full'}${bk.time===s.time?' selected':''}" data-time="${s.time}">${s.time}${!s.available?'<br><small style="opacity:.55">Belegt</small>':''}</div>`).join('')}</div>`;
  w.querySelectorAll('.slot.available').forEach(el=>el.addEventListener('click',()=>{
    bk.time=el.dataset.time;w.querySelectorAll('.slot').forEach(s=>s.classList.remove('selected'));el.classList.add('selected');
    const n=document.getElementById('s2n');if(n) n.disabled=false;
  }));
}
function bkS3(){
  const c=document.getElementById('bkc');
  const ds=new Date(bk.date+'T12:00:00').toLocaleDateString('de-DE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  c.innerHTML=`<div class="booking-panel">
    <div class="confirm-summary">
      <div class="confirm-row"><span class="c-key">Behandlung</span><span class="c-val">${esc(bk.tname)}</span></div>
      <div class="confirm-row"><span class="c-key">Datum</span><span class="c-val">${ds}</span></div>
      <div class="confirm-row"><span class="c-key">Uhrzeit</span><span class="c-val">${bk.time} Uhr</span></div>
    </div>
    <h2 style="margin-top:1.5rem">Ihre Kontaktdaten</h2>
    <div id="fal"></div>
    <div class="form-row">
      <div class="form-group"><label>Vorname <span class="req">*</span></label><input id="ffn" type="text" autocomplete="given-name"/></div>
      <div class="form-group"><label>Nachname <span class="req">*</span></label><input id="fln" type="text" autocomplete="family-name"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Telefon <span class="req">*</span></label><input id="fph" type="tel" autocomplete="tel"/></div>
      <div class="form-group"><label>E-Mail <span style="color:var(--muted);font-weight:400">(für Bestätigung)</span></label><input id="fem" type="email" autocomplete="email"/></div>
    </div>
    <div class="form-group"><label>Anmerkungen</label><textarea id="fno" placeholder="Besondere Wünsche…"></textarea></div>
    <div class="form-group" style="display:flex;align-items:center;gap:.7rem"><input type="checkbox" id="fnew" style="width:18px;height:18px;margin:0;flex-shrink:0;cursor:pointer"/><label for="fnew" style="margin:0;cursor:pointer">Ich bin Neupatient/in</label></div>
    <div id="rc-container"></div>
  </div>
  <div style="display:flex;justify-content:space-between;padding:0 0 2rem">
    <button class="btn btn-ghost" id="s3b">← Zurück</button>
    <button class="btn btn-prim" id="s3s">Termin verbindlich buchen</button>
  </div>`;
  renderRC('rc-container');
  document.getElementById('s3b').addEventListener('click',()=>{bk.step=2;renderBooking();});
  document.getElementById('s3s').addEventListener('click',submitBooking);
}
async function submitBooking(){
  if(!checkRC()){document.getElementById('fal').innerHTML=`<div class="alert alert-error">Bitte bestätigen Sie, dass Sie kein Roboter sind.</div>`;return;}
  const btn=document.getElementById('s3s');btn.disabled=true;btn.textContent='Wird gebucht…';
  const body={date:bk.date,time:bk.time,treatmentId:bk.tid,
    firstName:document.getElementById('ffn').value.trim(),lastName:document.getElementById('fln').value.trim(),
    phone:document.getElementById('fph').value.trim(),email:document.getElementById('fem').value.trim(),
    notes:document.getElementById('fno').value.trim(),isNewPatient:document.getElementById('fnew').checked};
  if(!body.firstName||!body.lastName||!body.phone){
    document.getElementById('fal').innerHTML=`<div class="alert alert-error">Bitte Vorname, Nachname und Telefon ausfüllen.</div>`;
    btn.disabled=false;btn.textContent='Termin verbindlich buchen';return;
  }
  const r=await apiFetch('/api/appointments',{method:'POST',body:JSON.stringify(body)});
  if(r.error){document.getElementById('fal').innerHTML=`<div class="alert alert-error">${esc(r.error)}</div>`;btn.disabled=false;btn.textContent='Termin verbindlich buchen';return;}
  bk.cid=r.id;bk.step=4;renderBooking();
}
function bkS4(){
  const ds=new Date(bk.date+'T12:00:00').toLocaleDateString('de-DE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('bkc').innerHTML=`<div class="booking-panel"><div class="success-box">
    <div class="success-icon">✅</div>
    <h2>Termin erfolgreich eingereicht!</h2>
    <p>Wir melden uns telefonisch zur Bestätigung.<br><span style="font-size:.85rem;color:var(--muted)">Falls Sie Ihre E-Mail angegeben haben, erhalten Sie eine Eingangsbestätigung.</span></p>
    <div class="confirm-summary" style="text-align:left;max-width:360px;margin:0 auto 2rem">
      <div class="confirm-row"><span class="c-key">Behandlung</span><span class="c-val">${esc(bk.tname)}</span></div>
      <div class="confirm-row"><span class="c-key">Datum</span><span class="c-val">${ds}</span></div>
      <div class="confirm-row"><span class="c-key">Uhrzeit</span><span class="c-val">${bk.time} Uhr</span></div>
      <div class="confirm-row"><span class="c-key">Buchungs-Nr.</span><span class="c-val highlight">#${bk.cid||'–'}</span></div>
    </div>
    <div style="display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap">
      <button class="btn btn-prim" onclick="bk={step:1,date:null,time:null,tid:null,tname:'',calY:null,calM:null,cid:null};renderBooking()">Weiteren Termin buchen</button>
      <button class="btn btn-ghost" onclick="goTo('home')">Zur Startseite</button>
    </div>
  </div></div>`;
}

/* ════════════════════════════════════════
   ADMIN
════════════════════════════════════════ */
async function checkAuth(){try{const r=await apiFetch('/api/admin/me');return r&&r.admin===true;}catch(e){return false;}}

function initLogin(){
  const doLogin=async()=>{
    const u=document.getElementById('login-user')?.value.trim(),p=document.getElementById('login-pass')?.value;
    const al=document.getElementById('login-alert');
    if(!u||!p){al.innerHTML=`<div class="alert alert-error">Benutzername und Passwort eingeben.</div>`;return;}
    const btn=document.getElementById('login-btn');btn.disabled=true;btn.textContent='Anmelden…';
    const r=await apiFetch('/api/admin/login',{method:'POST',body:JSON.stringify({username:u,password:p})});
    if(r.error){al.innerHTML=`<div class="alert alert-error">${esc(r.error)}</div>`;btn.disabled=false;btn.textContent='Anmelden';}
    else _goTo('admin');
  };
  document.getElementById('login-btn').onclick=doLogin;
  document.getElementById('login-pass').onkeydown=e=>{if(e.key==='Enter')doLogin();};
}

function setActiveNav(view){
  document.querySelectorAll('.sidebar-nav a[data-admin]').forEach(a=>a.classList.toggle('active',a.dataset.admin===view));
}

async function showAdmin(view){
  const ok=await checkAuth();
  if(!ok){_goTo('admin-login');return;}
  const main=document.getElementById('admin-content');
  if(!main) return;
  setActiveNav(view);
  const V={
    dashboard: adminDashboard,
    termine:   adminTermine,
    kalender:  adminKalender,
    settings:  adminSettings,
    zeiten:    adminZeiten,
    sondertage:adminSondertage,
    behandlungen:adminBehandlungen,
    email:     adminEmail
  };
  if(V[view]){
    main.innerHTML='<div style="padding:3rem;text-align:center;color:var(--muted)">⏳ Laden…</div>';
    try{ await V[view](main); }
    catch(err){ main.innerHTML=`<div class="alert alert-error" style="margin:2rem">Fehler: ${esc(err.message)}</div>`; }
  }
}

/* DASHBOARD */
async function adminDashboard(main){
  const td=todayStr(),all=await apiFetch('/api/admin/appointments');
  const tA=all.filter(a=>a.date===td),pend=all.filter(a=>a.status==='pending'),conf=all.filter(a=>a.status==='confirmed'),week=all.filter(a=>a.date>=td&&a.date<=addDays(td,7));
  main.innerHTML=`<div class="admin-header"><h1>Dashboard</h1><span style="color:var(--muted);font-size:.9rem">${new Date().toLocaleDateString('de-DE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span></div>
    <div class="admin-stats">
      <div class="stat-card"><span class="s-num">${tA.length}</span><div class="s-lbl">Heute</div></div>
      <div class="stat-card"><span class="s-num" style="color:var(--warning)">${pend.length}</span><div class="s-lbl">Ausstehend</div></div>
      <div class="stat-card"><span class="s-num" style="color:var(--success)">${conf.length}</span><div class="s-lbl">Bestätigt</div></div>
      <div class="stat-card"><span class="s-num">${week.length}</span><div class="s-lbl">Diese Woche</div></div>
    </div>
    <div class="admin-table-wrap">
      <div class="admin-table-header"><h2>${tA.length?'Heutige Termine':'Letzte Termine'}</h2><button class="btn btn-sm btn-prim" data-admin="termine">Alle →</button></div>
      ${buildTable(tA.length?tA:all.slice(-8).reverse())}
    </div>`;
  bindTable(main);
}

/* TERMINE */
async function adminTermine(main){
  const all=await apiFetch('/api/admin/appointments');
  main.innerHTML=`<div class="admin-header"><h1>Termine</h1>
    <div style="display:flex;gap:.8rem;flex-wrap:wrap">
      <select id="fst" style="padding:.45rem .8rem;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:inherit;font-size:.88rem;background:#fff">
        <option value="">Alle Status</option><option value="pending">⏳ Ausstehend</option><option value="confirmed">✅ Bestätigt</option><option value="cancelled">❌ Abgesagt</option>
      </select>
      <input type="date" id="fdt" value="${todayStr()}" style="padding:.45rem .8rem;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:inherit;font-size:.88rem"/>
      <button class="btn btn-sm btn-ghost" id="fcl">Alle anzeigen</button>
    </div></div>
  <div class="admin-table-wrap" id="ttbl">${buildTable(all.filter(a=>a.date===todayStr()))}</div>`;
  const rf=()=>{const st=document.getElementById('fst')?.value,dt=document.getElementById('fdt')?.value;let r=all;if(st)r=r.filter(a=>a.status===st);if(dt)r=r.filter(a=>a.date===dt);document.getElementById('ttbl').innerHTML=buildTable(r);bindTable(main);};
  document.getElementById('fst').addEventListener('change',rf);
  document.getElementById('fdt').addEventListener('change',rf);
  document.getElementById('fcl').addEventListener('click',()=>{document.getElementById('fst').value='';document.getElementById('fdt').value='';document.getElementById('ttbl').innerHTML=buildTable(all);bindTable(main);});
  bindTable(main);
}

function buildTable(list){
  if(!list.length) return`<div style="padding:3rem;text-align:center;color:var(--muted)">Keine Termine gefunden.</div>`;
  return`<table><thead><tr><th>Datum</th><th>Zeit</th><th>Patient</th><th>Behandlung</th><th>Tel.</th><th>Status</th><th></th></tr></thead><tbody>
  ${list.map(a=>{
    const d=new Date(a.date+'T12:00:00').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
    const bCls={confirmed:'badge-green',cancelled:'badge-red',pending:'badge-yellow'}[a.status]||'badge-gray';
    const bLbl={confirmed:'Bestätigt',cancelled:'Abgesagt',pending:'Ausstehend'}[a.status]||a.status;
    return`<tr><td>${d}</td><td style="white-space:nowrap">${a.time} Uhr</td>
      <td><strong>${esc(a.firstName)} ${esc(a.lastName)}</strong>${a.isNewPatient?' <span class="badge badge-blue" style="font-size:.7rem">Neu</span>':''}</td>
      <td style="font-size:.86rem">${esc(a.treatmentName)}</td><td style="font-size:.86rem">${esc(a.phone)}</td>
      <td><span class="badge ${bCls}">${bLbl}</span></td>
      <td><div class="table-actions">
        ${a.status!=='confirmed'?`<button class="btn btn-sm" style="background:#e8f8ef;color:#1a6a3a;border:1px solid #a0d8b0" data-act="confirm" data-id="${a.id}">✓</button>`:''}
        ${a.status!=='cancelled'?`<button class="btn btn-sm" style="background:#fdecea;color:#8a1a1a;border:1px solid #f0a0a0" data-act="cancel" data-id="${a.id}">✗</button>`:''}
        <button class="btn btn-sm btn-ghost" data-act="view" data-appt='${JSON.stringify(a)}'>Detail</button>
      </div></td></tr>`;
  }).join('')}</tbody></table>`;
}

function bindTable(ctx){
  ctx.querySelectorAll('[data-act]').forEach(btn=>{
    btn.addEventListener('click',async e=>{
      e.stopPropagation();
      const id=parseInt(btn.dataset.id),act=btn.dataset.act;
      const cur=document.querySelector('.sidebar-nav a.active')?.dataset?.admin||'termine';
      if(act==='confirm'){await apiFetch(`/api/admin/appointments/${id}`,{method:'PATCH',body:JSON.stringify({status:'confirmed'})});showAdmin(cur);}
      else if(act==='cancel'){if(!confirm('Termin wirklich absagen?')) return;await apiFetch(`/api/admin/appointments/${id}`,{method:'PATCH',body:JSON.stringify({status:'cancelled'})});showAdmin(cur);}
      else if(act==='view') apptDetail(JSON.parse(btn.dataset.appt));
    });
  });
}

function apptDetail(a){
  const d=new Date(a.date+'T12:00:00').toLocaleDateString('de-DE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const bCls={confirmed:'badge-green',cancelled:'badge-red',pending:'badge-yellow'}[a.status]||'badge-gray';
  const bLbl={confirmed:'Bestätigt',cancelled:'Abgesagt',pending:'Ausstehend'}[a.status]||a.status;
  modal(`<h2>Termin #${a.id}</h2>
    <div class="confirm-summary">
      <div class="confirm-row"><span class="c-key">Patient</span><span class="c-val">${esc(a.firstName)} ${esc(a.lastName)}${a.isNewPatient?' (Neu)':''}</span></div>
      <div class="confirm-row"><span class="c-key">Datum & Zeit</span><span class="c-val">${d}, ${a.time} Uhr</span></div>
      <div class="confirm-row"><span class="c-key">Behandlung</span><span class="c-val">${esc(a.treatmentName)}</span></div>
      <div class="confirm-row"><span class="c-key">Telefon</span><span class="c-val"><a href="tel:${esc(a.phone)}">${esc(a.phone)}</a></span></div>
      ${a.email?`<div class="confirm-row"><span class="c-key">E-Mail</span><span class="c-val"><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></span></div>`:''}
      ${a.notes?`<div class="confirm-row"><span class="c-key">Notizen</span><span class="c-val">${esc(a.notes)}</span></div>`:''}
      <div class="confirm-row"><span class="c-key">Status</span><span class="c-val"><span class="badge ${bCls}">${bLbl}</span></span></div>
    </div>
    <div style="display:flex;gap:.8rem;flex-wrap:wrap;margin-top:.5rem">
      ${a.status!=='confirmed'?`<button class="btn btn-prim" onclick="apiFetch('/api/admin/appointments/${a.id}',{method:'PATCH',body:JSON.stringify({status:'confirmed'})}).then(()=>{closeModal();showAdmin('termine')})">✓ Bestätigen</button>`:''}
      ${a.status!=='cancelled'?`<button class="btn btn-danger" onclick="if(confirm('Absagen?'))apiFetch('/api/admin/appointments/${a.id}',{method:'PATCH',body:JSON.stringify({status:'cancelled'})}).then(()=>{closeModal();showAdmin('termine')})">✗ Absagen</button>`:''}
      <button class="btn btn-ghost" onclick="closeModal()">Schließen</button>
    </div>`);
}

/* KALENDER */
async function adminKalender(main){
  const all=await apiFetch('/api/admin/appointments');
  const s=await apiFetch('/api/admin/settings');
  let vd=todayStr();
  const DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const render=()=>{
    const apts=all.filter(a=>a.date===vd),dn=DAYS[new Date(vd+'T12:00:00').getDay()];
    const hours=(s.specialDays&&s.specialDays[vd])||s.schedule[dn];
    const dl=new Date(vd+'T12:00:00').toLocaleDateString('de-DE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    let tl=!hours?`<div style="padding:2rem;text-align:center;color:var(--muted)">🔒 Praxis geschlossen</div>`:
      (()=>{let h='';const[sh,sm]=hours[0].split(':').map(Number),[eh,em]=hours[1].split(':').map(Number);
        for(let m=sh*60+sm;m<=eh*60+em-30;m+=30){
          const hh=String(Math.floor(m/60)).padStart(2,'0'),mm=String(m%60).padStart(2,'0'),t=`${hh}:${mm}`;
          const sl=apts.filter(a=>a.time===t);
          const chips=sl.map(a=>`<div class="appt-chip ${a.status}" data-act="view" data-appt='${JSON.stringify(a)}'><strong>${esc(a.firstName)} ${esc(a.lastName)}</strong> · ${esc(a.treatmentName)}</div>`).join('')||`<span style="font-size:.78rem;color:var(--border2)">frei</span>`;
          h+=`<div class="time-block"><div class="time-label">${t}</div><div class="appt-chips">${chips}</div></div>`;
        }return h;})();
    main.innerHTML=`<div class="admin-header"><h1>Kalender</h1><div style="display:flex;align-items:center;gap:.8rem">
        <button class="cal-nav" id="klp">←</button>
        <input type="date" id="kld" value="${vd}" style="padding:.45rem .8rem;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:inherit;font-size:.9rem"/>
        <button class="cal-nav" id="kln">→</button></div></div>
      <div class="day-view"><div class="day-view-header"><strong>${dl}</strong><span style="color:var(--muted);font-size:.88rem">${apts.length} Termin${apts.length!==1?'e':''}</span></div>
      <div class="day-timeline">${tl}</div></div>`;
    const inp=document.getElementById('kld');
    inp.addEventListener('change',()=>{vd=inp.value;render();});
    document.getElementById('klp').addEventListener('click',()=>{const d=new Date(vd+'T12:00:00');d.setDate(d.getDate()-1);vd=d.toISOString().split('T')[0];inp.value=vd;render();});
    document.getElementById('kln').addEventListener('click',()=>{const d=new Date(vd+'T12:00:00');d.setDate(d.getDate()+1);vd=d.toISOString().split('T')[0];inp.value=vd;render();});
    bindTable(main);
  };
  render();
}

/* SETTINGS */
async function adminSettings(main){
  const s=await apiFetch('/api/admin/settings');
  main.innerHTML=`<div class="admin-header"><h1>Einstellungen</h1></div>
    <div class="settings-section"><h3>Praxis-Informationen</h3><div id="sal"></div>
      <div class="form-row"><div class="form-group"><label>Praxisname</label><input id="sn" value="${esc(s.praxisName)}"/></div><div class="form-group"><label>Telefon</label><input id="sp" value="${esc(s.phone)}"/></div></div>
      <div class="form-group"><label>Adresse</label><input id="sa" value="${esc(s.address)}"/></div>
      <div class="form-group"><label>E-Mail</label><input id="se" type="email" value="${esc(s.email)}"/></div>
      <div class="form-row"><div class="form-group"><label>Terminlänge (Min.)</label><input id="sd" type="number" value="${s.slotDuration}" min="15" max="120" step="15"/></div><div class="form-group"><label>Max. Buchungen/Slot</label><input id="sm" type="number" value="${s.maxSlots}" min="1" max="20"/></div></div>
      <button class="btn btn-prim" id="ssv">Speichern</button></div>`;
  document.getElementById('ssv').addEventListener('click',async()=>{
    await apiFetch('/api/admin/settings',{method:'PUT',body:JSON.stringify({praxisName:document.getElementById('sn').value,phone:document.getElementById('sp').value,address:document.getElementById('sa').value,email:document.getElementById('se').value,slotDuration:+document.getElementById('sd').value||30,maxSlots:+document.getElementById('sm').value||4})});
    document.getElementById('sal').innerHTML=`<div class="alert alert-success">✓ Gespeichert!</div>`;setTimeout(()=>document.getElementById('sal').innerHTML='',3000);
  });
}

/* ÖFFNUNGSZEITEN */
async function adminZeiten(main){
  const s=await apiFetch('/api/admin/settings');
  const DAYS=[{k:'monday',l:'Montag'},{k:'tuesday',l:'Dienstag'},{k:'wednesday',l:'Mittwoch'},{k:'thursday',l:'Donnerstag'},{k:'friday',l:'Freitag'},{k:'saturday',l:'Samstag'},{k:'sunday',l:'Sonntag'}];
  main.innerHTML=`<div class="admin-header"><h1>Öffnungszeiten</h1></div>
    <div class="settings-section"><h3>Wöchentliche Sprechzeiten</h3><div id="zal"></div>
      <div class="schedule-grid">${DAYS.map(d=>{const v=s.schedule[d.k],o=!!v,fr=o?v[0]:'08:00',to=o?v[1]:'17:00';
        return`<div class="schedule-row" data-day="${d.k}"><span class="day-name">${d.l}</span>
          <label class="toggle"><input type="checkbox" class="dcb" ${o?'checked':''}/><span class="toggle-slider"></span></label>
          <input type="time" class="dfr" value="${fr}" ${!o?'disabled':''} style="padding:.4rem .6rem;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:inherit"/>
          <input type="time" class="dto" value="${to}" ${!o?'disabled':''} style="padding:.4rem .6rem;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:inherit"/></div>`;
      }).join('')}</div>
      <div style="margin-top:1.5rem"><button class="btn btn-prim" id="zsv">Speichern</button></div></div>`;
  main.querySelectorAll('.dcb').forEach(cb=>cb.addEventListener('change',()=>{const r=cb.closest('.schedule-row');r.querySelector('.dfr').disabled=!cb.checked;r.querySelector('.dto').disabled=!cb.checked;}));
  document.getElementById('zsv').addEventListener('click',async()=>{
    const sc={};main.querySelectorAll('.schedule-row').forEach(r=>{sc[r.dataset.day]=r.querySelector('.dcb').checked?[r.querySelector('.dfr').value,r.querySelector('.dto').value]:false;});
    await apiFetch('/api/admin/settings',{method:'PUT',body:JSON.stringify({schedule:sc})});
    document.getElementById('zal').innerHTML=`<div class="alert alert-success">✓ Gespeichert!</div>`;setTimeout(()=>document.getElementById('zal').innerHTML='',3000);
  });
}

/* SONDERTAGE */
async function adminSondertage(main){
  const s=await apiFetch('/api/admin/settings');
  const entries=Object.entries(s.specialDays).sort((a,b)=>a[0].localeCompare(b[0]));
  main.innerHTML=`<div class="admin-header"><h1>Sondertage & Feiertage</h1></div>
    <div class="settings-section"><h3>Neuen Sondertag eintragen</h3><div id="sdal"></div>
      <div style="display:grid;grid-template-columns:160px 160px auto;gap:.8rem;align-items:end">
        <div class="form-group" style="margin:0"><label>Datum</label><input type="date" id="sddt" min="${todayStr()}"/></div>
        <div class="form-group" style="margin:0"><label>Art</label>
          <select id="sdty" style="padding:.6rem .8rem;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:inherit;font-size:.9rem;background:#fff;width:100%">
            <option value="closed">🔒 Geschlossen</option><option value="special">🕐 Sonderzeiten</option>
          </select></div>
        <button class="btn btn-prim" id="sdad" style="align-self:end">+ Hinzufügen</button>
      </div>
      <div id="sdtimes" style="display:none;gap:.5rem;margin-top:.8rem">
        <div class="form-group" style="margin:0"><label>Von</label><input type="time" id="sdfr" value="08:00" style="padding:.6rem .7rem;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:inherit"/></div>
        <div class="form-group" style="margin:0"><label>Bis</label><input type="time" id="sdto" value="12:00" style="padding:.6rem .7rem;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:inherit"/></div>
      </div></div>
    <div class="settings-section"><h3>Eingetragene Sondertage (${entries.length})</h3>
      <div class="special-day-list">
        ${entries.length?entries.map(([dt,val])=>{
          const d=new Date(dt+'T12:00:00').toLocaleDateString('de-DE',{weekday:'short',year:'numeric',month:'short',day:'numeric'});
          const info=val===false?'<span style="color:var(--danger);font-weight:500">🔒 Geschlossen</span>':`<span style="color:var(--warning);font-weight:500">🕐 ${val[0]} – ${val[1]} Uhr</span>`;
          return`<div class="sd-item"><span style="font-weight:500">${d}</span>${info}<button class="btn btn-sm" style="background:var(--off);border:1px solid var(--border);color:var(--muted)" data-sddel="${dt}">🗑</button></div>`;
        }).join(''):'<div style="color:var(--muted);padding:.5rem 0">Keine Sondertage eingetragen.</div>'}
      </div></div>`;
  document.getElementById('sdty').addEventListener('change',e=>{document.getElementById('sdtimes').style.display=e.target.value==='special'?'flex':'none';});
  document.getElementById('sdad').addEventListener('click',async()=>{
    const date=document.getElementById('sddt').value;
    if(!date){document.getElementById('sdal').innerHTML=`<div class="alert alert-error">Bitte Datum wählen.</div>`;return;}
    const type=document.getElementById('sdty').value;
    const status=type==='closed'?false:[document.getElementById('sdfr').value,document.getElementById('sdto').value];
    await apiFetch('/api/admin/settings/special-day',{method:'PUT',body:JSON.stringify({date,status})});
    adminSondertage(main);
  });
  main.querySelectorAll('[data-sddel]').forEach(btn=>btn.addEventListener('click',async()=>{
    if(!confirm(`${btn.dataset.sddel} entfernen?`)) return;
    await apiFetch(`/api/admin/settings/special-day/${btn.dataset.sddel}`,{method:'DELETE'});
    adminSondertage(main);
  }));
}

/* BEHANDLUNGEN */
async function adminBehandlungen(main){
  const s=await apiFetch('/api/admin/settings');
  main.innerHTML=`<div class="admin-header"><h1>Behandlungsarten</h1></div>
    <div class="settings-section"><h3>Neue Behandlungsart hinzufügen</h3><div id="tral"></div>
      <div style="display:grid;grid-template-columns:1fr 120px 60px 100px auto;gap:.8rem;align-items:end">
        <div class="form-group" style="margin:0"><label>Bezeichnung</label><input id="trnm" placeholder="z.B. Röntgen"/></div>
        <div class="form-group" style="margin:0"><label>Dauer (Min.)</label><input id="trdu" type="number" value="30" min="15" max="240" step="15"/></div>
        <div class="form-group" style="margin:0"><label>Farbe</label><input type="color" id="trcl" value="#2e7d8a" style="width:100%;height:40px;padding:.2rem;border:1.5px solid var(--border);border-radius:var(--r-sm)"/></div>
        <div class="form-group" style="margin:0"><span style="font-size:.78rem;color:var(--muted);display:block;margin-bottom:.3rem">Vorschau</span><div id="trpv" style="padding:.4rem .9rem;border-radius:50px;display:inline-block;font-size:.82rem;font-weight:500;background:#e8f4f6;color:#1d5c66">Behandlung</div></div>
        <button class="btn btn-prim" id="trad" style="align-self:end">+ Hinzufügen</button>
      </div></div>
    <div class="settings-section"><h3>Aktuelle Behandlungsarten (${s.treatmentTypes.length})</h3>
      <div class="treatment-list">${s.treatmentTypes.map(t=>`<div class="tr-item"><span class="tr-dot" style="background:${t.color}"></span><span class="tr-name">${esc(t.name)}</span><span class="tr-dur" style="background:var(--off);padding:.2rem .6rem;border-radius:50px;font-size:.78rem">${t.duration} Min.</span></div>`).join('')}</div>
    </div>`;
  const upPrev=()=>{const cl=document.getElementById('trcl').value,nm=document.getElementById('trnm').value||'Behandlung',h=cl.replace('#',''),r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16),p=document.getElementById('trpv');p.style.background=`rgba(${r},${g},${b},.12)`;p.style.color=cl;p.textContent=nm;};
  document.getElementById('trnm').addEventListener('input',upPrev);document.getElementById('trcl').addEventListener('input',upPrev);
  document.getElementById('trad').addEventListener('click',async()=>{
    const name=document.getElementById('trnm').value.trim(),dur=+document.getElementById('trdu').value||30,color=document.getElementById('trcl').value;
    if(!name){document.getElementById('tral').innerHTML=`<div class="alert alert-error">Bitte Bezeichnung eingeben.</div>`;return;}
    await apiFetch('/api/admin/settings/treatment',{method:'PUT',body:JSON.stringify({id:-1,name,duration:dur,color})});
    document.getElementById('tral').innerHTML=`<div class="alert alert-success">✓ "${esc(name)}" hinzugefügt!</div>`;
    setTimeout(()=>adminBehandlungen(main),1200);
  });
}

/* ════════════════════════════════════════
   E-MAIL EINSTELLUNGEN
════════════════════════════════════════ */
async function adminEmail(main){
  const cfg=await apiFetch('/api/admin/email-config');
  if(cfg.error){main.innerHTML=`<div class="admin-header"><h1>E-Mail Einstellungen</h1></div><div class="alert alert-error" style="margin:2rem">❌ ${esc(cfg.error)}</div>`;return;}

  const PROV=[
    {id:'gmail',   n:'Gmail',    ic:'✉',  h:'smtp.gmail.com',     p:587,s:false},
    {id:'outlook', n:'Outlook',  ic:'📧', h:'smtp.office365.com', p:587,s:false},
    {id:'ionos',   n:'IONOS',    ic:'🌐', h:'smtp.ionos.de',      p:587,s:false},
    {id:'strato',  n:'Strato',   ic:'☁️', h:'smtp.strato.de',     p:465,s:true },
    {id:'gmx',     n:'GMX',      ic:'📮', h:'smtp.gmx.net',       p:587,s:false},
    {id:'webde',   n:'Web.de',   ic:'📬', h:'smtp.web.de',        p:587,s:false},
    {id:'custom',  n:'Eigener…', ic:'⚙️', h:'',                   p:587,s:false},
  ];
  const HINTS={
    gmail:'<strong>Gmail:</strong> Normales Passwort funktioniert nicht. Bitte ein <a href="https://myaccount.google.com/apppasswords" target="_blank" style="color:var(--ac2);font-weight:600">App-Passwort erstellen →</a> (Google-Konto → Sicherheit → 2-Faktor → App-Passwörter)',
    outlook:'<strong>Outlook / Office 365:</strong> Ihr Microsoft-Passwort oder App-Passwort verwenden.',
    ionos:'<strong>IONOS:</strong> E-Mail-Passwort aus dem IONOS-Kundenkonto (nicht Login-Passwort).',
    strato:'<strong>Strato:</strong> Port 465 mit SSL/TLS. Ihr Strato E-Mail-Passwort.',
    gmx:'<strong>GMX:</strong> GMX-Passwort. SMTP muss unter gmx.net → Einstellungen aktiviert sein.',
    webde:'<strong>Web.de:</strong> Web.de Passwort. SMTP-Zugang in Web.de-Einstellungen aktivieren.',
    custom:'Host, Port und Zugangsdaten Ihres eigenen SMTP-Servers eintragen.'
  };

  const detProv=h=>PROV.find(p=>p.h===h)?.id||'custom';
  let selProv=detProv(cfg.host);
  let selHost=cfg.host, selPort=cfg.port;

  main.innerHTML=`
    <div class="admin-header"><h1>E-Mail Einstellungen</h1></div>

    <div class="settings-section">
      <h3>Status</h3>
      <div id="estat" style="display:flex;align-items:center;gap:.9rem;padding:1rem 1.2rem;border-radius:var(--r-sm);border:1.5px solid ${cfg.enabled?'#a0d8b0':'var(--border)'};background:${cfg.enabled?'#e8f8ef':'var(--off)'}">
        <label class="toggle" style="flex-shrink:0"><input type="checkbox" id="eon" ${cfg.enabled?'checked':''}/><span class="toggle-slider"></span></label>
        <div id="estaxt"><div style="font-weight:600;font-size:.92rem">${cfg.enabled?'✅ Aktiv':'⬜ Deaktiviert'}</div><div style="font-size:.8rem;color:var(--muted)">${cfg.enabled?'E-Mails werden automatisch versendet':'Kein E-Mail-Versand'}</div></div>
      </div>
      <div id="eal" style="margin-top:1rem"></div>
    </div>

    <div class="settings-section">
      <h3>1 · Anbieter wählen</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:.6rem;margin-bottom:1rem" id="provgrid">
        ${PROV.map(p=>`<div class="smtp-provider${selProv===p.id?' selected':''}" data-pid="${p.id}"><span style="font-size:1.1rem">${p.ic}</span>${p.n}</div>`).join('')}
      </div>
      <div class="alert alert-info" style="font-size:.83rem" id="ehint">${HINTS[selProv]||''}</div>
    </div>

    <div class="settings-section">
      <h3>2 · Zugangsdaten</h3>
      <div id="customfields" style="display:${selProv==='custom'?'grid':'none'};grid-template-columns:1fr 100px;gap:.8rem;margin-bottom:1rem">
        <div class="form-group" style="margin:0"><label>SMTP Host</label><input id="ehost" value="${esc(cfg.host)}" placeholder="mail.ihredomain.de"/></div>
        <div class="form-group" style="margin:0"><label>Port</label><input id="eport" type="number" value="${cfg.port}" placeholder="587"/></div>
      </div>
      <div id="presetinfo" style="display:${selProv!=='custom'?'flex':'none'};align-items:center;gap:1rem;padding:.7rem 1rem;background:var(--off);border-radius:var(--r-sm);margin-bottom:1rem;font-size:.88rem">
        <span style="color:var(--muted)">Server:</span><strong id="hostdisp">${cfg.host}:${cfg.port}</strong><span style="color:var(--muted);font-size:.78rem">(automatisch)</span>
      </div>
      <div class="form-row">
        <div class="form-group"><label>E-Mail-Adresse</label><input id="euser" type="email" value="${esc(cfg.user)}" placeholder="praxis@gmail.com" autocomplete="off"/></div>
        <div class="form-group"><label>Passwort / App-Passwort</label><input id="epass" type="password" value="${cfg.pass}" placeholder="••••••••" autocomplete="new-password"/></div>
      </div>
    </div>

    <div class="settings-section">
      <h3>3 · Absender & Empfänger</h3>
      <div class="form-row">
        <div class="form-group"><label>Absendername</label><input id="efn" value="${esc(cfg.fromName)}" placeholder="Zahnarztpraxis Dr. Loggen"/></div>
        <div class="form-group"><label>Absender-E-Mail</label><input id="efe" type="email" value="${esc(cfg.fromEmail)}" placeholder="info@dr-loggen.de"/></div>
      </div>
      <div class="form-group"><label>Praxis-E-Mail <span style="color:var(--muted);font-weight:400">(empfängt neue Buchungen)</span></label>
        <input id="eae" type="email" value="${esc(cfg.adminEmail)}" placeholder="info@dr-loggen.de"/></div>
    </div>

    <div style="display:flex;gap:.8rem;flex-wrap:wrap;margin-bottom:2.5rem">
      <button class="btn btn-prim" id="esv">💾 Einstellungen speichern</button>
      <button class="btn btn-ghost" id="ets">🔌 Verbindung testen</button>
    </div>`;

  /* Provider grid click */
  main.querySelectorAll('.smtp-provider').forEach(el=>{
    el.addEventListener('click',()=>{
      main.querySelectorAll('.smtp-provider').forEach(p=>p.classList.remove('selected'));
      el.classList.add('selected');
      selProv=el.dataset.pid;
      const pv=PROV.find(p=>p.id===selProv);
      if(pv&&selProv!=='custom'){selHost=pv.h;selPort=pv.p;}
      const cf=main.querySelector('#customfields'),pi=main.querySelector('#presetinfo'),hd=main.querySelector('#hostdisp');
      if(selProv==='custom'){cf.style.display='grid';pi.style.display='none';}
      else{cf.style.display='none';pi.style.display='flex';if(hd) hd.textContent=`${selHost}:${selPort}`;}
      const hint=main.querySelector('#ehint');if(hint) hint.innerHTML=HINTS[selProv]||'';
    });
  });

  /* Toggle */
  main.querySelector('#eon').addEventListener('change',function(){
    const sw=main.querySelector('#estat'),tx=main.querySelector('#estaxt');
    sw.style.background=this.checked?'#e8f8ef':'var(--off)';
    sw.style.borderColor=this.checked?'#a0d8b0':'var(--border)';
    tx.innerHTML=`<div style="font-weight:600;font-size:.92rem">${this.checked?'✅ Aktiv':'⬜ Deaktiviert'}</div><div style="font-size:.8rem;color:var(--muted)">${this.checked?'E-Mails werden automatisch versendet':'Kein E-Mail-Versand'}</div>`;
  });

  /* Save */
  main.querySelector('#esv').addEventListener('click',async()=>{
    const btn=main.querySelector('#esv');btn.disabled=true;btn.textContent='⏳ Speichern…';
    const host=selProv==='custom'?(main.querySelector('#ehost')?.value||'').trim():selHost;
    const port=selProv==='custom'?(+main.querySelector('#eport')?.value||587):selPort;
    if(!host){main.querySelector('#eal').innerHTML=`<div class="alert alert-error">Bitte Anbieter wählen oder Host eingeben.</div>`;btn.disabled=false;btn.textContent='💾 Einstellungen speichern';return;}
    const payload={
      enabled: main.querySelector('#eon').checked,
      host,port,secure:port===465,
      user:    main.querySelector('#euser').value.trim(),
      pass:    main.querySelector('#epass').value,
      fromName:  main.querySelector('#efn').value.trim(),
      fromEmail: main.querySelector('#efe').value.trim(),
      adminEmail:main.querySelector('#eae').value.trim()
    };
    const r=await apiFetch('/api/admin/email-config',{method:'PUT',body:JSON.stringify(payload)});
    main.querySelector('#eal').innerHTML=r.success?`<div class="alert alert-success">✅ Gespeichert!</div>`:`<div class="alert alert-error">❌ ${esc(r.error||'Fehler')}</div>`;
    btn.disabled=false;btn.textContent='💾 Einstellungen speichern';
    setTimeout(()=>{const el=main.querySelector('#eal');if(el) el.innerHTML='';},4000);
  });

  /* Test */
  main.querySelector('#ets').addEventListener('click',async()=>{
    const btn=main.querySelector('#ets');btn.disabled=true;btn.textContent='⏳ Teste…';
    const r=await apiFetch('/api/admin/email-test',{method:'POST'});
    main.querySelector('#eal').innerHTML=r.success?`<div class="alert alert-success">✅ ${esc(r.message)}</div>`:`<div class="alert alert-error">❌ ${esc(r.error)}</div>`;
    btn.disabled=false;btn.textContent='🔌 Verbindung testen';
  });
}

/* ── MODAL ── */
function modal(html){
  const root=document.getElementById('modal-root');
  root.innerHTML=`<div id="mbg" style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:800;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)"><div class="modal"><button class="modal-close" onclick="closeModal()">×</button>${html}</div></div>`;
  root.querySelector('#mbg').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});
}
function closeModal(){document.getElementById('modal-root').innerHTML='';}
window.closeModal=closeModal;
window.saveConsent=saveConsent;
window.goTo=goTo;
window.showAdmin=showAdmin;

/* ── HELPERS ── */
function esc(s){if(s==null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function todayStr(){return new Date().toISOString().split('T')[0];}
function addDays(ds,d){const dt=new Date(ds+'T12:00:00');dt.setDate(dt.getDate()+d);return dt.toISOString().split('T')[0];}
async function apiFetch(url,opts={}){
  try{const r=await fetch(url,{headers:{'Content-Type':'application/json',...(opts.headers||{})},credentials:'same-origin',...opts});
  if(r.status===401)return{error:'Nicht autorisiert'};return r.json();}
  catch(e){return{error:'Netzwerkfehler: '+e.message};}
}
