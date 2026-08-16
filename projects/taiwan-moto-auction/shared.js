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

  const sourceLabels = { shwoo: "臺北惜物網", judicial: "司法院動產拍賣", moj_auction: "法務部公有財產拍賣" };
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
    localStorage.setItem(key, JSON.stringify([...new Set(values)]));
  }
  function toggleList(key, id, max) {
    const values = readList(key);
    const index = values.indexOf(id);
    if (index >= 0) values.splice(index, 1);
    else {
      if (max && values.length >= max) return { values, added: false, full: true };
      values.push(id);
    }
    writeList(key, values);
    return { values, added: index < 0, full: false };
  }
  function isEnded(row, now = new Date()) {
    if (["SOLD", "UNSOLD", "WITHDRAWN", "CANCELLED", "EXPIRED"].includes(row.auction_status)) return true;
    return Boolean(row.ends_at && new Date(row.ends_at) < now);
  }
  function safeOfficialUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value);
      const allowed = ["shwoo.gov.taipei", "aomp109.judicial.gov.tw", "auction.moj.gov.tw"];
      return url.protocol === "https:" && allowed.includes(url.hostname) ? url.href : null;
    } catch { return null; }
  }
  function safePhotoUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && ["shwoo.gov.taipei", "auction.moj.gov.tw"].includes(url.hostname) ? url.href : null;
    } catch { return null; }
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
  function money(value) {
    return value == null ? "官方未提供" : `NT$ ${Number(value).toLocaleString("zh-TW")}`;
  }
  function dateTime(value) {
    return value ? new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "官方未提供";
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
  function fetchRows(query = "") {
    return fetch(`${API_URL}?select=*&order=ends_at.asc.nullslast&limit=300${query}`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }, cache: "no-store",
    }).then((response) => {
      if (!response.ok) throw new Error(`資料服務暫時無法使用（${response.status}）`);
      return response.json();
    });
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
    API_URL, API_KEY, FAVORITES_KEY, COMPARE_KEY, sourceLabels, vehicleTypeLabels, carCategoryLabels, classLabels, eligibilityLabels,
    registrationLabels, ccBands, readList, writeList, toggleList, isEnded, safeOfficialUrl, safePhotoUrl,
    escapeHtml, money, dateTime, daysUntil, title, vehicleType, fetchRows, rememberSnapshots,
  };
});
