const TABLE_URL = 'https://hdxlhxqlkdipqkwisjyd.supabase.co/rest/v1/public_live_motorcycle_listings';

function authHeaders(env) {
  return {
    apikey: env.MOTO_SUPABASE_SERVICE_KEY,
    authorization: `Bearer ${env.MOTO_SUPABASE_SERVICE_KEY}`,
    'content-type': 'application/json',
  };
}

/* 2026-08-20：這張表目前還有另一條人工核對的既有管線在寫（Harry 說的 ChatGPT 流程），
   而且用的是同一套 id 命名（shwoo-<AUID>）。在雙方怎麼併存講清楚之前，這裡的三個寫入
   函式全部先走 dry-run：只印出「本來會寫什麼」，不會真的碰資料庫，不可能覆蓋既有的
   好資料。靠 env.INGESTION_DRY_RUN === '1' 開關，預設關掉自動化寫入時就已經安全，
   這層是多一道保險，避免以後誰忘記检查 cron 是否停用就直接把金鑰設回去。 */
function isDryRun(env) {
  return env.INGESTION_DRY_RUN === '1';
}

/* 「詳情頁才知道的欄位」——列表頁擷取一律不碰這幾個，交給 enrichment 專屬擁有。

   為什麼要這樣切（2026-08-20 決定）：列表頁根本看不到「能否領牌」「廠牌型號」，
   如果列表頁擷取每 3 分鐘就把這些欄位寫成 UNKNOWN／null，會把既有管線人工核對
   填好的好資料洗掉，然後指望 enrichment 補回來——但 enrichment 的解析正則還沒
   拿真實詳情頁驗證過，萬一對不上，那些資料就永久退化了。

   正確做法是讓兩個來源各自只擁有自己權威的欄位：
   - 列表頁權威：標題、機關、地點、級別、投標資格、狀態、價格、截止、照片、車牌
   - 詳情頁權威：以下這五個
   PostgREST 的 merge-duplicates 只會更新 payload 裡出現的欄位，所以只要把這幾個
   欄位從 payload 拿掉，既有值就會原封不動保留。 */
const DETAIL_PAGE_OWNED_FIELDS = [
  'registration_status', 'displacement_cc', 'brand_name', 'model_name', 'condition_summary',
];

function stripDetailOwnedFields(row) {
  const copy = { ...row };
  for (const field of DETAIL_PAGE_OWNED_FIELDS) delete copy[field];
  return copy;
}

/* upsert 以 id 為衝突鍵；id 必須在資料表上有唯一約束，前端本來就把 id 當唯一鍵用。
   詳情頁欄位會被剝掉（見上），所以這個函式永遠不會覆蓋 enrichment 或既有管線
   已經填好的深度欄位——新案件那幾欄會是 null，前端顯示「未確認」，等 enrichment 補。 */
export async function upsertListings(rows, env) {
  if (!rows.length) return;
  const payload = rows.map(stripDetailOwnedFields);
  if (isDryRun(env)) {
    console.log(`[DRY RUN] 會 upsert ${payload.length} 筆（已剝除詳情頁欄位），範例：`, JSON.stringify(payload[0]));
    return;
  }
  const res = await fetch(`${TABLE_URL}?on_conflict=id`, {
    method: 'POST',
    headers: { ...authHeaders(env), prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`supabase upsert failed: ${res.status} ${await res.text()}`);
}

/* 找出「還缺深度欄位」的既有列，給詳情頁擷取用。只挑還在進行中的案件——
   已結束的案件就算補了「能否領牌」也不會有人拿去投標，浪費請求配額。

   篩選條件要同時涵蓋 null 與 'UNKNOWN' 兩種「還沒查到」的表示法：
   - null：列表頁擷取新建的案件（列表頁不寫詳情頁欄位，見 DETAIL_PAGE_OWNED_FIELDS）
   - 'UNKNOWN'：既有管線或早期版本寫進去的值
   注意不要把 'REGISTRABILITY_UNKNOWN' 也撈進來——那代表「已經查過詳情頁、但官方
   資訊本身就無法判定」，再查一次結果還是一樣，只是白白多打來源網站一次。

   「還在進行中」用 ends_at 判斷，不要用 auction_status（2026-08-20 對照正式資料庫
   發現的 bug）：實際資料裡 50 筆 shwoo 全部是 auction_status='UNKNOWN'，沒有任何一筆
   是 'SCHEDULED'，原本寫 eq.SCHEDULED 等於永遠撈不到東西、enrichment 根本不會執行。
   ends_at 才是真正可靠的訊號，也跟前端 app.js 判斷「進行中」的邏輯一致。 */
export async function selectRowsNeedingEnrichment(env, { sourceAdapter, limit = 8 }) {
  const nowIso = new Date().toISOString();
  const query = new URLSearchParams({
    select: 'id,official_url',
    source_adapter: `eq.${sourceAdapter}`,
    and: `(or(registration_status.is.null,registration_status.eq.UNKNOWN),or(ends_at.is.null,ends_at.gt.${nowIso}))`,
    order: 'last_synced_at.asc',
    limit: String(limit),
  });
  const res = await fetch(`${TABLE_URL}?${query}`, { headers: authHeaders(env) });
  if (!res.ok) throw new Error(`supabase select failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/* 只更新單筆列出的欄位，不覆蓋整列——enrichment 找不到某個欄位時，
   不能因為沒查到就把原本已知的值洗掉。 */
export async function patchListingFields(id, fields, env) {
  if (!Object.keys(fields).length) return;
  if (isDryRun(env)) {
    console.log(`[DRY RUN] 會 patch ${id}：`, JSON.stringify(fields));
    return;
  }
  const res = await fetch(`${TABLE_URL}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...authHeaders(env), prefer: 'return=minimal' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`supabase patch failed for ${id}: ${res.status} ${await res.text()}`);
}

/* 取某來源目前已存在的所有 id，給去重用（例如司法院自動流要避開既有人工核對的案件）。 */
export async function fetchExistingIds(env, sourceAdapter) {
  const query = new URLSearchParams({ select: 'id', source_adapter: `eq.${sourceAdapter}` });
  const res = await fetch(`${TABLE_URL}?${query}`, { headers: authHeaders(env) });
  if (!res.ok) throw new Error(`supabase fetchExistingIds failed: ${res.status} ${await res.text()}`);
  return (await res.json()).map((r) => r.id);
}

/* AUTO-INGESTION-POLICY.md 第 3 節：拍賣結束 30 天後車牌自動下架，不靠人記得。 */
export async function purgeExpiredPlates(env) {
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const query = `ends_at=lt.${encodeURIComponent(cutoff)}&plate_number=not.is.null`;
  if (isDryRun(env)) {
    console.log(`[DRY RUN] 會清除 ends_at < ${cutoff} 且有車牌的列（跨所有 source_adapter，含既有管線的資料）`);
    return;
  }
  const res = await fetch(`${TABLE_URL}?${query}`, {
    method: 'PATCH',
    headers: { ...authHeaders(env), prefer: 'return=minimal' },
    body: JSON.stringify({ plate_number: null }),
  });
  if (!res.ok) throw new Error(`supabase plate purge failed: ${res.status} ${await res.text()}`);
}
