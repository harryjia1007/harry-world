/* ============================================================
   Harry World — Cloudflare Worker
   1. /api/spotify  回傳「正在聽 / 近期常聽」歌曲
   2. 流量統計：伺服器端記錄瀏覽，/api/e 收事件，/_stats 私人儀表板
   3. Cron 排程：機車拍賣資料自動擷取（見 scheduled()，規則見
      projects/taiwan-moto-auction/AUTO-INGESTION-POLICY.md）
   其他所有路徑照舊直接交給靜態檔案（env.ASSETS）處理。
   金鑰（Spotify、統計密碼、Supabase service key）存在 Cloudflare Secrets，不會進 GitHub。
   ============================================================ */

import { isPathAllowed } from './projects/taiwan-moto-auction/ingestion/robots.js';
import { runShwooIngestion } from './projects/taiwan-moto-auction/ingestion/shwoo.js';
import { runShwooEnrichment } from './projects/taiwan-moto-auction/ingestion/shwoo-detail.js';
import { runJudicialOpenDataIngestion } from './projects/taiwan-moto-auction/ingestion/judicial-opendata.js';
import { purgeExpiredPlates } from './projects/taiwan-moto-auction/ingestion/supabase.js';

/* ---------------- 安全標頭（防篡改 / 防點擊劫持 / 防 XSS） ----------------
   內容安全政策（CSP）用白名單，只放行本站與這幾個明確來源。就算有人設法把
   腳本塞進頁面，瀏覽器也直接擋掉。主站不放行 inline script（最關鍵那條）；
   少數自成一體、把邏輯寫在 <script> 裡的舊頁面（遊戲/落地頁/私人儀表板）
   才單獨放寬 script-src。 */
function buildCSP(allowInlineScript) {
  // 舊的 Claude Design 打包頁（notchglass 等）會把 JS/字型解成 blob: URL 再載入，
  // 所以放寬版的 script/font 要允許 blob:；主站維持最嚴格、不含 blob:。
  return [
    "default-src 'self'",
    `script-src 'self' https://static.cloudflareinsights.com${allowInlineScript ? " 'unsafe-inline' 'unsafe-eval' blob:" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    `font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:${allowInlineScript ? ' blob:' : ''}`,
    "img-src 'self' data: blob: https://i.scdn.co https://*.scdn.co https://shwoo.gov.taipei https://auction.moj.gov.tw",
    "connect-src 'self' https://cloudflareinsights.com https://hdxlhxqlkdipqkwisjyd.supabase.co",
    "frame-ancestors 'none'",   // 不准被別人用 iframe 包起來假冒
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
}
const CSP_STRICT = buildCSP(false);
const CSP_LEGACY = buildCSP(true);
// 這些頁面的程式寫在 inline <script> 裡，需要放寬；新頁面請一律把程式放外部 .js。
// 注意：資產伺服器會把 /x.html 轉址成 /x（漂亮網址），所以這裡存「去掉 .html」的形式，
// 比對前也把 pathname 的 .html 去掉，兩種寫法都命中。
const LEGACY_INLINE_PAGES = new Set(['/notchglass', '/stardust', '/stardust-privacy', '/_stats']);
function isLegacyPage(pathname) {
  return LEGACY_INLINE_PAGES.has(pathname.replace(/\.html$/, ''));
}

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
};

function withSecurity(res, pathname) {
  const r = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) r.headers.set(k, v);
  r.headers.set('content-security-policy', isLegacyPage(pathname) ? CSP_LEGACY : CSP_STRICT);
  return r;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 純靜態站，只接受讀取類方法；其他一律擋
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && url.pathname !== '/api/e') {
      return withSecurity(new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD, OPTIONS' } }), url.pathname);
    }

    let res;
    if (url.pathname === '/api/spotify')      res = await handleSpotify(env);
    else if (url.pathname === '/api/e')       res = await handleEvent(request, env, ctx);
    else if (url.pathname === '/_stats')      res = await handleStats(request, env);
    else if (url.pathname === '/_health')     res = await handleHealth(env);
    else {
      // 統計「頁面瀏覽」：只記 HTML 頁面，不記圖片/JS/CSS，避免灌水
      res = await env.ASSETS.fetch(request);
      if (isPageRequest(url, request, res)) {
        ctx.waitUntil(recordView(request, env, url));
      }
    }
    return withSecurity(res, url.pathname);
  },

  /* 兩種排程分開跑，因為兩邊的資料新鮮度天差地遠：
     - 高頻（每 3 分鐘）：惜物網。來源天天有新案件，且 robots.txt 允許 → 速度戰場在這。
     - 每日：司法院開放資料（來源本身每週才更新，打太密只是浪費）＋ 車牌 30 天下架。
     用 event.cron 區分；本機 `wrangler dev` 觸發時 cron 可能是空字串，預設走高頻那條。 */
  async scheduled(event, env, ctx) {
    const isDaily = event?.cron === DAILY_CRON;
    ctx.waitUntil(isDaily ? runDailyCycle(env) : runFastCycle(env));
  },
};

const DAILY_CRON = '17 3 * * *';

/* robots.txt 檢查＋KV 快取：區分「robots 說不准」與「抓不到 robots」。
   - 成功拿到 robots → 照結果走，並把結果快取進 KV。
   - 抓取暫時性失敗（逾時／5xx，來源 throttle Cloudflare 常見）→ 沿用最近 7 天內的
     已知結果，而不是 fail-closed 把已驗證的來源永久鎖死。
   - 真正的 Disallow 規則（reason 含 "disallow"）永遠尊重，不會被快取覆蓋。
   這樣既守住「不爬禁止來源」的原則，又不讓來源對 Cloudflare 的 throttle 卡死更新。 */
const ROBOTS_CACHE_TTL_MS = 7 * 86400000;
async function robotsAllowedWithCache(env, origin, path, cacheKey) {
  const live = await isPathAllowed(origin, path);
  const transient = /fetch failed|returned HTTP 5|failed reading/i.test(live.reason || '');
  if (!transient) {
    // 拿得到 robots（不論 allow 或 disallow）→ 這是權威結果，快取起來
    try { await env.STATS.put(cacheKey, JSON.stringify({ allowed: live.allowed, reason: live.reason, at: Date.now() }), { expirationTtl: DAY_TTL }); } catch { /* ignore */ }
    return live;
  }
  // 暫時性抓取失敗 → 沿用最近的已知結果
  try {
    const raw = await env.STATS.get(cacheKey);
    if (raw) {
      const c = JSON.parse(raw);
      if (c.allowed && Date.now() - c.at < ROBOTS_CACHE_TTL_MS) {
        return { allowed: true, reason: `robots 暫時抓不到（${live.reason}），沿用最近已知：allowed` };
      }
    }
  } catch { /* ignore */ }
  return live; // 沒有可用的已知結果 → 維持 fail-closed
}

/* 把每輪擷取結果寫進 KV，讓 /_health 讀得到「上一輪 cron 到底成功還失敗、錯在哪」——
   比 wrangler tail 可靠，也是給 Harry 的永久可觀測性。

   2026-08-26 修：Cloudflare 寄信警告 KV 每日寫入額度（免費層 1,000 次/天）用到 90%。
   查出來是這裡——shwoo 排程當時每三分鐘跑一次、guaranteed 失敗（shwoo 封鎖資料中心
   IP，見 HANDOFF 第 8 節），每次都無條件寫一筆幾乎一模一樣的失敗記錄，一天就佔掉
   480 次寫入、快半個免費額度。改成「狀態沒變就不寫」——讀一次比對，只有 ok/error
   內容真的變了才 PUT。讀是免費層 100,000 次/天，遠比寫寬裕，這樣換是划算的。
   （另一半修法是排程頻率從每三分鐘降到每三十分鐘，見 wrangler.toml。） */
async function recordIngest(env, source, status) {
  const key = `ingest:${source}:last`;
  try {
    const prevRaw = await env.STATS.get(key);
    if (prevRaw) {
      const prev = JSON.parse(prevRaw);
      const unchanged = prev.ok === status.ok
        && prev.error === status.error
        && prev.wrote === status.wrote;
      if (unchanged) return; // 狀態沒變，不浪費一次寫入額度
    }
    await env.STATS.put(key, JSON.stringify({ at: new Date().toISOString(), ...status }), { expirationTtl: DAY_TTL });
  } catch { /* 記錄失敗不影響擷取本身 */ }
}

/* 擷取前先確認 robots.txt 仍允許（fail closed，見 robots.js）。
   單一來源失敗只記錄、不中斷其他來源。 */
async function runFastCycle(env) {
  if (!env.MOTO_SUPABASE_SERVICE_KEY) return; // 沒設定寫入金鑰就整輪跳過，不用半套權限硬跑

  const robotsOk = await robotsAllowedWithCache(env, 'https://shwoo.gov.taipei', '/shwoo/browse/', 'robots:shwoo');
  if (!robotsOk.allowed) {
    await recordIngest(env, 'shwoo', { ok: false, error: `robots check: ${robotsOk.reason}` });
    console.error(`shwoo skipped this run — robots check failed: ${robotsOk.reason}`);
    return;
  }
  try {
    const started = Date.now();
    const n = await runShwooIngestion(env);
    await recordIngest(env, 'shwoo', { ok: true, wrote: n, ms: Date.now() - started });
    console.log(`shwoo ingestion ok: ${n} motorcycle rows`);
  } catch (e) {
    await recordIngest(env, 'shwoo', { ok: false, error: String(e && e.message || e) });
    console.error('shwoo ingestion failed', e);
  }

  // 詳情頁擷取（能否領牌／排氣量／廠牌型號）跟列表頁同源，共用同一個 robots.txt 判斷。
  // 每輪限量 6 筆：既能持續補完，也不會對來源打太密——3 分鐘一輪，跑幾輪就補完了。
  try {
    const enrichedCount = await runShwooEnrichment(env, 6);
    if (enrichedCount) console.log(`shwoo enrichment ok: ${enrichedCount} rows enriched`);
  } catch (e) {
    console.error('shwoo enrichment failed', e);
  }
}

/* 司法院這條是「官方開放資料 API」，不是爬蟲，所以不做 robots.txt 檢查——
   robots.txt 規範的是網頁爬取，而開放資料集本來就是發布給程式讀的。
   詳細法律理由見 judicial-opendata.js 檔頭。 */
async function runDailyCycle(env) {
  if (!env.MOTO_SUPABASE_SERVICE_KEY) return;

  try {
    const n = await runJudicialOpenDataIngestion(env);
    await recordIngest(env, 'judicial', { ok: true, wrote: n });
    console.log(`judicial opendata ingestion ok: ${n} motorcycle rows`);
  } catch (e) {
    await recordIngest(env, 'judicial', { ok: false, error: String(e && e.message || e) });
    console.error('judicial opendata ingestion failed', e);
  }

  try { await purgeExpiredPlates(env); }
  catch (e) { console.error('plate purge failed', e); }
}

/* ---------------- 流量統計 ----------------
   設計原則（對訪客零可見、對隱私友善）：
   • 頁面瀏覽在伺服器端記錄 → 訪客端沒有任何 UI，也不受廣告攔截器影響
   • 不使用 Cookie、不存 IP、不追蹤跨站行為 → 免同意橫幅、法規單純
   • 「不重複訪客」用「IP+瀏覽器 每日加鹽雜湊」判斷，單向不可還原，
     且每天鹽不同 → 無法跨日串連同一個人，只回答「今天幾個人」
*/

const DAY_TTL = 60 * 60 * 24 * 400;   // 資料保留約 400 天

function today() {
  return new Date().toISOString().slice(0, 10);   // YYYY-MM-DD (UTC)
}

function isPageRequest(url, request, res) {
  if (request.method !== 'GET') return false;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return false;
  if (url.pathname.startsWith('/_')) return false;    // 儀表板本身不計入
  return true;
}

/** 一日一鹽的單向雜湊：辨識「同一天內的同一位訪客」，但無法還原身分、也無法跨日追蹤 */
async function visitorHash(request, day) {
  const ip = request.headers.get('cf-connecting-ip') || '';
  const ua = request.headers.get('user-agent') || '';
  const data = new TextEncoder().encode(`${day}|${ip}|${ua}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

function bump(obj, key, n = 1) {
  if (!key) return;
  obj[key] = (obj[key] || 0) + n;
}

/** 讀出當天資料 → 修改 → 寫回。個人網站流量低，單鍵讀寫最單純好維護。 */
async function updateDay(env, day, mutate) {
  try {
    const raw = await env.STATS.get(`day:${day}`);
    const d = raw ? JSON.parse(raw) : { pv: {}, uv: 0, ref: {}, ev: {}, dev: {}, country: {} };
    mutate(d);
    await env.STATS.put(`day:${day}`, JSON.stringify(d), { expirationTtl: DAY_TTL });
  } catch (e) { /* 統計失敗絕不影響網站本身 */ }
}

/** 來源分類：把 referrer 收斂成好懂的來源名稱 */
function refLabel(request, url) {
  const utm = url.searchParams.get('utm_source');
  if (utm) return utm.toLowerCase();
  const r = request.headers.get('referer') || '';
  if (!r) return 'direct';                       // 直接輸入網址／書籤／App 開啟
  try {
    const h = new URL(r).hostname.replace(/^www\./, '');
    if (h === url.hostname) return null;         // 站內跳轉不算來源
    if (h.includes('google'))     return 'google';
    if (h.includes('instagram'))  return 'instagram';
    if (h.includes('facebook'))   return 'facebook';
    if (h.includes('threads'))    return 'threads';
    if (h.includes('linkedin'))   return 'linkedin';
    if (h.includes('github'))     return 'github';
    if (h.includes('gumroad'))    return 'gumroad';
    return h;
  } catch { return 'other'; }
}

async function recordView(request, env, url) {
  const day = today();
  const path = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '');
  const ua = request.headers.get('user-agent') || '';
  const isMobile = /iPhone|Android|iPad|Mobile/i.test(ua);
  const country = request.cf?.country || '??';
  const ref = refLabel(request, url);

  // 不重複訪客：當天雜湊沒出現過才 +1
  let isNew = false;
  try {
    const h = await visitorHash(request, day);
    const seen = await env.STATS.get(`v:${day}:${h}`);
    if (!seen) {
      isNew = true;
      await env.STATS.put(`v:${day}:${h}`, '1', { expirationTtl: 60 * 60 * 36 });
    }
  } catch (e) { /* 判斷失敗就當作重複訪客，不影響瀏覽數 */ }

  await updateDay(env, day, d => {
    bump(d.pv, path);
    if (isNew) d.uv = (d.uv || 0) + 1;
    if (ref) bump(d.ref, ref);
    bump(d.dev, isMobile ? 'mobile' : 'desktop');
    bump(d.country, country);
  });
}

/** 客戶端事件（點擊了什麼）。用 sendBeacon 送出，不阻塞頁面。 */
async function handleEvent(request, env, ctx) {
  const ok = new Response(null, { status: 204 });
  if (request.method !== 'POST') return ok;
  try {
    const body = await request.json();
    const name = String(body.n || '').slice(0, 60);     // 事件名稱長度上限，防灌水
    if (!name) return ok;
    ctx.waitUntil(updateDay(env, today(), d => bump(d.ev, name)));
  } catch (e) { /* 忽略格式錯誤 */ }
  return ok;
}

/* ---------------- 健康檢查 /_health ----------------
   讀 Supabase 各來源的最新 last_synced_at，判斷有沒有來源「太久沒更新」＝疑似掛了。
   公開唯讀、不需金鑰，方便直接開網頁看、或給 UptimeRobot 之類的監控輪詢。
   目的：來源壞掉時能主動被看到，不用等 Harry 自己發現才回報。 */
const HEALTH_MAX_AGE_HOURS = { shwoo: 1, judicial: 30, moj_auction: 24 * 8, pcc: 24 * 8, customs: 24 * 8 };
async function handleHealth(env) {
  const TABLE = 'https://hdxlhxqlkdipqkwisjyd.supabase.co/rest/v1/public_live_motorcycle_listings';
  const KEY = 'sb_publishable_O5FXZ4ecH2vFAlkRrCU0Ew_K831f3B2';
  try {
    const r = await fetch(`${TABLE}?select=source_adapter,last_synced_at`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
    if (!r.ok) throw new Error(`supabase ${r.status}`);
    const rows = await r.json();
    const latest = {};
    for (const row of rows) {
      const s = row.source_adapter;
      if (row.last_synced_at && (!latest[s] || row.last_synced_at > latest[s])) latest[s] = row.last_synced_at;
    }
    const now = Date.now();
    const sources = Object.entries(latest).map(([s, ts]) => {
      const ageH = (now - new Date(ts).getTime()) / 3600000;
      const budget = HEALTH_MAX_AGE_HOURS[s] ?? 24 * 8;
      return { source: s, last_synced_at: ts, age_hours: Math.round(ageH * 10) / 10, stale: ageH > budget };
    });
    const stale = sources.filter((x) => x.stale).map((x) => x.source);
    // 讀出各來源「上一輪 cron 的實際結果」（成功/失敗/錯誤訊息），比只看資料新鮮度更能診斷
    const lastRuns = {};
    for (const s of ['shwoo', 'judicial']) {
      const raw = await env.STATS.get(`ingest:${s}:last`);
      if (raw) { try { lastRuns[s] = JSON.parse(raw); } catch { /* ignore */ } }
    }
    return new Response(JSON.stringify({ ok: stale.length === 0, stale, sources, lastRuns, total: rows.length }, null, 2),
      { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e && e.message || e) }, null, 2),
      { status: 500, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  }
}

/* ---------------- 私人儀表板 /_stats ---------------- */

async function handleStats(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('k') || '';
  if (!env.STATS_KEY || key !== env.STATS_KEY) {
    return new Response('Not found', { status: 404 });   // 密碼不對就當作頁面不存在
  }

  const days = Math.min(parseInt(url.searchParams.get('days') || '14', 10) || 14, 90);
  const list = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const raw = await env.STATS.get(`day:${d}`);
    list.push({ day: d, data: raw ? JSON.parse(raw) : null });
  }

  const total = { pv: {}, uv: 0, ref: {}, ev: {}, dev: {}, country: {} };
  let pvTotal = 0;
  for (const { data } of list) {
    if (!data) continue;
    total.uv += data.uv || 0;
    for (const [k, v] of Object.entries(data.pv || {}))      { bump(total.pv, k, v); pvTotal += v; }
    for (const [k, v] of Object.entries(data.ref || {}))     bump(total.ref, k, v);
    for (const [k, v] of Object.entries(data.ev || {}))      bump(total.ev, k, v);
    for (const [k, v] of Object.entries(data.dev || {}))     bump(total.dev, k, v);
    for (const [k, v] of Object.entries(data.country || {})) bump(total.country, k, v);
  }

  const rows = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
  const maxOf = arr => Math.max(1, ...arr.map(r => r[1]));
  const bars = (title, o, empty) => {
    const r = rows(o); const m = maxOf(r);
    if (!r.length) return `<section><h2>${title}</h2><p class=e>${empty}</p></section>`;
    return `<section><h2>${title}</h2>${r.map(([k, v]) =>
      `<div class=row><span class=lbl>${esc(k)}</span><span class=bar style="width:${(v / m) * 100}%"></span><b>${v}</b></div>`
    ).join('')}</section>`;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const daily = list.slice().reverse();
  const dMax = Math.max(1, ...daily.map(x => {
    const p = x.data?.pv || {}; return Object.values(p).reduce((a, b) => a + b, 0);
  }));

  const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>harryjia.com · 流量</title><style>
:root{color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0b0b0c;color:#f3f3f0;font:15px/1.6 -apple-system,"PingFang TC",system-ui,sans-serif;padding:28px 20px 60px}
.wrap{max-width:760px;margin:0 auto}
h1{font-size:22px;letter-spacing:-.02em;margin-bottom:4px}
.sub{color:#8a8a92;font-size:13px;margin-bottom:26px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:30px}
.kpi{background:#151518;border:1px solid #26262c;border-radius:12px;padding:14px}
.kpi b{display:block;font-size:26px;letter-spacing:-.02em}
.kpi span{color:#8a8a92;font-size:12px}
section{margin-bottom:28px}
h2{font-size:13px;color:#8a8a92;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.row{display:flex;align-items:center;gap:10px;padding:5px 0;font-size:13.5px;position:relative}
.lbl{flex:0 0 46%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar{height:7px;background:#5b6df8;border-radius:4px;min-width:2px}
.row b{margin-left:auto;font-variant-numeric:tabular-nums;color:#c9c9d1}
.e{color:#5f5f61;font-size:13px}
.days{display:flex;align-items:flex-end;gap:3px;height:90px;margin-top:6px}
.days div{flex:1;background:#2a2a35;border-radius:3px 3px 0 0;position:relative}
.days div.on{background:#5b6df8}
.dl{display:flex;gap:3px;color:#5f5f61;font-size:10px;margin-top:6px}
.dl span{flex:1;text-align:center;overflow:hidden}
footer{color:#5f5f61;font-size:12px;margin-top:34px;line-height:1.7}
</style></head><body><div class=wrap>
<h1>harryjia.com</h1>
<div class=sub>最近 ${days} 天 · 資料每天 UTC 換日</div>
<div class=kpis>
  <div class=kpi><b>${pvTotal}</b><span>總瀏覽次數</span></div>
  <div class=kpi><b>${total.uv}</b><span>不重複訪客</span></div>
  <div class=kpi><b>${(total.dev.mobile || 0)}</b><span>手機瀏覽</span></div>
  <div class=kpi><b>${(total.dev.desktop || 0)}</b><span>電腦瀏覽</span></div>
</div>
<section><h2>每日瀏覽</h2>
  <div class=days>${daily.map(x => {
    const t = Object.values(x.data?.pv || {}).reduce((a, b) => a + b, 0);
    return `<div class="${t ? 'on' : ''}" style="height:${Math.max(2, (t / dMax) * 100)}%" title="${x.day}: ${t}"></div>`;
  }).join('')}</div>
  <div class=dl>${daily.map((x, i) => `<span>${i % 3 === 0 ? x.day.slice(5) : ''}</span>`).join('')}</div>
</section>
${bars('看了哪些頁面', total.pv, '尚無資料')}
${bars('點了什麼（互動事件）', total.ev, '尚無點擊事件——訪客還沒點過，或剛部署不久')}
${bars('從哪裡來', total.ref, '尚無資料')}
${bars('國家／地區', total.country, '尚無資料')}
<footer>不使用 Cookie、不記錄 IP、不做跨站追蹤；「不重複訪客」以每日加鹽的單向雜湊計算，隔日即無法對應同一人。<br>
此頁面不會被搜尋引擎收錄，網址需帶金鑰才能開啟。</footer>
</div></body></html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/* ---------------- Spotify（原有功能，未更動） ---------------- */

async function handleSpotify(env) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=90',
  };

  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_REFRESH_TOKEN) {
    return new Response(JSON.stringify({ nowPlaying: null, topTracks: [] }), { headers });
  }

  try {
    const token = await getAccessToken(env);

    const [nowRes, topRes] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=6', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    let nowPlaying = null;
    if (nowRes.status === 200) {
      const nowData = await nowRes.json();
      if (nowData && nowData.is_playing && nowData.item) {
        nowPlaying = simplifyTrack(nowData.item);
      }
    }

    let topTracks = [];
    if (topRes.status === 200) {
      const topData = await topRes.json();
      topTracks = (topData.items || []).map(simplifyTrack);
    }

    return new Response(JSON.stringify({ nowPlaying, topTracks }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ nowPlaying: null, topTracks: [] }), { headers });
  }
}

function simplifyTrack(item) {
  const artist = (item.artists || []).map(a => a.name).join(', ');
  const images = item.album?.images || [];
  const image = images[images.length - 1]?.url || images[0]?.url || null;
  return {
    name: item.name,
    artist,
    url: item.external_urls?.spotify || null,
    image,
  };
}

async function getAccessToken(env) {
  const basic = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    }),
  });
  if (!res.ok) throw new Error('spotify token refresh failed: ' + res.status);
  const data = await res.json();
  return data.access_token;
}
