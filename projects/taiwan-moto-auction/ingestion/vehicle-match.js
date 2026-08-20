/* 機車辨識與欄位解析——所有來源共用。
   放這裡的理由：惜物網當初踩到「起重機」被「重機」誤判的坑，這種修正必須自動套用到
   每一個新來源，不能每接一個來源就重抄一次關鍵字表。 */

export const MOTO_KEYWORDS = /機車|機踏車|重機|速克達|檔車|歐兜邁|機器腳踏車/;

/* 「起重機／吊車」等工程機械會被「重機」誤命中；「汽車」類則整批排除。
   比對順序：先看有沒有機車關鍵字，再看有沒有排除字，兩者都中就排除。 */
export const EXCLUDE_KEYWORDS =
  /汽車|貨車|自小客|遊覽車|拖車|曳引車|大客車|小貨車|起重機|吊車|怪手|挖土機|堆高機|推土機|農耕機|割草機|發電機/;

export function isMotorcycleTitle(title) {
  if (!title) return false;
  return MOTO_KEYWORDS.test(title) && !EXCLUDE_KEYWORDS.test(title);
}

/* 級別判斷保守處理：寫不明確就回 UNKNOWN，讓前端顯示「級別未確認」。
   寧可顯示未確認，也不要猜錯——猜錯級別會直接誤導能不能領牌的判斷。 */
export function classifyVehicleCategory(title) {
  if (!title) return 'UNKNOWN';
  if (/電動機車|電動二輪|電動自行車/.test(title)) return 'ELECTRIC_MOTORCYCLE';
  if (/大型重型/.test(title)) return 'LARGE_HEAVY';
  if (/普通重型/.test(title)) return 'HEAVY_UNSPECIFIED';
  if (/普通輕型|輕型機車/.test(title)) return 'ORDINARY_LIGHT';
  if (/重型機車/.test(title)) return 'HEAVY_UNSPECIFIED';
  return 'UNKNOWN';
}

/* 官方標題常見寫法：「重型機車1輛［原車牌：ADQ-8927］」。
   只認明確標示為車牌的欄位，不從一般文字裡亂猜英數字串。 */
export function extractPlateNumber(title) {
  if (!title) return null;
  const m = title.match(/(?:原車牌|車牌號碼|車牌)[：:\s]*([A-Z0-9]{2,4}-[A-Z0-9]{2,4})/i);
  return m ? m[1].toUpperCase() : null;
}

/* 排氣量：接受 125cc / 125 c.c. / 排氣量125 等寫法。
   只採信 30～2500 之間的值——超出這個範圍幾乎都是誤抓到年份、金額或編號。 */
export function extractDisplacementCc(title) {
  if (!title) return null;
  const patterns = [
    /(\d{2,4})\s*c\.?\s*c\.?/i,
    /排氣量[：:\s]*(\d{2,4})/,
    /(\d{2,4})\s*立方公分/,
  ];
  for (const re of patterns) {
    const m = title.match(re);
    if (!m) continue;
    const cc = Number(m[1]);
    if (cc >= 30 && cc <= 2500) return cc;
  }
  return null;
}

/* 從級別回推「大概是不是需要駕照升級」等前端提示用不到，但 cc 缺值時可補級別。 */
export function refineCategoryByCc(category, cc) {
  if (category !== 'UNKNOWN' || cc == null) return category;
  if (cc <= 50) return 'ORDINARY_LIGHT';
  if (cc <= 250) return 'HEAVY_UNSPECIFIED';
  if (cc > 550) return 'LARGE_HEAVY';
  return 'HEAVY_UNSPECIFIED';
}
