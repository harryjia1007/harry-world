/* ============================================================
   Harry Chen — Pixel Glitch Portfolio
   ★ 要更新網站內容，改下面的 DATA 就好
   ★ 要放照片：把圖檔放進 images/ 資料夾、檔名對到下面每個項目的 slot，
     存在的檔案會自動顯示，沒放的維持佔位圖 —— 不需要改任何程式碼。
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };

/* ---------------- 內容 ---------------- */
const WORKS = [
  { slot: 'work-notchglass', year: '2026', kind: 'macOS App', status: '開發中', badge: '#FF8A3D',
    name: 'NotchGlass',
    desc: '把筆電瀏海那塊「沒用的空間」，變成隨手可用的工具列。獨立設計、獨立開發中。',
    impact: null, stack: ['Swift', 'SwiftUI', 'macOS'] },
  { slot: 'work-injury', year: '2025', kind: 'AI 系統', status: '已收錄', badge: '#D6FF3F',
    name: '運動傷害預防系統',
    desc: '用 AI 預測並提醒運動傷害風險，已在真實場域落地驗證。',
    impact: '獲選收錄於數位發展部年度專書《看見・改變・落地，臺灣 AI 人才的 15 個真實案例》。',
    stack: ['Python', 'ML', 'Computer Vision'] },
  { slot: 'work-next', year: '——', kind: '施工中', status: 'SOON', badge: '#9D5CFF',
    name: '更多正在路上',
    desc: '新的展品還在做，之後會陸續補進來。',
    impact: null, stack: ['???'] },
];

const JOURNEY = [
  { date: '2026.3', tag: '實習', color: '#D6FF3F', title: 'Aiii.Ai — BD 實習生',
    desc: '協助執行國際藥廠系統專案，實際了解客戶痛點並提出解決方案；協助導入 LINE 官方帳號精準行銷。',
    slot: 'journey-aiii', cap: 'aiii ✦ 2026', tilt: '2deg' },
  { date: '2025.9', tag: 'AI 落地', color: '#FF5CA8', title: '數位發展部年度專書收錄',
    desc: '「運動傷害預防系統」成功把 AI 落地解決真實需求，獲選收錄於年度專書。',
    slot: 'journey-book', cap: 'moda book ✦ 2025', tilt: '-2deg' },
  { date: '2025.7', tag: '跨國', color: '#FF8A3D', title: '青年百億海外圓夢基金・正取',
    desc: '1000 份提案中擠進 60 人面試，成為 30 位錄取者中最年輕的一員。赴日與 Google Japan、JETRO 交流。',
    slot: 'journey-japan', cap: 'tokyo ✦ 2025', tilt: '1.6deg' },
  { date: '2025.7', tag: '演講', color: '#9D5CFF', title: 'AI WAVE SHOW・青年演講代表',
    desc: '於臺北世貿中心擔任青年演講代表，分享 AI 實作經驗。',
    slot: 'journey-wave', cap: 'ai wave ✦ 2025', tilt: '-1.8deg' },
  { date: '2023.12', tag: '英語', color: '#5CC8FF', title: '外交小尖兵・全國優等獎',
    desc: '全英文即席演講與國際議題問答，高壓攝影棚環境下完成。',
    slot: 'journey-diplomat', cap: 'diplomat ✦ 2023', tilt: '2.2deg' },
  { date: '2023.5', tag: '競賽', color: '#D6FF3F', title: 'BioSTEM 全國生醫創意競賽・季軍',
    desc: '臺北醫學大學主辦，從生醫角度提出創新解法，獲全國季軍。',
    slot: 'journey-biostem', cap: 'biostem ✦ 2023', tilt: '-1.4deg' },
];

const ABOUT_CHIPS = ['AI builder', 'macOS', '產品設計', '學生', '跨文化溝通'];
const CURRENTLY = ['中原大學電機系', '打磨 NotchGlass 中', '規劃下一個作品'];
const CONTACTS = [
  { label: 'EMAIL', sub: 'harryjia1007@gmail.com', href: 'mailto:harryjia1007@gmail.com' },
  { label: 'GITHUB', sub: '@harryjia1007', href: 'https://github.com/harryjia1007' },
  { label: 'INSTAGRAM', sub: '日常與作品', href: '#' },
  { label: 'LINKEDIN', sub: '專業經歷', href: '#' },
  { label: 'RESUME', sub: 'PDF', href: '#' },
];
const STRIP = [
  { slot: 'strip-1', cap: '01 ✦ life' },
  { slot: 'strip-2', cap: '02 ✦ stage' },
  { slot: 'strip-3', cap: '03 ✦ japan' },
  { slot: 'strip-4', cap: '04 ✦ builds' },
  { slot: 'strip-5', cap: '05 ✦ etc' },
];

/* 圖片欄位：放 images/<slot>.jpg 就會自動顯示，沒放維持佔位圖 */
function imgSlot(slot) {
  const wrap = el('div', 'img-slot');
  wrap.dataset.slot = slot;
  wrap.innerHTML =
    `<img alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
     <div class="img-placeholder"><i class="fa-solid fa-camera"></i></div>`;
  wrap.querySelector('img').src = `images/${slot}.jpg`;
  return wrap;
}

/* ---------------- 繪製 ---------------- */
function renderWork() {
  const list = $('#workList');
  WORKS.forEach((w, i) => {
    const idx = String(i + 1).padStart(2, '0');
    const card = el('div', 'work-card');
    card.innerHTML = `
      <span class="idx-wm">${idx}</span>
      <div class="work-shot"></div>
      <div class="work-body">
        <div class="work-line1">
          <span class="work-idx">${idx}</span>
          <span class="work-meta">${w.year}</span>
          <span class="work-meta">${w.kind}</span>
          <span class="work-status" style="background:${w.badge}">${w.status}</span>
        </div>
        <div class="work-name">${w.name}</div>
        <p class="work-desc">${w.desc}</p>
        ${w.impact ? `<div class="work-impact" style="border-color:${w.badge}"><p>${w.impact}</p></div>` : ''}
        <div class="work-stack">${w.stack.map(s => `<span>${s}</span>`).join('')}</div>
      </div>`;
    const shot = card.querySelector('.work-shot');
    shot.appendChild(imgSlot(w.slot));
    shot.innerHTML += `<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>`;
    list.appendChild(card);
  });
}

function renderJourney() {
  const list = $('#journeyList');
  JOURNEY.forEach(j => {
    const card = el('div', 'journey-card');
    card.innerHTML = `
      <span class="journey-node" style="background:${j.color}"></span>
      <div class="journey-main">
        <div class="journey-line1">
          <span class="journey-date" style="color:${j.color}">${j.date}</span>
          <span class="journey-tag" style="background:${j.color}">${j.tag}</span>
        </div>
        <div class="journey-title">${j.title}</div>
        <p class="journey-desc">${j.desc}</p>
      </div>
      <div class="journey-photo" style="transform:rotate(${j.tilt})">
        <div class="photo-slot-mount"></div>
        <div class="journey-cap">${j.cap}</div>
      </div>`;
    card.querySelector('.photo-slot-mount').replaceWith(imgSlot(j.slot));
    list.appendChild(card);
  });
}

function renderAbout() {
  $('#aboutChips').innerHTML = ABOUT_CHIPS.map(c => `<span>${c}</span>`).join('');

  const photoMount = $('.polaroid .img-slot');
  photoMount.dataset.slot = 'about';
  photoMount.querySelector('img').src = 'images/about.jpg';

  const strip = $('#strip');
  STRIP.forEach(s => {
    const card = el('div', 'strip-card');
    card.appendChild(imgSlot(s.slot));
    const cap = el('div', 'strip-cap');
    cap.textContent = s.cap;
    card.appendChild(cap);
    strip.appendChild(card);
  });
}

function renderFooter() {
  $('#currentlyList').innerHTML = CURRENTLY.map(c => `<div><span>▸</span><span>${c}</span></div>`).join('');
  $('#contactList').innerHTML = CONTACTS.map(c => `
    <a href="${c.href}"${c.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>
      <span>[</span><span>${c.label}</span><span>${c.sub}</span><span>]</span>
    </a>`).join('');
}

/* ---------------- 分頁切換 ---------------- */
function initTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  const panels = { work: $('#panel-work'), journey: $('#panel-journey'), about: $('#panel-about') };

  function activate(tab) {
    btns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    Object.entries(panels).forEach(([k, p]) => { p.hidden = k !== tab; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  btns.forEach(b => b.addEventListener('click', () => activate(b.dataset.tab)));
  activate('work');
}

/* ---------------- 像素游標 ---------------- */
function initCursor() {
  const cursor = $('#pixelCursor'), ring = $('#pixelCursorRing');
  if (!cursor || !ring) return;
  if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) return;

  cursor.style.opacity = '0';
  ring.style.opacity = '0';

  let tx = 0, ty = 0, cx = 0, cy = 0, rx = 0, ry = 0, started = false;
  window.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!started) {
      started = true;
      cx = rx = tx; cy = ry = ty;
      cursor.style.opacity = '1';
      ring.style.opacity = '1';
    }
  });
  window.addEventListener('mouseover', (e) => {
    const hot = e.target && e.target.closest && e.target.closest('a,button,.img-slot');
    ring.classList.toggle('hot', !!hot);
  });

  function loop() {
    cx += (tx - cx) * 0.3; cy += (ty - cy) * 0.3;
    rx += (tx - rx) * 0.11; ry += (ty - ry) * 0.11;
    cursor.style.transform = `translate(${(cx - 6.5).toFixed(1)}px,${(cy - 6.5).toFixed(1)}px)`;
    ring.style.transform = `translate(${(rx - 17).toFixed(1)}px,${(ry - 17).toFixed(1)}px)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ---------------- 捲動進度 ---------------- */
function initScrollProgress() {
  const bar = $('#progBar');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h * 100) : 0) + '%';
  }, { passive: true });
}

/* ---------------- 生活照底片：自動來回捲動，滑過暫停 ---------------- */
function initStrip() {
  const strip = $('#strip');
  if (!strip) return;
  let paused = false, dir = 1;
  strip.addEventListener('pointerenter', () => { paused = true; });
  strip.addEventListener('pointerleave', () => { paused = false; });
  function loop() {
    if (!paused) {
      const max = strip.scrollWidth - strip.clientWidth;
      if (max > 4) {
        let sl = strip.scrollLeft + dir * 0.55;
        if (sl >= max) { sl = max; dir = -1; }
        if (sl <= 0) { sl = 0; dir = 1; }
        strip.scrollLeft = sl;
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ---------------- 啟動 ---------------- */
function init() {
  renderWork();
  renderJourney();
  renderAbout();
  renderFooter();
  initTabs();
  initCursor();
  initScrollProgress();
  initStrip();

  $('#topBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
