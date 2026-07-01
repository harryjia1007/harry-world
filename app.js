/* ============================================================
   Harry World — 中樞地圖 + 展廳內頁
   ★ 要更新網站內容，改下面的 DATA() 就好（中 / 英兩份）
   架構：主畫面是地圖(hub)，走進展廳 = 切換到該展廳的內頁(hall)
   路由用網址 #builder / #lab / #journey / #connect，瀏覽器上一頁可用
   ============================================================ */

let LANG = 'zh';
const tr = (zh, en) => (LANG === 'zh' ? zh : en);

/* 四個展廳：在地圖上的座標（600×300 座標系）、主色、羅盤座標 */
const HALLS = [
  { key: 'builder', x: 300, y: 46,  color: '#5A7691', coord: 'N · 00,01' },
  { key: 'journey', x: 540, y: 150, color: '#C29144', coord: 'E · 02,00' },
  { key: 'lab',     x: 300, y: 255, color: '#BC6A4E', coord: 'S · 00,-2' },
  { key: 'connect', x: 60,  y: 150, color: '#7C9068', coord: 'W · -2,00' },
];
const hallTint = { builder:'rgba(90,118,145,.15)', journey:'rgba(194,145,68,.16)', lab:'rgba(188,106,78,.14)', connect:'rgba(124,144,104,.16)' };
const hallLabel = { builder:'Builder', journey:'Journey', lab:'Lab', connect:'Connect' };
const isHall = (k) => HALLS.some(h => h.key === k);

/* 每個展廳的內頁資訊 */
function HALL_META() {
  return {
    builder: { icon:'fa-solid fa-hammer', color:'#5A7691',
      title: tr('Builder 展廳','Builder Hall'), sub: tr('關於我 · 正在做的東西','About & currently building') },
    lab:     { icon:'fa-solid fa-flask', color:'#BC6A4E',
      title: tr('Lab 展廳','Lab Hall'), sub: tr('作品','Work & projects') },
    journey: { icon:'fa-solid fa-route', color:'#C29144',
      title: tr('Journey 展廳','Journey Hall'), sub: tr('我的旅程','My journey') },
    connect: { icon:'fa-solid fa-paper-plane', color:'#7C9068',
      title: tr('Connect 展廳','Connect Hall'), sub: tr('聊聊','Let’s connect') },
  };
}
/* 進場滑入方向（依羅盤位置）*/
const ENTER_DIR = {
  builder: { x:'0', y:'-26px' }, journey: { x:'26px', y:'0' },
  lab: { x:'0', y:'26px' }, connect: { x:'-26px', y:'0' },
};

/* 內容 */
function DATA() {
  return {
    name: tr('陳佳朋', 'Harry Chen'),
    langBtn: LANG === 'zh' ? 'EN' : '中',
    role: tr('準備就讀 中原大學 電機工程 · 臺北市立成功高中',
             'Incoming EE @ CYCU · Cheng Gong Senior High'),

    heroKicker: tr('HARRY WORLD — 一座還在長大的數位博物館',
                   'HARRY WORLD — a tiny museum that keeps growing'),
    heroTagline: tr('把想法，做成真的東西。', 'Building ideas into reality.'),

    aboutP1: tr('我準備從臺北市立成功高中畢業，進中原大學念電機。比起頭銜，我更在意「做出真的有人在用的東西」。',
                'I’m about to graduate from Cheng Gong Senior High and start Electrical Engineering at CYCU. I care less about titles, and more about shipping things people actually use.'),
    aboutP2: tr('從 macOS 小工具到 AI 系統，我喜歡把生活裡的小麻煩變成一個會動的產品。這個網站會跟著我一起長大——每做一個新東西，就多一個展品。',
                'From small macOS utilities to AI systems, I like turning everyday annoyances into working products. This site grows with me — every new build adds a new exhibit.'),
    aboutTags: [tr('AI builder','AI builder'), 'macOS', tr('產品設計','Product design'), tr('學生','Student'), tr('跨文化溝通','Cross-culture')],

    ui: {
      build:    tr('正在做的東西','Currently building'),
      projects: tr('作品','Work'),
      journey:  tr('我的旅程','My journey'),
      about:    tr('關於我','About'),
      connect:  tr('聊聊','Let’s connect'),
      enter:    tr('按 E 進入','Press E'),
      walkHint: tr('用方向鍵走動','arrow keys to walk'),
      enterTip: tr('用方向鍵 / WASD 走動，靠近展廳按 E 進入，或直接點展廳',
                   'Walk with arrows / WASD, press E near a hall — or just click one'),
      back:     tr('回地圖','Back to map'),
    },

    building: [
      { name:'NotchGlass', tag:'macOS', color:'#BC6A4E',
        note:tr('把 MacBook 的瀏海，變成隨手可用的小工具列。獨立開發中。',
                'Turning the MacBook notch into a handy little toolbar. Building it solo.') },
      { name:tr('運動傷害預防系統','Injury Prevention'), tag:'AI', color:'#5A7691',
        note:tr('用 AI 預測並提醒運動傷害風險，已落地驗證。',
                'Using AI to flag sports-injury risk before it happens — validated in the field.') },
    ],

    projects: [
      { name:'NotchGlass', kind:tr('macOS 應用程式','macOS App'), status:tr('開發中','In progress'),
        color:'#BC6A4E', icon:'fa-brands fa-apple',
        one:tr('把筆電瀏海那塊「沒用的空間」，變成隨手可用的工具列。',
               'Making the “useless” notch space into something genuinely handy.'),
        stack:'Swift · SwiftUI · macOS' },
      { name:tr('運動傷害預防系統','Sports Injury Prevention'), kind:tr('AI 系統','AI System'), status:tr('已收錄','Featured'),
        color:'#5A7691', icon:'fa-solid fa-wave-square',
        one:tr('獲選收錄於數位發展部年度專書《看見·改變·落地，臺灣 AI 人才的 15 個真實案例》。',
               'Selected for the Ministry of Digital Affairs’ annual book on 15 real Taiwanese AI cases.'),
        stack:'Python · ML · Computer Vision' },
      { name:tr('更多正在路上','More on the way'), kind:tr('施工中','Cooking'), status:tr('即將補上','Soon'),
        color:'#9AA0A6', icon:'fa-solid fa-screwdriver-wrench',
        one:tr('新的展品還在做，之後會陸續補進來。','New exhibits are being built — they’ll show up here soon.'),
        stack:'—' },
    ],

    journey: [
      { date:'2026.3', color:'#5A7691', tag:tr('實習','Internship'), title:tr('Aiii.Ai — BD 實習生','BD Intern @ Aiii.Ai'),
        desc:tr('負責國際藥廠資料庫專案、報價與合約，協助導入 LINE 官方帳號精準行銷；累積跨領域溝通與專案管理。',
                'Leading international pharma database projects, quotes & contracts, and LINE precision-marketing rollout — building cross-functional and project skills.') },
      { date:'2025.9', color:'#BC6A4E', tag:tr('AI 落地','AI in practice'), title:tr('數位發展部年度專書收錄','Featured in national AI book'),
        desc:tr('「運動傷害預防系統」成功把 AI 落地解決真實需求，獲選收錄於數位發展部年度專書。',
                'My sports-injury prevention system put AI to real-world use and was selected for the ministry’s annual AI casebook.') },
      { date:'2025.7', color:'#C29144', tag:tr('跨國','Japan'), title:tr('青年百億海外圓夢基金 · 正取','Youth Overseas Dream Fund · Selected'),
        desc:tr('1000 份提案中擠進 60 人面試，成為 30 位錄取者中最年輕的一員。赴日與 Google Japan、JETRO 交流，於東京新創實習，並籌辦兩場工作坊。',
                'Out of 1,000 proposals I reached the final 60, then became the youngest of the 30 selected. In Japan I met Google Japan & JETRO, interned at a Tokyo startup, and ran two workshops.') },
      { date:'2025.7', color:'#C29144', tag:tr('演講','Speaking'), title:tr('AI WAVE SHOW · 青年演講代表','AI WAVE SHOW · Youth speaker'),
        desc:tr('於臺北世貿中心 AI WAVE SHOW 擔任青年演講代表，分享我的 AI 實作經驗。',
                'Spoke as a youth representative at the AI WAVE SHOW, Taipei World Trade Center.') },
      { date:'2023.12', color:'#7C9068', tag:tr('英語','English'), title:tr('外交小尖兵 · 全國優等獎','Young Diplomats · National Honor'),
        desc:tr('在公視攝影棚的高壓環境下，與隊友完成全英文即席演講與國際議題問答。',
                'Delivered full-English impromptu speeches and international-affairs Q&A under studio pressure with my team.') },
      { date:'2023.5', color:'#8A6A9E', tag:tr('競賽','Contest'), title:tr('BioSTEM 全國生醫創意競賽 · 季軍','BioSTEM National Biomed Contest · 3rd'),
        desc:tr('臺北醫學大學主辦，從生醫角度提出創新解法，獲全國季軍。',
                'Hosted by Taipei Medical University — placed 3rd nationally with an innovative biomed idea.') },
    ],

    connect: [
      { label:'Email', sub:'harryjia1007@gmail.com', href:'mailto:harryjia1007@gmail.com', icon:'fa-solid fa-envelope', color:'#7C9068' },
      { label:'GitHub', sub:'@harryjia1007', href:'https://github.com/harryjia1007', icon:'fa-brands fa-github', color:'#202124' },
      { label:'Instagram', sub:tr('日常與作品','Life & builds'), href:'#', icon:'fa-brands fa-instagram', color:'#BC6A4E' },
      { label:'LinkedIn', sub:tr('專業經歷','Experience'), href:'#', icon:'fa-brands fa-linkedin-in', color:'#5A7691' },
      { label:tr('履歷','Resume'), sub:'PDF', href:'#', icon:'fa-solid fa-file-lines', color:'#C29144' },
    ],

    footer: tr('Harry World · 永遠在做下一個東西', 'Harry World · always building the next thing'),
  };
}

/* ---------------- 角色移動狀態 ---------------- */
const W = 600, H = 300, CW = 26, CH = 40, PAD = 12, R = 84, STEP = 24;
let char = { x: 287, y: 128, face: 1 };
let nearHall = null;

const $ = (s, r = document) => r.querySelector(s);
const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };

/* ---------------- 遊戲化狀態：探索進度 / 音效 ---------------- */
const VISITED_KEY = 'hw_visited';
const MUTED_KEY = 'hw_muted';
let visited = new Set(JSON.parse(localStorage.getItem(VISITED_KEY) || '[]'));
let muted = localStorage.getItem(MUTED_KEY) === 'true';
let hasMovedOnce = false;
let audioCtx = null;
let lastStepSfxAt = 0, lastDustAt = 0;

/* 用 Web Audio 產生極短的復古音效，完全不需要外部音檔 */
function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function tone(freq, dur = 90, type = 'sine', peak = 0.05, delay = 0, glideTo = null) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, t0 + dur / 1000);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + dur / 1000 + 0.02);
}
function sfxStep()    { tone(170 + Math.random() * 30, 45, 'square', 0.022); }
function sfxPortal()  { tone(260, 240, 'sine', 0.05, 0, 640); }
function sfxBack()    { tone(420, 150, 'sine', 0.04, 0, 220); }
function sfxAchieve() { tone(660, 120, 'triangle', 0.05); tone(880, 160, 'triangle', 0.05, 0.12); tone(1160, 220, 'triangle', 0.05, 0.24); }

function paintSoundBtn() {
  const b = $('#soundBtn');
  if (!b) return;
  b.innerHTML = `<i class="fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}"></i>`;
  b.classList.toggle('is-muted', muted);
}

/* 探索進度 HUD */
function paintProgress() {
  const hud = $('#progressHud');
  if (!hud) return;
  const total = HALLS.length, done = visited.size;
  const dots = HALLS.map(h => `<span class="progress-dot ${visited.has(h.key) ? 'done' : ''}" style="--pc:${h.color}"></span>`).join('');
  const label = done >= total
    ? tr('🏆 探索完成！', '🏆 Fully explored!')
    : tr(`探索進度 ${done} / ${total}`, `Explored ${done} / ${total}`);
  hud.innerHTML = `<span class="progress-dots">${dots}</span><span class="progress-label">${label}</span>`;
}

/* 成就通知 */
let toastTimer = null;
function showToast(html, color) {
  const t = $('#toast');
  if (!t) return;
  t.innerHTML = html;
  t.style.setProperty('--tc', color || '#5A7691');
  t.hidden = false;
  setTimeout(() => t.classList.add('show'), 20);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.hidden = true; }, 320);
  }, 2600);
}

/* 彩帶慶祝 */
function burstConfetti(count = 26) {
  const layer = $('#confettiLayer');
  if (!layer) return;
  const colors = ['#5A7691', '#C29144', '#BC6A4E', '#7C9068', '#8A6A9E'];
  for (let i = 0; i < count; i++) {
    const p = el('span', 'confetti-piece');
    const dx = (Math.random() * 2 - 1) * 180;
    const rot = (Math.random() * 2 - 1) * 380;
    const dur = 900 + Math.random() * 550;
    const delay = Math.random() * 160;
    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--rot', rot + 'deg');
    p.style.setProperty('--dur', dur + 'ms');
    p.style.setProperty('--delay', delay + 'ms');
    p.style.background = colors[i % colors.length];
    p.style.left = (44 + Math.random() * 12) + '%';
    layer.appendChild(p);
    setTimeout(() => p.remove(), dur + delay + 120);
  }
}

/* 記錄探索：第一次造訪某展廳 → 通知 + 音效；全部造訪 → 彩帶慶祝 */
function markVisited(key) {
  if (!visited.has(key)) {
    visited.add(key);
    localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
    const meta = HALL_META()[key];
    showToast(`<i class="${meta.icon}"></i> ${tr('首次造訪', 'First visit')} · <b>${meta.title}</b>`, meta.color);
    sfxAchieve();
    if (visited.size === HALLS.length) {
      setTimeout(() => {
        burstConfetti(50);
        showToast(tr('🏆 全部展廳都探索完成了！', '🏆 You’ve explored every hall!'), '#202124');
        sfxAchieve();
      }, 900);
    }
  }
  paintProgress();
  document.querySelectorAll('.hall').forEach(b => b.classList.toggle('visited', visited.has(b.dataset.key)));
}

/* 走路踩點的塵土粒子 */
function spawnDust() {
  const now = performance.now();
  if (now - lastDustAt < 90) return;
  lastDustAt = now;
  const pg = $('#playground');
  if (!pg) return;
  const d = el('span', 'dust');
  d.style.left = (char.x + CW / 2) + 'px';
  d.style.top = (char.y + CH - 2) + 'px';
  pg.appendChild(d);
  setTimeout(() => d.remove(), 500);
}
function maybeStepSfx() {
  const now = performance.now();
  if (now - lastStepSfxAt < 140) return;
  lastStepSfxAt = now;
  sfxStep();
}

/* 首次載入的走路提示 */
function showKeyHintOnce() {
  const hint = $('#keyHint');
  if (!hint || hasMovedOnce) return;
  hint.hidden = false;
  hint.innerHTML =
    `<div class="hint-row"><span class="hint-key">↑</span></div>
     <div class="hint-row"><span class="hint-key">←</span><span class="hint-key">↓</span><span class="hint-key">→</span></div>
     <div class="hint-label">${tr('走走看', 'try walking')}</div>`;
}
function hideKeyHint() {
  hasMovedOnce = true;
  const hint = $('#keyHint');
  if (hint) hint.hidden = true;
}

function findNear() {
  const cx = char.x + CW / 2, cy = char.y + CH / 2;
  let best = null, bd = R;
  for (const h of HALLS) { const d = Math.hypot(cx - h.x, cy - h.y); if (d < bd) { bd = d; best = h.key; } }
  return best;
}

function move(dx, dy) {
  hideKeyHint();
  const nx = Math.max(PAD, Math.min(W - CW - PAD, char.x + dx * STEP));
  const ny = Math.max(PAD, Math.min(H - CH - PAD, char.y + dy * STEP));
  const blocked = nx === char.x && ny === char.y;
  char.x = nx; char.y = ny;
  if (dx < 0) char.face = -1; else if (dx > 0) char.face = 1;
  nearHall = findNear();
  paintChar(); paintPrompt();
  spawnDust(); maybeStepSfx();
  if (blocked) {
    const p = $('#pixel');
    if (p) { p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
  }
}

/* ---------------- 路由：進 / 出展廳（走進去＝彩色傳送門轉場） ---------------- */
function enter(key) {
  if (!isHall(key)) return;
  const btn = document.querySelector(`.hall[data-key="${key}"]`);
  const rect = btn ? btn.getBoundingClientRect() : null;
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  const color = (HALLS.find(h => h.key === key) || {}).color || '#5A7691';
  sfxPortal();
  runIris(color, x, y, () => { location.hash = key; });
}
function toMap() { sfxBack(); location.hash = ''; }

/* 傳送門 wipe：先蓋滿全螢幕，切換內容，再縮回去露出新畫面 */
function runIris(color, x, y, mid) {
  const iris = $('#iris');
  if (!iris) { mid && mid(); return; }
  iris.style.setProperty('--ix', x + 'px');
  iris.style.setProperty('--iy', y + 'px');
  iris.style.background = color;
  iris.classList.add('active');
  setTimeout(() => {
    mid && mid();
    setTimeout(() => iris.classList.remove('active'), 160);
  }, 380);
}

function route() {
  const key = location.hash.replace('#', '');
  if (isHall(key)) openHall(key);
  else closeHall();
}

function openHall(key) {
  const dir = ENTER_DIR[key] || { x:'0', y:'20px' };
  const view = $('#hallView');
  view.style.setProperty('--enter-x', dir.x);
  view.style.setProperty('--enter-y', dir.y);
  renderHall(key);
  document.body.classList.add('mode-hall');
  view.setAttribute('aria-hidden', 'false');
  view.scrollTop = 0;
  const meta = HALL_META()[key];
  $('#hereLabel').textContent = '/ ' + meta.title;
  document.title = meta.title + ' — Harry World';
  markVisited(key);
}

function closeHall() {
  document.body.classList.remove('mode-hall');
  $('#hallView').setAttribute('aria-hidden', 'true');
  $('#hereLabel').textContent = '';
  document.title = 'Harry World — 陳佳朋';
}

/* ---------------- 繪製地圖 ---------------- */
function paintChar() {
  const p = $('#pixel');
  if (p) p.style.transform = `translate(${char.x}px,${char.y}px) scaleX(${char.face})`;
}
function paintPrompt() {
  const box = $('#pgPrompt');
  document.querySelectorAll('.hall').forEach(b => b.classList.toggle('near', b.dataset.key === nearHall));
  if (!box) return;
  if (nearHall) {
    const h = HALLS.find(x => x.key === nearHall);
    box.hidden = false;
    box.innerHTML = `<span class="pd" style="background:${h.color}"></span>${HALL_META()[nearHall].title} · <span style="opacity:.65">${DATA().ui.enter}</span>`;
  } else box.hidden = true;
}

function buildPlayground() {
  const pg = $('#playground');
  pg.querySelectorAll('.hall,.pixel').forEach(n => n.remove());
  HALLS.forEach(h => {
    const b = el('button', 'hall');
    b.dataset.key = h.key;
    b.style.left = h.x + 'px'; b.style.top = h.y + 'px';
    b.classList.toggle('visited', visited.has(h.key));
    b.setAttribute('aria-label', HALL_META()[h.key].title);
    b.innerHTML =
      `<div class="booth" style="background:${hallTint[h.key]};--pulse-color:${h.color}40">
         <div class="roof" style="background:${h.color}"></div><div class="door"></div>
       </div>
       <div class="hall-name">${hallLabel[h.key]}</div>
       <div class="hall-coord">${h.coord}</div>`;
    b.addEventListener('click', () => enter(h.key));
    pg.appendChild(b);
  });
  const pixel = el('div', 'pixel'); pixel.id = 'pixel';
  pixel.innerHTML =
    `<div class="shadow"></div>
     <div class="body"><div class="hair"></div>
       <div class="face"><span class="eye"></span><span class="eye"></span></div>
       <div class="torso"></div>
       <div class="legs"><span class="leg"></span><span class="leg"></span></div></div>`;
  pg.appendChild(pixel);
  paintChar();
}

/* ---------------- 繪製展廳內頁 ---------------- */
function sectionHead(color, title) {
  return `<div class="block-head"><span class="dot" style="background:${color}"></span><h2>${title}</h2></div>`;
}
function buildingCards(d) {
  return d.building.map(b => `
    <div class="card build-card">
      <div class="build-top"><span class="cdot" style="background:${b.color}"></span>
        <span class="cname">${b.name}</span>
        <span class="ctag" style="color:${b.color}">${b.tag}</span></div>
      <p>${b.note}</p>
    </div>`).join('');
}
function projectCards(d) {
  return d.projects.map(p => `
    <div class="card proj-card">
      <div class="proj-icon" style="background:${p.color}"><i class="${p.icon}"></i></div>
      <div class="proj-body">
        <div class="proj-line1"><span class="proj-name">${p.name}</span>
          <span class="proj-kind">${p.kind}</span>
          <span class="proj-status" style="color:${p.color}">● ${p.status}</span></div>
        <p class="one">${p.one}</p>
        <div class="proj-stack">${p.stack}</div>
      </div>
    </div>`).join('');
}
function journeyItems(d) {
  return d.journey.map(j => `
    <div class="tl-item"><span class="node" style="background:${j.color}"></span>
      <div class="tl-line1"><span class="tl-date">${j.date}</span>
        <span class="tl-tag" style="color:${j.color}">${j.tag}</span></div>
      <div class="tl-title">${j.title}</div><p class="tl-desc">${j.desc}</p>
    </div>`).join('');
}
function connectCards(d) {
  return d.connect.map(c => `
    <a class="card connect-card" href="${c.href}"${c.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>
      <span class="connect-icon" style="background:${c.color}"><i class="${c.icon}"></i></span>
      <span style="min-width:0"><span class="clabel">${c.label}</span>
        <span class="csub">${c.sub}</span></span>
    </a>`).join('');
}

function renderHall(key) {
  const d = DATA(), meta = HALL_META()[key];
  $('#hallBanner').innerHTML =
    `<div class="hb-icon" style="background:${meta.color}"><i class="${meta.icon}"></i></div>
     <div><div class="hb-name">${meta.title}</div><div class="hb-sub">${meta.sub}</div></div>`;

  let body = '';
  if (key === 'builder') {
    body += `<div class="block">${sectionHead('#5A7691', d.ui.about)}
      <div class="about-card">
        <p class="about-p">${d.aboutP1}</p><p class="about-p">${d.aboutP2}</p>
        <div class="tags">${d.aboutTags.map(t => `<span>${t}</span>`).join('')}</div>
      </div></div>`;
    body += `<div class="block">${sectionHead('#8A6A9E', d.ui.build)}
      <div class="grid-2">${buildingCards(d)}</div></div>`;
  } else if (key === 'lab') {
    body += `<div class="block">${sectionHead('#BC6A4E', d.ui.projects)}
      <div class="stack">${projectCards(d)}</div></div>`;
  } else if (key === 'journey') {
    body += `<div class="block">${sectionHead('#C29144', d.ui.journey)}
      <div class="timeline">${journeyItems(d)}</div></div>`;
  } else if (key === 'connect') {
    body += `<div class="block">${sectionHead('#7C9068', d.ui.connect)}
      <div class="grid-2">${connectCards(d)}</div></div>`;
  }
  $('#hallBody').innerHTML = body;
}

/* ---------------- data-bind 文字 ---------------- */
function paintBindings() {
  const d = DATA();
  document.querySelectorAll('[data-bind]').forEach(node => {
    const val = node.getAttribute('data-bind').split('.').reduce((o, k) => (o ? o[k] : undefined), d);
    if (val != null) node.textContent = val;
  });
  $('#langBtn').textContent = d.langBtn;
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hant' : 'en';
}

/* ---------------- RWD ---------------- */
function fitPlayground() {
  const box = $('.playground-scale');
  const avail = Math.min(box.clientWidth, 820);
  const s = Math.max(0.5, Math.min(1.3, avail / W));
  box.style.setProperty('--pg-scale', s);
  box.style.height = (H * s) + 'px';
}

/* ---------------- 啟動 ---------------- */
function init() {
  buildPlayground();
  paintBindings();
  paintPrompt();
  paintProgress();
  paintSoundBtn();
  fitPlayground();
  route();
  if (!location.hash) showKeyHintOnce();

  window.addEventListener('resize', fitPlayground);
  window.addEventListener('hashchange', route);

  window.addEventListener('keydown', (e) => {
    // 在展廳內：Esc 回地圖
    if (document.body.classList.contains('mode-hall')) {
      if ((e.key || '').toLowerCase() === 'escape') { e.preventDefault(); toMap(); }
      return;
    }
    // 在地圖上：方向鍵 / WASD 走動，E 進入
    const k = (e.key || '').toLowerCase();
    const m = { arrowup:[0,-1], w:[0,-1], arrowdown:[0,1], s:[0,1], arrowleft:[-1,0], a:[-1,0], arrowright:[1,0], d:[1,0] };
    if (m[k]) { e.preventDefault(); move(m[k][0], m[k][1]); }
    else if (k === 'e' && nearHall) { e.preventDefault(); enter(nearHall); }
  });

  $('#backBtn').addEventListener('click', toMap);
  $('#brandHome').addEventListener('click', (e) => { e.preventDefault(); toMap(); });

  $('#soundBtn').addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem(MUTED_KEY, String(muted));
    paintSoundBtn();
    if (!muted) tone(440, 80, 'sine', 0.05);
  });

  $('#langBtn').addEventListener('click', () => {
    LANG = LANG === 'zh' ? 'en' : 'zh';
    paintBindings();
    buildPlayground();          // 重畫地圖（aria-label 等，含 visited/pulse 狀態）
    paintPrompt();
    paintProgress();
    const key = location.hash.replace('#', '');
    if (isHall(key)) { renderHall(key); const m = HALL_META()[key]; $('#hereLabel').textContent = '/ ' + m.title; }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
