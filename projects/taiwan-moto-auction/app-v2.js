const M = window.Moto;
const DAY = 86400000;
const lifecycleLabels = { active: '進行中', within30: '未來 30 天', ended: '已結束紀錄', favorites: '我的收藏', scrap: '報廢／回收專區', all: '全部可查案件' };
const sortLabels = { deadline: '快截止優先', newest: '最近同步優先', priceLow: '價格低到高', priceHigh: '價格高到低', completeness: '資料完整優先' };
const state = {
  view: 'active', vehicleType: 'all', keyword: '', source: '', region: '', vehicleClass: '', carCategory: '', cc: '',
  eligibility: '', registration: '', deadlineDays: '', minPrice: '', maxPrice: '', hasPhotos: false, singleLot: false,
  sort: 'deadline', rows: [],
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function ccMatch(value, band) {
  const item = M.ccBands.find((candidate) => candidate.value === band);
  return item ? item.test(value == null ? null : Number(value)) : true;
}
function favorites() { return M.readList(M.FAVORITES_KEY); }
function compared() { return M.readList(M.COMPARE_KEY); }
function preferredPrice(row) { return M.priceInfo(row).value; }
function matchesLifecycle(item, view = state.view) {
  const scrap = M.isScrap(item);
  if (view === 'scrap') return scrap;
  if (scrap) return false;
  if (view === 'favorites') return favorites().includes(item.id);
  if (view === 'all') return true;
  if (view === 'active') return M.isActive(item);
  if (view === 'ended') return M.isEnded(item);
  if (view === 'within30') {
    if (!M.isActive(item) || !item.ends_at) return false;
    const time = new Date(item.ends_at).getTime();
    return time >= Date.now() && time <= Date.now() + 30 * DAY;
  }
  return false;
}
function matchesFilters(item, options = {}) {
  const type = M.vehicleType(item);
  if (!matchesLifecycle(item, options.view || state.view)) return false;
  if (!options.ignoreVehicle && state.vehicleType !== 'all' && type !== state.vehicleType) return false;
  const query = state.keyword.toLocaleLowerCase('zh-TW').replace(/\s/g, '');
  const searchable = [item.plate_number, item.brand_name, item.model_name, item.organization_name, item.official_title, item.official_case_number, item.location].filter(Boolean).join(' ').toLocaleLowerCase('zh-TW').replace(/\s/g, '');
  if (query && !searchable.includes(query)) return false;
  if (state.source && item.source_adapter !== state.source) return false;
  if (state.region && M.region(item) !== state.region) return false;
  if (!options.ignoreTypeFilters && state.vehicleClass && (type !== 'MOTORCYCLE' || item.vehicle_category !== state.vehicleClass)) return false;
  if (!options.ignoreTypeFilters && state.carCategory && (type !== 'CAR' || item.car_category !== state.carCategory)) return false;
  if (!options.ignoreCc && state.cc && (type !== 'MOTORCYCLE' || !ccMatch(item.displacement_cc, state.cc))) return false;
  if (state.eligibility && item.eligibility !== state.eligibility) return false;
  if (state.registration && item.registration_status !== state.registration) return false;
  if (state.deadlineDays) {
    if (!M.isActive(item) || !item.ends_at) return false;
    if (new Date(item.ends_at).getTime() > Date.now() + Number(state.deadlineDays) * DAY) return false;
  }
  const price = preferredPrice(item);
  if (state.minPrice !== '' && (price == null || price < Number(state.minPrice))) return false;
  if (state.maxPrice !== '' && (price == null || price > Number(state.maxPrice))) return false;
  if (state.hasPhotos && !(Array.isArray(item.photo_urls) && item.photo_urls.some(M.safePhotoUrl))) return false;
  if (state.singleLot && (item.bulk_lot || Number(item.lot_size || 1) > 1)) return false;
  return true;
}
function sortRows(rows) {
  return rows.sort((a, b) => {
    if (state.sort === 'newest') return new Date(b.last_synced_at || 0) - new Date(a.last_synced_at || 0);
    if (state.sort === 'priceLow' || state.sort === 'priceHigh') {
      const direction = state.sort === 'priceLow' ? 1 : -1;
      const aPrice = preferredPrice(a), bPrice = preferredPrice(b);
      if (aPrice == null && bPrice != null) return 1;
      if (aPrice != null && bPrice == null) return -1;
      if (aPrice !== bPrice) return direction * (Number(aPrice || 0) - Number(bPrice || 0));
    }
    if (state.sort === 'completeness') return Number(b.completeness || 0) - Number(a.completeness || 0);
    const aEnded = M.isEnded(a), bEnded = M.isEnded(b);
    if (aEnded !== bEnded) return aEnded ? 1 : -1;
    const aTime = a.ends_at ? new Date(a.ends_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.ends_at ? new Date(b.ends_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aEnded ? bTime - aTime : aTime - bTime;
  });
}
function filtered() { return sortRows(state.rows.filter((item) => matchesFilters(item))); }
function fact(label, value) { return `<div><dt>${M.escapeHtml(label)}</dt><dd>${M.escapeHtml(value ?? '官方未提供')}</dd></div>`; }
function deadlineText(item) {
  if (!item.ends_at) return '拍賣日期待核對';
  const days = M.daysUntil(item.ends_at);
  if (days == null) return '拍賣日期待核對';
  if (days < 0) return '已截止';
  if (days === 0) return '今天截止';
  return `${days} 天後截止`;
}
function riskMarkup(item) {
  const risks = [];
  if ([null, undefined, '', 'UNKNOWN'].includes(item.eligibility)) risks.push('投標資格未確認');
  if ([null, undefined, '', 'UNKNOWN', 'REGISTRABILITY_UNKNOWN'].includes(item.registration_status)) risks.push('領牌狀態未確認');
  if (item.has_key === 'NO') risks.push('官方註記無鑰匙');
  if (item.can_test === 'NO') risks.push('官方註記不能測試');
  if (item.can_test === 'CONFLICTING' || item.can_start === 'CONFLICTING') risks.push('車況資訊有衝突');
  if (item.bulk_lot || Number(item.lot_size || 1) > 1) risks.push('整批投標');
  return risks.length ? `<div class="risk-list" aria-label="重要提醒">${risks.slice(0, 3).map((risk) => `<span>${M.escapeHtml(risk)}</span>`).join('')}</div>` : '';
}
function photoMarkup(item) {
  const urls = (Array.isArray(item.photo_urls) ? item.photo_urls : []).map(M.safePhotoUrl).filter(Boolean);
  if (!urls.length) return '<p class="no-photo-note">官方未提供照片</p>';
  return `<div class="photo-carousel" data-index="0" tabindex="0" aria-label="${M.escapeHtml(M.title(item))} 官方照片，可用左右方向鍵切換">${urls.map((url, index) => `<img src="${M.escapeHtml(url)}" alt="${M.escapeHtml(M.title(item))} 官方照片 ${index + 1}" loading="lazy" ${index ? 'hidden' : ''}>`).join('')}${urls.length > 1 ? `<button class="photo-prev" type="button" aria-label="上一張照片">‹</button><button class="photo-next" type="button" aria-label="下一張照片">›</button><span class="photo-count">1 / ${urls.length}</span>` : ''}<span class="official-photo">官方來源照片</span><div class="photo-failed" hidden>官方照片暫時無法顯示</div></div>`;
}
function currentReturnSearch() {
  const params = new URLSearchParams();
  if (state.view !== 'active') params.set('view', state.view);
  if (state.vehicleType !== 'all') params.set('vehicle', state.vehicleType.toLowerCase());
  if (state.keyword) params.set('q', state.keyword);
  if (state.source) params.set('source', state.source);
  if (state.region) params.set('region', state.region);
  if (state.vehicleClass) params.set('class', state.vehicleClass);
  if (state.carCategory) params.set('car', state.carCategory);
  if (state.cc) params.set('cc', state.cc);
  if (state.eligibility) params.set('eligibility', state.eligibility);
  if (state.registration) params.set('registration', state.registration);
  if (state.deadlineDays) params.set('within', state.deadlineDays);
  if (state.minPrice !== '') params.set('minPrice', state.minPrice);
  if (state.maxPrice !== '') params.set('maxPrice', state.maxPrice);
  if (state.hasPhotos) params.set('photos', '1');
  if (state.singleLot) params.set('single', '1');
  if (state.sort !== 'deadline') params.set('sort', state.sort);
  return params.size ? `?${params}` : '';
}
function detailHref(item) { return `./detail.html?id=${encodeURIComponent(item.id)}&return=${encodeURIComponent(currentReturnSearch())}`; }
function card(item) {
  const isFavorite = favorites().includes(item.id);
  const isCompared = compared().includes(item.id);
  const price = M.priceInfo(item);
  const article = document.createElement('article');
  const type = M.vehicleType(item);
  const categoryFacts = type === 'MOTORCYCLE'
    ? `${fact('機車級別', M.classLabels[item.vehicle_category] || '級別未確認')}${fact('排氣量', item.displacement_cc == null ? '官方未提供' : `${item.displacement_cc} c.c.`)}`
    : type === 'CAR'
      ? `${fact('汽車類別', M.carCategoryLabels[item.car_category] || '類別未確認')}${fact('引擎排氣量', item.displacement_cc == null ? '官方未提供' : `${item.displacement_cc} c.c.`)}`
      : `${fact('車輛類型', M.vehicleTypeLabels[type])}${fact('批次數量', item.lot_size > 1 ? `${item.lot_size} 輛` : '官方未提供')}`;
  const officialTitle = item.official_title && item.official_title !== M.title(item) ? `<p class="official-title">${M.escapeHtml(item.official_title)}</p>` : '';
  article.className = `card${Array.isArray(item.photo_urls) && item.photo_urls.some(M.safePhotoUrl) ? '' : ' card-without-photo'}`;
  article.dataset.id = item.id;
  article.innerHTML = `<button class="favorite-button${isFavorite ? ' selected' : ''}" type="button" aria-label="${isFavorite ? '取消收藏' : '加入收藏'}" aria-pressed="${isFavorite}">♥</button>${photoMarkup(item)}<div class="card-body"><div class="source"><i></i>${M.escapeHtml(item.source_name)}<span class="vehicle-badge">${M.escapeHtml(M.vehicleTypeLabels[type])}</span><span class="status ${M.isEnded(item) ? 'ended' : 'active-status'}">${M.escapeHtml(M.statusLabel(item))}</span></div><div class="deadline-line"><strong>${M.escapeHtml(deadlineText(item))}</strong><span>${M.escapeHtml(M.dateTime(item.ends_at))}</span></div><h3><a href="${detailHref(item)}">${M.escapeHtml(M.title(item))}</a></h3>${officialTitle}<div class="gates"><div class="gate"><span>${M.escapeHtml(price.label)}</span><strong>${M.escapeHtml(M.money(price.value))}</strong></div><div class="gate"><span>誰能投標</span><strong>${M.escapeHtml(M.eligibilityLabels[item.eligibility] || '未確認')}</strong></div><div class="gate"><span>能否領牌</span><strong>${M.escapeHtml(M.registrationLabels[item.registration_status] || '未確認')}</strong></div><div class="gate"><span>拍賣地點</span><strong>${M.escapeHtml(item.location || M.region(item))}</strong></div></div>${riskMarkup(item)}<dl class="facts">${fact('車牌', item.plate_number || '官方未提供／已逾公開期')}${categoryFacts}${fact('拍賣機關', item.organization_name)}${fact('拍賣次數', item.auction_round ? `第 ${item.auction_round} 次` : '官方未提供')}</dl>${type === 'MIXED' ? '<p class="condition">本案為汽機車混合批次；官方未逐車分列的規格不會被推定。</p>' : ''}<div class="card-actions"><a class="detail-link" href="${detailHref(item)}">查看完整資料</a><button class="compare-button${isCompared ? ' selected' : ''}" type="button" aria-pressed="${isCompared}">${isCompared ? '已加入比較' : '加入比較'}</button><span>資料完整度 ${Number(item.completeness || 0)}%</span></div></div>`;
  wireCard(article);
  return article;
}
function wireCard(article) {
  const id = article.dataset.id;
  article.querySelector('.favorite-button').addEventListener('click', (event) => {
    const result = M.toggleList(M.FAVORITES_KEY, id);
    if (result.error) { showMessage('瀏覽器目前無法儲存收藏，請檢查隱私模式或儲存空間設定。'); return; }
    event.currentTarget.classList.toggle('selected', result.added);
    event.currentTarget.setAttribute('aria-pressed', String(result.added));
    event.currentTarget.setAttribute('aria-label', result.added ? '取消收藏' : '加入收藏');
    render();
  });
  article.querySelector('.compare-button').addEventListener('click', (event) => {
    const result = M.toggleList(M.COMPARE_KEY, id, 3);
    if (result.full) { showMessage('一次最多比較 3 台，請先移除一台。'); return; }
    if (result.error) { showMessage('瀏覽器目前無法儲存比較清單。'); return; }
    event.currentTarget.classList.toggle('selected', result.added);
    event.currentTarget.setAttribute('aria-pressed', String(result.added));
    event.currentTarget.textContent = result.added ? '已加入比較' : '加入比較';
    updateCompareTray();
  });
  const carousel = article.querySelector('.photo-carousel');
  if (!carousel) return;
  const count = carousel.querySelector('.photo-count');
  const show = (next) => {
    const images = [...carousel.querySelectorAll('img')];
    if (!images.length) return;
    const index = (next + images.length) % images.length;
    carousel.dataset.index = index;
    images.forEach((image, i) => { image.hidden = i !== index; });
    if (count) count.textContent = `${index + 1} / ${images.length}`;
  };
  carousel.querySelector('.photo-prev')?.addEventListener('click', () => show(Number(carousel.dataset.index) - 1));
  carousel.querySelector('.photo-next')?.addEventListener('click', () => show(Number(carousel.dataset.index) + 1));
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(Number(carousel.dataset.index) - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(Number(carousel.dataset.index) + 1); }
  });
  [...carousel.querySelectorAll('img')].forEach((image) => image.addEventListener('error', () => {
    image.remove();
    const remaining = carousel.querySelectorAll('img');
    if (!remaining.length) { carousel.querySelector('.photo-failed').hidden = false; carousel.classList.add('image-error'); }
    else show(Math.min(Number(carousel.dataset.index), remaining.length - 1));
  }));
}
function contextRowsForTypeCounts() { return state.rows.filter((row) => matchesFilters(row, { ignoreVehicle: true, ignoreTypeFilters: true, ignoreCc: true })); }
function renderCcOptions() {
  const selected = state.cc;
  const motorcycles = state.rows.filter((row) => M.vehicleType(row) === 'MOTORCYCLE' && matchesFilters(row, { ignoreVehicle: true, ignoreCc: true }));
  $('#cc').replaceChildren(new Option('全部排氣量', ''), ...M.ccBands.map((band) => new Option(`${band.label}（${motorcycles.filter((row) => band.test(row.displacement_cc == null ? null : Number(row.displacement_cc))).length}）`, band.value)));
  $('#cc').value = selected;
}
function replaceOptions(select, entries, firstLabel, selected) {
  select.replaceChildren(new Option(firstLabel, ''), ...entries.map(([value, label]) => new Option(label, value)));
  select.value = entries.some(([value]) => value === selected) ? selected : '';
}
function renderDynamicOptions() {
  const sources = [...new Set(state.rows.map((row) => row.source_adapter).filter(Boolean))].sort().map((adapter) => [adapter, M.sourceLabels[adapter] || adapter]);
  const regions = [...new Set(state.rows.map(M.region))].sort((a, b) => a.localeCompare(b, 'zh-TW')).map((name) => [name, name]);
  replaceOptions($('#source'), sources, '全部來源', state.source);
  replaceOptions($('#region'), regions, '全部地區', state.region);
  state.source = $('#source').value;
  state.region = $('#region').value;
}
function clearFilter(key) {
  if (key === 'vehicleType') state.vehicleType = 'all';
  else if (['hasPhotos', 'singleLot'].includes(key)) state[key] = false;
  else if (key === 'sort') state.sort = 'deadline';
  else state[key] = '';
  if (key === 'vehicleType') { state.vehicleClass = ''; state.carCategory = ''; state.cc = ''; }
  syncForm(); render();
}
function renderChips(items) {
  const chips = [{ label: lifecycleLabels[state.view], static: true }];
  if (state.vehicleType !== 'all') chips.push({ key: 'vehicleType', label: M.vehicleTypeLabels[state.vehicleType] });
  const additions = [
    ['keyword', state.keyword && `搜尋「${state.keyword}」`], ['source', state.source && (M.sourceLabels[state.source] || state.source)], ['region', state.region],
    ['vehicleClass', state.vehicleClass && M.classLabels[state.vehicleClass]], ['carCategory', state.carCategory && M.carCategoryLabels[state.carCategory]],
    ['cc', state.cc && M.ccBands.find((band) => band.value === state.cc)?.label], ['eligibility', state.eligibility && M.eligibilityLabels[state.eligibility]],
    ['registration', state.registration && M.registrationLabels[state.registration]], ['deadlineDays', state.deadlineDays && `${state.deadlineDays} 天內`],
    ['minPrice', state.minPrice !== '' && `最低 ${M.money(state.minPrice)}`], ['maxPrice', state.maxPrice !== '' && `最高 ${M.money(state.maxPrice)}`],
    ['hasPhotos', state.hasPhotos && '有照片'], ['singleLot', state.singleLot && '單輛'], ['sort', state.sort !== 'deadline' && sortLabels[state.sort]],
  ];
  additions.forEach(([key, label]) => { if (label) chips.push({ key, label }); });
  $('#chips').replaceChildren(...chips.map((item) => {
    if (item.static) { const span = document.createElement('span'); span.className = 'chip'; span.textContent = item.label; return span; }
    const button = document.createElement('button'); button.type = 'button'; button.className = 'chip removable'; button.textContent = `${item.label} ×`; button.addEventListener('click', () => clearFilter(item.key)); return button;
  }));
  const conditions = chips.filter((chip) => !chip.static).length;
  const typeLabel = state.vehicleType === 'all' ? '全部車輛' : M.vehicleTypeLabels[state.vehicleType];
  $('#summary').textContent = `${lifecycleLabels[state.view]}・${typeLabel}${conditions ? `・${conditions} 個篩選` : ''}・共 ${items.length} 筆`;
}
function renderCounts() {
  $('#activeCount').textContent = state.rows.filter((row) => matchesLifecycle(row, 'active')).length;
  $('#within30Count').textContent = state.rows.filter((row) => matchesLifecycle(row, 'within30')).length;
  $('#endedCount').textContent = state.rows.filter((row) => matchesLifecycle(row, 'ended')).length;
  $('#scrapCount').textContent = state.rows.filter((row) => matchesLifecycle(row, 'scrap')).length;
  $('#favoriteCount').textContent = favorites().length;
  const context = contextRowsForTypeCounts();
  $('#allVehicleCount').textContent = context.length;
  $('#motorcycleCount').textContent = context.filter((row) => M.vehicleType(row) === 'MOTORCYCLE').length;
  $('#carCount').textContent = context.filter((row) => M.vehicleType(row) === 'CAR').length;
  $('#mixedCount').textContent = context.filter((row) => M.vehicleType(row) === 'MIXED').length;
}
function render() {
  renderCcOptions();
  const items = filtered();
  $('#results').replaceChildren(...items.map(card));
  $('#empty').hidden = items.length !== 0 || !state.rows.length;
  $('#emptyHint').textContent = state.view === 'favorites' ? '按案件右上角的愛心，就會收藏在這台裝置。' : '目前條件可能太窄，也可能是該來源尚未完成更新。';
  renderChips(items); renderCounts();
  $$('.tabs button').forEach((button) => { const on = button.dataset.view === state.view; button.classList.toggle('active', on); button.setAttribute('aria-selected', String(on)); });
  $$('.vehicle-tabs button').forEach((button) => { const on = button.dataset.vehicle === state.vehicleType; button.classList.toggle('active', on); button.setAttribute('aria-selected', String(on)); });
  $('#motorcycleClassField').hidden = state.vehicleType !== 'MOTORCYCLE';
  $('#ccField').hidden = state.vehicleType !== 'MOTORCYCLE';
  $('#carCategoryField').hidden = state.vehicleType !== 'CAR';
  if (state.vehicleClass || state.carCategory || state.cc || state.eligibility || state.registration || state.deadlineDays || state.minPrice !== '' || state.maxPrice !== '' || state.hasPhotos || state.singleLot) $('#advancedFilters').open = true;
  const params = new URLSearchParams();
  if (state.view !== 'active') params.set('view', state.view);
  if (state.vehicleType !== 'all') params.set('vehicle', state.vehicleType.toLowerCase());
  if (state.keyword) params.set('q', state.keyword);
  if (state.source) params.set('source', state.source);
  if (state.region) params.set('region', state.region);
  if (state.vehicleClass) params.set('class', state.vehicleClass);
  if (state.carCategory) params.set('car', state.carCategory);
  if (state.cc) params.set('cc', state.cc);
  if (state.eligibility) params.set('eligibility', state.eligibility);
  if (state.registration) params.set('registration', state.registration);
  if (state.deadlineDays) params.set('within', state.deadlineDays);
  if (state.minPrice !== '') params.set('minPrice', state.minPrice);
  if (state.maxPrice !== '') params.set('maxPrice', state.maxPrice);
  if (state.hasPhotos) params.set('photos', '1');
  if (state.singleLot) params.set('single', '1');
  if (state.sort !== 'deadline') params.set('sort', state.sort);
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
  updateCompareTray();
}
function updateCompareTray() {
  const count = compared().length;
  $('#compareTray').hidden = count === 0;
  $('#compareCount').textContent = count;
  $('#openCompare').disabled = count < 2;
}
function renderComparison() {
  const rows = compared().map((id) => state.rows.find((row) => row.id === id)).filter(Boolean);
  const fields = [
    ['來源', (row) => row.source_name], ['車牌', (row) => row.plate_number || '未提供'], ['車輛類型', (row) => M.vehicleTypeLabels[M.vehicleType(row)]],
    ['車輛分類', (row) => M.vehicleType(row) === 'CAR' ? (M.carCategoryLabels[row.car_category] || '未確認') : M.vehicleType(row) === 'MOTORCYCLE' ? (M.classLabels[row.vehicle_category] || '未確認') : '混合批次'],
    ['引擎排氣量', (row) => row.displacement_cc ? `${row.displacement_cc} c.c.` : '未提供'],
    ['價格', (row) => { const price = M.priceInfo(row); return `${price.label}：${M.money(price.value)}`; }], ['截止', (row) => M.dateTime(row.ends_at)],
    ['投標資格', (row) => M.eligibilityLabels[row.eligibility] || '未確認'], ['領牌', (row) => M.registrationLabels[row.registration_status] || '未確認'],
  ];
  $('#compareContent').innerHTML = `<table class="compare-table"><thead><tr><th>比較項目</th>${rows.map((row) => `<th>${M.escapeHtml(M.title(row))}<button type="button" data-remove-compare="${M.escapeHtml(row.id)}">移除</button></th>`).join('')}</tr></thead><tbody>${fields.map(([label, get]) => `<tr><th>${label}</th>${rows.map((row) => `<td>${M.escapeHtml(get(row))}</td>`).join('')}</tr>`).join('')}<tr><th></th>${rows.map((row) => `<td><a href="${detailHref(row)}">查看詳情</a></td>`).join('')}</tr></tbody></table>`;
  $$('[data-remove-compare]').forEach((button) => button.addEventListener('click', () => {
    M.toggleList(M.COMPARE_KEY, button.dataset.removeCompare); renderComparison(); updateCompareTray(); render();
    if (compared().length < 2) $('#compareDialog').close();
  }));
}
function showMessage(text) { $('#alerts').hidden = false; $('#alertText').textContent = text; }
function sourceLatest(rows) { return rows.map((row) => row.last_synced_at).filter(Boolean).sort().at(-1) || null; }
function renderSourceHealth(rows) {
  const staleNames = [];
  $('#sourceHealth').replaceChildren(...M.sourceMeta.map((meta) => {
    const sourceRows = rows.filter((row) => row.source_adapter === meta.adapter);
    const latest = sourceLatest(sourceRows);
    const stale = latest && meta.staleHours && Date.now() - new Date(latest).getTime() > meta.staleHours * 60 * 60 * 1000;
    if (stale) staleNames.push(meta.name);
    const active = sourceRows.filter((row) => matchesLifecycle(row, 'active')).length;
    const status = !sourceRows.length ? '尚未匯入' : stale ? `更新逾 ${meta.staleHours} 小時` : meta.staleHours == null ? '人工核對' : '已有正式資料';
    const card = document.createElement('article');
    card.className = `source-health-card${stale || !sourceRows.length ? ' warning' : ''}`;
    card.innerHTML = `<div><h3>${M.escapeHtml(meta.name)}</h3><span>${M.escapeHtml(status)}</span></div><p>${M.escapeHtml(meta.scope)}</p><dl><div><dt>同步方式</dt><dd>${M.escapeHtml(meta.mode)}</dd></div><div><dt>目前收錄</dt><dd>${sourceRows.length} 筆</dd></div><div><dt>進行中</dt><dd>${active} 筆</dd></div><div><dt>最後資料時間</dt><dd>${latest ? M.escapeHtml(M.dateTime(latest)) : '尚無'}</dd></div></dl><a href="${M.escapeHtml(meta.officialUrl)}" target="_blank" rel="noopener noreferrer">前往官方來源 ↗</a>`;
    return card;
  }));
  const active = rows.filter((row) => matchesLifecycle(row, 'active')).length;
  $('#sourceCounts').textContent = `共收錄 ${rows.length} 筆正式資料，其中 ${active} 筆拍賣日期尚未到。`;
  return staleNames;
}
function renderAlerts(changes, staleNames) {
  const ids = favorites();
  const due = state.rows.filter((row) => ids.includes(row.id) && M.isActive(row) && M.daysUntil(row.ends_at) != null && M.daysUntil(row.ends_at) >= 0 && M.daysUntil(row.ends_at) <= 3);
  const relevantChanges = changes.filter((change) => ids.includes(change.id));
  const messages = [];
  if (staleNames.length) messages.push(`${staleNames.join('、')}超過 36 小時未更新`);
  if (due.length) messages.push(`${due.length} 筆收藏將在 3 天內截止`);
  if (relevantChanges.length) messages.push(`${relevantChanges.length} 筆收藏價格有異動`);
  $('#alerts').hidden = !messages.length;
  $('#alertText').textContent = messages.length ? `${messages.join('；')}。既有資料仍保留，投標前請查看官方公告。` : '';
}
function safeNumber(value) {
  if (value === null || value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? String(Math.round(number)) : '';
}
function readUrl() {
  const params = new URLSearchParams(location.search), view = params.get('view');
  state.view = ['active', 'within30', 'ended', 'favorites', 'scrap', 'all'].includes(view) ? view : 'active';
  const vehicle = (params.get('vehicle') || '').toUpperCase();
  state.vehicleType = ['MOTORCYCLE', 'CAR', 'MIXED'].includes(vehicle) ? vehicle : 'all';
  state.keyword = (params.get('q') || '').slice(0, 80);
  state.source = /^[a-z_]{1,40}$/.test(params.get('source') || '') ? params.get('source') : '';
  state.region = (params.get('region') || '').slice(0, 20);
  state.vehicleClass = Object.hasOwn(M.classLabels, params.get('class')) ? params.get('class') : '';
  state.carCategory = Object.hasOwn(M.carCategoryLabels, params.get('car')) ? params.get('car') : '';
  state.cc = M.ccBands.some((band) => band.value === params.get('cc')) ? params.get('cc') : '';
  state.eligibility = Object.hasOwn(M.eligibilityLabels, params.get('eligibility')) ? params.get('eligibility') : '';
  state.registration = Object.hasOwn(M.registrationLabels, params.get('registration')) ? params.get('registration') : '';
  state.deadlineDays = ['3', '7', '14', '30'].includes(params.get('within')) ? params.get('within') : '';
  state.minPrice = safeNumber(params.get('minPrice'));
  state.maxPrice = safeNumber(params.get('maxPrice'));
  state.hasPhotos = params.get('photos') === '1';
  state.singleLot = params.get('single') === '1';
  state.sort = Object.hasOwn(sortLabels, params.get('sort')) ? params.get('sort') : 'deadline';
  if (state.vehicleType === 'CAR') { state.vehicleClass = ''; state.cc = ''; }
  if (state.vehicleType === 'MOTORCYCLE') state.carCategory = '';
  if (['MIXED', 'all'].includes(state.vehicleType)) { state.vehicleClass = ''; state.carCategory = ''; state.cc = ''; }
}
function syncForm() {
  $('#keyword').value = state.keyword; $('#source').value = state.source; $('#region').value = state.region; $('#sort').value = state.sort;
  $('#vehicleClass').value = state.vehicleClass; $('#carCategory').value = state.carCategory; $('#cc').value = state.cc;
  $('#eligibility').value = state.eligibility; $('#registration').value = state.registration; $('#deadline').value = state.deadlineDays;
  $('#minPrice').value = state.minPrice; $('#maxPrice').value = state.maxPrice; $('#hasPhotos').checked = state.hasPhotos; $('#singleLot').checked = state.singleLot;
}
function resetFilters() {
  Object.assign(state, { vehicleType: 'all', keyword: '', source: '', region: '', vehicleClass: '', carCategory: '', cc: '', eligibility: '', registration: '', deadlineDays: '', minPrice: '', maxPrice: '', hasPhotos: false, singleLot: false, sort: 'deadline' });
  syncForm();
}
async function load() {
  $('#loading').hidden = false; $('#error').hidden = true; $('#empty').hidden = true;
  try {
    const rows = await M.fetchRows();
    state.rows = [...new Map(rows.map((row) => [row.id, row])).values()];
    M.pruneList(M.FAVORITES_KEY, state.rows.map((row) => row.id));
    M.pruneList(M.COMPARE_KEY, state.rows.map((row) => row.id));
    renderDynamicOptions(); renderCcOptions(); syncForm();
    const latest = sourceLatest(state.rows);
    const staleNames = renderSourceHealth(state.rows);
    $('#syncStatus').textContent = latest ? `最新一筆資料 ${M.dateTime(latest)}；各來源時間見下方` : '目前尚無案件';
    $('.sync-pill').classList.toggle('stale', Boolean(staleNames.length));
    renderAlerts(M.rememberSnapshots(state.rows.filter((row) => favorites().includes(row.id))), staleNames);
    render();
  } catch (error) {
    console.error(error); $('#error').hidden = false; $('#syncStatus').textContent = '資料暫時離線'; $('#sourceCounts').textContent = '正式資料暫時無法統計';
  } finally { $('#loading').hidden = true; }
}

$$('.tabs button').forEach((button) => button.addEventListener('click', () => {
  state.view = button.dataset.view;
  if (['ended', 'scrap', 'all'].includes(state.view)) state.deadlineDays = '';
  syncForm(); render();
}));
$$('.vehicle-tabs button').forEach((button) => button.addEventListener('click', () => {
  state.vehicleType = button.dataset.vehicle;
  if (state.vehicleType === 'CAR') { state.vehicleClass = ''; state.cc = ''; }
  else if (state.vehicleType === 'MOTORCYCLE') state.carCategory = '';
  else { state.vehicleClass = ''; state.carCategory = ''; state.cc = ''; }
  syncForm(); render();
}));
$('#filters').addEventListener('submit', (event) => {
  event.preventDefault();
  state.keyword = $('#keyword').value.trim().slice(0, 80); state.source = $('#source').value; state.region = $('#region').value; state.sort = $('#sort').value;
  state.vehicleClass = $('#vehicleClass').value; state.carCategory = $('#carCategory').value; state.cc = $('#cc').value;
  state.eligibility = $('#eligibility').value; state.registration = $('#registration').value; state.deadlineDays = $('#deadline').value;
  state.minPrice = safeNumber($('#minPrice').value); state.maxPrice = safeNumber($('#maxPrice').value);
  state.hasPhotos = $('#hasPhotos').checked; state.singleLot = $('#singleLot').checked; render();
});
$('#clearFilters').addEventListener('click', () => { resetFilters(); render(); });
$('#emptyClear').addEventListener('click', () => { resetFilters(); state.view = 'active'; render(); });
$('#emptyEnded').addEventListener('click', () => { resetFilters(); state.view = 'ended'; render(); });
$('#retry').addEventListener('click', load);
$('#clearCompare').addEventListener('click', () => { M.writeList(M.COMPARE_KEY, []); render(); });
$('#openCompare').addEventListener('click', () => { renderComparison(); $('#compareDialog').showModal(); });
$('#closeCompare').addEventListener('click', () => $('#compareDialog').close());
readUrl(); load();
