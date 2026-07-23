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
  { slot: 'work-notchglass', year: '2026', kind: 'macOS App', status: '已上架', badge: '#D6FF3F',
    name: 'NotchGlass',
    desc: '把筆電瀏海那塊「沒用的空間」，變成隨手可用的工具列。獨立設計、獨立開發，已於 Gumroad 上架。',
    impact: null, stack: ['Swift', 'SwiftUI', 'macOS'],
    link: 'notchglass.html', cta: '看介紹・購買' },
  { slot: 'work-injury', year: '2025', kind: 'AI 系統', status: '已收錄', badge: '#D6FF3F',
    name: '運動傷害預防系統',
    desc: '用 AI 預測並提醒運動傷害風險，已在真實場域落地驗證。',
    impact: '獲選收錄於數位發展部年度專書《看見・改變・落地，臺灣 AI 人才的 15 個真實案例》。',
    stack: ['Python', 'ML', 'Computer Vision'] },
  { slot: 'work-stardust', year: '2026', kind: 'Web 小遊戲', status: '可遊玩', badge: '#5CC8FF',
    name: '星塵捕手 Stardust Catcher',
    desc: '一顆游標、一片會流動的星空。移動滑鼠收集金色能量星、避開暗物質漩渦——純 HTML/Canvas 手寫，無框架、無外部相依，點開就能玩。',
    impact: null, stack: ['Canvas 2D', 'Simplex Noise', 'Vanilla JS'],
    link: 'stardust.html', cta: '直接開玩' },
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
  { label: 'INSTAGRAM', sub: '@jia.1oo7', href: 'https://www.instagram.com/jia.1oo7' },
  { label: 'LINKEDIN', sub: '專業經歷', href: 'https://www.linkedin.com/in/chia-peng-chen-60981531b/' },
];
/* cap 先留空，之後要補圖說就直接填字串進去，會自動出現 */
const STRIP = [
  { slot: 'strip-1', cap: '' },
  { slot: 'strip-2', cap: '' },
  { slot: 'strip-3', cap: '' },
  { slot: 'strip-4', cap: '' },
  { slot: 'strip-5', cap: '' },
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
        ${w.link ? `<a class="work-cta" href="${w.link}" style="--cta:${w.badge}">${w.cta || '查看'} <i class="fa-solid fa-arrow-right"></i></a>` : ''}
      </div>`;
    const shot = card.querySelector('.work-shot');
    shot.appendChild(imgSlot(w.slot));
    shot.innerHTML += `<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>`;
    // 有專頁的作品：整張封面也可點
    if (w.link) {
      const a = el('a'); a.href = w.link; a.className = 'work-shot-link';
      a.setAttribute('aria-label', w.name);
      shot.style.cursor = 'pointer';
      shot.addEventListener('click', () => { window.location.href = w.link; });
    }
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

  renderFanStack();
}

/* ---------------- 生活照扇形卡片堆疊 ----------------
   拍立得照片像撲克牌一樣扇形展開：點旁邊的卡或左右拖曳換張，
   下方圓點可直接跳。純 CSS transform + transition，無任何函式庫。 */
function renderFanStack() {
  const strip = $('#strip');
  strip.classList.add('fanstack');
  const stage = el('div', 'fan-stage');
  const dots  = el('div', 'fan-dots');
  strip.appendChild(stage); strip.appendChild(dots);

  const N = STRIP.length;
  let active = 0;

  const cards = STRIP.map((s, i) => {
    const card = el('div', 'strip-card fan-card');
    card.appendChild(imgSlot(s.slot));
    if (s.cap) {                     // 沒填圖說就不畫那個條，之後補了自動出現
      const cap = el('div', 'strip-cap');
      cap.textContent = s.cap;
      card.appendChild(cap);
    }
    card.addEventListener('click', () => { if (i !== active) set(i); });
    stage.appendChild(card);
    return card;
  });

  const dotEls = STRIP.map((s, i) => {
    const d = el('button', 'fan-dot');
    d.setAttribute('aria-label', s.cap || `照片 ${i + 1}`);
    d.addEventListener('click', () => set(i));
    dots.appendChild(d);
    return d;
  });

  function set(i) { active = ((i % N) + N) % N; layout(); }

  // 自動輪播：3.2 秒換一張；滑鼠移入（想看清楚）時暫停，移開後續播
  let timer = null;
  function play() { stop(); timer = setInterval(() => set(active + 1), 3200); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  stage.addEventListener('mouseenter', stop);
  stage.addEventListener('mouseleave', play);
  play();

  function layout() {
    const gap = Math.min(110, stage.clientWidth * 0.16);
    cards.forEach((c, i) => {
      let off = i - active;
      if (off >  N / 2) off -= N;      // 環狀：最短路徑
      if (off < -N / 2) off += N;
      const abs = Math.abs(off);
      const lift  = off === 0 ? -18 : abs * 12;
      const scale = off === 0 ? 1.04 : 0.9;
      c.style.transform =
        `translate(calc(-50% + ${off * gap}px), ${lift}px) rotate(${off * 8}deg) scale(${scale})`;
      c.style.zIndex = String(100 - abs);
      c.classList.toggle('active', off === 0);
    });
    dotEls.forEach((d, i) => d.classList.toggle('on', i === active));
  }

  // 左右拖曳（滑鼠與觸控皆可）
  let sx = null;
  stage.addEventListener('pointerdown', e => { sx = e.clientX; });
  window.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (dx > 40) set(active - 1);
    else if (dx < -40) set(active + 1);
  });
  stage.tabIndex = 0;
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  set(active - 1);
    if (e.key === 'ArrowRight') set(active + 1);
  });

  layout();
  window.addEventListener('resize', layout);

  // ABOUT 分頁一開始是 display:none，這時量到的寬度是 0，
  // 卡片會全部疊在同一個位置。用 ResizeObserver 盯著舞台，
  // 一旦分頁切過來、量出真正的寬度，立刻重新攤開。
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => { if (stage.clientWidth > 0) layout(); });
    ro.observe(stage);
  }
  // 分頁一切到 ABOUT 就同一時間立刻重排一次，不等 ResizeObserver 那個 tick
  document.addEventListener('tabshown', (e) => { if (e.detail.tab === 'about') layout(); });
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

  const wrap = $('.wordmark-wrap');
  let first = true;

  function activate(tab) {
    btns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    Object.entries(panels).forEach(([k, p]) => { p.hidden = k !== tab; });

    // 整站重點色跟著分頁換（nav 膠囊、進度條、區塊標題）
    document.body.classList.remove('tab-work', 'tab-journey', 'tab-about');
    document.body.classList.add('tab-' + tab);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.dispatchEvent(new CustomEvent('tabshown', { detail: { tab } }));

    if (first) { first = false; return; }   // 首次載入不用跳動

    // 主標故障跳動 + 被按的分頁鈕彈一下
    // 動畫播完一定要把 class 拿掉：一次性動畫會蓋掉原本的無限循環動畫，
    // 不移除的話故障層會停在最後一格 → 變成永久殘影。
    if (wrap) {
      wrap.classList.remove('jolt'); void wrap.offsetWidth; wrap.classList.add('jolt');
      clearTimeout(wrap._joltT);
      wrap._joltT = setTimeout(() => wrap.classList.remove('jolt'), 460);
    }
    const btn = [...btns].find(b => b.dataset.tab === tab);
    if (btn) {
      btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
      clearTimeout(btn._popT);
      btn._popT = setTimeout(() => btn.classList.remove('pop'), 400);
    }
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

/* ---------------- Hero 抖動網點底紋（dithering） ----------------
   低解析 Bayer 4×4 抖動 + 流動場，畫在 hero 背景的 canvas 上，
   低透明度、像素風、滑過 hero 會加速流動。無 WebGL、無函式庫。 */
function initDither() {
  const hero = $('.hero');
  if (!hero) return;
  const cv = document.createElement('canvas');
  cv.className = 'dither-bg';
  cv.setAttribute('aria-hidden', 'true');
  hero.prepend(cv);
  const ctx = cv.getContext('2d');

  // Bayer 4×4 門檻矩陣（0..1）
  const B = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5].map(v => (v + .5) / 16);
  const SCALE = 7;                 // 每 7px 一個網點（像素感）

  // 每個分頁一個底紋顏色，切換分頁時平滑過渡過去，
  // 讓使用者一眼看出「畫面真的換了」。
  const TAB_RGB = {
    work:    [214, 255,  63],   // --accent 螢光黃綠
    journey: [255,  92, 168],   // --pink
    about:   [157,  92, 255],   // --purple（原本的顏色）
  };
  let cur = TAB_RGB.work.slice();     // 目前實際畫出來的顏色
  let aim = TAB_RGB.work.slice();     // 目標顏色
  document.addEventListener('tabshown', (e) => {
    const next = TAB_RGB[e.detail.tab];
    if (next) aim = next.slice();
  });

  let w = 0, h = 0, img = null;
  function resize() {
    w = Math.max(2, Math.ceil(hero.clientWidth  / SCALE));
    h = Math.max(2, Math.ceil(hero.clientHeight / SCALE));
    cv.width = w; cv.height = h;
    img = ctx.createImageData(w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0, speed = 1, target = 1;
  hero.addEventListener('pointerenter', () => { target = 3; });
  hero.addEventListener('pointerleave', () => { target = 1; });

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame() {
    speed += (target - speed) * 0.05;
    t += 0.012 * speed;
    // 顏色朝目標色漸變（約 0.6 秒完成，不會突兀）
    for (let k = 0; k < 3; k++) cur[k] += (aim[k] - cur[k]) * 0.06;
    const R = cur[0] | 0, G = cur[1] | 0, Bb = cur[2] | 0;
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // 流動場：兩層正弦交織＋往上淡出（讓底部較濃、頂部乾淨）
        const v = 0.5 + 0.5 * Math.sin(x * 0.11 + t) * Math.cos(y * 0.13 - t * 0.8)
                * (0.35 + 0.65 * (y / h));
        const on = v > B[(y % 4) * 4 + (x % 4)];
        const i = (y * w + x) * 4;
        d[i] = R; d[i + 1] = G; d[i + 2] = Bb;
        d[i + 3] = on ? 255 : 0;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (!still && !document.hidden) requestAnimationFrame(frame);
  }
  if (still) {                                  // 減少動態：只畫靜態，換分頁時直接換色重畫
    frame();
    document.addEventListener('tabshown', () => { cur = aim.slice(); frame(); });
    return;
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(frame); });
  requestAnimationFrame(frame);
}

/* ---------------- ON REPEAT（Spotify 常聽） ----------------
   打 /api/spotify（Cloudflare Worker 端點）拿目前播放 + 近期常聽歌曲。
   API 沒回應或帳號沒在聽也沒關係，整區塊直接隱藏，不會壞版面。 */
function initSpotify() {
  const section = $('#onrepeat');
  if (!section) return;

  fetch('/api/spotify')
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(data => {
      const hasNow = data && data.nowPlaying;
      const hasTop = data && Array.isArray(data.topTracks) && data.topTracks.length > 0;
      if (!hasNow && !hasTop) return; // 沒資料就整區隱藏

      if (hasNow) {
        const np = $('#nowPlaying');
        const t = data.nowPlaying;
        const inner = `
          <img class="np-art" src="${t.image || ''}" alt="" loading="lazy">
          <div class="np-body">
            <div class="np-live"><span class="np-dot"></span>NOW PLAYING</div>
            <div class="np-name">${escapeHtml(t.name)}</div>
            <div class="np-artist">${escapeHtml(t.artist)}</div>
          </div>`;
        if (t.url) {
          np.outerHTML = `<a id="nowPlaying" class="now-playing" href="${t.url}" target="_blank" rel="noopener">${inner}</a>`;
        } else {
          np.hidden = false;
          np.innerHTML = inner;
        }
      }

      if (hasTop) {
        $('#topTracks').innerHTML = data.topTracks.map((t, i) => `
          <a class="track-card" href="${t.url || '#'}" target="_blank" rel="noopener">
            <img class="tc-art" src="${t.image || ''}" alt="" loading="lazy">
            <div class="tc-rank">${String(i + 1).padStart(2, '0')}</div>
            <div class="tc-name">${escapeHtml(t.name)}</div>
            <div class="tc-artist">${escapeHtml(t.artist)}</div>
          </a>`).join('');
      }

      section.hidden = false;
    })
    .catch(() => { /* 沒設定好 API 或暫時抓不到，安靜跳過 */ });
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
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
  initDither();
  initSpotify();

  $('#topBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
