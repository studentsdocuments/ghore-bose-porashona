'use strict';
// ===== কনফিগ: Apps Script Web App URL এখানে বসান =====
const API_URL = 'https://script.google.com/macros/s/AKfycbxwnYkXm1R7bMHvFEAXWXQ-79o2SCiFinjhrCKMxECzX1lzeXhMwdkWH3vzy9GHBnyG/exec';
const SECS = 20, LB_KEY = 'tenseLB';
const $ = document.getElementById('app');
let S = {mode:'solo', lang:'bn-en', n:10, names:['',''], reset(){}};
let G = null, tmr = null;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle = a => { for (let i = a.length-1; i > 0; i--) { const j = Math.random()*(i+1)|0; [a[i],a[j]] = [a[j],a[i]]; } return a; };
const card = h => { $.innerHTML = '<div class="card">'+h+'</div>'; };

function home(){ clearInterval(tmr); card(`<div class="big">🎯</div><h1>Tense-এর খেলা</h1><p class="sub">খেলতে খেলতে Tense শিখুন!</p>
<button class="btn" onclick="setup('solo')">👤 একা খেলুন</button><button class="btn g" onclick="setup('two')">👥 ২ জন মিলে খেলুন</button>
<button class="btn o" onclick="board()">🏆 Leaderboard</button><a class="btn gr" style="text-align:center;text-decoration:none" href="../index.html">🏠 মূল ওয়েবসাইট</a>`); }

function setup(m){ S.mode = m; S.lang = m==='solo' ? 'bn-en' : 'bn-en';
  const p = m==='solo' ? `<h2>আপনার নাম লিখুন</h2><input id="n1" placeholder="নাম" maxlength="20">`
    : `<h2>👤 Player 1</h2><input id="n1" placeholder="নাম" maxlength="20"><h2>👤 Player 2</h2><input id="n2" placeholder="নাম" maxlength="20">`;
  const langs = [['bn-en','🇧🇩 বাংলা → English'],['en-bn','🇬🇧 English → বাংলা']]; if (m==='two') langs.push(['random','🔀 Random Mode']);
  card(`<h1>${m==='solo'?'👤 একা খেলুন':'👥 ২ জন'}</h1>${p}<h2>কোন ধরনের Tense game খেলবেন</h2><div class="row" id="lg">${langs.map(l=>`<button class="chip ${l[0]===S.lang?'on':''}" data-v="${l[0]}">${l[1]}</button>`).join('')}</div>
<h2>কত প্রশ্নের game খেলবেন</h2><div class="row" id="cn">${[10,20,50,100,200,500].map(x=>`<button class="chip ${x===S.n?'on':''}" data-v="${x}">${x}</button>`).join('')}</div>
<input id="cu" type="number" min="2" max="500" placeholder="অথবা নিজে লিখুন (২–৫০০)"><button class="btn g" id="go">🎮 খেলা শুরু করুন</button><button class="btn gr" onclick="home()">← পেছনে</button>`);
  document.querySelectorAll('#lg .chip').forEach(b => b.onclick = () => { S.lang = b.dataset.v; document.querySelectorAll('#lg .chip').forEach(x=>x.classList.toggle('on',x===b)); });
  document.querySelectorAll('#cn .chip').forEach(b => b.onclick = () => { S.n = +b.dataset.v; document.getElementById('cu').value=''; document.querySelectorAll('#cn .chip').forEach(x=>x.classList.toggle('on',x===b)); });
  document.getElementById('go').onclick = () => {
    const n1 = document.getElementById('n1').value.trim(), n2 = m==='two' ? document.getElementById('n2').value.trim() : '-';
    const cu = document.getElementById('cu').value; let n = S.n;
    if (cu !== '') { n = parseInt(cu); if (!(n >= 2 && n <= 500)) return alert('প্রশ্ন সংখ্যা ২ থেকে ৫০০-এর মধ্যে দিন'); }
    if (!n1 || !n2) return alert('নাম লিখুন'); S.names = [n1, n2]; S.n = n; start(); }; }

function start(){
  // প্রতিটি example একবারই আসবে (এক session-এ duplicate নেই)
  const byEx = {}; QUESTIONS.forEach(q => (byEx[q.ex] = byEx[q.ex] || []).push(q));
  const list = shuffle(Object.keys(byEx)).slice(0, S.n).map(k => {
    const qs = byEx[k]; return S.lang==='random' ? qs[Math.random()*qs.length|0] : qs.find(q=>q.type===S.lang) || qs[0]; });
  G = {q:list, i:0, score:[0,0], two:S.mode==='two', locked:false}; show(); }

function show(){
  if (G.i >= G.q.length) return finish();
  const q = G.q[G.i], who = G.two ? G.i % 2 : 0; G.locked = false; let t = SECS;
  card(`<div class="top"><span>Question ${G.i+1} / ${G.q.length}</span><span>${esc(q.tense)}</span></div><div class="bar"><i style="width:${G.i/G.q.length*100}%"></i></div>
<div class="turn">👤 এখন উত্তর দেবে ${esc(S.names[who])}</div><div class="timer" id="t">⏱️ ${t}</div><div class="q">${esc(q.question)}</div>
${q.options.map((o,k)=>`<button class="opt" data-k="${k}"><b>${'ABCD'[k]}.</b> ${esc(o)}</button>`).join('')}<div id="fb"></div><button class="btn gr" id="sk">⏭️ Skip</button>`);
  document.querySelectorAll('.opt').forEach(b => b.onclick = () => answer(+b.dataset.k));
  document.getElementById('sk').onclick = () => answer(-2);
  clearInterval(tmr); tmr = setInterval(() => { t--; const e = document.getElementById('t'); if (e) { e.textContent = '⏱️ ' + t; e.classList.toggle('low', t <= 5); } if (t <= 0) answer(-1); }, 1000); }

function answer(k){
  if (G.locked) return; G.locked = true; clearInterval(tmr);
  const q = G.q[G.i], who = G.two ? G.i % 2 : 0, ok = k === q.answer;
  document.querySelectorAll('.opt').forEach((b,i) => { b.disabled = true; if (i === q.answer) b.classList.add('right'); else if (i === k) b.classList.add('bad'); });
  if (ok) G.score[who]++;
  const msg = ok ? '<span style="color:#00b894">✅ Correct! +1 🎉</span>' : k === -1 ? '⏰ Time Up!' : k === -2 ? '⏭️ Skipped' : '<span style="color:#d63031">❌ Wrong Answer</span>';
  document.getElementById('fb').innerHTML = `<div class="fb">${msg}</div>` + (ok ? '' : `<div class="ex"><b>সঠিক উত্তর:</b> ${esc(q.options[q.answer])}<br>${esc(q.explanation)}</div>`);
  document.getElementById('sk').style.display = 'none'; G.i++; setTimeout(show, ok ? 900 : 2600); }

const pct = (s,n) => Math.round(s/n*100);
function finish(){
  const n = G.q.length, [a,b] = G.score, p1 = pct(a,n); let h = '<div class="big">🎉</div><h1>Game Complete!</h1>';
  if (!G.two) { const M = p1>=90 ? ['🏆 Excellent!','অসাধারণ! Tense-এর উপর তোমার দখল খুব ভালো। এভাবেই practice চালিয়ে যাও!'] : p1>=70 ? ['🎉 Very Good!','দারুণ করেছো! আর একটু practice করলে Excellent করতে পারবে।'] : p1>=50 ? ['👍 Good!','ভালো চেষ্টা! নিয়মগুলো আরেকবার practice করো, তাহলে score আরও বাড়বে।'] : p1>=30 ? ['🙂 আরও চেষ্টা করুন!','হাল ছেড়ো না। ভুল থেকেই শেখা যায়। আবার খেলো!'] : ['💪 Keep Practicing!','Practice makes perfect! আবার চেষ্টা করো—পরেরবার অবশ্যই আরও ভালো করবে।'];
    h += `<div class="sc">Player ${esc(S.names[0])}</div><div class="sc">Score ${a} / ${n}</div><div class="sc">Percentage ${p1}%</div><h2 style="text-align:center">${M[0]}</h2><p style="text-align:center">${M[1]}</p>`;
  } else { const p2 = pct(b,n), nm = S.names;
    h += `<div class="sc">👤 ${esc(nm[0])} — ${a} / ${n}</div><div class="sc">👤 ${esc(nm[1])} — ${b} / ${n}</div>`;
    if (a === b) h += `<h2 style="text-align:center;font-size:26px">🤝 It's a Draw!</h2><p style="text-align:center">দুজনেই সমান ভালো খেলেছো! আবার খেলো এবং এবার Champion হওয়ার চেষ্টা করো! 🔥</p>`;
    else { const w = a>b?0:1; h += `<h2 style="text-align:center;font-size:26px">🏆 Winner ${esc(nm[w])}!</h2><p style="text-align:center">অসাধারণ ${esc(nm[w])}! তুমি আজকের Tense Champion! 🏆</p><p style="text-align:center;margin-top:8px">${esc(nm[1-w])}, মন খারাপ করার কিছু নেই। আরও একটু practice করো—পরের game-এ তুমিই Champion হতে পারো! 💪</p>`; } }
  h += `<button class="btn g" onclick="start()">🔄 আবার খেলুন</button><button class="btn" onclick="home()">🏠 Home</button><button class="btn o" onclick="board()">🏆 Leaderboard</button>`;
  card(h); save(); }

// ===== Validation + Save =====
function valid(r){ return r.name && r.name.length <= 20 && Number.isInteger(r.total) && r.total >= 1 && r.total <= 500 && Number.isInteger(r.score) && r.score >= 0 && r.score <= r.total && r.pct === Math.round(r.score/r.total*100); }
function save(){
  const n = G.q.length, [a,b] = G.score, two = G.two, nm = S.names;
  const rec = {name:nm[0], mode:two?'2 Player':'Solo', lang:S.lang, total:n, score:a, pct:pct(a,n), p2:two?nm[1]:'', p2s:two?b:'', winner:!two?'':a>b?nm[0]:b>a?nm[1]:'Draw', date:new Date().toISOString()};
  if (!valid(rec) || (two && !(nm[1] && b >= 0 && b <= n))) return;
  const L = JSON.parse(localStorage.getItem(LB_KEY) || '[]'); L.push(rec); localStorage.setItem(LB_KEY, JSON.stringify(L.slice(-300)));
  if (API_URL) fetch(API_URL, {method:'POST', body:JSON.stringify(rec)}).then(r=>r.json()).then(j=>{if(!j.ok)console.warn('Sheet save failed',j)}).catch(e=>console.warn('Sheet save error',e)); }

// ===== Leaderboard =====
async function board(tab){
  tab = tab || 'pct'; card('<h1>🏆 Leaderboard</h1><p class="sub">লোড হচ্ছে...</p>');
  let rows = JSON.parse(localStorage.getItem(LB_KEY) || '[]');
  let apiErr = '';
  if (API_URL) { try { const c = new AbortController(); setTimeout(() => c.abort(), 10000); const r = await (await fetch(API_URL + '?action=leaderboard', {signal:c.signal})).json(); if (Array.isArray(r)) rows = r; else apiErr = 'Server থেকে ভুল উত্তর এসেছে'; } catch (e) { apiErr = 'Online leaderboard লোড হয়নি'; } }
  const E = []; rows.forEach(r => { const m = r.mode || r.Mode;
    const g = (a,b) => r[a] !== undefined ? r[a] : r[b];
    const base = {mode:g('mode','Mode'), total:+g('total','TotalQuestions'), date:g('date','DateTime')};
    E.push({...base, name:g('name','PlayerName'), score:+g('score','Score')});
    const p2 = g('p2','Player2Name'); if (p2 && p2 !== '-' ) E.push({...base, name:p2, score:+g('p2s','Player2Score')}); });
  const L = E.filter(e => e.total > 0).map(e => ({...e, pct:pct(e.score,e.total)}));
  L.sort(tab==='pct' ? (x,y)=>y.pct-x.pct||y.total-x.total : (x,y)=>y.score-x.score||y.pct-x.pct);
  card(`<h1>🏆 Leaderboard</h1><div class="row" style="margin:10px 0"><button class="chip ${tab==='pct'?'on':''}" onclick="board('pct')">🥇 Best Percentage</button><button class="chip ${tab!=='pct'?'on':''}" onclick="board('cor')">🔥 Highest Correct</button></div>
${apiErr?`<p class="sub" style="color:#d63031">⚠️ ${apiErr} (শুধু এই ফোনের result দেখাচ্ছে)</p>`:''}<div class="scroll"><table><tr><th>Rank</th><th>Player</th><th>Mode</th><th>Qs</th><th>Score</th><th>%</th><th>Date</th></tr>${L.slice(0,50).map((e,i)=>`<tr><td>${i+1}</td><td>${esc(e.name)}</td><td>${esc(e.mode)}</td><td>${e.total}</td><td>${e.score}</td><td>${e.pct}%</td><td>${new Date(e.date).toLocaleDateString('bn-BD')}</td></tr>`).join('') || '<tr><td colspan=7>এখনো কোনো result নেই</td></tr>'}</table></div><button class="btn gr" onclick="home()">← Home</button>`); }
home();
