const M = window.Moto;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const factStates = { YES: '是', NO: '否', UNKNOWN: '官方未確認', CONFLICTING: '資訊衝突', NOT_APPLICABLE: '不適用' };
const originLabels = {
  JUDICIAL_EXECUTION: '法院強制執行', CRIMINAL_SEIZURE_OR_FORFEITURE: '查扣／沒收財物', ADMINISTRATIVE_ENFORCEMENT: '行政執行',
  PUBLIC_ASSET_DISPOSAL: '公有財產標售', SCRAP_DISPOSAL: '報廢財物', IMPOUNDED_UNCLAIMED: '逾期未領回車輛', CUSTOMS_FORFEITURE: '海關標售', UNKNOWN: '來源性質未確認',
};
function section(title, rows) {
  return `<section class="detail-section"><h2>${M.escapeHtml(title)}</h2><dl class="detail-facts">${rows.map(([label, value]) => `<div><dt>${M.escapeHtml(label)}</dt><dd>${M.escapeHtml(value ?? '官方未提供')}</dd></div>`).join('')}</dl></section>`;
}
function sourceMethod(adapter) {
  const messages = {
    judicial: '本案由人工核對官方公告；不代表司法院全國案件已自動同步。',
    shwoo: '本案來自臺北惜物網公開頁面；投標與結果仍以官方即時頁面為準。',
    moj_auction: '本案來自法務部集中拍賣官方入口；外部機關明細若未通過來源檢核，本站只保留中央頁可證實的摘要。',
    moj_enforcement: '本案需經人工完成官方搜尋驗證後匯入；本站不破解或繞過驗證碼。',
    moj_enforcement_cms: '本案由行政執行署分署官方公告發現；系統不使用中央驗證碼查詢。',
    pcc: '本案由政府電子採購網官方開放資料發現，再以官方公告核對。',
    customs: '本案來自海關官方公告；受限附件只提供原站連結。',
  };
  return messages[adapter] || '本案來自標示的官方發布機關。';
}
function missingFacts(row) {
  const checks = [
    ['拍賣日期', row.ends_at], ['價格', M.priceInfo(row).value], ['保證金', row.deposit], ['投標資格', row.eligibility && row.eligibility !== 'UNKNOWN'],
    ['領牌狀態', row.registration_status && !['UNKNOWN', 'REGISTRABILITY_UNKNOWN'].includes(row.registration_status)], ['車牌', row.plate_number],
    ['品牌', row.brand_name], ['型號', row.model_name], ['出廠年份', row.manufacture_year], ['排氣量', row.displacement_cc], ['里程', row.mileage_km],
  ];
  return checks.filter(([, value]) => !value).map(([label]) => label);
}
function render(row) {
  document.title = `${M.title(row)}｜臺灣汽機車拍賣情報`;
  const type = M.vehicleType(row);
  const classification = type === 'CAR'
    ? ['汽車類別', M.carCategoryLabels[row.car_category] || '類別未確認']
    : type === 'MOTORCYCLE'
      ? ['機車級別', M.classLabels[row.vehicle_category] || '級別未確認']
      : ['批次類型', type === 'MIXED' ? '汽機車混合批次' : '車種未確認'];
  const displacementLabel = type === 'MOTORCYCLE' ? '機車排氣量' : '引擎排氣量';
  const photos = (Array.isArray(row.photo_urls) ? row.photo_urls : []).map(M.safePhotoUrl).filter(Boolean);
  const documents = (Array.isArray(row.documents) ? row.documents : []).map((document) => ({
    label: typeof document?.label === 'string' ? document.label : '官方附件',
    url: M.safeOfficialUrl(document?.url),
  })).filter((document) => document.url);
  const official = M.safeOfficialUrl(row.official_url);
  const price = M.priceInfo(row);
  const favorite = M.readList(M.FAVORITES_KEY).includes(row.id);
  const missing = missingFacts(row);
  const returnValue = new URLSearchParams(location.search).get('return') || '';
  const backHref = returnValue.startsWith('?') && returnValue.length < 500 ? `./${returnValue}` : './';
  $$('.detail-back, .detail-nav-back').forEach((link) => { link.href = backHref; });
  $('#detail').innerHTML = `<header class="detail-hero"><div><p class="eyebrow">${M.escapeHtml(row.source_name)}・${M.escapeHtml(M.statusLabel(row))}</p><h1>${M.escapeHtml(M.title(row))}</h1><p>${M.escapeHtml(row.official_title)}</p></div><button id="favoriteDetail" class="detail-favorite${favorite ? ' selected' : ''}" type="button" aria-pressed="${favorite}">♥ ${favorite ? '已收藏' : '收藏'}</button></header>
  ${photos.length ? `<section class="detail-gallery" aria-label="官方照片">${photos.map((url, index) => `<a href="${M.escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><img src="${M.escapeHtml(url)}" alt="${M.escapeHtml(M.title(row))} 官方照片 ${index + 1}" loading="${index ? 'lazy' : 'eager'}"></a>`).join('')}</section>` : '<p class="detail-no-photo">官方未提供照片。本頁不使用示意圖替代。</p>'}
  <div class="detail-decision"><div><span>${M.escapeHtml(price.label)}</span><strong>${M.escapeHtml(M.money(price.value))}</strong></div><div><span>拍賣截止</span><strong>${M.escapeHtml(M.dateTime(row.ends_at))}</strong></div><div><span>誰能投標</span><strong>${M.escapeHtml(M.eligibilityLabels[row.eligibility] || '未確認')}</strong></div><div><span>能否領牌</span><strong>${M.escapeHtml(M.registrationLabels[row.registration_status] || '未確認')}</strong></div></div>
  <div class="detail-grid">${section('拍賣重點', [['案件狀態', M.statusLabel(row)], ['拍賣底價', M.money(row.reserve_price)], ['目前出價', M.money(row.current_price)], ['成交價', M.money(row.sold_price)], ['保證金', M.money(row.deposit)], ['開始時間', M.dateTime(row.starts_at)], ['截止時間', M.dateTime(row.ends_at)], ['拍賣次數', row.auction_round ? `第 ${row.auction_round} 次` : '官方未提供']])}
  ${section('車輛資料', [['車輛類型', M.vehicleTypeLabels[type]], classification, ['車牌', row.plate_number || '官方未提供／已逾公開期'], ['品牌', row.brand_name || '官方未提供'], ['型號', row.model_name || '官方未提供'], [displacementLabel, row.displacement_cc != null ? `${row.displacement_cc} c.c.` : '官方未提供'], ['出廠年月', row.manufacture_year ? `${row.manufacture_year} 年${row.manufacture_month ? ` ${row.manufacture_month} 月` : ''}` : '官方未提供'], ['顏色', row.color || '官方未提供'], ['里程', row.mileage_km != null ? `${Number(row.mileage_km).toLocaleString('zh-TW')} 公里` : '官方未提供'], ['數量', row.lot_size > 1 ? `${row.lot_size} 輛${row.bulk_lot ? '（整批）' : ''}` : '1 輛']])}
  ${section('資格與領牌', [['投標資格', M.eligibilityLabels[row.eligibility] || '官方未確認'], ['領牌狀態', M.registrationLabels[row.registration_status] || '官方未確認']])}
  ${section('車況', [['有無鑰匙', factStates[row.has_key] || '官方未確認'], ['能否發動', factStates[row.can_start] || '官方未確認'], ['能否測試', factStates[row.can_test] || '官方未確認'], ['車況摘要', row.condition_summary || '官方未提供']])}
  ${section('機關與來源', [['拍賣機關', row.organization_name], ['處分性質', originLabels[row.disposal_origin] || '未確認'], ['地區', M.region(row)], ['地點', row.location || '官方未提供'], ['官方案號', row.official_case_number || '官方未提供'], ['最近同步', M.dateTime(row.last_synced_at)], ['資料完整度', `${Number(row.completeness || 0)}%`]])}</div>
  <section class="detail-section detail-wide"><h2>資料缺口</h2>${missing.length ? `<p>官方公告或目前解析尚未提供：${missing.map(M.escapeHtml).join('、')}。缺少不代表否定，請以官方全文及現場查驗為準。</p>` : '<p>主要購車判斷欄位已有資料；仍須以官方最新公告與現場查驗為準。</p>'}</section>
  ${Array.isArray(row.fee_notes) && row.fee_notes.length ? `<section class="detail-section detail-wide"><h2>費用與注意事項</h2><ul>${row.fee_notes.map((note) => `<li>${M.escapeHtml(note)}</li>`).join('')}</ul></section>` : ''}
  ${documents.length ? `<section class="detail-section detail-wide"><h2>官方附件</h2><p>附件保留在發布機關網站，本站不建立公開副本。</p><ul class="document-list">${documents.map((document, index) => `<li><a href="${M.escapeHtml(document.url)}" target="_blank" rel="noopener noreferrer">${M.escapeHtml(document.label)}${documents.length > 1 ? ` ${index + 1}` : ''} ↗</a></li>`).join('')}</ul></section>` : ''}
  <section class="detail-section detail-wide"><h2>投標前檢查清單</h2><ol class="buyer-checklist"><li>先開啟官方完整公告，確認是否停拍、改期或更正。</li><li>確認投標資格、應備證件、投標方式與截止時間。</li><li>確認底價、保證金、付款期限，以及欠稅、罰鍰與其他費用。</li><li>依官方開放時間現場看車；確認鑰匙、發動、測試與拖運安排。</li><li>向監理及稅捐機關確認過戶、重新領牌或不得領牌的限制。</li></ol></section>
  <section class="source-method"><strong>這筆資料如何取得</strong><p>${M.escapeHtml(sourceMethod(row.source_adapter))}</p></section>
  <section class="official-callout"><div><strong>投標與案件異動，以官方公告為準</strong><p>本站整理購車判斷欄位，不代替官方投標文件。</p></div>${official ? `<a class="button" href="${M.escapeHtml(official)}" target="_blank" rel="noopener noreferrer">查看官方完整公告 ↗</a>` : '<span>官方連結暫未通過安全檢查</span>'}</section>`;
  $('#favoriteDetail').addEventListener('click', (event) => {
    const result = M.toggleList(M.FAVORITES_KEY, row.id);
    if (result.error) { event.currentTarget.textContent = '無法儲存收藏'; return; }
    event.currentTarget.classList.toggle('selected', result.added);
    event.currentTarget.setAttribute('aria-pressed', String(result.added));
    event.currentTarget.textContent = result.added ? '♥ 已收藏' : '♥ 收藏';
  });
  const galleryImages = [...document.querySelectorAll('.detail-gallery img')];
  galleryImages.forEach((image) => image.addEventListener('error', () => {
    image.closest('a')?.remove();
    if (!document.querySelector('.detail-gallery img')) document.querySelector('.detail-gallery')?.replaceWith(Object.assign(document.createElement('p'), { className: 'detail-no-photo', textContent: '官方照片目前無法顯示，請到官方公告查看。' }));
  }));
  $('#detail').hidden = false;
}
async function load() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id || id.length > 300) { $('#detailLoading').hidden = true; $('#detailError').hidden = false; return; }
  try {
    const rows = await M.fetchRows(`&id=eq.${encodeURIComponent(id)}`);
    if (!rows.length) throw new Error('not found');
    render(rows[0]);
  } catch (error) { console.error(error); $('#detailError').hidden = false; }
  finally { $('#detailLoading').hidden = true; }
}
load();
