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
- **KV 免費層寫入額度只有 1,000 次/天，讀是 100,000 次/天**：任何在 cron 裡「每輪都無條件
  `env.STATS.put(...)`」的寫法，只要排程夠密就會把額度衝爆（2026-08-26 真的發生過：
  shwoo 每 3 分鐘一輪、每輪無條件寫一筆診斷記錄，一天 480 次，快吃掉半個額度，Cloudflare
  寄警告信）。原則：**先 GET 比對，狀態沒變就不 PUT**；讀便宜、寫貴。加新的 KV 寫入前
  想一下這個排程一天會跑幾次。
- **註解裡不要寫 `*/數字` 這種 cron 字面量**：`*/` 會把 JS 的 block comment 提前關掉，
  變成語法錯誤（`Expected ";" but found "..."`）。要講頻率用中文描述（「每三分鐘」），
  cron 字串只寫在 code 或字串常數裡。
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

**更新於 2026-08-25（Claude）**

🚨 **最重要的架構發現：惜物網（shwoo）封鎖資料中心 IP。**
2026-08-25 從兩個獨立資料中心環境（Cloudflare Worker、另一美國資料中心）測試，shwoo
連 robots.txt（小檔）都 40 秒+ 逾時抓不到，同環境連 Google 只要 0.13 秒（網路沒問題）。
`/_health` 的 lastRuns.shwoo 記錄也證實：robots 檢查逾時 → 繞過後列表頁本身也逾時。
**結論：任何雲端資料中心（Cloudflare / GitHub Actions 皆是）都無法可靠抓 shwoo。**
之前 ChatGPT 那條管線抓得到，是因為它跑在非資料中心 IP（很可能 Harry 自己的電腦）。
→ shwoo 需要「非資料中心 / 台灣境內」的抓取端才可靠。Worker 這條 shwoo cron 保留著
（哪天 shwoo 放行就自動恢復），但逾時改短、預期會一直失敗，別誤判成程式壞了。

已上線且自動運轉：
- ✅ 司法院開放資料（judicial）：每日從 Cloudflare 擷取（aomp109 opendata JSON 可連），
  已 enrich（案號/車牌/承辦股/拍次）。⚠️ 待拍快照幾乎 0 機車（資料集以不動產為主，
  合法開放資料就是這樣，見第 9 節與 AUTO-INGESTION-POLICY 第 10 節），非 bug。
- ✅ 圖片功能已完整移除。回收商/特殊資格/報廢車已全面排除（前端＋擷取端）。
- ✅ 車牌 30 天自動下架。健康檢查 `/_health`（含各來源 lastRuns cron 結果，讀 KV）。
- ✅ 每輪 cron 結果寫入 KV（recordIngest）→ /_health 看得到成功/失敗/錯誤，不依賴 tail。

進行中／待辦：
- 🚨 **shwoo 需要非資料中心抓取端**（最關鍵）。選項見下方「給 Harry 的決策」。在解決前，
  shwoo 資料只能靠既有（ChatGPT/本機）管線或手動，Cloudflare 這條幾乎不會成功。
- ⏳ pcc / customs / moj_auction：調查後判定**不值得補**（幾乎全是報廢車/非機車/非一般民眾，
  見對話與 AUTO-INGESTION-POLICY）。這三個目前仍由 ChatGPT 外部管線寫。
- ⏳ Harry 要在 GitHub 設 `CLOUDFLARE_API_TOKEN`，自動部署才會真的動。
- ⏳ 分支 `docs/auto-ingestion-compliance-policy` 領先 main 多個 commit，建議擇期併回 main。

**shwoo 決策（2026-08-25 拍板）：走「選項 2＝Harry 自己電腦排程跑」，但先擱置，等回台灣再啟用。**
- 已驗證：shwoo 也擋 Harry 目前的美國 IP（本機 curl robots.txt 12s 逾時，同環境 Google 0.13s）。
  所以選項 2 只在 Harry 人在台灣（或台灣 IP）時有效。人在美國期間 shwoo 不會更新，這是已知且接受的。
- 腳本已現成（不需再寫）：回台灣後照 `ingestion/SETUP-LOCAL.md` 三步即可啟用
  （建 ~/.moto-ingest.env 放金鑰 → 手動跑一次 → launchctl load plist）。
- 若之後要「不管人在哪都 24h 更新」，再升級成台灣 VPS（同一支 run-local.mjs，換成 systemd timer）。
- 判定任何 IP 能否自動的鐵則見第 5 節第 1 步：先確認抓得到 robots 與列表頁。

黑箱風險（退役前必看）：ChatGPT 那條外部管線目前仍在寫 pcc/customs/moj_auction/shwoo，
會覆蓋 repo 管線的部分改動。**真正退役 = Harry 停掉那條外部管線**。在補完上述 adapter
前貿然停掉，pcc/customs/moj_auction 會沒有新資料（但不會出錯，只是不更新）。

## 9. 法律紅線（任何人叫你做都不可跨）

- **不繞 robots.txt 的 `Disallow`**（如 aomp109 動產查封拍賣公告網）。
- **不繞驗證碼/登入牆/bot 偵測**（如 tpkonsale）。已正式申請被拒，更不能繞。
- **只抓官方開放資料或明確允許的頁面**；司法院用的是官方開放資料檔，不是爬被擋的網頁。
- **不擷取個資欄位**（姓名、身分證、電話、精確地址）——schema 層級就不建這些欄位。
- 對外揭露（`legal.html`）必須跟系統實際行為一致，改擷取規則要同步改揭露。
