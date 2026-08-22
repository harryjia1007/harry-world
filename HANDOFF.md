# HANDOFF — 給接手這個專案的任何 AI（Claude / ChatGPT）或人

這份文件是「交接棒」。**開工前先讀完這頁**，就能在不重新摸索的情況下繼續編輯，
而且不會跟另一個 AI 打架。Harry 會在 Claude 與 ChatGPT 之間切換（token 用完就換），
所以這份文件的存在目的，就是讓**兩個 AI 共用同一條管線、順暢接力**。

---

## 0. 最重要的一條規則（打破就會出事）

**這個 git repo 是資料管線的唯一擁有者。不要在 repo 外另外跑一條會寫入 Supabase 的
管線。** 過去 Claude 與 ChatGPT 各跑各的（ChatGPT 那條沒有版控、在 repo 外執行），
結果兩邊在同一張 Supabase 表上反方向覆蓋——Claude 清掉的非機車資料被 ChatGPT 重新
加回來，永遠修不完。2026-08-22 決定退役那條外部管線，改成：

- **唯一 runtime**：Cloudflare Worker（`worker.js` 的 `scheduled()`），跑在雲端。
- **兩個 AI 都只做一件事**：編輯這個 repo 的程式碼，然後 `git push`。
- **協調層是 git**：push 後 GitHub Actions 自動部署（見第 6 節）。誰要接手，先 `git pull`、
  讀本檔第 8 節「Current State」，就知道上一棒做到哪。

如果你是 ChatGPT，而 Harry 要你「更新機車網站的資料抓取」：**不要寫一個獨立腳本去跑**，
而是改這個 repo 的 adapter、更新第 8 節、commit push。這樣才不會跟 Claude 打架。

---

## 1. 這個專案是什麼

「臺灣機車拍賣情報」（`harryjia.com/projects/taiwan-moto-auction`）——把分散在各政府
官方來源的**合法機車拍賣/標售**案件，彙整成單一好搜尋的網站。目標客群是**一般民眾**
（不是回收商、不是車商）。商業定位與競品分析見 `projects/taiwan-moto-auction/docs/
COMPETITIVE-STRATEGY.md`（該資料夾刻意 gitignore，只在本機）。

## 2. 架構地圖

```
使用者瀏覽器
  └─ 前端靜態頁（index.html / app.js / detail.* / shared.js / styles.css）
       └─ 直接讀 Supabase REST（唯讀 publishable key，在 shared.js）
Cloudflare Worker（worker.js）
  ├─ fetch()：靜態檔 + 流量統計 + /api/spotify + /_stats（私人儀表板）
  └─ scheduled()：資料擷取排程 ← 管線的心臟
       └─ projects/taiwan-moto-auction/ingestion/*.js
            └─ 寫入 Supabase（service_role key，存 Cloudflare Secrets）
Supabase：public_live_motorcycle_listings（單一資料表）
```

- **前端**只讀、不寫。改前端顯示邏輯 = 改 `app.js`/`detail.js`/`shared.js`/`styles.css`。
- **擷取**只在 Worker 的 `scheduled()`。改抓取邏輯 = 改 `ingestion/`。
- 規格與合規全文：`projects/taiwan-moto-auction/AUTO-INGESTION-POLICY.md`。

## 3. 資料怎麼流動

1. `worker.js` 的 `scheduled()` 依 `event.cron` 分流（`wrangler.toml` 的 `[triggers]`）：
   - `*/3 * * * *`：惜物網（速度戰場）＋詳情頁補欄位
   - `17 3 * * *`：司法院開放資料＋車牌 30 天自動下架
2. 每個來源一個 adapter（`ingestion/<source>.js`），回傳 row 陣列 → `upsertListings()` 寫入。
3. `upsertListings()`（`ingestion/supabase.js`）是所有寫入的單一入口，內含共用防線（見第 4 節）。

## 4. 任何 adapter 都必須遵守的硬規則（踩到就寫入失敗或出事）

這些都是**用真實寫入踩過的坑**換來的，別重蹈覆轍：

- **NOT NULL 欄位**：`source_record_id`（＝id 去掉來源前綴）與 `content_checksum`
  （用 `vehicle-match.js` 的 `contentChecksum([...])`）**一定要給**，否則 Supabase 回 400。
  其他欄位多半有 DB 預設值或觸發器（`search_text`、`vehicle_type` 等會自動生成）。
- **同批不可有重複 id**：`upsertListings` 已用 id 去重（否則 PostgREST 報 21000）。
- **一般民眾買得到、用得了才收**：`upsertListings` 會過濾掉 `eligibility` ∈
  {限回收商/特殊資格/限事業/限整批} 或 `registration_status` ∈ {僅供報廢/不得再領牌/僅供出口}。
  前端 `shared.js` 的 `publicBiddable()` 同步過濾。改一邊要改兩邊。
- **不覆蓋既有好資料**：`upsertListings` 會剝除 `DETAIL_PAGE_OWNED_FIELDS`（能否領牌、
  排氣量、廠牌型號、車況），這些交給詳情頁 enrichment 擁有，列表頁不碰。
- **dry-run 開關**：`env.INGESTION_DRY_RUN==='1'` 時只印 log 不寫入。目前是 **'0'（正式寫入）**。
- **機車辨識共用**：一律用 `vehicle-match.js`（關鍵字、級別、車牌、排氣量、牌照文字對應）。
  「起重機被『重機』誤判」這種坑已在裡面修掉，別再各寫一份。回歸測試：
  `node --test projects/taiwan-moto-auction/ingestion/vehicle-match.test.mjs`。

## 5. 怎麼加一個新來源（退役 ChatGPT 後，pcc/customs/moj_auction 要照這流程補）

1. **先查合規**（不可跳過）：讀該來源 `robots.txt`。`Disallow: /` 就不做（如 aomp109）。
   有驗證碼/登入牆就不做（如 tpkonsale）。判準見 AUTO-INGESTION-POLICY.md 第 1 節。
2. 用瀏覽器實際跑一次搜尋流程，抓真正的資料端點（別用猜的）。
3. 寫 `ingestion/<source>.js`，`toRow()` 輸出對齊資料表欄位，務必含第 4 節的硬規則。
4. 在 `shared.js` 的 `sourceLabels`/`sourceNotes` 加上這個來源的顯示名稱與誠實描述。
5. 在 `worker.js` 的 `runFastCycle`/`runDailyCycle` 掛上排程呼叫，包 try/catch（單一來源
   失敗不能拖垮其他）。
6. 更新本檔第 8 節。commit、push。

## 6. 怎麼部署（已自動化）

- **自動**：push 到 `main` 或 `docs/auto-ingestion-compliance-policy` → GitHub Actions
  （`.github/workflows/deploy.yml`）自動 syntax check + 跑測試 + `wrangler deploy`。
  **需 Harry 設定一次**：GitHub repo Secrets 加 `CLOUDFLARE_API_TOKEN`（見 workflow 檔頭註解）。
- **手動 fallback**：`npx wrangler deploy`（需本機已 `wrangler login`）。
- Worker secrets（`MOTO_SUPABASE_SERVICE_KEY` 等）已在 Cloudflare，deploy 不會動到。

## 7. 兩個 AI 的協作規矩

- 開工先 `git pull`，讀本檔第 8 節。收工前更新第 8 節、commit、push。
- Commit 訊息講清楚「為什麼」，尤其是踩到的坑（未來的你/另一個 AI 會感謝）。
- 破壞性操作（刪 Supabase 資料）要有備份，且用寫死 filter 的受保護端點或 SQL，別亂刪。
- **法律紅線不可跨**（見第 9 節），不管誰叫你做。

## 8. Current State（交接棒——每次收工更新這段）

**更新於 2026-08-22（Claude）**

已上線且自動運轉：
- ✅ 惜物網（shwoo）：每 3 分鐘擷取，正式寫入中，已驗證端到端成功。只抓「不限資格區」。
- ✅ 司法院開放資料（judicial）：每日擷取，已 enrich（案號/車牌/承辦股/拍次），
  正式寫入。⚠️ 待拍快照常常 0 機車（滾動的），這正常。
- ✅ 圖片功能已完整移除（惜物網圖需 session，外連拿不到）。
- ✅ 回收商/特殊資格/報廢車已全面排除（前端＋擷取端）。
- ✅ 車牌 30 天自動下架、健康檢查（見 worker.js）。

進行中／待辦（退役 ChatGPT 的收尾）：
- ⏳ **補三個 adapter**：`pcc`（政府電子採購網）、`customs`（關務署）、`moj_auction`
  （法務部查扣變價）——這三個目前是 ChatGPT 外部管線在寫，退役後會斷。照第 5 節補。
  moj_auction 已調查過（量少、車輛細節鎖 PDF，投報比低，見 ingestion/moj-auction.js）。
- ⏳ **一次性回填歷史**：從司法院「已拍定」資料集（data.gov.tw #22893）回填,補歷史深度。
- ⏳ Harry 要在 GitHub 設 `CLOUDFLARE_API_TOKEN`，自動部署才會真的動。
- ⏳ 分支 `docs/auto-ingestion-compliance-policy` 領先 main 23 commit,建議擇期併回 main。

黑箱風險（退役前必看）：ChatGPT 那條外部管線目前仍在寫 pcc/customs/moj_auction/shwoo，
會覆蓋 repo 管線的部分改動。**真正退役 = Harry 停掉那條外部管線**。在補完上述 adapter
前貿然停掉，pcc/customs/moj_auction 會沒有新資料（但不會出錯，只是不更新）。

## 9. 法律紅線（任何人叫你做都不可跨）

- **不繞 robots.txt 的 `Disallow`**（如 aomp109 動產查封拍賣公告網）。
- **不繞驗證碼/登入牆/bot 偵測**（如 tpkonsale）。已正式申請被拒，更不能繞。
- **只抓官方開放資料或明確允許的頁面**；司法院用的是官方開放資料檔，不是爬被擋的網頁。
- **不擷取個資欄位**（姓名、身分證、電話、精確地址）——schema 層級就不建這些欄位。
- 對外揭露（`legal.html`）必須跟系統實際行為一致，改擷取規則要同步改揭露。
