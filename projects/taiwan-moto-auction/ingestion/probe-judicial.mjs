#!/usr/bin/env node
/* 司法院待拍開放資料集探針——在「你自己的網路」上跑，用來驗證 judicial-opendata.js 的欄位猜測。

   為什麼需要這支：寫 judicial-opendata.js 當下的開發環境連不到 aomp.judicial.gov.tw（逾時，
   疑似擋境外 IP 或沙箱限制），欄位名稱是依資料集說明頁推斷的。跑這支就會印出真實欄位，
   對不上就照印出來的結果修 FIELD_CANDIDATES。

   用法： node projects/taiwan-moto-auction/ingestion/probe-judicial.mjs          （摘要）
         node projects/taiwan-moto-auction/ingestion/probe-judicial.mjs --dump    （另存完整樣本）
*/

import fs from 'node:fs';

const URLS = [
  // 現行官方網址（2026-08-20 從 opendata.judicial.gov.tw 官方 API datasetId 22892 查到）
  'https://aomp109.judicial.gov.tw/judbp/opendata/Foreclosure.json',
  // 舊網址（2018 年 data.gov.tw metadata，已失效，留著只是對照）
  'https://aomp.judicial.gov.tw/abbs/opendata/Foreclosure.json',
];
const MOTO = /機車|機踏車|重機|速克達|檔車|歐兜邁|機器腳踏車/;
const EXCLUDE = /汽車|貨車|自小客|遊覽車|拖車|曳引車|大客車|小貨車|起重機|吊車|怪手|挖土機|堆高機|推土機|農耕機|割草機|發電機/;

async function load() {
  for (const url of URLS) {
    try {
      process.stdout.write(`嘗試 ${url} ... `);
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok) { console.log(`HTTP ${res.status}`); continue; }
      const text = await res.text();
      console.log(`OK（${(text.length / 1024 / 1024).toFixed(2)} MB）`);
      return { text, url };
    } catch (e) {
      console.log(`失敗：${e.message}`);
    }
  }
  throw new Error('兩個網址都連不到。若你人在台灣仍連不到，代表這個端點可能已停用，需要回 data.gov.tw/dataset/49107 確認最新下載網址。');
}

function findRecordArray(payload) {
  if (Array.isArray(payload)) return { rows: payload, path: '(根層級陣列)' };
  if (payload && typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
        return { rows: value, path: key };
      }
    }
  }
  return { rows: [], path: null };
}

const { text, url } = await load();

let payload;
try {
  payload = JSON.parse(text);
} catch (e) {
  console.error('\n❌ JSON 解析失敗：', e.message);
  console.error('前 500 字元：\n', text.slice(0, 500));
  process.exit(1);
}

const { rows, path } = findRecordArray(payload);
console.log(`\n資料來源：${url}`);
console.log(`紀錄陣列位置：${path ?? '找不到'}`);
console.log(`總筆數：${rows.length}`);

if (!rows.length) {
  console.error('\n❌ 找不到紀錄陣列。頂層結構：', JSON.stringify(payload).slice(0, 800));
  process.exit(1);
}

// 統計所有出現過的欄位名（不同筆可能欄位不一致）
const keyCount = new Map();
for (const r of rows) {
  if (r && typeof r === 'object') {
    for (const k of Object.keys(r)) keyCount.set(k, (keyCount.get(k) || 0) + 1);
  }
}
console.log('\n=== 實際欄位名（依出現次數排序）===');
for (const [k, n] of [...keyCount.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}  →  ${n} 筆 (${((n / rows.length) * 100).toFixed(0)}%)`);
}

console.log('\n=== 第 1 筆完整內容 ===');
console.log(JSON.stringify(rows[0], null, 2));

// 用「任一欄位含機車關鍵字」的寬鬆條件掃，看這個資料集裡到底有沒有機車
const motoRows = rows.filter((r) => {
  const blob = Object.values(r || {}).filter((v) => typeof v === 'string').join(' ');
  return MOTO.test(blob) && !EXCLUDE.test(blob);
});
console.log(`\n=== 機車相關筆數：${motoRows.length} / ${rows.length} ===`);
for (const r of motoRows.slice(0, 5)) {
  console.log('  ' + JSON.stringify(r));
}

if (!motoRows.length) {
  console.log('\n⚠️  這個資料集裡找不到機車關鍵字。可能原因：');
  console.log('   (a) 待拍資料集只收不動產，動產部分是空的 → 這條路對機車沒用，別接');
  console.log('   (b) 欄位是代碼而非中文品名 → 需要另外找代碼對照表');
}

if (process.argv.includes('--dump')) {
  const out = '/tmp/judicial-foreclosure-sample.json';
  fs.writeFileSync(out, JSON.stringify(rows.slice(0, 200), null, 2));
  console.log(`\n已寫出前 200 筆樣本：${out}`);
}
