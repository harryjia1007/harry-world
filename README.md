# Harry World — 個人網站

陳佳朋的個人網站。一座還在長大的數位博物館：用方向鍵走進四個展廳，看看我正在做什麼。

從 Claude Design 的「Harry World」概念稿實作出來的**乾淨靜態網站**，採 1a「Soft Studio」溫暖俐落風格。

**互動模式**：主畫面是一張地圖（hub），像素小人可以用方向鍵 / WASD 走動；靠近展廳按 **E**（或直接點展廳），就「走進」那個小房間看內頁。按 **Esc** 或左上角「回地圖」回到主畫面。四個展廳各是一個獨立內頁，網址會變成 `#builder` / `#lab` / `#journey` / `#connect`，瀏覽器上一頁也能用。

四個展廳：
- 🟦 **Builder** → 關於我 ＋ 正在做的東西
- 🟫 **Lab** → 作品
- 🟧 **Journey** → 我的旅程（時間軸）
- 🟩 **Connect** → 聊聊（聯絡方式）

---

## 📁 檔案結構

```
harry-world/
├── index.html   ← 網頁骨架（幾乎不用動）
├── styles.css   ← 所有樣式、顏色、字型（想改風格看這裡）
├── app.js       ← 內容資料 + 互動邏輯（想改文字看這裡）★最常改的
└── README.md    ← 這份說明
```

只有這三個檔，沒有任何安裝、沒有編譯步驟。用瀏覽器打開 `index.html` 就是完整的網站。

---

## ✏️ 如何更新內容（最重要）

**幾乎所有文字都集中在 `app.js` 最上面的 `DATA()` 裡**，中英文成對寫在一起：`tr('中文','English')`。

想改什麼，就找對應區塊：

| 想改的東西 | 在哪個展廳 | 找 `app.js` 裡的 |
|---|---|---|
| 名字、主畫面標語 | 主畫面 | `name` / `heroTagline` / `heroKicker` |
| 自我介紹、標籤 | Builder | `aboutP1`、`aboutP2` / `aboutTags` |
| 正在做的東西（卡片） | Builder | `building: [...]` |
| 作品 | Lab | `projects: [...]` |
| 我的旅程（時間軸） | Journey | `journey: [...]` |
| 聯絡方式 | Connect | `connect: [...]` |
| 展廳標題／副標 | — | `HALL_META()` |

**範例——新增一個作品：** 在 `projects` 陣列裡加一筆：

```js
{ name:tr('新專案','New Project'), kind:tr('網站','Website'), status:tr('上線','Live'),
  color:'#7C9068', icon:'fa-solid fa-globe',
  one:tr('一句話介紹。','One-line description.'),
  stack:'React · Vite' },
```

- `color` 用四個展廳的主色之一：靛藍 `#5A7691`、琥珀 `#C29144`、陶土 `#BC6A4E`、苔綠 `#7C9068`
- `icon` 用 [Font Awesome](https://fontawesome.com/search) 的圖示代碼

**想改整體風格／顏色**：改 `styles.css` 最上面的 `:root` 那一區。

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

## 🚀 上架（把網站放到網路上）

推薦 **GitHub Pages**（免費、你已經有 GitHub 帳號 `harryjia1007`）。等你準備好，我可以一步步帶你做。大方向是：

1. 把這個資料夾變成一個 GitHub repo（例如叫 `harry-world`）
2. 推上 GitHub
3. 在 repo 的 **Settings → Pages** 開啟，來源選 `main` 分支
4. 幾分鐘後就有一個網址：`https://harryjia1007.github.io/harry-world/`

之後每次改完 `app.js`，只要 push 上去，網站就自動更新。

> 另一個更省事的選擇是 **Vercel** 或 **Netlify**：把資料夾拖上去就自動部署，還能一鍵綁自訂網域。要用哪個都行，跟我說我幫你設定。

---

## 🌐 買網域（例如 harryworld.dev / harrychen.me）

網域＝你的專屬網址，一年約 US$10–15。步驟：

1. **想名字**：例如 `harrychen.me`、`harryjia.com`、`harry.world`、`harryworld.dev`。
   - `.dev` 很適合工程師（設計稿裡用的就是 `harryworld.dev`）
   - `.me` 適合個人品牌
2. **到網域商查詢並購買**（挑一家就好）：
   - [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)：業界最便宜、不哄抬續約價（**最推薦**）
   - [Namecheap](https://www.namecheap.com/)：便宜、介面友善
   - [Porkbun](https://porkbun.com/)：便宜、`.dev` 常有優惠
3. **付款買下**（信用卡即可，這步要你自己操作）
4. **把網域接到你的網站**：在網域商的 DNS 設定，指向 GitHub Pages（或 Vercel/Netlify）。這步有點技術，**買好之後跟我說，我帶你設定 DNS**。

> 小提醒：`.dev` 網域強制 HTTPS（更安全），GitHub Pages / Vercel 都免費附 HTTPS，完全相容。

---

## 🔁 持續迭代的建議節奏

1. 有新作品／新經歷 → 改 `app.js` 的對應陣列
2. 本機打開 `index.html` 確認畫面
3. push 上 GitHub（或拖上 Vercel）→ 網站自動更新

就這麼簡單。這個網站設計成「會跟著你一起長大」——每做一個新東西，就多一個展品。

---

## 備註

- 設計稿裡還有另一種風格 **1b「Grid Lab」結構網格科技感**（等寬字、新創感）。目前實作的是 1a Soft Studio。想切換或做成可切換版本，跟我說。
- 字型（Hanken Grotesk / Noto Sans TC / Space Mono）與圖示（Font Awesome）都從 CDN 載入，需要網路連線；上線後會自動快取，速度沒問題。
