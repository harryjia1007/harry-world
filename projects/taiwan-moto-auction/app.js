const M = window.Moto;
const DAY = 86400000;
const statusLabels = { DISCOVERED: '已發現', ANNOUNCED: '已公告', SCHEDULED: '進行中', SOLD: '已得標', UNSOLD: '未得標', WITHDRAWN: '已撤回', CANCELLED: '已取消', EXPIRED: '已截止', UNKNOWN: '結果待官方確認' };
const state = { view: 'active', keyword: '', vehicleClass: '', cc: '', hasPhotos: false, rows: [] };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function ccMatch(value, band) {
  const item = M.ccBands.find((candidate) => candidate.value === band);
  return item ? item.test(value == null ? null : Number(value)) : true;
}
function favorites() { return M.readList(M.FAVORITES_KEY); }
function compared() { return M.readList(M.COMPARE_KEY); }
function filtered() {
  const now = Date.now();
  const query = state.keyword.toLocaleLowerCase('zh-TW').replace(/\s/g, '');
  const favoriteIds = favorites();
  return state.rows.filter((item) => {
    // 目標客群是一般民眾：限合格回收商的車一律不顯示（不論哪個來源、哪個分頁）。
    // 這是前端保險，讓既有資料庫裡的回收商車即刻消失；擷取端也已停收（見 ingestion）。
    if (item.eligibility === 'LICENSED_RECYCLER_ONLY') return false;
    const ended = M.isEnded(item);
    const scheduled = !ended && (item.auction_status === 'SCHEDULED' || Boolean(item.ends_at && new Date(item.ends_at).getTime() >= now));
    if (state.view === 'active' && !scheduled) return false;
    if (state.view === 'ended' && !ended) return false;
    if (state.view === 'within30' && (ended || !item.ends_at || new Date(item.ends_at).getTime() > now + 30 * DAY)) return false;
    if (state.view === 'favorites' && !favoriteIds.includes(item.id)) return false;
    if (query && !Object.values(item).filter((value) => typeof value === 'string').join(' ').toLocaleLowerCase('zh-TW').replace(/\s/g, '').includes(query)) return false;
    if (state.vehicleClass && item.vehicle_category !== state.vehicleClass) return false;
    if (state.cc && !ccMatch(item.displacement_cc, state.cc)) return false;
    if (state.hasPhotos && !(Array.isArray(item.photo_urls) && item.photo_urls.some(M.safePhotoUrl))) return false;
    return true;
  }).sort((a, b) => {
    const aEnded = M.isEnded(a), bEnded = M.isEnded(b);
    if (aEnded !== bEnded) return aEnded ? 1 : -1;
    const aTime = a.ends_at ? new Date(a.ends_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.ends_at ? new Date(b.ends_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aEnded ? bTime - aTime : aTime - bTime;
  });
}
function fact(label, value) { return `<div><dt>${M.escapeHtml(label)}</dt><dd>${M.escapeHtml(value ?? '官方未提供')}</dd></div>`; }
function photoMarkup(item) {
  const urls = (Array.isArray(item.photo_urls) ? item.photo_urls : []).map(M.safePhotoUrl).filter(Boolean);
  if (!urls.length) return '<p class="no-photo-note">官方未提供照片</p>';
  return `<div class="photo-carousel" data-index="0">${urls.map((url, index) => `<img src="${M.escapeHtml(url)}" alt="${M.escapeHtml(M.title(item))} 官方照片 ${index + 1}" loading="lazy" ${index ? 'hidden' : ''}>`).join('')}${urls.length > 1 ? `<button class="photo-prev" type="button" aria-label="上一張照片">‹</button><button class="photo-next" type="button" aria-label="下一張照片">›</button><span class="photo-count">1 / ${urls.length}</span>` : ''}<span class="official-photo">官方來源照片</span><div class="photo-failed" hidden>官方照片暫時無法顯示</div></div>`;
}
// 卡片高訊號標籤：只在有明確值時顯示，UNKNOWN／null 一律不出現（維持誠實、不製造雜訊）。
// 資料早已由擷取管線填好，只是列表頁先前沒露出——買家掃視時最在意的就是這幾項。
function signalChips(item) {
  const chips = [];
  const round = Number(item.auction_round);
  if (round >= 1) chips.push(`<span class="signal-chip${round >= 2 ? ' signal-chip-hot' : ''}">第 ${round} 拍</span>`);
  if (item.manufacture_year) chips.push(`<span class="signal-chip">${M.escapeHtml(String(item.manufacture_year))} 年車</span>`);
  if (item.can_start === 'NO') chips.push('<span class="signal-chip signal-chip-warn">不能發動</span>');
  if (item.has_key === 'NO') chips.push('<span class="signal-chip signal-chip-warn">無鑰匙</span>');
  if (item.can_test === 'YES') chips.push('<span class="signal-chip signal-chip-good">可試車</span>');
  return chips.length ? `<div class="signal-chips">${chips.join('')}</div>` : '';
}
function card(item) {
  const isFavorite = favorites().includes(item.id);
  const isCompared = compared().includes(item.id);
  const price = item.sold_price ?? item.current_price ?? item.reserve_price;
  const article = document.createElement('article');
  article.className = `card${Array.isArray(item.photo_urls) && item.photo_urls.length ? '' : ' card-without-photo'}`;
  article.dataset.id = item.id;
  article.innerHTML = `<button class="favorite-button${isFavorite ? ' selected' : ''}" type="button" aria-label="${isFavorite ? '取消收藏' : '加入收藏'}" aria-pressed="${isFavorite}">♥</button>${photoMarkup(item)}<div class="card-body"><div class="source"><i></i>${M.escapeHtml(item.source_name)}<span class="status ${M.isEnded(item) ? 'ended' : 'active-status'}">${M.escapeHtml(statusLabels[item.auction_status] || '狀態未確認')}</span></div><h3><a href="./detail.html?id=${encodeURIComponent(item.id)}">${M.escapeHtml(M.title(item))}</a></h3><p class="official-title">${M.escapeHtml(item.official_title)}</p>${signalChips(item)}<div class="gates"><div class="gate"><span>誰能投標</span><strong>${M.escapeHtml(M.eligibilityLabels[item.eligibility] || '未確認')}</strong></div><div class="gate"><span>能否領牌</span><strong>${M.escapeHtml(M.registrationLabels[item.registration_status] || '未確認')}</strong></div></div><dl class="facts">${fact('車牌', item.plate_number || '官方未提供／已逾公開期')}${fact('法定級別', M.classLabels[item.vehicle_category] || '級別未確認')}${fact('排氣量', item.displacement_cc == null ? '官方未提供' : `${item.displacement_cc} c.c.`)}${fact('價格', M.money(price))}${fact('拍賣截止', M.dateTime(item.ends_at))}${fact('拍賣機關', item.organization_name)}${fact('地點', item.location || '官方未提供')}</dl>${item.condition_summary ? `<p class="condition">${M.escapeHtml(item.condition_summary)}</p>` : ''}<div class="card-actions"><a class="detail-link" href="./detail.html?id=${encodeURIComponent(item.id)}">查看完整資料</a><button class="compare-button${isCompared ? ' selected' : ''}" type="button" aria-pressed="${isCompared}">${isCompared ? '已加入比較' : '加入比較'}</button><span>完整度 ${Number(item.completeness || 0)}%</span></div></div>`;
  wireCard(article);
  return article;
}
function wireCard(article) {
  const id = article.dataset.id;
  article.querySelector('.favorite-button').addEventListener('click', (event) => {
    const result = M.toggleList(M.FAVORITES_KEY, id);
    event.currentTarget.classList.toggle('selected', result.added);
    event.currentTarget.setAttribute('aria-pressed', String(result.added));
    event.currentTarget.setAttribute('aria-label', result.added ? '取消收藏' : '加入收藏');
    render();
  });
  article.querySelector('.compare-button').addEventListener('click', (event) => {
    const result = M.toggleList(M.COMPARE_KEY, id, 3);
    if (result.full) { showMessage('一次最多比較 3 台，請先移除一台。'); return; }
    event.currentTarget.classList.toggle('selected', result.added);
    event.currentTarget.setAttribute('aria-pressed', String(result.added));
    event.currentTarget.textContent = result.added ? '已加入比較' : '加入比較';
    updateCompareTray();
  });
  const carousel = article.querySelector('.photo-carousel');
  if (!carousel) return;
  const images = [...carousel.querySelectorAll('img')];
  const count = carousel.querySelector('.photo-count');
  const show = (next) => {
    const index = (next + images.length) % images.length;
    carousel.dataset.index = index;
    images.forEach((image, i) => { image.hidden = i !== index; });
    if (count) count.textContent = `${index + 1} / ${images.length}`;
  };
  carousel.querySelector('.photo-prev')?.addEventListener('click', () => show(Number(carousel.dataset.index) - 1));
  carousel.querySelector('.photo-next')?.addEventListener('click', () => show(Number(carousel.dataset.index) + 1));
  images.forEach((image) => image.addEventListener('error', () => {
    image.remove();
    const remaining = carousel.querySelectorAll('img');
    if (!remaining.length) { carousel.querySelector('.photo-failed').hidden = false; carousel.classList.add('image-error'); }
  }));
}
function renderCcOptions() {
  const selected = state.cc;
  const select = $('#cc');
  select.replaceChildren(new Option('全部排氣量', ''), ...M.ccBands.map((band) => new Option(`${band.label}（${state.rows.filter((row) => band.test(row.displacement_cc == null ? null : Number(row.displacement_cc))).length}）`, band.value)));
  select.value = selected;
}
function render() {
  const items = filtered();
  $('#results').replaceChildren(...items.map(card));
  $('#empty').hidden = items.length !== 0 || !state.rows.length;
  $('#emptyHint').textContent = state.view === 'favorites' ? '按案件右上角的愛心，就會收藏在這台裝置。' : '可切換案件狀態或清除部分條件。';
  const labels = { active: '進行中', within30: '未來 30 天', ended: '已結束', favorites: '我的收藏', all: '全部正式案件' };
  const ccLabel = M.ccBands.find((band) => band.value === state.cc)?.label;
  const parts = [labels[state.view], state.keyword ? `搜尋「${state.keyword}」` : null, state.vehicleClass ? M.classLabels[state.vehicleClass] : null, ccLabel, state.hasPhotos ? '有照片' : null, `共 ${items.length} 筆`].filter(Boolean);
  $('#summary').textContent = parts.join('・');
  $('#chips').replaceChildren(...parts.slice(0, -1).map((text) => { const chip = document.createElement('span'); chip.className = 'chip'; chip.textContent = text; return chip; }));
  $('#favoriteCount').textContent = favorites().length;
  $$('.tabs button').forEach((button) => { const on = button.dataset.view === state.view; button.classList.toggle('active', on); button.setAttribute('aria-selected', String(on)); });
  const params = new URLSearchParams();
  if (state.view !== 'all') params.set('view', state.view);
  if (state.keyword) params.set('q', state.keyword);
  if (state.vehicleClass) params.set('class', state.vehicleClass);
  if (state.cc) params.set('cc', state.cc);
  if (state.hasPhotos) params.set('photos', '1');
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
  updateCompareTray();
}
function updateCompareTray() {
  const count = compared().length;
  $('#compareTray').hidden = count === 0;
  $('#compareCount').textContent = count;
  $('#openCompare').disabled = count < 2;
}

// ---- 訂閱搜尋（主動通知）----
// 純瀏覽器端：條件與「已看過的案件」都存在使用者裝置，不上傳、不含個資、不寄信。
// 通知只在頁面開著／被重新打開時觸發，這是純前端方案的誠實限制（沒有背景推播伺服器）。
function matchCriteria(rows, c) {
  const now = Date.now();
  const query = (c.keyword || '').toLocaleLowerCase('zh-TW').replace(/\s/g, '');
  return rows.filter((item) => {
    const ended = M.isEnded(item);
    const scheduled = !ended && (item.auction_status === 'SCHEDULED' || Boolean(item.ends_at && new Date(item.ends_at).getTime() >= now));
    if (c.view === 'active' && !scheduled) return false;
    if (c.view === 'ended' && !ended) return false;
    if (c.view === 'within30' && (ended || !item.ends_at || new Date(item.ends_at).getTime() > now + 30 * DAY)) return false;
    if (query && !Object.values(item).filter((v) => typeof v === 'string').join(' ').toLocaleLowerCase('zh-TW').replace(/\s/g, '').includes(query)) return false;
    if (c.vehicleClass && item.vehicle_category !== c.vehicleClass) return false;
    if (c.cc && !ccMatch(item.displacement_cc, c.cc)) return false;
    if (c.hasPhotos && !(Array.isArray(item.photo_urls) && item.photo_urls.some(M.safePhotoUrl))) return false;
    return true;
  });
}
function describeCriteria(c) {
  const labels = { active: '進行中', within30: '未來 30 天', ended: '已結束', all: '全部' };
  const ccLabel = M.ccBands.find((band) => band.value === c.cc)?.label;
  const parts = [labels[c.view] || '全部', c.keyword ? `「${c.keyword}」` : null, c.vehicleClass ? M.classLabels[c.vehicleClass] : null, ccLabel, c.hasPhotos ? '有照片' : null].filter(Boolean);
  return parts.join('・') || '全部案件';
}
function currentCriteria() {
  return { view: state.view === 'favorites' ? 'all' : state.view, keyword: state.keyword, vehicleClass: state.vehicleClass, cc: state.cc, hasPhotos: state.hasPhotos };
}
function subscribeCurrentSearch() {
  const criteria = currentCriteria();
  const watches = M.readWatches();
  const label = describeCriteria(criteria);
  if (watches.some((w) => w.label === label)) { showMessage('這個搜尋條件已經訂閱過了。'); return; }
  const seenIds = matchCriteria(state.rows, criteria).map((r) => r.id);
  watches.push({ id: `w${Date.now()}`, label, criteria, seenIds });
  M.writeWatches(watches);
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
  renderWatches();
  showMessage(`已訂閱「${label}」。符合的新機車出現、且你開著本頁時會通知你。`);
}
function removeWatch(id) {
  M.writeWatches(M.readWatches().filter((w) => w.id !== id));
  renderWatches();
}
function renderWatches() {
  const watches = M.readWatches();
  const wrap = $('#watches');
  if (!wrap) return;
  wrap.hidden = watches.length === 0;
  $('#watchList').replaceChildren(...watches.map((w) => {
    const el = document.createElement('div');
    el.className = 'watch-item';
    el.innerHTML = `<button class="watch-apply" type="button" data-id="${M.escapeHtml(w.id)}">${M.escapeHtml(w.label)}</button><button class="watch-remove" type="button" data-id="${M.escapeHtml(w.id)}" aria-label="移除訂閱">✕</button>`;
    return el;
  }));
}
// 回傳每個訂閱的新增筆數；commit=true 時把目前符合的 id 存回 seenIds（看過即清零）。
function watchNewCounts(rows, watches, commit) {
  const counts = {};
  let mutated = false;
  for (const w of watches) {
    const matchIds = matchCriteria(rows, w.criteria).map((r) => r.id);
    const seen = new Set(w.seenIds || []);
    const fresh = matchIds.filter((id) => !seen.has(id));
    counts[w.id] = fresh.length;
    if (commit && fresh.length) { w.seenIds = matchIds; mutated = true; }
  }
  if (commit && mutated) M.writeWatches(watches);
  return counts;
}
// 進站時偵測各訂閱的新案件：更新畫面提示，並在有權限時發瀏覽器通知，然後把已看過的存回。
function detectAndNotifyWatches(rows) {
  const watches = M.readWatches();
  if (!watches.length) { renderWatches(); return; }
  const counts = watchNewCounts(rows, watches, false);
  const hits = watches.filter((w) => counts[w.id] > 0);
  const total = hits.reduce((s, w) => s + counts[w.id], 0);
  if (total > 0) {
    showMessage(`你的訂閱有 ${total} 筆新機車：${hits.map((w) => `${w.label}（${counts[w.id]}）`).join('、')}。`);
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('臺灣機車拍賣情報', {
          body: `有 ${total} 筆符合你訂閱條件的新機車`,
          tag: 'taiwan-moto-watch',
        });
      } catch { /* 部分瀏覽器需在使用者手勢後才能發，靜默略過 */ }
    }
  }
  watchNewCounts(rows, watches, true); // 標記為已看過，下次不重複提示
  renderWatches();
}
function renderComparison() {
  const rows = compared().map((id) => state.rows.find((row) => row.id === id)).filter(Boolean);
  const fields = [
    ['案件', (row) => M.title(row)], ['來源', (row) => row.source_name], ['車牌', (row) => row.plate_number || '未提供'],
    ['級別', (row) => M.classLabels[row.vehicle_category] || '未確認'], ['排氣量', (row) => row.displacement_cc ? `${row.displacement_cc} c.c.` : '未提供'],
    ['價格', (row) => M.money(row.sold_price ?? row.current_price ?? row.reserve_price)], ['截止', (row) => M.dateTime(row.ends_at)],
    ['投標資格', (row) => M.eligibilityLabels[row.eligibility] || '未確認'], ['領牌', (row) => M.registrationLabels[row.registration_status] || '未確認'],
  ];
  $('#compareContent').innerHTML = `<table class="compare-table"><tbody>${fields.map(([label, get]) => `<tr><th>${label}</th>${rows.map((row) => `<td>${M.escapeHtml(get(row))}</td>`).join('')}</tr>`).join('')}<tr><th></th>${rows.map((row) => `<td><a href="./detail.html?id=${encodeURIComponent(row.id)}">查看詳情</a></td>`).join('')}</tr></tbody></table>`;
}
function showMessage(text) { $('#alerts').hidden = false; $('#alertText').textContent = text; }
function renderAlerts(changes) {
  const ids = favorites();
  const due = state.rows.filter((row) => ids.includes(row.id) && !M.isEnded(row) && M.daysUntil(row.ends_at) != null && M.daysUntil(row.ends_at) >= 0 && M.daysUntil(row.ends_at) <= 3);
  const relevantChanges = changes.filter((change) => ids.includes(change.id));
  const messages = [];
  if (due.length) messages.push(`${due.length} 筆收藏將在 3 天內截止`);
  if (relevantChanges.length) messages.push(`${relevantChanges.length} 筆收藏價格有異動`);
  if (messages.length) showMessage(`${messages.join('；')}。請查看「我的收藏」並以官方公告為準。`);
}
function readUrl() {
  const params = new URLSearchParams(location.search), view = params.get('view');
  state.view = ['active', 'within30', 'ended', 'favorites', 'all'].includes(view) ? view : 'active';
  state.keyword = (params.get('q') || '').slice(0, 80);
  state.vehicleClass = Object.hasOwn(M.classLabels, params.get('class')) ? params.get('class') : '';
  state.cc = M.ccBands.some((band) => band.value === params.get('cc')) ? params.get('cc') : '';
  state.hasPhotos = params.get('photos') === '1';
  $('#keyword').value = state.keyword; $('#vehicleClass').value = state.vehicleClass; $('#hasPhotos').checked = state.hasPhotos;
}
async function load() {
  $('#loading').hidden = false; $('#error').hidden = true; $('#empty').hidden = true;
  try {
    const rows = await M.fetchRows();
    if (!Array.isArray(rows)) throw new Error('資料格式錯誤');
    state.rows = rows;
    renderCcOptions(); $('#cc').value = state.cc;
    const latest = rows.map((row) => row.last_synced_at).filter(Boolean).sort().at(-1);
    $('#syncStatus').textContent = latest ? `最近同步 ${M.relativeTime(latest)}` : '目前尚無案件';
    renderSourcePanel(rows);
    const changes = M.rememberSnapshots(rows.filter((row) => favorites().includes(row.id)));
    renderAlerts(changes); render(); detectAndNotifyWatches(rows);
  } catch (error) {
    console.error(error); $('#error').hidden = false; $('#syncStatus').textContent = '資料暫時離線';
    $('#sourceGrid').innerHTML = '<p class="source-loading">正式資料暫時無法統計</p>';
  } finally { $('#loading').hidden = true; }
}
// P3：每個來源各自的筆數、最後同步時間（相對）、新鮮度色點與來源性質說明。
// 時間戳全部由資料本身算出，是事實；不宣稱我們的抓取頻率，避免過度承諾即時性。
function renderSourcePanel(rows) {
  const bySource = new Map();
  for (const row of rows) {
    if (row.eligibility === 'LICENSED_RECYCLER_ONLY') continue; // 不計入，與畫面顯示一致
    const key = row.source_adapter || 'other';
    const entry = bySource.get(key) || { count: 0, latest: null, sourceName: row.source_name };
    entry.count += 1;
    if (row.source_name && !entry.sourceName) entry.sourceName = row.source_name;
    if (row.last_synced_at && (!entry.latest || row.last_synced_at > entry.latest)) entry.latest = row.last_synced_at;
    bySource.set(key, entry);
  }
  const freshLabels = { fresh: '資料新', recent: '近期同步', stale: '較久未更新', unknown: '時間未知' };
  const cards = [...bySource.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, e]) => {
      // 未知的 adapter 用資料自己的 source_name 當名稱，不讓多個未知來源都變成同一張「其他」卡
      const name = M.escapeHtml(M.sourceLabels[key] || e.sourceName || '其他官方來源');
      const note = M.escapeHtml(M.sourceNotes[key] || e.sourceName || '官方公告來源');
      const level = M.freshnessLevel(e.latest);
      const rel = e.latest ? M.relativeTime(e.latest) : '尚無同步紀錄';
      return `<article class="source-card" data-fresh="${level}">
        <div class="source-card-top"><span class="source-name">${name}</span><span class="source-count">${e.count}</span></div>
        <p class="source-note">${note}</p>
        <div class="source-sync"><span class="fresh-dot" title="${freshLabels[level]}"></span><span>最後同步 ${M.escapeHtml(rel)}</span></div>
      </article>`;
    }).join('');
  $('#sourceGrid').innerHTML = cards || '<p class="source-loading">目前尚無案件</p>';
}

$$('.tabs button').forEach((button) => button.addEventListener('click', () => { state.view = button.dataset.view; render(); }));

/* 篩選改成即時套用，不用按「套用」才有反應。
   理由：ui-ux-pro-max 的 UX 準則點名「Search: 要邊打邊給預測／回饋，不要逼使用者
   打完再按 enter」。這個站的資料量小（幾十筆、全部已在前端記憶體裡），filtered()
   純粹是陣列運算，即時重繪沒有效能問題，卻能省掉每次調條件都要多按一次的成本。
   「套用」按鈕保留：表單仍可送出（按 Enter 也會觸發），對鍵盤與讀屏使用者是明確的
   完成訊號，移掉反而會讓無障礙體驗變差。 */
function applyFiltersFromForm() {
  state.keyword = $('#keyword').value.trim();
  state.vehicleClass = $('#vehicleClass').value;
  state.cc = $('#cc').value;
  state.hasPhotos = $('#hasPhotos').checked;
  render();
}
$('#filters').addEventListener('submit', (event) => { event.preventDefault(); applyFiltersFromForm(); });
// 打字用 debounce，避免每個字元都重繪整個列表；下拉與勾選是離散操作，立即套用。
let keywordTimer;
$('#keyword').addEventListener('input', () => {
  clearTimeout(keywordTimer);
  keywordTimer = setTimeout(applyFiltersFromForm, 200);
});
$('#vehicleClass').addEventListener('change', applyFiltersFromForm);
$('#cc').addEventListener('change', applyFiltersFromForm);
$('#hasPhotos').addEventListener('change', applyFiltersFromForm);
$('#clearFilters').addEventListener('click', () => { state.keyword = ''; state.vehicleClass = ''; state.cc = ''; state.hasPhotos = false; $('#filters').reset(); renderCcOptions(); render(); });
$('#retry').addEventListener('click', load);
$('#clearCompare').addEventListener('click', () => { M.writeList(M.COMPARE_KEY, []); render(); });
$('#openCompare').addEventListener('click', () => { renderComparison(); $('#compareDialog').showModal(); });
$('#closeCompare').addEventListener('click', () => $('#compareDialog').close());
// 訂閱搜尋
$('#subscribeSearch').addEventListener('click', subscribeCurrentSearch);
$('#watchList').addEventListener('click', (event) => {
  const applyBtn = event.target.closest('.watch-apply');
  const removeBtn = event.target.closest('.watch-remove');
  if (removeBtn) { removeWatch(removeBtn.dataset.id); return; }
  if (applyBtn) {
    const w = M.readWatches().find((x) => x.id === applyBtn.dataset.id);
    if (!w) return;
    const c = w.criteria;
    state.view = c.view; state.keyword = c.keyword || ''; state.vehicleClass = c.vehicleClass || ''; state.cc = c.cc || ''; state.hasPhotos = !!c.hasPhotos;
    $('#keyword').value = state.keyword; $('#vehicleClass').value = state.vehicleClass; $('#cc').value = state.cc; $('#hasPhotos').checked = state.hasPhotos;
    render();
  }
});
readUrl(); load(); renderWatches();
