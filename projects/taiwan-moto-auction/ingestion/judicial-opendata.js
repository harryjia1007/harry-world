/* 司法院「法拍屋動產及不動產待拍公告資料集」（司法院資料開放平台 datasetId 22892）。

   ⚠️ 為什麼這條路合法，而直接爬 aomp109 的查詢網頁不合法——兩者是不同的東西，別搞混：
   - aomp109.judicial.gov.tw 的**查詢網頁**（judbp/wkw/... 那些 HTML 頁）robots.txt 是
     `Disallow: /`，禁止自動爬取 → 不爬。
   - 本檔案抓的是**司法院自己在資料開放平台（opendata.judicial.gov.tw）公告、標明「請程式
     下載」的開放資料 JSON 檔**，採「政府資料開放授權條款」，明示得免費、免申請重製再利用，
     只需註明出處。這個檔剛好也 host 在 aomp109 網域下，但它是開放資料集資源、不是被 robots
     擋的網頁——下載官方發布的開放資料檔，正是這個檔存在的目的，跟爬網頁是兩回事。
   授權要求的「註明出處」由前端負責：source_name 顯示「司法院動產拍賣」。

   ⚠️ 正確的下載網址（2026-08-20 從 opendata.judicial.gov.tw 官方 API 查到現行值）：
     https://aomp109.judicial.gov.tw/judbp/opendata/Foreclosure.json
   先前用的 aomp.judicial.gov.tw/abbs/opendata/Foreclosure.json 是 data.gov.tw 上 2018 年
   的過期 metadata，主機與路徑都已改，那個網址已失效。查現行網址的方法：
     GET https://opendata.judicial.gov.tw/data/api/rest/categories/001/resources
     → 找 datasetId 22892 → filesets[].resourceDescription

   ⚠️ 資料新鮮度：這個資料集是滾動快照、約每週更新，不是即時。它補的是「合法覆蓋率」，
   不是「速度」。速度戰場在惜物網（見 shwoo.js）。不要對外宣稱司法院案件是即時的。

   真實 schema（2026-08-20 實地驗證，非推斷）：
     頂層是案件陣列。每筆案件：
       crtid   法院代碼（如 "NTD" 南投、"TCD" 台中、"CYD" 嘉義…）
       crmyy / crmid / crmno  年度 / 字別 / 案號（組成案號）
       land[] / house[]  不動產（本站不收）
       movable_decide[]  動產品項陣列 ← 機車在這裡
     每個 movable_decide 項目：
       registeno  品名（常帶前綴流水號，如 "069352堆高機"、"…重型機車"）
       saledate   拍賣日期，民國格式 YYYMMDD（如 "1150807" = 民國115/08/07）
       qty / unit 數量 / 單位（如 "1" / "台"）
       ordno      拍賣次序
       saleno     拍次（"一拍"／"特拍"…）
       動產項目沒有底價欄位 → reserve_price 一律 null
   驗證工具：ingestion/probe-judicial.mjs（在能連到政府站的網路上跑）。 */

import { upsertListings } from './supabase.js';
import {
  isMotorcycleTitle, classifyVehicleCategory,
  extractDisplacementCc, refineCategoryByCc,
} from './vehicle-match.js';

const DATA_URL = 'https://aomp109.judicial.gov.tw/judbp/opendata/Foreclosure.json';
const OFFICIAL_SEARCH_URL = 'https://aomp109.judicial.gov.tw/judbp/wkw/WHD1A02.htm';
const MAX_BYTES = 24 * 1024 * 1024; // Workers 記憶體有限，超過就放棄這輪而不是讓它 OOM
const UA = 'Mozilla/5.0 (compatible; TaiwanMotoAuctionBot/1.0; +https://harryjia.com/projects/taiwan-moto-auction/legal.html)';

/* 法院代碼 → 中文名。只列常見的；查不到就顯示代碼本身，不硬猜。 */
const COURT_NAMES = {
  TPD: '臺灣臺北地方法院', TPA: '臺灣臺北地方法院', SLD: '臺灣士林地方法院',
  PCD: '臺灣新北地方法院', TYD: '臺灣桃園地方法院', SCD: '臺灣新竹地方法院',
  MLD: '臺灣苗栗地方法院', TCD: '臺灣臺中地方法院', CHD: '臺灣彰化地方法院',
  NTD: '臺灣南投地方法院', ULD: '臺灣雲林地方法院', CYD: '臺灣嘉義地方法院',
  TND: '臺灣臺南地方法院', KSD: '臺灣高雄地方法院', CTD: '臺灣橋頭地方法院',
  PTD: '臺灣屏東地方法院', TTD: '臺灣臺東地方法院', HLD: '臺灣花蓮地方法院',
  ILD: '臺灣宜蘭地方法院', KLD: '臺灣基隆地方法院', PHD: '臺灣澎湖地方法院',
  KMD: '福建金門地方法院', LCD: '福建連江地方法院',
};

function courtName(crtid) {
  return COURT_NAMES[crtid] || (crtid ? `${crtid} 地方法院` : '執行法院（官方未提供）');
}

/* 民國 YYYMMDD（如 "1150807"）→ ISO。當日 23:59:59 台北時間。格式不符回 null。 */
function rocYmdToIso(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d]/g, '');
  if (digits.length !== 7) return null;
  const y = Number(digits.slice(0, 3)) + 1911;
  const m = Number(digits.slice(3, 5));
  const d = Number(digits.slice(5, 7));
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  return new Date(Date.UTC(y, m - 1, d, 15, 59, 59)).toISOString();
}

/* registeno 常帶前綴流水號（"069352堆高機"）；辨識機車時把開頭那串數字去掉，
   避免流水號干擾，但顯示用的品名保留原字串（讓使用者看到官方原文）。 */
function cleanItemName(registeno) {
  return String(registeno || '').replace(/^\d+/, '').trim();
}

const PLATE_VISIBILITY_WINDOW_MS = 30 * 86400000;

function toRow(caseRec, item) {
  const displayName = String(item.registeno || '').trim();
  const nameForMatch = cleanItemName(item.registeno);
  const endsAt = rocYmdToIso(item.saledate);
  const cc = extractDisplacementCc(nameForMatch);
  const caseId = [caseRec.crmyy, caseRec.crmid, caseRec.crmno].filter(Boolean).join('-');

  const filled = [displayName, endsAt, caseRec.crtid].filter((v) => v != null).length;

  return {
    // id 用「法院-年度字別案號-拍序」組合，穩定且冪等（同一項重跑不會變新案件）。
    id: `judicial-${(caseRec.crtid || 'X').toLowerCase()}-${caseId}-${item.ordno || '1'}`,
    source_adapter: 'judicial',
    source_name: '司法院動產拍賣',
    official_title: displayName,
    brand_name: null,
    model_name: null,
    organization_name: courtName(caseRec.crtid),
    location: null, // 動產項目沒有地點欄位
    vehicle_category: refineCategoryByCc(classifyVehicleCategory(nameForMatch), cc),
    displacement_cc: cc,
    // 投標資格與領牌狀態不在開放資料集裡，一律 UNKNOWN，前端顯示「未確認」，不猜。
    eligibility: 'UNKNOWN',
    registration_status: 'UNKNOWN',
    auction_status: endsAt && new Date(endsAt).getTime() < Date.now() ? 'UNKNOWN' : 'SCHEDULED',
    reserve_price: null, // 動產項目官方未提供底價
    current_price: null,
    sold_price: null,
    ends_at: endsAt,
    condition_summary: [item.qty, item.unit].filter(Boolean).join(' ') + (item.saleno ? `（${item.saleno}）` : '') || null,
    photo_urls: [],
    official_url: OFFICIAL_SEARCH_URL,
    plate_number: null, // 品名裡偶爾有車牌，但格式不穩，開放資料不主動解析車牌
    completeness: Math.round((filled / 3) * 100),
    last_synced_at: new Date().toISOString(),
  };
}

async function fetchDataset() {
  const res = await fetch(DATA_URL, { headers: { 'user-agent': UA, accept: 'application/json' } });
  if (!res.ok) throw new Error(`judicial opendata HTTP ${res.status}`);
  const declared = Number(res.headers.get('content-length') || '0');
  if (declared > MAX_BYTES) {
    throw new Error(`dataset too large for worker memory: ${declared} bytes`);
  }
  return res.json();
}

/* 頂層是 { createdate, createtime, type, data }，案件陣列在 data 欄位裡
   （2026-08-20 從 Cloudflare 實測 log 確認，不是頂層陣列）。相容處理：頂層若本身
   就是陣列也接受，避免哪天官方改回頂層陣列就整個壞掉。 */
function extractCases(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

/* 回傳寫入的機車件數。展開每筆案件的 movable_decide[]，只收機車品項。
   完全對不到 movable_decide 結構時記錄樣本並回 0，不硬塞假資料。 */
export async function runJudicialOpenDataIngestion(env) {
  const payload = await fetchDataset();
  const cases = extractCases(payload);
  if (!cases.length) {
    console.error('judicial opendata: 找不到案件陣列，頂層 keys =',
      payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 20) : typeof payload);
    return 0;
  }

  const rows = [];
  let sawMovableArray = false;
  for (const rec of cases) {
    const movables = Array.isArray(rec?.movable_decide) ? rec.movable_decide : null;
    if (movables) sawMovableArray = true;
    if (!movables) continue;
    for (const item of movables) {
      if (!isMotorcycleTitle(cleanItemName(item.registeno))) continue;
      rows.push(toRow(rec, item));
    }
  }

  if (!sawMovableArray) {
    console.error('judicial opendata: 沒有任何 movable_decide 陣列——schema 可能又改了。sample keys =',
      Object.keys(cases[0]).slice(0, 30));
    return 0;
  }

  await upsertListings(rows, env);
  return rows.length;
}
