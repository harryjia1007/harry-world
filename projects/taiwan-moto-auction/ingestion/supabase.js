const TABLE_URL = 'https://hdxlhxqlkdipqkwisjyd.supabase.co/rest/v1/public_live_motorcycle_listings';

function authHeaders(env) {
  return {
    apikey: env.MOTO_SUPABASE_SERVICE_KEY,
    authorization: `Bearer ${env.MOTO_SUPABASE_SERVICE_KEY}`,
    'content-type': 'application/json',
  };
}

/* upsert 以 id 為衝突鍵；id 必須在資料表上有唯一約束，前端本來就把 id 當唯一鍵用。 */
export async function upsertListings(rows, env) {
  if (!rows.length) return;
  const res = await fetch(`${TABLE_URL}?on_conflict=id`, {
    method: 'POST',
    headers: { ...authHeaders(env), prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`supabase upsert failed: ${res.status} ${await res.text()}`);
}

/* 找出「還缺深度欄位」的既有列，給詳情頁擷取用。只挑還在進行中的案件——
   已結束的案件就算補了「能否領牌」也不會有人拿去投標，浪費請求配額。 */
export async function selectRowsNeedingEnrichment(env, { sourceAdapter, limit = 8 }) {
  const query = new URLSearchParams({
    select: 'id,official_url',
    source_adapter: `eq.${sourceAdapter}`,
    registration_status: 'eq.UNKNOWN',
    auction_status: 'eq.SCHEDULED',
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
  const res = await fetch(`${TABLE_URL}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...authHeaders(env), prefer: 'return=minimal' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`supabase patch failed for ${id}: ${res.status} ${await res.text()}`);
}

/* AUTO-INGESTION-POLICY.md 第 3 節：拍賣結束 30 天後車牌自動下架，不靠人記得。 */
export async function purgeExpiredPlates(env) {
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const query = `ends_at=lt.${encodeURIComponent(cutoff)}&plate_number=not.is.null`;
  const res = await fetch(`${TABLE_URL}?${query}`, {
    method: 'PATCH',
    headers: { ...authHeaders(env), prefer: 'return=minimal' },
    body: JSON.stringify({ plate_number: null }),
  });
  if (!res.ok) throw new Error(`supabase plate purge failed: ${res.status} ${await res.text()}`);
}
