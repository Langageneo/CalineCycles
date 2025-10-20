/* CalineCycle Pro - script.js
   stockage : localStorage key = "calineMemory_v1"
*/
const STORAGE_KEY = "calineMemory_v1";
let DB = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"profiles":{} }');
let currentUser = null;

// --- contenu Fun / conseils ---
const FUN = {
  jokes: [
    "Pourquoi les ovules ne se perdent jamais ? Parce qu'ils ont un GPS en elles ! 🌸",
    "Même la lune change de phase, toi aussi tu es magnifique à chaque étape. 🌙",
    "Chaque cycle est une histoire : tu es l’héroïne. 💫"
  ],
  adv: [
    "Bois de l’eau régulièrement et respire profondément aujourd'hui.",
    "Si tu es fatiguée, repose-toi 20 minutes ; ton corps travaille fort.",
    "Mange quelque chose riche en fer si tu te sens faible."
  ]
};

// ---------- UTIL : hash code (SHA-256) ----------
async function hashString(str){
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
}

// ---------- UI helpers ----------
function $(id){return document.getElementById(id)}
function showSection(id){
  document.querySelectorAll('main .card, main #splash, main section').forEach(s=>s.classList.add('hidden'));
  $(id).classList.remove('hidden');
  window.scrollTo(0,0);
}
function showWelcome(){ showSection('welcome'); displayAutoFun(); }
function showCreate(){ showSection('create') }
function showLogin(){ populateUsers(); showSection('login') }
function showDash(){ renderRecent(); showSection('dash') }
function showSymptom(){ showSection('symptom') }
function showJournal(){ renderJournal(); showSection('journal') }
function showFun(){ generateFun(); showSection('fun') }
function showGraph(){ renderGraph(); showSection('graph') }

// ---------- profiles ----------
function saveDB(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }

function createProfile(){
  const name = $('in-name').value.trim();
  const surname = $('in-surname').value.trim();
  const dob = $('in-dob').value;
  const cls = $('in-class').value.trim();
  const code = $('in-code').value;
  if(!name || !surname || !dob || !code || code.length < 4){ alert("Remplis correctement les champs (code >=4)."); return; }
  const username = (name + '_' + surname).replace(/\s+/g,'');
  if(DB.profiles[username]){ alert("Profil existant."); return; }
  hashString(code).then(hash=>{
    DB.profiles[username] = { name, surname, dob, class:cls, codeHash:hash, journal:[], cycles:[], symptoms:[] };
    saveDB();
    currentUser = username;
    $('in-name').value=''; $('in-surname').value=''; $('in-dob').value=''; $('in-class').value=''; $('in-code').value='';
    greetUser();
    showDash();
    displayAutoFun();
  });
}

function populateUsers(){
  const sel = $('select-user'); sel.innerHTML='';
  Object.keys(DB.profiles).forEach(u=>{
    const o = document.createElement('option'); o.value=u; o.innerText = u; sel.appendChild(o);
  });
}

function login(){
  const username = $('select-user').value;
  const code = $('login-code').value;
  if(!username){ alert("Choisis un profil."); return; }
  if(!code){ alert("Entrer le code."); return; }
  hashString(code).then(hash=>{
    const p = DB.profiles[username];
    if(p && p.codeHash === hash){
      currentUser = username;
      $('login-code').value='';
      greetUser();
      showDash();
      showAutoFunOnLogin();
    } else {
      alert("Code incorrect.");
    }
  });
}

function logout(){ currentUser = null; showWelcome(); }

// ---------- greeting / auto fun ----------
function greetUser(){
  if(!currentUser) return;
  const p = DB.profiles[currentUser];
  $('greeting').innerText = `Bonjour ${p.name} 🌸`;
  $('small-info').innerText = `Classe: ${p.class || '—'} • Née: ${p.dob || '—'}`;
}

// show a joke+advice block on welcome
function displayAutoFun(){
  const box = $('auto-fun');
  const j = FUN.jokes[Math.floor(Math.random()*FUN.jokes.length)];
  const a = FUN.adv[Math.floor(Math.random()*FUN.adv.length)];
  box.innerHTML = `<strong>Blague :</strong> ${j}<br><strong>Conseil :</strong> ${a}`;
}

// show fun when user logs in
function showAutoFunOnLogin(){ displayAutoFun(); generateFun(); }

// generate fun content
function generateFun(){
  const j = FUN.jokes[Math.floor(Math.random()*FUN.jokes.length)];
  const a = FUN.adv[Math.floor(Math.random()*FUN.adv.length)];
  const disp = $('fun-display');
  disp.innerHTML = `<div class="fun-title">✨ Blague du jour</div><p>${j}</p><hr/><div class="fun-title">Conseil</div><p>${a}</p>`;
}

// quick regenerate
function regenerateFun(){ generateFun(); }

// ---------- cycles ----------
function startCycle(){
  if(!currentUser){ alert("Connecte-toi d'abord."); return; }
  const today = new Date().toISOString().split('T')[0];
  const profile = DB.profiles[currentUser];
  profile.cycles.push({ start: today, end: null });
  saveDB();
  alert(`Cycle commencé le ${today} 🌟`);
  greetUser(); renderRecent();
}

function endCycle(){
  if(!currentUser){ alert("Connecte-toi d'abord."); return; }
  const today = new Date().toISOString().split('T')[0];
  const profile = DB.profiles[currentUser];
  if(profile.cycles.length && !profile.cycles[profile.cycles.length-1].end){
    profile.cycles[profile.cycles.length-1].end = today;
    saveDB();
    alert(`Cycle terminé le ${today} 🌸`);
    renderRecent();
  } else {
    alert("Aucun cycle à terminer !");
  }
}

// ---------- symptoms / mood ----------
let selectedMood = null;
document.addEventListener('click', (e)=>{
  if(e.target && e.target.classList && e.target.classList.contains('mood')){
    selectedMood = e.target.getAttribute('data-mood');
    Array.from(document.querySelectorAll('.mood')).forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
  }
});

function saveSymptom(){
  if(!currentUser){ alert("Connecte-toi."); return; }
  const sym = $('sym-input').value.trim();
  const note = $('sym-note').value.trim();
  const mood = selectedMood || (document.getElementById('sym-input').value ? '🙂' : null);
  if(!sym && !mood && !note){ alert("Entre au moins quelque chose."); return; }
  const profile = DB.profiles[currentUser];
  profile.symptoms.push({ date: new Date().toISOString().split('T')[0], symptom: sym, mood, note });
  saveDB();
  $('sym-input').value=''; $('sym-note').value=''; selectedMood=null; Array.from(document.querySelectorAll('.mood')).forEach(b=>b.classList.remove('active'));
  alert("Symptôme / humeur ajouté ✅\n" + FUN.adv[Math.floor(Math.random()*FUN.adv.length)]);
  showDash();
}

// ---------- journal ----------
function saveJournal(){
  if(!currentUser){ alert("Connecte-toi."); return; }
  const text = $('journal-text').value.trim();
  if(!text){ alert("Écris quelque chose."); return; }
  const profile = DB.profiles[currentUser];
  profile.journal.push({ date: new Date().toISOString().split('T')[0], entry: text });
  saveDB();
  $('journal-text').value='';
  alert("Entrée sauvegardée ✨");
  renderJournal();
}

function renderJournal(){
  if(!currentUser) return;
  const list = $('journal-list'); list.innerHTML='';
  const arr = DB.profiles[currentUser].journal.slice().reverse();
  if(arr.length===0) { list.innerHTML = '<div class="muted">Aucune entrée</div>'; return; }
  arr.forEach(it=>{
    const d = document.createElement('div'); d.className='item';
    d.innerHTML = `<div class="muted">${it.date}</div><div>${escapeHtml(it.entry)}</div>`;
    list.appendChild(d);
  });
}

// ---------- recent / dash ----------
function renderRecent(){
  if(!currentUser) return;
  const r = $('recent'); r.innerHTML='';
  const p = DB.profiles[currentUser];
  const lastCycle = p.cycles.slice(-1)[0];
  let html = `<div class="muted">Dernier cycle: ${lastCycle ? lastCycle.start + (lastCycle.end ? " → " + lastCycle.end : " (en cours)") : "Aucun"}</div>`;
  const lastSym = p.symptoms.slice(-3).reverse();
  if(lastSym.length){
    html += "<div class='muted'>Derniers symptômes :</div>";
    lastSym.forEach(s=> html += `<div class="item">${s.date} — ${s.symptom || ''} ${s.mood ? '('+s.mood+')' : ''}</div>`);
  }
  r.innerHTML = html;
  greetUser();
}

// ---------- chart (cycle durations) ----------
function renderGraph(){
  if(!currentUser) return;
  const ctx = $('cycleChart').getContext('2d');
  const p = DB.profiles[currentUser];
  const cycles = p.cycles.filter(c=>c.start);
  if(cycles.length===0){ alert("Aucun cycle enregistré."); showDash(); return; }
  const labels = cycles.map((c,i)=>`#${i+1}`);
  const durations = cycles.map(c => {
    const s = new Date(c.start);
    const e = c.end ? new Date(c.end) : new Date();
    return Math.max(1, Math.round((e - s) / (1000*60*60*24)));
  });
  if(window._cycleChart) window._cycleChart.destroy();
  window._cycleChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label:'Durée (jours)', data: durations, backgroundColor: '#ff9ac7' }]},
    options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true }}}
  });
}

// ---------- small util ----------
function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s])); }

// ---------- startup / splash ----------
function init(){
  setTimeout(()=>{ $('splash').classList.add('hidden'); showWelcome(); }, 900);
  displayAutoFun();
}
window.addEventListener('load', init);
