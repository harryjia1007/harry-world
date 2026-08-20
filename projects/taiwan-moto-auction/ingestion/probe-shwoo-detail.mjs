#!/usr/bin/env node
/* 惜物網詳情頁探針——驗證 shwoo-detail.js 的欄位解析對不對。

   背景：寫 shwoo-detail.js 當下這個開發環境連不到 shwoo.gov.taipei（逾時），
   「牌照異動登記」「廠牌」「型號」「物品說明」的擷取正則是依已知的欄位名稱
   （UNIT1VALUE_4_C）跟搜尋表單的下拉選項文字推斷出來的包法，沒有拿真實詳情頁
   HTML 驗證過。跑這支就知道對不對。

   用法：
     node projects/taiwan-moto-auction/ingestion/probe-shwoo-detail.mjs 934469
     node projects/taiwan-moto-auction/ingestion/probe-shwoo-detail.mjs 934469 --dump

   AUID 可以從 https://harryjia.com/projects/taiwan-moto-auction 任一案件的
   official_url 取得，或直接查 Supabase 的 id 欄位（格式 shwoo-<AUID>）。 */

import fs from 'node:fs';

const auid = process.argv[2];
if (!auid) {
  console.error('用法：node probe-shwoo-detail.mjs <AUID> [--dump]');
  console.error('範例：node probe-shwoo-detail.mjs 934469');
  process.exit(1);
}

const url = `https://shwoo.gov.taipei/shwoo/newproduct/newproduct00/product?AUID=${auid}`;
console.log(`抓取 ${url} ...`);

const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
console.log(`HTTP ${res.status}`);
const html = await res.text();
console.log(`頁面大小：${(html.length / 1024).toFixed(1)} KB\n`);

function extractLabeledValue(html, label) {
  const patterns = [
    { name: 'table <td>標籤</td><td>值</td>', re: new RegExp(`<t[dh][^>]*>\\s*${label}\\s*[：:]?\\s*<\\/t[dh]>\\s*<td[^>]*>\\s*([^<]{1,120})`, 'i') },
    { name: 'dl <dt>標籤</dt><dd>值</dd>', re: new RegExp(`<dt[^>]*>\\s*${label}\\s*<\\/dt>\\s*<dd[^>]*>\\s*([^<]{1,120})`, 'i') },
    { name: '純文字 標籤：值', re: new RegExp(`${label}\\s*[：:]\\s*([^<\\n，,]{1,60})`, 'i') },
  ];
  for (const p of patterns) {
    const m = html.match(p.re);
    if (m && m[1].trim()) return { value: m[1].trim(), matchedBy: p.name };
  }
  return null;
}

const labels = ['牌照異動登記', '廠牌', '型號', '物品說明', '車況說明'];
console.log('=== 逐欄位比對結果 ===');
for (const label of labels) {
  const hit = extractLabeledValue(html, label);
  if (hit) {
    console.log(`✅ ${label}：「${hit.value}」（比對到：${hit.matchedBy}）`);
  } else {
    console.log(`❌ ${label}：三種寫法都沒比對到`);
    const idx = html.indexOf(label);
    if (idx >= 0) {
      console.log(`   但頁面裡有出現這個字，前後文：\n   ...${html.slice(Math.max(0, idx - 20), idx + 150).replace(/\s+/g, ' ')}...`);
    } else {
      console.log(`   頁面裡完全沒有出現「${label}」這幾個字——這個欄位可能叫別的名字，或這個 AUID 沒有這項資料`);
    }
  }
}

if (process.argv.includes('--dump')) {
  const out = `/tmp/shwoo-detail-${auid}.html`;
  fs.writeFileSync(out, html);
  console.log(`\n已存完整 HTML：${out}`);
}

console.log('\n若有 ❌，把上面印出的前後文貼給 Claude，照真實格式修 shwoo-detail.js 的 extractLabeledValue。');
