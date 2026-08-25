/* 臺北惜物網（shwoo.gov.taipei）擷取。robots.txt 對 /shwoo/ 明確 Allow，見 AUTO-INGESTION-POLICY.md。
   搜尋是傳統 POST 表單（無 JSON API），流程：先 GET 進階搜尋頁拿 jsessionid，
   再 POST q_item1=C（物品分類：運輸車輛）+ order=5（依上架日期新到舊排序）取得列表 HTML，
   用正則從固定的卡片區塊裡切欄位。頁面結構若改版，這裡的正則需要跟著更新。 */

import { upsertListings } from './supabase.js';
import {
  isMotorcycleTitle, classifyVehicleCategory, extractPlateNumber,
  extractDisplacementCc, refineCategoryByCc, contentChecksum,
} from './vehicle-match.js';

const BASE = 'https://shwoo.gov.taipei';
const UA = 'Mozilla/5.0 (compatible; TaiwanMotoAuctionBot/1.0; +https://harryjia.com/projects/taiwan-moto-auction/legal.html)';
const ORGANIZATION_NAME = '臺北市動產質借處';
const ITEM_BLOCK_MARKER = '<div class="col-xs-6 col-md-3  padding10a">';

/* 2026-08-20：上線後第一輪就收到 520（Cloudflare 對「來源伺服器回應無法辨識」的代號），
   當下的錯誤訊息只有狀態碼，看不出是 session 沒拿到、來源在擋 Cloudflare 出口 IP、
   還是純粹暫時性問題。這裡把診斷資訊補齊：session 有沒有拿到、失敗時的回應內容
   前 300 字，讓下一輪的 log 能真的告訴我們發生什麼事，不用再靠猜的。 */
// 2026-08-25 定案：惜物網封鎖資料中心 IP（Cloudflare 與另一美國資料中心測試皆 40s+ 逾時，
// 同環境連 Google 0.13s，證明網路沒問題）。所以 Cloudflare Worker 結構上抓不到 shwoo，
// 這條每 3 分鐘的 cron 幾乎必失敗——保留只為了「哪天 shwoo 放行 Cloudflare 就自動恢復」。
// 逾時改短（快速失敗、少浪費），不再期待它在雲端成功。shwoo 需要非資料中心的抓取方式，
// 見 HANDOFF.md / AUTO-INGESTION-POLICY.md 的「shwoo 資料中心封鎖」段。
const REQUEST_TIMEOUT_MS = 15000;

/* 拿 session 失敗（逾時、520、沒 cookie）一律回 null，讓主流程用無 session 繼續，
   不讓「拿 session」這一步的失敗把整輪擷取拖垮——實測沒有 session 也抓得到列表。 */
async function getSessionId() {
  try {
    // session 是加分、非必要（實測無 session 也抓得到）。給短逾時，拿不到就快點放棄、
    // 把時間留給真正需要的列表頁請求，不要在這步就把時間耗光。
    const res = await fetch(`${BASE}/shwoo/browse/browse00/advancedQuery?isRecyclerLink=N&q_unit1value4C=`, {
      headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000),
    });
    const cookies = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie') || ''];
    const cookieMatch = cookies.join('; ').match(/JSESSIONID=([^;]+)/i);
    if (cookieMatch) return cookieMatch[1];
    const urlMatch = new URL(res.url).pathname.match(/jsessionid=([^;?]+)/i);
    if (urlMatch) return urlMatch[1];
    return null;
  } catch (e) {
    console.error(`shwoo getSessionId 失敗，改用無 session 繼續：${e.message}`);
    return null;
  }
}

async function fetchListingHtml(isRecyclerLink, sessionId, page = 1) {
  const path = `/shwoo/browse/browse00/advancedQuery${sessionId ? `;jsessionid=${sessionId}` : ''}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA },
    // showPage 是惜物網分頁參數（見搜尋表單 hidden 欄位）。order=5 依上架日期新到舊。
    body: new URLSearchParams({ q_item1: 'C', order: '5', isRecyclerLink, showPage: String(page) }).toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const bodySnippet = await res.text().then((t) => t.slice(0, 300)).catch(() => '(讀取回應內容失敗)');
    throw new Error(
      `shwoo listing fetch failed: ${res.status}, sessionId=${sessionId ? 'present' : 'MISSING'}, `
      + `cf-ray=${res.headers.get('cf-ray') || 'n/a'}, body 開頭="${bodySnippet}"`,
    );
  }
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
    source_record_id: String(item.auid), // 資料表此欄 NOT NULL；慣例＝id 去掉來源前綴（既有管線同格式）
    content_checksum: contentChecksum([item.title, item.location, item.reservePrice, item.currentPrice, item.endsAt, item.photoUrl, item.plateNumber, item.vehicleCategory]), // NOT NULL；內容變才變
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

const MAX_PAGES = 15; // 安全上限：避免 showPage 被忽略時無限迴圈；正常「運輸車輛」不會這麼多頁。


/* 回傳這輪擷取到的機車件數；不吞例外，讓呼叫端（worker.js 的排程）決定要不要記錄失敗。
   只抓「不限資格區」（isRecyclerLink='N'）——目標客群是一般民眾，「廢機動車輛回收業
   競標區」（'Y'）限合格回收商才能投標，一般人根本標不到，不收（2026-08-22 決定）。

   分頁：一頁一頁抓，直到某頁沒有「新的」AUID 為止（用已見過的 AUID 集合偵測最後一頁，
   即使 showPage 被伺服器忽略而一直回第一頁，也會在第 2 輪就因為全部重複而停，不會
   重複寫或無限迴圈）。這是 2026-08-22 補的——先前只抓第一頁，機車散在後面幾頁的全漏了，
   導致「進行中案件比實際少」。 */
const CRAWL_BUDGET_MS = 15000; // 分頁總預算：慢的時候只抓第 1 頁就寫入（頁 1 已有機車），確保排程有時間 upsert 不被砍；快的時候一輪抓完全部頁

export async function runShwooIngestion(env) {
  const rows = [];
  const seenAuids = new Set();
  const startedAt = Date.now();
  const sessionId = await getSessionId();
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    // 預算只限制「第 2 頁以後」——第 1 頁一定要抓（不然拿不到任何機車）。
    // 這是 2026-08-23 修的關鍵 bug：原本 getSessionId 慢就把預算耗光，第 1 頁還沒抓就 break→寫 0 筆。
    if (page > 1 && Date.now() - startedAt > CRAWL_BUDGET_MS) {
      console.error(`shwoo 分頁超過時間預算，停在第 ${page - 1} 頁、先寫入 ${rows.length} 筆`);
      break;
    }
    let html;
    try {
      html = await fetchListingHtml('N', sessionId, page);
    } catch (e) {
      // 惜物網會間歇性 520。中途某頁掛掉就停止分頁，但保留前面抓到的，不整批丟。
      // 第 1 頁就掛且什麼都沒抓到才往上拋，讓呼叫端記錄這輪失敗。
      if (page === 1 && !rows.length) throw e;
      console.error(`shwoo 第 ${page} 頁失敗，保留前 ${rows.length} 筆先寫入：${e.message}`);
      break;
    }
    let newOnThisPage = 0;
    for (const block of splitItemBlocks(html)) {
      const item = parseItemBlock(block);
      const auid = item ? item.auid : (block.match(/AUID=(\d+)/) || [])[1];
      if (auid && !seenAuids.has(auid)) {
        seenAuids.add(auid);
        newOnThisPage += 1;
        if (item) rows.push(toRow(item, 'N'));
      }
    }
    if (newOnThisPage === 0) break; // 這頁全是看過的（或空頁）→ 已到最後一頁
  }
  await upsertListings(rows, env);
  console.log(`shwoo pages crawled, unique items across pages: ${seenAuids.size}, motorcycle rows: ${rows.length}`);
  return rows.length;
}
