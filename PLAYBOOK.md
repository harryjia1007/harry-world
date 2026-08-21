# PLAYBOOK — harry-world（harryjia.com）
更新：2026-08-15（Cloudflare 登入、dry-run、本機互動與響應式版面均已實測）

## 一句話
Harry 的個人網站（深色像素風 portfolio），Cloudflare Workers 託管，自有網域 harryjia.com。

## 建置/執行
純靜態三檔：`index.html` / `styles.css` / `app.js`。文字內容集中在 app.js 的 `DATA()`，`tr('中','En')` 成對。本機預覽直接開 index.html。
子頁面：`notchglass.html`（產品頁）、`stardust.html`（星塵捕手小遊戲）、`projects/taiwan-moto-auction/`（臺灣機車拍賣情報合成資料互動展示）、`privacy.html`（全站隱私與分析說明）。作品卡封面通常放 `images/work-<slot>.jpg`；機車情報封面使用自有 SVG。

## 部署/發佈（重要：git push 不會觸發部署）
1. `cd /Users/harry/Desktop/專案/harry-world && npx wrangler deploy`（約 10 秒；wrangler 已 OAuth 登入。2026-07-13 修正：資料夾已搬進 專案/，舊路徑失效）
2. `git add -A && git commit && git push`（只是備份原始碼）
兩步都要做。Cloudflare 的 Git 自動部署是斷的（repo 無 webhook），別浪費時間查為什麼 push 沒生效。

## 帳號與外部服務
Cloudflare（網域＋Workers）＝harryjia1007 的帳號；GitHub repo＝harryjia1007/harry-world（公開）。

## 坑
- 2026-07｜加圖片｜iPhone 照片可能是 HEIC 卻叫 .jpg，瀏覽器不吃｜先 `file` 檢查，`sips -s format jpeg` 轉檔；大圖用 `sips -Z <maxpx>` 壓縮
- 2026-07｜敏感檔外洩｜.wrangler/ 曾被推上公開 repo｜`.gitignore` 已加 `.wrangler/`；`.assetsignore` 用 `*.md` 排除說明檔
- 2026-07｜部署驗證｜dashboard 綠燈不可信｜部署後 curl harryjia.com 實測
- 2026-07｜NotchGlass 專頁｜`notchglass.html` 部署後對外網址是 `harryjia.com/notchglass`（Cloudflare 自動 307 去掉 .html，正常行為別當 bug）；該檔 13.7MB 是完整版落地頁（內嵌全部資源），Gumroad 上的是 267K 瘦身版
- 2026-07｜本機預覽｜Claude 的預覽伺服器沙盒讀不到 `Desktop/專案` 路徑（連 ASCII symlink 也不行）→ 要預覽就 rsync 整個資料夾到 scratchpad 再 serve；或叫 Harry 直接雙擊 index.html
- 2026-07｜文案修改｜Harry 自改文案流程見 `文案修改指南.md`（app.js 頂部 DATA 區 + 一行 wrangler deploy）
- 2026-07-13｜本機預覽｜Claude 內建瀏覽器對本站捲動後截圖全黑、且會把部署前的 404 快取住｜驗證改用 read_page/curl/img.naturalWidth 等文字手段，別依賴截圖

## 流量統計（2026-07-25 建置，已實測）
- 儀表板：`https://harryjia.com/_stats?k=XBeVPj0ED96eApPtiSfTXZvI`（加書籤即可；沒帶金鑰一律回 404、不會被搜尋引擎收錄）
- 想看更多天：網址後面加 `&days=30`（最多 90）
- 架構：紀錄在 Worker 伺服器端（訪客端零程式碼、不受廣告攔截器影響）→ Cloudflare KV
- **關鍵設定**：`wrangler.toml` 的 `[assets] run_worker_first = true`。少了它，靜態頁面會直接由資產伺服器回應、**完全不經過 Worker**，統計永遠是 0（實際踩過）
- 坑：測試務必用 GET（`curl -s`）；`curl -I` 送的是 HEAD，程式碼刻意不計入
- 坑：Cloudflare 邊緣快取會讓你以為程式沒生效，驗證時加 `?cb=隨機` 或 `-H "Cache-Control: no-cache"`
- 隱私：不用 Cookie、不存 IP、不跨站追蹤；不重複訪客用每日加鹽單向雜湊（隔日無法對應同一人）→ 法規上免同意橫幅
- 公開告知：首頁 footer 連到 `/privacy`。新增或變更分析服務時，必須同步更新該頁；不要只更新 Worker 註解。

## 臺灣機車拍賣情報作品頁
- 對外網址：`https://harryjia.com/projects/taiwan-moto-auction`
- **2026-08-17 更新：已從合成資料展示頁轉為真實資料產品。** 頁面透過 `shared.js` 的 `fetchRows()` 即時打 Supabase REST API（`public_live_motorcycle_listings` 表，唯讀 publishable key），顯示真實案件、車牌（僅拍賣結束後 30 天內）、官方照片網址。舊版「只放合成資料、不連資料庫」的限制已不適用，別再照抄。
- **2026-08-17 更新：自動擷取管線已經開始搬進這個 repo。** 見 `projects/taiwan-moto-auction/ingestion/`：
  - `shwoo.js`：臺北惜物網（robots.txt 明確 `Allow: /shwoo/`），POST 表單擷取「運輸車輛」分類、關鍵字篩機車、正則切欄位。**已用真實網站回應測試過**（含修掉「起重機」被「重機」關鍵字誤判、加上從標題解析車牌與級別）。
  - `judicial-opendata.js`：**司法院待拍開放資料集**（data.gov.tw #49107，JSON、文件宣稱每週更新、政府資料開放授權條款第 1 版，含動產）。**這是官方開放資料 API，不是爬蟲**，跟 `aomp109.judicial.gov.tw` 的 `Disallow: /` 完全無關——兩者是不同東西，別混為一談。⚠️ **2026-08-20：連續多次、跨兩個開發 session 都連不到 `aomp.judicial.gov.tw`**（curl、WebFetch 都逾時；同網段的 `aomp109` 連得到，DNS 也解析得到 IP，不像網路端問題）。data.gov.tw 說明頁的詮釋資料最後更新是 2018-01-23，**懷疑這個端點已經停止服務**。程式碼已寫成「多組候選欄位名＋對不到就回報 0 筆並記錄樣本」，不會寫入假資料，且失敗不影響其他排程；但**這個來源能不能用，要看部署後 Cloudflare 自己連不連得到**，不是靠這個開發沙盒判斷。先跑 `node projects/taiwan-moto-auction/ingestion/probe-judicial.mjs` 驗證，若持續連不到就代表這來源目前用不了，不是程式問題。
  - `shwoo-detail.js` + `probe-shwoo-detail.mjs`：惜物網**詳情頁**擷取，補列表頁沒有的「牌照異動登記（能否領牌）」「排氣量」「廠牌／型號」——這是打樹懶的核心差異化欄位（見 COMPETITIVE-STRATEGY.md 第 3 節）。⚠️ 同樣尚未拿真實詳情頁 HTML 驗證過（這次開發環境連不到 shwoo.gov.taipei，跟司法院端點疑似停用的情況不同，比較像暫時性問題）。**上線前先跑** `node projects/taiwan-moto-auction/ingestion/probe-shwoo-detail.mjs <AUID>` 驗證正則對不對，對不到就照腳本印出的原始 HTML 片段修 `extractLabeledValue`。已接進 `worker.js` 的快速排程，每輪限量 6 筆，只在案件仍在進行中（`auction_status='SCHEDULED'`）時才補，且只更新解析到的欄位、不會拿空值覆蓋已知資料。
  - `vehicle-match.js`：機車辨識共用模組（關鍵字、級別、車牌、排氣量、牌照異動登記文字對應）。所有來源共用，這樣「起重機被『重機』誤判」這類修正會自動套用到每個來源。回歸測試：`node --test projects/taiwan-moto-auction/ingestion/vehicle-match.test.mjs`（8 個測試，測資是真實網站抓到的標題）。
  - `moj-auction.js`：法務部查扣變價（robots.txt 完全開放）——**調查完後決定不做**。實測每個地檢署一年僅 1～2 筆公告（新北最新一筆 2023 年），車輛細節都鎖在 PDF 附件裡、標題看不出有沒有機車，投入產出比太差。詳細調查記錄見檔案內註解。
  - 行政執行署 `tpkonsale.moj.gov.tw`：robots.txt 允許、資料開放宣告也允許再利用，**但查詢介面有驗證碼 → 不自動化**。判準是「著作權授權 ≠ 可繞過技術管制」，見 AUTO-INGESTION-POLICY.md 第 10 節。**2026-08 已正式去信申請，該署回信拒絕 → 結案**。注意：申請被拒之後更不能自己繞驗證碼，別把「試過了」當成正當化理由。
  - 司法院動產查封拍賣公告網（`aomp109.judicial.gov.tw`）：robots.txt 整站 `Disallow: /`，**沒有排進自動化**，也沒有合法的即時替代管道（政府開放資料平台的相關資料集每月批次更新、只收已拍定結果）。已寫信詢問正式介接可能性，草稿在 `projects/taiwan-moto-auction/docs/司法院合作申請信-草稿.md`（尚未寄出）。這個來源在拿到回覆前維持人工核對。
  - `worker.js` 的 `scheduled()` 用 `event.cron` 分流兩種排程：`*/3 * * * *` 跑惜物網（速度戰場），`17 3 * * *` 跑司法院開放資料（來源每週才更新）＋車牌 30 天自動下架。改 cron 字串要同步改 worker.js 的 `DAILY_CRON` 常數，否則分流失效。惜物網擷取前會先查 robots.txt 是否仍允許（fail closed）。
  - **競爭策略**：`projects/taiwan-moto-auction/docs/COMPETITIVE-STRATEGY.md`——**這個資料夾刻意不進版控**（repo 是公開的，商業策略與對外信件草稿不掛在作品集上），檔案只在本機。重點結論：樹懶法拍是綜合型資料站、其法拍主打**不動產**，不是機車競品；別跟它比爬取速度（那條路要違法才贏得了），改打「機車專屬欄位深度」＋「主動通知」——把查詢工具變成監控服務，這是它結構上追不上的。
  - **要讓這條管線真的寫入 Supabase，需要 `npx wrangler secret put MOTO_SUPABASE_SERVICE_KEY`** 設定 service_role 金鑰（跟前端用的唯讀 publishable key 不同，這把有寫入權限，千萬不要跟公開的 key 混用或進 git）。沒設就整輪跳過，不會半套硬跑。
  - 部署前務必先用 `npx wrangler dev` 本機測過 `scheduled` 流程，這段目前只驗證過 parsing 邏輯（拿真實回應資料在 Node 裡測），還沒在 Workers runtime 裡實跑過完整流程。
- 自動化與合規規則全文：`projects/taiwan-moto-auction/AUTO-INGESTION-POLICY.md`。
- 資料與免責：`projects/taiwan-moto-auction/legal.html`——**這頁的文字必須跟實際管線行為一致**，改了擷取規則就要同步改這頁，不然等於對外做不實揭露。目前 legal.html 還是寫舊規則（司法院人工／惜物網自動），等 moj-auction 也做完、整體穩定後再一起更新，避免頁面講的比系統實際做的還多。
- 全站分析：`privacy.html`。
- 發布前至少執行 `node --check projects/taiwan-moto-auction/app.js`、`node --check worker.js`、`node --check projects/taiwan-moto-auction/ingestion/*.js`、`node --test projects/taiwan-moto-auction/ingestion/vehicle-match.test.mjs`、敏感資料掃描、桌機與手機實測。
