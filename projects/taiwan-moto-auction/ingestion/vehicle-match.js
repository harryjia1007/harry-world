/* 機車辨識與欄位解析——所有來源共用。
   放這裡的理由：惜物網當初踩到「起重機」被「重機」誤判的坑，這種修正必須自動套用到
   每一個新來源，不能每接一個來源就重抄一次關鍵字表。 */

export const MOTO_KEYWORDS = /機車|機踏車|重機|速克達|檔車|歐兜邁|機器腳踏車/;

/* 只列「字面上會跟機車關鍵字撞到、但其實不是機車」的詞——用途是消除誤命中，不是分類車種。

   2026-08-20 重新設計（原本的做法有兩個實際踩到的問題）：
   1. 舊清單寫「自小客」想擋掉汽車，但公文最常見的寫法是「自**用**小客車」，中間多一個
      「用」字就比對不到，汽車照樣混進來——正式資料庫裡真的有 MASERATI 轎車被收進機車站。
   2. 舊做法是「有機車關鍵字 AND 沒有排除字」，等於只要標題提到汽車就整筆否決。但法院／
      檢察署常見「汽車2輛、機車1台」這種混合標的，那是**真的有機車**的案件，卻會被丟掉。

   新做法：先把已知會造成字面誤命中的詞從標題「挖掉」，再判斷剩下的文字有沒有機車關鍵字。
   - 「車輛起重機(車輛吊車)」→ 挖掉「起重機」→ 沒有機車關鍵字 → 排除 ✅
   - 「汽車2輛、機車1台」→ 沒東西可挖 → 命中「機車」→ 收錄 ✅（本來就是有機車的案件）
   - 「自用小客車壹台」→ 沒東西可挖 → 沒有機車關鍵字 → 排除 ✅（不必再維護汽車詞表）
   - 「挖土機」「堆高機」「發電機」→ 本來就不含「機車／重機」→ 自動排除，不用列 ✅
   汽車、挖土機那些詞不需要列進來，因為它們根本不會命中機車關鍵字。 */
export const FALSE_POSITIVE_TERMS = /起重機|重機械|重機具|吊重機/g;

export function isMotorcycleTitle(title) {
  if (!title) return false;
  const cleaned = title.replace(FALSE_POSITIVE_TERMS, '');
  return MOTO_KEYWORDS.test(cleaned);
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

/* 惜物網搜尋表單「牌照異動登記」下拉選單（欄位名 UNIT1VALUE_4_C）的固定選項文字，
   對應到 shared.js 的 registrationLabels 列舉。這四個選項字串是 2026-08 從搜尋表單
   原始 HTML 讀到的，不是猜的；但沒有實地看過詳情頁怎麼「顯示」這個值，所以呼叫端
   （shwoo-detail.js）要用寬鬆比對（indexOf/包含），不要求完全相等。

   UNKNOWN 跟 REGISTRABILITY_UNKNOWN 語意不同，別混用（2026-08-20 對照既有正式資料庫
   時發現自己先前搞混過一次）：
   - UNKNOWN＝根本還沒查（例如 shwoo.js 列表頁擷取，還沒打過詳情頁）
   - REGISTRABILITY_UNKNOWN＝已經查過詳情頁，但官方給的資訊本身就無法判定能不能領牌
   這裡是「查過」的情境，所以查不出結果時要回 REGISTRABILITY_UNKNOWN，不是 UNKNOWN。 */
export function mapRegistrationStatus(raw) {
  if (!raw) return 'REGISTRABILITY_UNKNOWN';
  const text = raw.trim();
  if (text.includes('已繳銷') && text.includes('可再領牌')) return 'RE_REGISTRATION_REQUIRED'; // 牌已繳銷但能重新領，對買家來說就是「需重新領牌」
  if (text.includes('報廢') && text.includes('無法再領牌')) return 'CANNOT_RELICENSE';
  if (text.includes('無牌照')) return 'REGISTRABILITY_UNKNOWN'; // 「沒牌」原因不只一種（從沒領過／已繳銷未寫可否再領），不硬猜
  if (text.includes('詳物品說明')) return 'REGISTRABILITY_UNKNOWN'; // 官方自己都說要看說明，不能簡化成固定分類
  return 'REGISTRABILITY_UNKNOWN';
}
