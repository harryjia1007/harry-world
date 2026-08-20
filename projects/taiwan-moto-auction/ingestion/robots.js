/* 通用 robots.txt 判斷：只認 User-agent: * 群組，抓不到／解析失敗一律視為不允許（fail closed），
   對應 AUTO-INGESTION-POLICY.md 第 1 節「判斷不出來就跳過，不硬闖」。 */
export async function isPathAllowed(origin, path) {
  let text;
  try {
    const res = await fetch(`${origin}/robots.txt`, { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!res.ok) return false;
    text = await res.text();
  } catch {
    return false;
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
  if (!matches.length) return true;
  matches.sort((a, b) => b.prefix.length - a.prefix.length);
  return matches[0].type === 'allow';
}
