/* 臺北惜物網「詳情頁」擷取——補上列表頁沒有的欄位：牌照異動登記（能否領牌）、
   排氣量、廠牌／型號、物品說明。這些是本站對樹懶法拍的差異化欄位，見
   docs/COMPETITIVE-STRATEGY.md 第 3 節 (1)。

   ⚠️ 這支還沒有機會拿真實的詳情頁 HTML 驗證過（開發環境這次連不到
   shwoo.gov.taipei，跟司法院那個端點疑似停用不同，這次比較像暫時性網路問題）。
   解析用「多個候選正則＋只在有信心時才回填」的寫法：找不到就是 null，
   絕不會拿猜測值覆蓋掉已經寫進資料庫的正確資料（見 supabase.js 的
   patchListingFields 只更新有值的欄位，且呼叫端只在解析出東西時才放進 fields）。

   上線前務必先跑：
     node projects/taiwan-moto-auction/ingestion/probe-shwoo-detail.mjs <AUID>
   拿真實 HTML 核對這裡的正則有沒有對到。對不到就照印出來的原始 HTML 片段修。 */

import { patchListingFields, selectRowsNeedingEnrichment } from './supabase.js';
import { mapRegistrationStatus, extractDisplacementCc } from './vehicle-match.js';

const UA = 'Mozilla/5.0 (compatible; TaiwanMotoAuctionBot/1.0; +https://harryjia.com/projects/taiwan-moto-auction/legal.html)';

/* 「標籤：值」在這類政府系統常見的三種包法，依序試：
   1. <td>標籤</td><td>值</td>（表格，跟搜尋表單同款式，最可能）
   2. <dt>標籤</dt><dd>值</dd>（定義列表）
   3. 標籤：值（純文字相鄰，兜底方案，容易誤抓，放最後） */
function extractLabeledValue(html, label) {
  const patterns = [
    new RegExp(`<t[dh][^>]*>\\s*${label}\\s*[：:]?\\s*<\\/t[dh]>\\s*<td[^>]*>\\s*([^<]{1,120})`, 'i'),
    new RegExp(`<dt[^>]*>\\s*${label}\\s*<\\/dt>\\s*<dd[^>]*>\\s*([^<]{1,120})`, 'i'),
    new RegExp(`${label}\\s*[：:]\\s*([^<\\n，,]{1,60})`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1].trim()) return m[1].trim();
  }
  return null;
}

function extractAuid(officialUrl) {
  const m = officialUrl && officialUrl.match(/AUID=(\d+)/);
  return m ? m[1] : null;
}

async function fetchDetailHtml(auid) {
  const res = await fetch(`https://shwoo.gov.taipei/shwoo/newproduct/newproduct00/product?AUID=${auid}`, {
    headers: { 'user-agent': UA },
  });
  if (!res.ok) throw new Error(`detail fetch failed for AUID=${auid}: ${res.status}`);
  return res.text();
}

function parseDetail(html) {
  const registrationRaw = extractLabeledValue(html, '牌照異動登記');
  const brand = extractLabeledValue(html, '廠牌');
  const model = extractLabeledValue(html, '型號');
  const condition = extractLabeledValue(html, '物品說明') || extractLabeledValue(html, '車況說明');
  const cc = extractDisplacementCc(condition || html);

  const fields = {};
  if (registrationRaw) fields.registration_status = mapRegistrationStatus(registrationRaw);
  if (brand) fields.brand_name = brand;
  if (model) fields.model_name = model;
  if (condition) fields.condition_summary = condition.slice(0, 300);
  if (cc) fields.displacement_cc = cc;
  return fields;
}

/* 回傳成功補到欄位的筆數。單筆解析失敗只記錄、不影響其他筆——
   詳情頁擷取本來就是錦上添花，不該讓一筆爛資料拖垮整輪。 */
export async function runShwooEnrichment(env, limit = 6) {
  const candidates = await selectRowsNeedingEnrichment(env, { sourceAdapter: 'shwoo', limit });
  let enriched = 0;
  for (const row of candidates) {
    const auid = extractAuid(row.official_url);
    if (!auid) continue;
    try {
      const html = await fetchDetailHtml(auid);
      const fields = parseDetail(html);
      if (Object.keys(fields).length) {
        fields.last_synced_at = new Date().toISOString();
        await patchListingFields(row.id, fields, env);
        enriched += 1;
      }
    } catch (e) {
      console.error(`shwoo enrichment failed for ${row.id}`, e);
    }
  }
  return enriched;
}
