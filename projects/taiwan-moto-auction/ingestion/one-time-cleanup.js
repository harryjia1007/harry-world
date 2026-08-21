/* 一次性資料清理——執行完就該刪掉這個檔案與 worker.js 裡的呼叫。

   背景：2026-08-20 稽核正式資料庫時發現，既有管線寫進來的 26 筆 moj_auction
   案件裡有 23 筆根本不是機車（MASERATI 自用小客車、挖土機等），而這個網站叫
   「臺灣機車拍賣情報」。這些舊案（105-109 年度，2016-2020）會出現在「已結束」
   與「全部」分頁，直接損害站台的專業度。

   為什麼寫成 Worker 裡的程式而不是直接下 SQL：刪除需要 Supabase service_role
   金鑰，那把金鑰存在 Cloudflare Secrets 裡（env.MOTO_SUPABASE_SERVICE_KEY），
   只有 Worker 讀得到。這樣不需要任何人把金鑰複製出來或貼到別處。

   安全設計：
   • 刪除清單是**寫死的 23 個 id**，不接受任何外部輸入，不可能被拿去刪別的東西。
   • 每個 id 都經過人工核對完整標題（見下方註解），確認是汽車／工程機械。
   • 操作具冪等性：重跑只是刪不到東西，不會有副作用。
   • 刻意**不走** supabase.js 的 dry-run 開關：那個開關是保護「自動擷取」不要
     覆蓋既有資料，而這裡是 Harry 明確要求的一次性刪除，兩件事目的不同。

   保留的 3 筆（人工確認過完整標題，是真的含機車的混合標的，不可刪）：
   • moj_auction-13362 / 13376：「…自用小客車3部及車牌號碼LGA-3838號大型重機1部」
   • moj_auction-13374：「…扣押車輛2輛、機車1台…」
   備份：~/Documents/moto-backups/moj_auction_20260820_174934.json（26 筆完整資料）
*/

const TABLE_URL = 'https://hdxlhxqlkdipqkwisjyd.supabase.co/rest/v1/public_live_motorcycle_listings';

/* 全部是「自用小客車」「汽車」「挖土機」類，標題已逐筆核對過。 */
const NON_MOTORCYCLE_IDS = [
  'moj_auction-13400', // 自用小客車壹台（MASERATI GHIBLI S Q4）
  'moj_auction-32723', // 自用小客車4部
  'moj_auction-13268', // 車牌 AAY-5233 自用小客車乙部（第二次拍賣）
  'moj_auction-13280', // 沒收扣押物(自小客車、挖土機)拍賣結果
  'moj_auction-13290', // 車牌 9365-M9 自用小客車乙部
  'moj_auction-13316', // 車牌 ARP-5695 自用小客車乙部
  'moj_auction-13350', // 車牌 6616-S7 自用小客車乙部
  'moj_auction-13354', // 車牌 AUD-7038 自用小客車乙部
  'moj_auction-13360', // 車牌 H3-6287 自用小客車乙部
  'moj_auction-13372', // 車牌 AUD-7038 自用小客車乙部（第二次拍賣）
  'moj_auction-13380', // 車牌 W3-1193 及 AUH-7331 自用小客車2部
  'moj_auction-13402', // 臺東地檢 拍賣扣押物自用小客車2台
  'moj_auction-13414', // 107年度變價字第1號(自小客車)拍賣結果
  'moj_auction-13444', // 107年度拍賣沒收扣押物(自小客車)公告
  'moj_auction-13450', // 107年度拍賣沒收扣押物(自小客車)拍賣結果
  'moj_auction-13452', // 107年度第二次拍賣沒收扣押物(自小客車)結果公告
  'moj_auction-13513', // 車牌 AWL-5579 自用小客車1部
  'moj_auction-17434', // 車牌 ABZ-9295 自用小客車1部
  'moj_auction-30168', // 車牌 BHT-1108 自用小客車1部
  'moj_auction-13330', // 車牌 AMR-0158 自用小客車乙部
  'moj_auction-13384', // 車牌 AQF-1118 自用小客車1部（第二次拍賣公告）
  'moj_auction-31427', // 車牌 BCA-7171 自用小客車1部
  'moj_auction-13266', // 依法變賣偵查中扣押之汽車一部
];

/* 回傳刪掉幾筆。用 Prefer: return=representation 才能確認實際刪除數量，
   不然 PostgREST 回 204 我們無從得知到底有沒有刪到。 */
export async function deleteNonMotorcycleRows(env) {
  if (!env.MOTO_SUPABASE_SERVICE_KEY) {
    throw new Error('沒有寫入金鑰，跳過清理');
  }
  const idList = NON_MOTORCYCLE_IDS.map((id) => `"${id}"`).join(',');
  const res = await fetch(`${TABLE_URL}?id=in.(${encodeURIComponent(idList)})`, {
    method: 'DELETE',
    headers: {
      apikey: env.MOTO_SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.MOTO_SUPABASE_SERVICE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
  });
  if (!res.ok) {
    throw new Error(`cleanup delete failed: ${res.status} ${await res.text()}`);
  }
  const deleted = await res.json();
  return Array.isArray(deleted) ? deleted.length : 0;
}
