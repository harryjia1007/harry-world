/* 臺北惜物網（shwoo.gov.taipei）擷取。robots.txt 對 /shwoo/ 明確 Allow，見 AUTO-INGESTION-POLICY.md。
   搜尋是傳統 POST 表單（無 JSON API），流程：先 GET 進階搜尋頁拿 jsessionid，
   再 POST q_item1=C（物品分類：運輸車輛）+ order=5（依上架日期新到舊排序）取得列表 HTML，
   用正則從固定的卡片區塊裡切欄位。頁面結構若改版，這裡的正則需要跟著更新。 */

import { upsertListings } from './supabase.js';
import {
  isMotorcycleTitle, classifyVehicleCategory, extractPlateNumber,
  extractDisplacementCc, refineCategoryByCc,
} from './vehicle-match.js';

const BASE = 'https://shwoo.gov.taipei';
const UA = 'Mozilla/5.0 (compatible; TaiwanMotoAuctionBot/1.0; +https://harryjia.com/projects/taiwan-moto-auction/legal.html)';
const ORGANIZATION_NAME = '臺北市動產質借處';
const ITEM_BLOCK_MARKER = '<div class="col-xs-6 col-md-3  padding10a">';

async function getSessionId() {
  const res = await fetch(`${BASE}/shwoo/browse/browse00/advancedQuery?isRecyclerLink=N&q_unit1value4C=`, {
    headers: { 'user-agent': UA },
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const cookieMatch = setCookie.match(/JSESSIONID=([^;]+)/i);
  if (cookieMatch) return cookieMatch[1];
  const urlMatch = new URL(res.url).pathname.match(/jsessionid=([^;?]+)/i);
  return urlMatch ? urlMatch[1] : null;
}

async function fetchListingHtml(isRecyclerLink, sessionId) {
  const path = `/shwoo/browse/browse00/advancedQuery${sessionId ? `;jsessionid=${sessionId}` : ''}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA },
    body: new URLSearchParams({ q_item1: 'C', order: '5', isRecyclerLink }).toString(),
  });
  if (!res.ok) throw new Error(`shwoo listing fetch failed: ${res.status}`);
  return res.text();
}

function extract(block, re) {
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function rocDateToIso(rocDate) {
  const [y, m, d] = rocDate.split('/').map(Number);
  return new Date(Date.UTC(y + 1911, m - 1, d, 15, 59, 59)).toISOString(); // 23:59:59 台北時間
}

function parseItemBlock(block) {
  const auid = extract(block, /AUID=(\d+)/);
  if (!auid) return null;
  const title = extract(block, /alt="([^"]+)"/);
  if (!isMotorcycleTitle(title)) return null;

  const location = extract(block, /class="caption">\s*([^<]+)<br>/);
  const reserveRaw = extract(block, /底價<span[^>]*>([\d,]+)<\/span>/);
  const currentRaw = extract(block, /出價<span[^>]*>([\d,]+)<\/span>/);
  const deadline = extract(block, /(\d{3}\/\d{2}\/\d{2})截止/);
  const photoPath = extract(block, /src="(\/shwoo\/image[^"]+)"/);
  const cc = extractDisplacementCc(title);

  return {
    auid,
    title,
    location,
    reservePrice: reserveRaw ? Number(reserveRaw.replace(/,/g, '')) : null,
    currentPrice: currentRaw ? Number(currentRaw.replace(/,/g, '')) : null,
    endsAt: deadline ? rocDateToIso(deadline) : null,
    photoUrl: photoPath ? `${BASE}${photoPath.replace(/;jsessionid=[^&?]+/, '')}` : null,
    vehicleCategory: refineCategoryByCc(classifyVehicleCategory(title), cc),
    plateNumber: extractPlateNumber(title),
    displacementCc: cc,
  };
}

function computeCompleteness(item) {
  const fields = [item.title, item.location, item.reservePrice, item.endsAt, item.photoUrl];
  return Math.round((fields.filter((v) => v != null).length / fields.length) * 100);
}

const PLATE_VISIBILITY_WINDOW_MS = 30 * 86400000;

function toRow(item, isRecyclerLink) {
  const endsAtMs = item.endsAt ? new Date(item.endsAt).getTime() : null;
  const ended = endsAtMs != null && endsAtMs < Date.now();
  const platePastPurgeWindow = endsAtMs != null && Date.now() - endsAtMs > PLATE_VISIBILITY_WINDOW_MS;
  return {
    id: `shwoo-${item.auid}`,
    source_adapter: 'shwoo',
    source_name: '臺北惜物網',
    official_title: item.title,
    brand_name: null,
    model_name: null,
    organization_name: ORGANIZATION_NAME,
    location: item.location,
    vehicle_category: item.vehicleCategory,
    displacement_cc: item.displacementCc, // 標題偶爾寫 cc，寫了就收；沒寫是 null，靠詳情頁補
    eligibility: isRecyclerLink === 'Y' ? 'LICENSED_RECYCLER_ONLY' : 'NATURAL_PERSON_ALLOWED',
    registration_status: 'UNKNOWN', // 牌照異動登記需查詳情頁，列表頁未提供
    auction_status: ended ? 'UNKNOWN' : 'SCHEDULED', // 逾期未即時知道結果，交給決標查詢流程補（尚未實作）
    reserve_price: item.reservePrice,
    current_price: item.currentPrice,
    sold_price: null,
    ends_at: item.endsAt,
    condition_summary: null,
    photo_urls: item.photoUrl ? [item.photoUrl] : [],
    official_url: `${BASE}/shwoo/newproduct/newproduct00/product?AUID=${item.auid}`,
    plate_number: platePastPurgeWindow ? null : item.plateNumber,
    completeness: computeCompleteness(item),
    last_synced_at: new Date().toISOString(),
  };
}

function splitItemBlocks(html) {
  return html.split(ITEM_BLOCK_MARKER).slice(1);
}

/* 回傳這輪擷取到的機車件數；不吞例外，讓呼叫端（worker.js 的排程）決定要不要記錄失敗。 */
export async function runShwooIngestion(env) {
  const rows = [];
  for (const isRecyclerLink of ['N', 'Y']) {
    const sessionId = await getSessionId();
    const html = await fetchListingHtml(isRecyclerLink, sessionId);
    for (const block of splitItemBlocks(html)) {
      const item = parseItemBlock(block);
      if (item) rows.push(toRow(item, isRecyclerLink));
    }
  }
  await upsertListings(rows, env);
  return rows.length;
}
