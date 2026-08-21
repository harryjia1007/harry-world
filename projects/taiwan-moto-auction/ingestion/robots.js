/* 通用 robots.txt 判斷：只認 User-agent: * 群組，抓不到／解析失敗一律視為不允許（fail closed），
   對應 AUTO-INGESTION-POLICY.md 第 1 節「判斷不出來就跳過，不硬闖」。

   回傳 { allowed, reason }，不是單純 boolean——2026-08-20 第一次上線就踩到看不出
   「網站真的禁止」跟「連線失敗」的坑：兩者在舊版都會回傳同一個 false，log 只印
   「robots.txt no longer allows」，完全看不出來是哪一種，沒辦法判斷 Cloudflare
   到底連不連得到來源網站。reason 就是為了讓呼叫端把真正原因印出來。 */
export async function isPathAllowed(origin, path) {
  let text;
  let res;
  try {
    res = await fetch(`${origin}/robots.txt`, { cf: { cacheTtl: 3600, cacheEverything: true } });
  } catch (e) {
    return { allowed: false, reason: `fetch failed: ${e.message}` };
  }
  if (!res.ok) return { allowed: false, reason: `robots.txt returned HTTP ${res.status}` };
  try {
    text = await res.text();
  } catch (e) {
    return { allowed: false, reason: `failed reading robots.txt body: ${e.message}` };
  }

  const rules = [];
  let inWildcardGroup = false;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;
    const sep = line.indexOf(':');
    if (sep < 0) continue;
    const key = line.slice(0, sep).trim().toLowerCase();
    const value = line.slice(sep + 1).trim();
    if (key === 'user-agent') { inWildcardGroup = value === '*'; continue; }
    if (!inWildcardGroup) continue;
    if (key === 'allow') rules.push({ type: 'allow', prefix: value });
    if (key === 'disallow' && value) rules.push({ type: 'disallow', prefix: value });
  }

  const matches = rules.filter((rule) => path.startsWith(rule.prefix));
  if (!matches.length) return { allowed: true, reason: 'no matching rule, default allow' };
  matches.sort((a, b) => b.prefix.length - a.prefix.length);
  const winner = matches[0];
  return {
    allowed: winner.type === 'allow',
    reason: `matched "${winner.type}: ${winner.prefix}"`,
  };
}
