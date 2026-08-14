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
- 只允許合成資料與自有示意圖。不得放入真實案件、車牌、案號、官方附件、官方照片、Supabase URL／金鑰或私人 API。
- 互動資料位於 `projects/taiwan-moto-auction/app.js`，頁面不連線資料庫或政府網站。
- 資料與免責：`projects/taiwan-moto-auction/legal.html`；全站分析：`privacy.html`。
- 發布前至少執行 `node --check projects/taiwan-moto-auction/app.js`、敏感資料掃描、桌機與手機實測。
