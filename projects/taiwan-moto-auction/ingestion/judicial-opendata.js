/* 司法院「法拍屋動產及不動產待拍資料集」（政府資料開放平臺 dataset 49107）。

   ⚠️ 為什麼這條路合法，而直接爬 aomp109 不合法——兩者是不同的東西，別搞混：
   - aomp109.judicial.gov.tw（動產查封拍賣公告網）robots.txt 是 `Disallow: /`，禁止自動存取 → 不爬。
   - 本檔案用的是司法院**主動發布在政府資料開放平臺的 JSON 資料集**，採「政府資料開放授權
     條款－第1版」，明示得免費、免申請重製與再利用，只需註明出處。使用官方開放資料 API
     不是爬蟲行為，不受該網站 robots.txt 規範。
   授權要求的「註明出處」由前端負責：source_name 會顯示「司法院動產拍賣」。

   ⚠️ 資料新鮮度：這個資料集是**每週更新**，不是即時。它補的是「合法覆蓋率」，
   不是「速度」。速度戰場在惜物網（見 shwoo.js）。不要對外宣稱司法院案件是即時的。

   ⚠️ Schema 未經實地驗證：撰寫當下的環境連不到 aomp.judicial.gov.tw（逾時），
   欄位名稱是依資料集說明頁推斷的。因此這裡採「多組候選欄位名 + 找不到就放棄該筆」的
   寫法，並在完全對不到欄位時記錄一筆樣本供除錯——寧可這輪回報 0 筆，也不要把
   對不上的欄位硬塞進資料庫變成假資料。實際欄位請用 probe-judicial.mjs 打一次確認。 */

import { upsertListings } from './supabase.js';
import {
  isMotorcycleTitle, classifyVehicleCategory, extractPlateNumber,
  extractDisplacementCc, refineCategoryByCc,
} from './vehicle-match.js';

const DATA_URL = 'https://aomp.judicial.gov.tw/abbs/opendata/Foreclosure.json';
const FALLBACK_URL = 'http://aomp.judicial.gov.tw/abbs/opendata/Foreclosure.json';
const OFFICIAL_SEARCH_URL = 'https://aomp109.judicial.gov.tw/judbp/wkw/WHD1A02.htm';
const MAX_BYTES = 24 * 1024 * 1024; // Workers 記憶體有限，超過就放棄這輪而不是讓它 OOM
const UA = 'Mozilla/5.0 (compatible; TaiwanMotoAuctionBot/1.0; +https://harryjia.com/projects/taiwan-moto-auction/legal.html)';

/* 各邏輯欄位的候選 JSON key（比對時忽略大小寫與底線）。
   資料集說明頁提到動產欄位有：物品名稱、數量(QTY)、單位(UNIT)、物品所在地(TLOT)，
   姊妹資料集（拍定 49108）拍賣日期用 SALEDATE，故一併列入候選。 */
const FIELD_CANDIDATES = {
  itemName: ['物品名稱', 'ITEMNAME', 'ITEM_NAME', 'OBJECTNAME', 'NAME', 'SUBJECT'],
  location: ['物品所在地', 'TLOT', 'LOCATION', 'ADDR', 'ADDRESS', '標的位置'],
  saleDate: ['拍賣日期', 'SALEDATE', 'SALE_DATE', 'AUCTIONDATE', 'ADATE'],
  price: ['總拍賣底價', 'TOTALPRICE', 'PRICE', 'BASEPRICE', 'MINPRICE', '底價'],
  court: ['法院', 'COURT', 'COURTNAME', 'CRTNAME', 'CRT'],
  caseYear: ['年度', 'YEAR', 'CASEYEAR', 'JYEAR'],
  caseWord: ['字別', 'WORD', 'CASEWORD', 'JWORD'],
  caseNo: ['案號', 'CASENO', 'CASE_NO', 'NO', 'JNO'],
  quantity: ['數量', 'QTY', 'QUANTITY'],
  unit: ['單位', 'UNIT'],
};

const normalizeKey = (k) => String(k).replace(/[_\s]/g, '').toUpperCase();

function pickField(row, candidates) {
  const lookup = new Map(Object.keys(row).map((k) => [normalizeKey(k), k]));
  for (const cand of candidates) {
    const hit = lookup.get(normalizeKey(cand));
    if (hit != null) {
      const value = row[hit];
      if (value != null && String(value).trim() !== '') return String(value).trim();
    }
  }
  return null;
}

/* 資料可能是純陣列，也可能包在某個 key 底下；兩種都接。 */
function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    for (const value of Object.values(payload)) {
      if (Array.isArray(value) && value.length && typeof value[0] === 'object') return value;
    }
  }
  return [];
}

/* 民國日期（1150824 或 115/08/24）與西元日期都可能出現，都轉成當日 23:59:59 台北時間。 */
function parseSaleDate(raw) {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  let y, m, d;
  if (digits.length === 7) {            // 1150824 → 民國
    y = Number(digits.slice(0, 3)) + 1911; m = Number(digits.slice(3, 5)); d = Number(digits.slice(5, 7));
  } else if (digits.length === 8) {     // 20260824 → 西元
    y = Number(digits.slice(0, 4)); m = Number(digits.slice(4, 6)); d = Number(digits.slice(6, 8));
  } else {
    return null;
  }
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  return new Date(Date.UTC(y, m - 1, d, 15, 59, 59)).toISOString();
}

function toNumber(raw) {
  if (!raw) return null;
  const n = Number(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/* 沒有穩定案號時用內容雜湊當 id，確保同一筆重跑不會變成新案件（避免重複上架）。 */
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function buildId(fields) {
  const { court, caseYear, caseWord, caseNo, itemName, saleDate } = fields;
  if (court && caseYear && caseWord && caseNo) {
    return `judicial-${fnv1a(`${court}|${caseYear}|${caseWord}|${caseNo}|${itemName || ''}`)}`;
  }
  return `judicial-${fnv1a(`${court || ''}|${itemName || ''}|${saleDate || ''}`)}`;
}

const PLATE_VISIBILITY_WINDOW_MS = 30 * 86400000;

function toRow(fields) {
  const endsAt = parseSaleDate(fields.saleDate);
  const endsAtMs = endsAt ? new Date(endsAt).getTime() : null;
  const ended = endsAtMs != null && endsAtMs < Date.now();
  const platePastWindow = endsAtMs != null && Date.now() - endsAtMs > PLATE_VISIBILITY_WINDOW_MS;
  const cc = extractDisplacementCc(fields.itemName);
  const plate = extractPlateNumber(fields.itemName);

  const filled = [fields.itemName, fields.location, fields.saleDate, fields.price, fields.court]
    .filter((v) => v != null).length;

  return {
    id: buildId(fields),
    source_adapter: 'judicial',
    source_name: '司法院動產拍賣',
    official_title: fields.itemName,
    brand_name: null,
    model_name: null,
    organization_name: fields.court || '執行法院（官方未提供）',
    location: fields.location,
    vehicle_category: refineCategoryByCc(classifyVehicleCategory(fields.itemName), cc),
    displacement_cc: cc,
    // 法院拍賣的投標資格與領牌狀態不在這個資料集裡，一律 UNKNOWN，前端會顯示「未確認」。
    // 不要因為「法院拍賣通常一般人可投標」就填 PUBLIC——那是猜測，會誤導投標決定。
    eligibility: 'UNKNOWN',
    registration_status: 'UNKNOWN',
    auction_status: ended ? 'UNKNOWN' : 'SCHEDULED',
    reserve_price: toNumber(fields.price),
    current_price: null,
    sold_price: null,
    ends_at: endsAt,
    condition_summary: [fields.quantity, fields.unit].filter(Boolean).join(' ') || null,
    photo_urls: [],
    official_url: OFFICIAL_SEARCH_URL,
    plate_number: platePastWindow ? null : plate,
    completeness: Math.round((filled / 5) * 100),
    last_synced_at: new Date().toISOString(),
  };
}

async function fetchDataset() {
  let lastError;
  for (const url of [DATA_URL, FALLBACK_URL]) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
      if (!res.ok) { lastError = new Error(`HTTP ${res.status}`); continue; }
      const declared = Number(res.headers.get('content-length') || '0');
      if (declared > MAX_BYTES) {
        throw new Error(`dataset too large for worker memory: ${declared} bytes — move this adapter off Workers`);
      }
      return await res.json();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('judicial dataset unreachable');
}

/* 回傳寫入筆數。找不到任何可用欄位時回傳 0 並記錄一筆樣本，方便對照真實 schema 修正候選欄位表。 */
export async function runJudicialOpenDataIngestion(env) {
  const payload = await fetchDataset();
  const rawRows = extractRows(payload);
  if (!rawRows.length) {
    console.error('judicial opendata: no array of records found; payload keys =',
      payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 20) : typeof payload);
    return 0;
  }

  const rows = [];
  let matchedAnyField = false;
  for (const raw of rawRows) {
    if (!raw || typeof raw !== 'object') continue;
    const fields = Object.fromEntries(
      Object.entries(FIELD_CANDIDATES).map(([key, cands]) => [key, pickField(raw, cands)]),
    );
    if (fields.itemName) matchedAnyField = true;
    if (!isMotorcycleTitle(fields.itemName)) continue;
    rows.push(toRow(fields));
  }

  if (!matchedAnyField) {
    console.error('judicial opendata: could not map itemName on any record — FIELD_CANDIDATES needs updating. sample keys =',
      Object.keys(rawRows[0]).slice(0, 30));
    return 0;
  }

  await upsertListings(rows, env);
  return rows.length;
}
