#!/usr/bin/env node
/* 惜物網（shwoo）本機擷取執行器——在「非資料中心 IP」的機器上排程跑。

   為什麼要這支：shwoo.gov.taipei 封鎖資料中心 IP（Cloudflare Worker / GitHub Actions
   都抓不到，見 HANDOFF.md 第 8 節）。所以 shwoo 只能從 Harry 自己的電腦或台灣境內的
   機器抓。這支共用 repo 現有的 adapter（不重寫邏輯），可用 launchd/cron 定期執行。

   金鑰不進版控：從環境變數 MOTO_SUPABASE_SERVICE_KEY 讀；沒有的話，退而讀
   ~/.moto-ingest.env（格式 KEY=VALUE 一行一個，chmod 600）。service_role 金鑰只放這裡。

   用法：
     MOTO_SUPABASE_SERVICE_KEY=xxxx node run-local.mjs
   或建立 ~/.moto-ingest.env 後直接 `node run-local.mjs`。
   排程安裝見 com.harryjia.moto-shwoo.plist 檔頭與 SETUP-LOCAL.md。 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isPathAllowed } from './robots.js';
import { runShwooIngestion } from './shwoo.js';
import { runShwooEnrichment } from './shwoo-detail.js';
import { purgeExpiredPlates } from './supabase.js';

function loadKeyFromDotfile() {
  try {
    const p = path.join(os.homedir(), '.moto-ingest.env');
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*MOTO_SUPABASE_SERVICE_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
  } catch { /* 沒有 dotfile 就算了 */ }
  return null;
}

const key = process.env.MOTO_SUPABASE_SERVICE_KEY || loadKeyFromDotfile();
if (!key) {
  console.error('缺少 MOTO_SUPABASE_SERVICE_KEY（環境變數或 ~/.moto-ingest.env）。中止，不寫入。');
  process.exit(1);
}
// 本機執行預設「真的寫入」；要試跑不寫可設 INGESTION_DRY_RUN=1。
const env = { MOTO_SUPABASE_SERVICE_KEY: key, INGESTION_DRY_RUN: process.env.INGESTION_DRY_RUN || '0' };

const stamp = () => new Date().toISOString();

async function main() {
  // 跟 Worker 一樣先查 robots（合規原則一致）。從非封鎖 IP 這步會正常成功。
  const robots = await isPathAllowed('https://shwoo.gov.taipei', '/shwoo/browse/');
  if (!robots.allowed) {
    console.error(`[${stamp()}] robots 檢查未通過，略過本輪：${robots.reason}`);
    process.exit(robots.reason && /fetch failed|timeout/i.test(robots.reason) ? 2 : 0);
  }

  try {
    const n = await runShwooIngestion(env);
    console.log(`[${stamp()}] shwoo 擷取完成，寫入 ${n} 筆機車`);
  } catch (e) {
    console.error(`[${stamp()}] shwoo 擷取失敗：${e.message}`);
    process.exitCode = 3;
  }

  try {
    const enriched = await runShwooEnrichment(env, 8);
    if (enriched) console.log(`[${stamp()}] 詳情頁補齊 ${enriched} 筆`);
  } catch (e) {
    console.error(`[${stamp()}] 詳情頁擷取失敗：${e.message}`);
  }

  try {
    await purgeExpiredPlates(env);
  } catch (e) {
    console.error(`[${stamp()}] 車牌 30 天下架失敗：${e.message}`);
  }
}

main();
