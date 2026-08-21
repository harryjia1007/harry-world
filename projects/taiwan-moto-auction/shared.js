(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Moto = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const API_URL = "https://hdxlhxqlkdipqkwisjyd.supabase.co/rest/v1/public_live_motorcycle_listings";
  const API_KEY = "sb_publishable_O5FXZ4ecH2vFAlkRrCU0Ew_K831f3B2";
  const FAVORITES_KEY = "taiwan_moto_favorites_v1";
  const COMPARE_KEY = "taiwan_moto_compare_v1";
  const SNAPSHOTS_KEY = "taiwan_moto_snapshots_v1";

  const sourceLabels = {
    shwoo: "臺北惜物網",
    judicial: "司法院動產拍賣",
    moj_auction: "法務部查扣物集中拍賣",
    moj_enforcement: "行政執行署動產拍賣",
    moj_enforcement_cms: "行政執行署各分署公告",
    pcc: "政府電子採購網財物變賣",
    customs: "財政部關務署四關標售",
  };
  const sourceMeta = [
    {
      adapter: "moj_auction",
      name: sourceLabels.moj_auction,
      mode: "每日兩次自動同步",
      scope: "檢察機關查扣物集中拍賣",
      officialUrl: "https://auction.moj.gov.tw/1724/1726/searchList",
      staleHours: 36,
    },
    {
      adapter: "pcc",
      name: sourceLabels.pcc,
      mode: "官方開放資料每日檢查",
      scope: "全國機關財物變賣；報廢案件另行分區",
      officialUrl: "https://data.gov.tw/dataset/7263",
      staleHours: 72,
    },
    {
      adapter: "moj_enforcement_cms",
      name: sourceLabels.moj_enforcement_cms,
      mode: "13 個分署公告每日兩次檢查",
      scope: "由分署官方公告發現案件，不操作中央驗證碼",
      officialUrl: "https://www.tpk.moj.gov.tw/9539/9685/1458230/1461437/",
      staleHours: 36,
    },
    {
      adapter: "customs",
      name: sourceLabels.customs,
      mode: "四關公告每日檢查",
      scope: "基隆、臺北、臺中、高雄四關；附件只連回官方",
      officialUrl: "https://web.customs.gov.tw/singlehtml/1207?cntId=cus1_93228_1207",
      staleHours: 72,
    },
    {
      adapter: "shwoo",
      name: sourceLabels.shwoo,
      mode: "臺灣網路批次同步",
      scope: "參與機關公開標售與近期結果",
      officialUrl: "https://shwoo.gov.taipei/shwoo/browse/browse00/",
      staleHours: 36,
    },
    {
      adapter: "judicial",
      name: sourceLabels.judicial,
      mode: "人工核對官方公告",
      scope: "法院動產法拍；不宣稱全國即時完整",
      officialUrl: "https://aomp109.judicial.gov.tw/",
      staleHours: null,
    },
    {
      adapter: "moj_enforcement",
      name: sourceLabels.moj_enforcement,
      mode: "人工驗證後匯入",
      scope: "官方查詢含驗證碼，尚未納入無人排程",
      officialUrl: "https://www.tpkonsale.moj.gov.tw/Chattel",
      staleHours: null,
    },
  ];
  const vehicleTypeLabels = { MOTORCYCLE: "機車", CAR: "汽車", MIXED: "汽機車混合批次", UNKNOWN: "車種未確認" };
  const carCategoryLabels = { PASSENGER: "小客車／轎車", SUV: "休旅車", VAN: "廂型／客貨車", TRUCK: "貨車", BUS: "大客車／遊覽車", OTHER: "其他汽車", UNKNOWN: "汽車類別未確認" };
  const classLabels = {
    ORDINARY_LIGHT: "普通輕型", ORDINARY_HEAVY: "普通重型", LARGE_HEAVY: "大型重型",
    ELECTRIC_MOTORCYCLE: "電動機車", HEAVY_UNSPECIFIED: "重型（級別未明）", UNKNOWN: "級別未確認",
  };
  const eligibilityLabels = {
    PUBLIC: "一般民眾可投標", NATURAL_PERSON_ALLOWED: "一般民眾可投標", BUSINESS_ONLY: "限事業單位",
    LICENSED_RECYCLER_ONLY: "限合格回收商", SPECIAL_QUALIFICATION: "需特別資格", BULK_PURCHASE_ONLY: "限整批投標", UNKNOWN: "投標資格未確認",
  };
  const registrationLabels = {
    NORMAL_TRANSFER: "可正常過戶", RE_REGISTRATION_REQUIRED: "需重新領牌", INSPECTION_REQUIRED: "需檢驗後領牌",
    REGISTRABILITY_UNKNOWN: "能否領牌未確認", DEREGISTERED: "牌照已繳銷", CANNOT_RELICENSE: "不得再領牌",
    SCRAP_ONLY: "僅供報廢／回收", EXPORT_ONLY: "僅供出口", UNKNOWN: "牌照狀態未確認",
  };
  const ccBands = [
    { value: "le-125", label: "125 c.c. 以下", test: (cc) => cc != null && cc <= 125 },
    { value: "126-150", label: "126–150 c.c.", test: (cc) => cc != null && cc >= 126 && cc <= 150 },
    { value: "151-250", label: "151–250 c.c.", test: (cc) => cc != null && cc >= 151 && cc <= 250 },
    { value: "251-550", label: "251–550 c.c.", test: (cc) => cc != null && cc >= 251 && cc <= 550 },
    { value: "gt-550", label: "550 c.c. 以上", test: (cc) => cc != null && cc > 550 },
    { value: "unknown", label: "排氣量未提供", test: (cc) => cc == null },
  ];

  function readList(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch { return []; }
  }
  function writeList(key, values) {
    try {
      localStorage.setItem(key, JSON.stringify([...new Set(values)]));
      return true;
    } catch { return false; }
  }
  function toggleList(key, id, max) {
    const values = readList(key);
    const index = values.indexOf(id);
    if (index >= 0) values.splice(index, 1);
    else {
      if (max && values.length >= max) return { values, added: false, full: true };
      values.push(id);
    }
    const saved = writeList(key, values);
    return { values, added: index < 0, full: false, error: !saved };
  }
  function pruneList(key, validIds) {
    const valid = new Set(validIds);
    const next = readList(key).filter((id) => valid.has(id));
    return writeList(key, next);
  }
  function isEnded(row, now = new Date()) {
    if (["SOLD", "UNSOLD", "WITHDRAWN", "CANCELLED", "EXPIRED"].includes(row.auction_status)) return true;
    return Boolean(row.ends_at && new Date(row.ends_at) < now);
  }
  function safeOfficialUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value);
      const allowed = [
        "shwoo.gov.taipei", "aomp109.judicial.gov.tw", "auction.moj.gov.tw",
        "www.tpkonsale.moj.gov.tw", "www.tcc.moj.gov.tw", "www.qtc.moj.gov.tw", "www.ulc.moj.gov.tw",
        "web.pcc.gov.tw", "data.gov.tw", "web.customs.gov.tw", "www.tpk.moj.gov.tw",
        "www.tpy.moj.gov.tw", "www.sly.moj.gov.tw", "www.pcy.moj.gov.tw", "www.tyy.moj.gov.tw",
        "www.scy.moj.gov.tw", "www.tcy.moj.gov.tw", "www.chy.moj.gov.tw", "www.cyy.moj.gov.tw",
        "www.tny.moj.gov.tw", "www.ksy.moj.gov.tw", "www.pty.moj.gov.tw", "www.hly.moj.gov.tw", "www.ily.moj.gov.tw",
      ];
      return url.protocol === "https:" && allowed.includes(url.hostname) ? url.href : null;
    } catch { return null; }
  }
  function safePhotoUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value);
      const allowed = [
        "shwoo.gov.taipei", "auction.moj.gov.tw", "www.tpkonsale.moj.gov.tw",
        "www.tcc.moj.gov.tw", "www.qtc.moj.gov.tw", "www.ulc.moj.gov.tw",
        "www.tpy.moj.gov.tw", "www.sly.moj.gov.tw", "www.pcy.moj.gov.tw", "www.tyy.moj.gov.tw",
        "www.scy.moj.gov.tw", "www.tcy.moj.gov.tw", "www.chy.moj.gov.tw", "www.cyy.moj.gov.tw",
        "www.tny.moj.gov.tw", "www.ksy.moj.gov.tw", "www.pty.moj.gov.tw", "www.hly.moj.gov.tw", "www.ily.moj.gov.tw",
      ];
      return url.protocol === "https:" && allowed.includes(url.hostname) ? url.href : null;
    } catch { return null; }
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
  function money(value) {
    return value == null ? "官方未提供" : `NT$ ${Number(value).toLocaleString("zh-TW")}`;
  }
  function dateTime(value) {
    if (!value) return "官方未提供";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "官方未提供";
    return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  }
  function daysUntil(value, now = new Date()) {
    if (!value) return null;
    return Math.ceil((new Date(value).getTime() - now.getTime()) / 86400000);
  }
  function title(row) {
    return [row.brand_name, row.model_name].filter(Boolean).join(" ") || row.official_title || "車輛拍賣案件";
  }
  function vehicleType(row) {
    if (["MOTORCYCLE", "CAR", "MIXED", "UNKNOWN"].includes(row.vehicle_type)) return row.vehicle_type;
    return row.vehicle_category && row.vehicle_category !== "UNKNOWN" ? "MOTORCYCLE" : "UNKNOWN";
  }
  function isScrap(row) {
    return ["SCRAP_ONLY", "CANNOT_RELICENSE"].includes(row.registration_status)
      || row.eligibility === "LICENSED_RECYCLER_ONLY"
      || row.disposal_origin === "SCRAP_DISPOSAL";
  }
  function isActive(row, now = new Date()) {
    if (isEnded(row, now)) return false;
    if (row.ends_at) return new Date(row.ends_at).getTime() >= now.getTime();
    return row.auction_status === "SCHEDULED";
  }
  function statusLabel(row, now = new Date()) {
    const labels = { DISCOVERED: "已發現", ANNOUNCED: "已公告", SCHEDULED: "進行中", SOLD: "已得標", UNSOLD: "未得標", WITHDRAWN: "已撤回", CANCELLED: "已取消", EXPIRED: "已截止", UNKNOWN: "結果待官方確認" };
    if (isScrap(row)) return "報廢／回收專區";
    if (row.ends_at && new Date(row.ends_at).getTime() < now.getTime() && !["SOLD", "UNSOLD", "WITHDRAWN", "CANCELLED"].includes(row.auction_status)) return "已截止／結果待確認";
    if (!row.ends_at && ["ANNOUNCED", "DISCOVERED", "UNKNOWN"].includes(row.auction_status)) return "日期待核對";
    return labels[row.auction_status] || "狀態未確認";
  }
  function priceInfo(row) {
    if (row.sold_price != null) return { label: "成交價", value: row.sold_price };
    if (row.current_price != null) return { label: "目前出價", value: row.current_price };
    if (row.reserve_price != null) return { label: "拍賣底價", value: row.reserve_price };
    return { label: "價格", value: null };
  }
  function region(row) {
    const text = `${row.organization_name || ""} ${row.location || ""}`.replaceAll("台", "臺");
    const regions = ["基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣", "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣", "金門縣", "連江縣"];
    const exact = regions.find((name) => text.includes(name));
    if (exact) return exact;
    const aliases = [
      ["士林", "臺北市"], ["橋頭", "高雄市"], ["臺北", "臺北市"], ["新北", "新北市"], ["桃園", "桃園市"],
      ["新竹", "新竹市"], ["苗栗", "苗栗縣"], ["臺中", "臺中市"], ["彰化", "彰化縣"], ["南投", "南投縣"],
      ["雲林", "雲林縣"], ["嘉義", "嘉義縣"], ["臺南", "臺南市"], ["高雄", "高雄市"], ["屏東", "屏東縣"],
      ["宜蘭", "宜蘭縣"], ["花蓮", "花蓮縣"], ["臺東", "臺東縣"], ["澎湖", "澎湖縣"], ["金門", "金門縣"],
      ["連江", "連江縣"], ["基隆", "基隆市"],
    ];
    return aliases.find(([token]) => text.includes(token))?.[1] || "地區未確認";
  }
  async function fetchRows(query = "") {
    const pageSize = 500;
    const maximumRows = 5000;
    const rows = [];
    for (let offset = 0; offset < maximumRows; offset += pageSize) {
      const response = await fetch(`${API_URL}?select=*&order=last_synced_at.desc,id.asc&offset=${offset}&limit=${pageSize}${query}`, {
        headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }, cache: "no-store",
      });
      if (!response.ok) throw new Error(`資料服務暫時無法使用（${response.status}）`);
      const page = await response.json();
      if (!Array.isArray(page)) throw new Error("資料格式錯誤");
      rows.push(...page);
      if (page.length < pageSize) return rows;
    }
    throw new Error("案件筆數超過安全讀取上限，請縮小查詢範圍");
  }
  function rememberSnapshots(rows) {
    let previous = {};
    try { previous = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "{}"); } catch { previous = {}; }
    const changes = [];
    for (const row of rows) {
      const old = previous[row.id];
      const price = row.sold_price ?? row.current_price ?? row.reserve_price;
      if (old && old.price !== price && price != null) changes.push({ id: row.id, before: old.price, after: price });
      previous[row.id] = { price, auctionAt: row.ends_at, checkedAt: new Date().toISOString() };
    }
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(previous));
    return changes;
  }

  return {
    API_URL, API_KEY, FAVORITES_KEY, COMPARE_KEY, sourceLabels, sourceMeta, vehicleTypeLabels, carCategoryLabels, classLabels, eligibilityLabels,
    registrationLabels, ccBands, readList, writeList, toggleList, pruneList, isEnded, isActive, isScrap, statusLabel, priceInfo, region, safeOfficialUrl, safePhotoUrl,
    escapeHtml, money, dateTime, daysUntil, title, vehicleType, fetchRows, rememberSnapshots,
  };
});
