# Harry Chen Portfolio — 個人網站

陳佳朋（Harry Chen）的個人作品集。深色系、像素故障感的編輯風格：巨大像素字姓名、懸浮分頁導覽（WORK / JOURNEY / ABOUT）、自訂像素游標、CRT 掃描線與底片顆粒質感。

從 Claude Design 生成的設計稿實作出來的**乾淨靜態網站**，零安裝、零編譯。

---

## 📁 檔案結構

```
harry-world/
├── index.html    ← 網頁骨架（幾乎不用動）
├── styles.css    ← 所有樣式、顏色、字型、動畫（想改風格看這裡）
├── app.js        ← 內容資料 + 互動邏輯（想改文字看這裡）★最常改的
├── images/       ← 放照片的地方，檔名規則見 images/README.md
└── README.md     ← 這份說明
```

用瀏覽器打開 `index.html` 就是完整的網站，不需要任何安裝或建置步驟。

---

## 🔒 圖片安全性（只有你能新增/修改）

這個網站**沒有任何上傳功能**——所有圖片都是寫死在程式碼裡、指向 `images/` 資料夾裡的檔案。訪客只能「看」，沒有任何管道能新增、修改或刪除圖片，因為根本沒有後端伺服器可以接收資料。

唯一能改變網站內容或圖片的方式：**編輯這個 GitHub repo 裡的檔案並 push**。這個 repo 目前只有你（`harryjia1007`）有寫入權限，沒有邀請任何協作者，所以「只有你能新增圖片」這件事現在就已經是事實，不需要額外設定。

---

## 🖼️ 放照片

目前上架的是**佔位圖版本**（深色像素風的相機圖示佔位框），所有照片位置都還沒放真的照片。

放照片很簡單：把照片檔案丟進 `images/` 資料夾，**檔名要對到 [images/README.md](images/README.md) 裡的表格**（例如 `about.jpg`、`work-notchglass.jpg`），存檔後跟我說一聲，我幫你 commit + push，Cloudflare 會自動重新部署上線。沒放照片的欄位會維持佔位圖，不會壞版面。

---

## ✏️ 如何更新文字內容

**所有內容都集中在 `app.js` 最上面幾個陣列 / 常數**：

| 想改的東西 | 找 `app.js` 裡的 |
|---|---|
| 作品（WORK 分頁） | `WORKS` |
| 旅程時間軸（JOURNEY 分頁） | `JOURNEY` |
| 關於我的標籤 | `ABOUT_CHIPS` |
| 「目前在...」清單（頁尾） | `CURRENTLY` |
| 聯絡方式（頁尾） | `CONTACTS` |
| Hero 大字、標語、學經歷 | `index.html` 裡 `.hero` 區塊的文字 |

**範例——新增一個作品：** 在 `WORKS` 陣列裡加一筆：

```js
{ slot: 'work-newproject', year: '2026', kind: '網站', status: '上線', badge: '#7C9068',
  name: '新專案',
  desc: '一句話介紹這個作品在做什麼。',
  impact: null, stack: ['React', 'Vite'] },
```

`slot` 是圖片檔名（不含副檔名），記得同時在 `images/` 資料夾放一張 `work-newproject.jpg`。

**想改整體風格／顏色**：改 `styles.css` 最上面的 `:root` 那一區（`--accent` 螢光黃綠、`--pink`、`--purple`、`--orange` 是主要點綴色）。

改完存檔，重新整理瀏覽器就看到了。

---

## 👀 本機預覽

最簡單：直接**用瀏覽器打開 `index.html`**（Finder 裡雙擊）。

或用小型伺服器（比較接近上線環境）：在這個資料夾開終端機，執行
```
python3 -m http.server 4173
```
然後打開瀏覽器輸入 `http://localhost:4173`。

---

## 🚀 上架狀態

原始碼在 GitHub → **[github.com/harryjia1007/harry-world](https://github.com/harryjia1007/harry-world)**（公開 repo），透過 **Cloudflare Pages/Workers** 部署到你的網域 **harryjia.com**（設定檔是 `wrangler.toml`）。

之後只要我幫你改完內容並 `git push`，Cloudflare 會**自動重新部署**，網域上的網站幾分鐘內就更新，不用再手動做任何事。

---

## 🔁 持續迭代的建議節奏

1. 有新作品／新經歷 → 改 `app.js` 的對應陣列；有新照片 → 丟進 `images/`
2. 本機打開 `index.html` 確認畫面
3. push 上 GitHub → Cloudflare 自動重新部署

就這麼簡單。跟我說「幫我加一個新作品」之類的，我改完就會直接幫你 commit + push。
