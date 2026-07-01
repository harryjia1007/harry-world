# Harry World — 個人網站

陳佳朋的個人網站。一座還在長大的數位博物館：用方向鍵走進四個展廳，看看我正在做什麼。

從 Claude Design 的「Harry World」概念稿實作出來的**乾淨靜態網站**，採 1a「Soft Studio」溫暖俐落風格。

**互動模式**：主畫面是一張地圖（hub），像素小人可以用方向鍵 / WASD 走動；靠近展廳按 **E**（或直接點展廳），會有一個彩色「傳送門」轉場、走進那個小房間看內頁。按 **Esc** 或左上角「回地圖」回到主畫面。四個展廳各是一個獨立內頁，網址會變成 `#builder` / `#lab` / `#journey` / `#connect`，瀏覽器上一頁也能用。

**遊戲化細節**：
- 🎵 走路有腳步音效、腳下有塵土粒子；撞到地圖邊界會有輕微回饋
- 🌀 走進展廳＝彩色傳送門 wipe 轉場（顏色對應該展廳）
- 🏅 每個展廳右上角有「探索進度」計數，首次造訪會跳出成就通知；全部走完會有彩帶慶祝
- 🔇 右上角喇叭圖示可以靜音（狀態會記住，下次打開網站不會重置）
- 探索進度會存在瀏覽器 `localStorage`，換瀏覽器 / 清除快取才會重置

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

## 🚀 上架狀態

**已完成**：原始碼已經推上 GitHub → **[github.com/harryjia1007/harry-world](https://github.com/harryjia1007/harry-world)**（公開 repo）

因為你的網域已經買在 **Cloudflare**，最順的部署方式是 **Cloudflare Pages**（免費、跟網域同一帳號，綁定自訂網域幾乎是自動的，不用手動查 DNS）。

### 接下來請你在 Cloudflare 儀表板操作（這段是你的帳號，我沒辦法幫你點）：

1. 登入 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 左側選單找 **Workers & Pages** → **Create** → **Pages** 分頁 → **Connect to Git**
3. 授權並選擇 repo：`harryjia1007/harry-world`
4. 建置設定全部**留空／預設**即可（這是純靜態網站，不需要 build command，Framework preset 選 **None**）
   - Build command：留空
   - Build output directory：留空（或填 `/`）
5. 按 **Save and Deploy**，約 1 分鐘後會拿到一個 `xxx.pages.dev` 的網址，先確認能打開
6. 進這個 Pages 專案的 **Custom domains** 分頁 → **Set up a custom domain** → 輸入你買的網域
   - 因為網域跟 Pages 專案在同一個 Cloudflare 帳號，這步通常會**自動幫你設好 DNS**，等它顯示綠色的 Active 就完成了
7. 之後只要我幫你改完 `app.js` 並 `git push`，Cloudflare Pages 會**自動重新部署**，不用再手動做任何事

> 如果卡在任何一步、畫面跟說明對不上，截圖給我，我可以就著畫面告訴你下一步按哪裡。

---

## 🔁 持續迭代的建議節奏

1. 有新作品／新經歷 → 改 `app.js` 的對應陣列
2. 本機打開 `index.html` 確認畫面
3. push 上 GitHub → Cloudflare Pages 自動重新部署，網域上的網站幾分鐘內就更新

就這麼簡單。這個網站設計成「會跟著你一起長大」——每做一個新東西，就多一個展品。之後你只要跟我說「幫我加一個新作品」之類的，我改完 `app.js` 就會直接幫你 commit + push。

---

## 備註

- 設計稿裡還有另一種風格 **1b「Grid Lab」結構網格科技感**（等寬字、新創感）。目前實作的是 1a Soft Studio。想切換或做成可切換版本，跟我說。
- 字型（Hanken Grotesk / Noto Sans TC / Space Mono）與圖示（Font Awesome）都從 CDN 載入，需要網路連線；上線後會自動快取，速度沒問題。
