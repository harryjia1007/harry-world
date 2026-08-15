const M = window.Moto;
const $ = (selector) => document.querySelector(selector);
const yesNo = { YES: '是', NO: '否', UNKNOWN: '官方未確認', NOT_APPLICABLE: '不適用' };
function section(title, rows) {
  const visible = rows.filter(([, value]) => value != null && value !== '');
  if (!visible.length) return '';
  return `<section class="detail-section"><h2>${M.escapeHtml(title)}</h2><dl class="detail-facts">${visible.map(([label, value]) => `<div><dt>${M.escapeHtml(label)}</dt><dd>${M.escapeHtml(value)}</dd></div>`).join('')}</dl></section>`;
}
function render(row) {
  document.title = `${M.title(row)}｜臺灣機車拍賣情報`;
  const photos = (Array.isArray(row.photo_urls) ? row.photo_urls : []).map(M.safePhotoUrl).filter(Boolean);
  const official = M.safeOfficialUrl(row.official_url);
  const price = row.sold_price ?? row.current_price ?? row.reserve_price;
  const favorite = M.readList(M.FAVORITES_KEY).includes(row.id);
  $('#detail').innerHTML = `<header class="detail-hero"><div><p class="eyebrow">${M.escapeHtml(row.source_name)}・${M.isEnded(row) ? '已結束' : '進行中'}</p><h1>${M.escapeHtml(M.title(row))}</h1><p>${M.escapeHtml(row.official_title)}</p></div><button id="favoriteDetail" class="detail-favorite${favorite ? ' selected' : ''}" type="button" aria-pressed="${favorite}">♥ ${favorite ? '已收藏' : '收藏'}</button></header>
  ${photos.length ? `<section class="detail-gallery">${photos.map((url, index) => `<a href="${M.escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><img src="${M.escapeHtml(url)}" alt="${M.escapeHtml(M.title(row))} 官方照片 ${index + 1}" loading="${index ? 'lazy' : 'eager'}"></a>`).join('')}</section>` : '<p class="detail-no-photo">官方未提供照片。本頁不使用示意圖替代。</p>'}
  <div class="detail-grid">${section('拍賣重點', [['目前價格', M.money(price)], ['底價', M.money(row.reserve_price)], ['保證金', M.money(row.deposit)], ['開始時間', M.dateTime(row.starts_at)], ['截止時間', M.dateTime(row.ends_at)], ['拍賣次數', row.auction_round ? `第 ${row.auction_round} 次` : '官方未提供'], ['案件狀態', row.auction_status || '官方未確認']])}
  ${section('車輛資料', [['車牌', row.plate_number || '官方未提供／已逾公開期'], ['品牌', row.brand_name || '官方未提供'], ['型號', row.model_name || '官方未提供'], ['法定級別', M.classLabels[row.vehicle_category] || '級別未確認'], ['排氣量', row.displacement_cc ? `${row.displacement_cc} c.c.` : '官方未提供'], ['出廠年月', row.manufacture_year ? `${row.manufacture_year} 年${row.manufacture_month ? ` ${row.manufacture_month} 月` : ''}` : '官方未提供'], ['顏色', row.color || '官方未提供'], ['里程', row.mileage_km != null ? `${Number(row.mileage_km).toLocaleString('zh-TW')} 公里` : '官方未提供'], ['數量', row.lot_size > 1 ? `${row.lot_size} 輛${row.bulk_lot ? '（整批）' : ''}` : '1 輛']])}
  ${section('資格與領牌', [['投標資格', M.eligibilityLabels[row.eligibility] || '官方未確認'], ['領牌狀態', M.registrationLabels[row.registration_status] || '官方未確認']])}
  ${section('車況', [['有無鑰匙', yesNo[row.has_key] || '官方未確認'], ['能否發動', yesNo[row.can_start] || '官方未確認'], ['能否測試', yesNo[row.can_test] || '官方未確認'], ['車況摘要', row.condition_summary || '官方未提供'], ['其他說明', row.description || '官方未提供']])}
  ${section('機關與來源', [['拍賣機關', row.organization_name], ['地點', row.location || '官方未提供'], ['官方案號', row.official_case_number || '官方未提供'], ['最近同步', M.dateTime(row.last_synced_at)], ['資料完整度', `${Number(row.completeness || 0)}%`]])}</div>
  ${Array.isArray(row.fee_notes) && row.fee_notes.length ? `<section class="detail-section"><h2>費用與注意事項</h2><ul>${row.fee_notes.map((note) => `<li>${M.escapeHtml(note)}</li>`).join('')}</ul></section>` : ''}
  <section class="official-callout"><div><strong>投標與案件異動，以官方公告為準</strong><p>本站協助整理欄位，不代替官方投標文件。</p></div>${official ? `<a class="button" href="${M.escapeHtml(official)}" target="_blank" rel="noopener noreferrer">查看官方完整公告 ↗</a>` : ''}</section>`;
  $('#favoriteDetail').addEventListener('click', (event) => { const result = M.toggleList(M.FAVORITES_KEY, row.id); event.currentTarget.classList.toggle('selected', result.added); event.currentTarget.setAttribute('aria-pressed', String(result.added)); event.currentTarget.textContent = result.added ? '♥ 已收藏' : '♥ 收藏'; });
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
