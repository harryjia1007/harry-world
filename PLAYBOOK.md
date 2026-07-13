# PLAYBOOK — harry-world（harryjia.com）
更新：2026-07-04（來源：自動記憶，**未逐條實測**——第一次操作時驗證並把本行改成「實測」）

## 一句話
Harry 的個人網站（深色像素風 portfolio），Cloudflare Workers 託管，自有網域 harryjia.com。

## 建置/執行
純靜態三檔：`index.html` / `styles.css` / `app.js`。文字內容集中在 app.js 的 `DATA()`，`tr('中','En')` 成對。本機預覽直接開 index.html。
子頁面：`notchglass.html`（產品頁）、`stardust.html`（星塵捕手小遊戲，2026-07-13 從 專案/星塵捕手 收割上架；對外網址 harryjia.com/stardust）。作品卡封面放 `images/work-<slot>.jpg` 會自動顯示。

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
