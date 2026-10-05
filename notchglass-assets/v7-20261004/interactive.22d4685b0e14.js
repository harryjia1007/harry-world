
(function () {
  "use strict";
  // ── 圖示（SF Symbols 的線條版替身）
  var I = {
    clip: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4.2l2 2.2H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    conv: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 10.5A7.5 7.5 0 0 0 6 6.6L4.5 8"/><path d="M4.5 4v4h4"/><path d="M4.5 13.5A7.5 7.5 0 0 0 18 17.4l1.5-1.4"/><path d="M19.5 20v-4h-4"/></svg>',
    air: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><path d="M8.6 8.6a4.8 4.8 0 0 0 0 6.8M15.4 8.6a4.8 4.8 0 0 1 0 6.8M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/></svg>',
    cloud: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M7 18.5h10.5a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.4 9.2 4.7 4.7 0 0 0 7 18.5z"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    down: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v11M7 9.5l5 5 5-5M5 20h14"/></svg>',
    down2: '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M6 13l6 6 6-6"/></svg>',
    cup: function (on) { return '<svg width="13" height="13" viewBox="0 0 24 24" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a3 3 0 0 1 0 6H17" fill="none"/><path d="M3 21.5h16" fill="none" stroke-linecap="round"/></svg>'; },
    cupIdle: '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="#8B5CF6"/><path d="M17 10h1.5a3 3 0 0 1 0 6H17" fill="none" stroke="#8B5CF6" stroke-width="2.4"/><path d="M3 21.5h16" stroke="#8B5CF6" stroke-width="2.4" stroke-linecap="round"/></svg>',
    gear: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/></svg>',
    x: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    xs: '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    note: '<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 17.5a3 3 0 1 1-2-2.83V5.2l12-2.4v12.7a3 3 0 1 1-2-2.83V7.4l-8 1.6z"/></svg>',
    prev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.5 12L21 5.5v13zM2.5 12L12 5.5v13z"/></svg>',
    next: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.5 12L3 5.5v13zM21.5 12L12 5.5v13z"/></svg>',
    play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.2v15.6a1 1 0 0 0 1.5.86l12.4-7.8a1 1 0 0 0 0-1.72L8.5 3.34A1 1 0 0 0 7 4.2z"/></svg>',
    pause: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5.5" y="4" width="4.6" height="16" rx="1.2"/><rect x="13.9" y="4" width="4.6" height="16" rx="1.2"/></svg>',
    okc: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#34D399"/><path d="M7 12.4l3.3 3.3L17.2 8.8" fill="none" stroke="#0B2A20" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    photo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM7.5 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM3.5 17l5-5 4 4 3-3 5 5"/></svg>',
    film: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/></svg>',
    mnote: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M9 18a2.5 2.5 0 1 1-2.5-2.5H9V5l11-2v12.5a2.5 2.5 0 1 1-2.5-2.5H20"/></svg>',
    doc: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 2.5h8l4.5 4.5v14.5H6zM14 2.5V7h4.5"/></svg>',
    docBig: function (ext) { return '<svg width="46" height="58" viewBox="0 0 46 58" aria-hidden="true"><path d="M4 1h27l14 14v39a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3z" fill="#FFFFFF" stroke="#D1D1D6"/><path d="M31 1v11a3 3 0 0 0 3 3h11z" fill="#E5E5EA" stroke="#D1D1D6"/><text x="23" y="46" text-anchor="middle" font-size="9.5" font-weight="700" fill="#636366" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif">' + ext + '</text></svg>'; },
    folder: '<svg width="58" height="46" viewBox="0 0 58 46" aria-hidden="true"><path d="M2 8a4 4 0 0 1 4-4h14l5 5h27a4 4 0 0 1 4 4v27a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="#2F8BE0"/><path d="M2 15h54v25a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="#55AEF6"/></svg>'
  };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  // Marketing copy is localized; the illustrated App interface stays English.
  var ZH = {
    n1: "試玩", n2: "拖放", n3: "格式", n4: "音樂", n5: "限制", n6: "價格", n7: "說明", buyS: "購買",
    kick: "NotchGlass：在 Mac 本機轉檔，就在瀏海上", h1: "把檔案<br>丟進瀏海。",
    sub: "NotchGlass 把 MacBook 頂端那塊黑色瀏海，變成放檔案的地方。把檔案往上拖，丟到轉檔、AirDrop 或 iCloud 雲碟，然後回去做你的事。",
    tryline: "這個網頁最上面的瀏海也能用，試試看。", buy: "購買 · US$6 起", watch: "看影片",
    fine: "macOS 13 以上 · 沒有瀏海也能用 · 一次付費",
    sticky: "試試看 ↑\n把 sunrise.png 拖到上面的黑色瀏海。<small>沒有滑鼠？點一下檔案，再選一格。</small>",
    stickyDone: "成功，就是這樣。\n真的 App 會處理你自己的檔案。<small>也試試 AirDrop，或下面的無聲音樂預覽。</small>",
    dropH: "四個可以放檔案的地方。", dropP: "只有你帶著檔案靠近，面板才會打開；移開就收回瀏海。其他時候，它就只是瀏海。",
    dropS: "檔案進入螢幕頂端往下 280 點、中線左右各 380 點的範圍時就會打開，可以在設定裡調大或調小。",
    c1: "複製到「下載項目 › NotchClip」，同時放進剪貼簿，供支援貼上檔案的 App 使用。", c2: "在你的 Mac 上轉成別的格式，下面有詳細說明。",
    c3: "叫出 macOS 的 AirDrop 分享視窗，檔案已經帶上。", c4k: "iCloud 雲碟", c4: "複製到「iCloud 雲碟 › NotchGlass」，同步交給 macOS。",
    convH: "在你的 Mac 上轉檔，不是在別人的伺服器上。",
    convP: "常用格式用的是 macOS 內建的功能；部分影音格式需要另外安裝 FFmpeg。新檔案會出現在原檔旁邊、用新的檔名，不會覆蓋任何東西。",
    v1cap: "這段畫面由 NotchGlass 自己的介面程式碼產生。PNG → JPEG 的轉檔是真的執行、以原速播放；周圍的桌面與 Finder 是佈景。",
    listT: "什麼可以轉成什麼", th1: "來源", th2: "可以轉成", th3: "需要",
    r1a: "圖片：HEIC、PNG、JPG、WebP、AVIF、TIFF、BMP", r1b: "互轉，或轉成 PDF；多張圖片會合併成一份 PDF。",
    r2b: "逐頁存成 PNG 或 JPG 的資料夾、純文字、Word（.docx）", r3a: "Word、Markdown、RTF、HTML、純文字", r3b: "PDF；純文字也能轉成 HTML。",
    r4b: "互轉、GIF，或只取出音訊（M4A、WAV）", r5b: "互轉", r6b: "其他影片與音訊格式",
    bi1: "內建", bi2: "內建", bi3: "內建", bi4: "內建", bi5: "內建", ff: "需另外安裝 FFmpeg", listF: "能輸出哪些圖片格式，取決於你的 macOS 版本。",
    musH: "有音樂在播時，瀏海會顯示出來。",
    musP: "瀏海一側是小小的專輯封面，另一側是播放狀態動畫。滑鼠移上去，就展開完整的播放器：時間軸、播放暫停、上一首下一首。",
    musS: "封面、切歌與時間軸操作，依播放器、版本及你給的權限而異。這段影片是介面示範，不是播放器相容性測試。",
    awake: "另外還有一個咖啡杯圖示：點一下，螢幕就不會因為閒置而關閉，直到你再點一次或結束 App。手動睡眠或闔上螢幕不受影響。",
    limH: "老實說，它做不到的事。", limP: "每個 App 都有邊界。先把 NotchGlass 的寫在這裡，免得你付錢之後才發現。",
    limT: "- 沒有 OCR。掃描出來的 PDF 只是圖片，抓不出文字。\n- PDF 轉 Word 會保留文字，但複雜的版面可能會跑掉。\n- MKV、WebM、MP3、FLAC 等格式需要另外安裝 FFmpeg。\n- 只有 Mac 版，需要 macOS 13 以上。沒有 iPhone、iPad 或 Windows 版。\n- 音樂控制取決於播放器和你給的權限。\n- 這是一個人做的。出問題時，你的信是直接寄給我。",
    le1: "嗨，我是 Harry，住在台灣。NotchGlass 從畫面、動畫到每一項功能，都是我一個人做的。",
    le2: "聽歌、轉檔、傳檔案，每一件都要我離開正在做的事。NotchGlass 來自一個直接的問題：MacBook 頂端那塊空間，能不能替工作省下一步？",
    le3: "它 6 美元起，付一次，沒有訂閱。如果不適合你，14 天內寫信給我，我會退款。",
    le4: "它還很早期，也只有我一個人在做。壞掉的地方、想要的功能，都直接告訴我；你是在跟真正能改它的人說話。",
    ver: "目前下載版：1.5.15", once: "起，一次付費", p1: "所有功能，沒有分級。", p2: "最多 2 台 Mac 的永久授權，沒有訂閱。", p3: "想多支持一點，可以在 Gumroad 自己填更高的金額。", p4: "購買後 14 天內可全額退款。",
    mkRole: "NotchGlass 開發者", mkH: "一個人做的，在台灣。", mkP: "我是 Harry。聽歌、轉檔、傳檔案，每一件都要我離開手上的工作。所以我做了 NotchGlass，讓這些小事在螢幕頂端就能完成。",
    mkQ: "有問題或遇到錯誤？", mkS: "直接寫信給我，收信的就是做這個 App 的人。",
    prH: "一個價格，所有功能。", prP: "買一次，最多可在兩台 Mac 上使用。沒有訂閱，也沒有要另外付費解鎖的等級。", prF: "查看支援的格式", prQ: "有問題？看常見問題", prM: "寫信問我",
    qBtn: "有問題？", buyG: "到 Gumroad 購買", gm: "結帳、收據和授權碼由 Gumroad 處理。", s2: "不訂閱，永遠不會。",
    helpT: "NotchGlass 說明",
    q1: "一定要有瀏海的 MacBook 嗎？", a1: "不用。沒有瀏海的 Mac，它會待在螢幕頂端正中間，用法一樣。",
    q2: "轉檔時檔案會被上傳嗎？", a2: "不會。轉檔都在你的 Mac 上完成。App 只有在檢查授權、檢查更新、查詢正在播放歌曲的封面時才會連網。丟到 iCloud 雲碟的檔案，會複製到你的 iCloud 資料夾，之後由 macOS 同步。",
    q3: "轉好的檔案會放在哪？", a3: "放在原檔旁邊、用新的檔名，不會覆蓋任何檔案。",
    q4: "如果不適合我呢？", a4: "購買後 14 天內寄信到 harryjia1007@gmail.com，全額退款。",
    f1: "NotchGlass 由台灣的一個人製作。", f2: "這個網頁上的瀏海是在你瀏覽器裡的模擬，丟上去的東西不會離開你的電腦。",
    zone: "檔案進入這個範圍，NotchGlass 就會打開",
    demoNote: "<b>互動示意</b>這裡不會轉檔、上傳，也不會更改你電腦上的任何東西。示意畫面沿用 App 的英文介面。",
    q5: "怎麼安裝、啟用？", a5: "從 Gumroad 收據下載 App，移到「應用程式」資料夾。打開設定 › License，貼上購買時拿到的授權碼，按 Activate。App 有 Developer ID 簽章，並經過 Apple 公證。",
    q6: "更新怎麼拿？", a6: "從 Gumroad 購買收據下載最新版本，結束 NotchGlass，再替換「應用程式」裡的 App。設定與鑰匙圈授權會保留；更新需手動安裝。",
    q7: "為什麼會問媒體存取權限？", a7: "為了顯示正在播放的歌曲、控制播放器，macOS 會詢問是否允許 NotchGlass 取得媒體資訊。之後可以在「系統設定 › 隱私權與安全性 › 自動化」更改。",
    winReset: "把視窗放回原位"
  };
  var nodes = [].slice.call(document.querySelectorAll("[data-i]"));
  var EN = {}; nodes.forEach(function (n) { EN[n.getAttribute("data-i")] = n.innerHTML; });
  EN.stickyDone = "nice, that's it.\nthe real app does this with your own files.<small>Try AirDrop too, or the silent music preview below.</small>";
  var L = window.NotchGlassLocales;
  Object.assign(EN, L.en); Object.assign(ZH, L.zh);
  var copies = { en: EN, zh: ZH, ja: L.ja, ko: L.ko };
  var lang = "en";
  try { lang = localStorage.getItem("ng-language") || "en"; } catch (e) {}
  if (lang === "zh-Hant") lang = "zh";
  if (!copies[lang]) lang = "en";
  var T = function (en, zh) { return lang === "zh" ? zh : (L.common[lang] && L.common[lang][en]) || en; };
  function message(key, arg) { return L.messages[lang][key].replace(/\{0\}/g, String(arg)); }
  var langBtn = document.getElementById("lang");
  var themeBtn = document.getElementById("theme");
  var colorQuery = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
  function applyTheme(t) {
    window.ngTheme = t;
    document.documentElement.dataset.theme = t === "auto" ? (colorQuery && colorQuery.matches ? "dark" : "light") : t;
    themeBtn.value = t;
  }
  applyTheme(window.ngTheme || "auto");
  themeBtn.addEventListener("change", function () { applyTheme(themeBtn.value); try { localStorage.setItem("ng-theme", themeBtn.value); } catch (e) {} });
  if (colorQuery) colorQuery.addEventListener("change", function () { if (window.ngTheme === "auto") applyTheme("auto"); });
  // 各語系的限制文字是「- 」開頭的多行字串；轉成真正的清單，續行併回上一項
  function listify() {
    var el = document.querySelector('.limits[data-i="limT"]'); if (!el) return;
    var items = [];
    el.textContent.split(/\n/).forEach(function (ln) {
      var t = ln.trim(); if (!t) return;
      if (/^[-–•]\s*/.test(t)) items.push(t.replace(/^[-–•]\s*/, ""));
      else if (items.length) items[items.length - 1] += " " + t;
      else items.push(t);
    });
    el.innerHTML = "<ul>" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
  }
  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l === "zh" ? "zh-Hant" : l;
    nodes.forEach(function (n) { var k = n.getAttribute("data-i"); n.innerHTML = copies[l][k] != null ? copies[l][k] : EN[k]; });
    listify();
    langBtn.value = l;
    langBtn.setAttribute("aria-label", L.controls[l].language);
    themeBtn.setAttribute("aria-label", L.controls[l].appearance);
    [].forEach.call(themeBtn.options, function (o, i) { o.textContent = L.controls[l].themes[i]; });
    document.querySelector('meta[name="description"]').content = L.controls[l].description;
    document.getElementById("fgrid").setAttribute("aria-label", L.controls[l].files);
    document.getElementById("ng").setAttribute("aria-label", L.controls[l].demo);
    mobileMenu.setAttribute("aria-label", copies[l].pageOptions);
    demoReset.setAttribute("aria-label", copies[l].resetDemo);
    demoReset.title = copies[l].resetDemo;
    document.querySelector(".maker img").alt = L.controls[l].portrait;
    document.getElementById("v1").setAttribute("aria-label", L.controls[l].conversionVideo);
    document.getElementById("v2").setAttribute("aria-label", L.controls[l].musicVideo);
    stickyText(); tickClock(); musicBtnText(); syncVideoLabels(); if (S.toast) setToast(S.toast); render(true);
  }
  langBtn.addEventListener("change", function () { var l = langBtn.value; try { localStorage.setItem("ng-language", l === "zh" ? "zh-Hant" : l); } catch (e) {} applyLang(l); });

  var mobileMenu = document.getElementById("mobileMenu"), pageOptions = document.getElementById("pageOptions"), demoReset = document.getElementById("demoReset");
  function compact() { return window.matchMedia("(max-width: 640px), (max-height: 500px) and (pointer: coarse), (max-width: 1024px) and (hover: none) and (pointer: coarse)").matches; }
  function menuOpen(open, restore) {
    pageOptions.classList.toggle("open", open);
    mobileMenu.setAttribute("aria-expanded", String(open));
    if (restore) mobileMenu.focus({ preventScroll: true });
  }
  mobileMenu.addEventListener("click", function () {
    var open = mobileMenu.getAttribute("aria-expanded") !== "true";
    if (S.expanded) { if (S.picked) cancelPick(); else collapse(); }
    menuOpen(open, false);
  });
  document.addEventListener("pointerdown", function (e) {
    if (!pageOptions.contains(e.target) && !mobileMenu.contains(e.target)) menuOpen(false, false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && pageOptions.classList.contains("open")) { e.stopPropagation(); menuOpen(false, true); }
  });

  // ── 選單列：時鐘用訪客自己的時間；離開桌面區就換成淺色
  var clock = document.getElementById("clock");
  function tickClock() {
    var d = new Date();
    try {
      clock.textContent = d.toLocaleString({ zh: "zh-TW", en: "en-US", ja: "ja-JP", ko: "ko-KR" }[lang], { month: "numeric", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" });
    } catch (e) { clock.textContent = ""; }
  }
  setInterval(tickClock, 20000);
  var mb = document.getElementById("mb"), hero = document.getElementById("try");
  function mbTone() { mb.classList.toggle("light", hero.getBoundingClientRect().bottom < 32); }
  var toneFrame = 0;
  addEventListener("scroll", function () {
    if (!toneFrame) toneFrame = requestAnimationFrame(function () { toneFrame = 0; mbTone(); });
  }, { passive: true });

  // ── 四格說明區的靜態面板（和試玩用同一套元件）
  var TILES = [
    { key: "clip", title: "NotchClip", sub: "Save to shelf" },
    { key: "conv", title: "Convert", sub: "Convert format" },
    { key: "air", title: "AirDrop", sub: "Send wirelessly" },
    { key: "cloud", title: "iCloud", sub: "Upload to cloud" }
  ];
  function cellsHTML(interactive, hoverIdx) {
    return TILES.map(function (t, i) {
      var tag = interactive ? 'button type="button" data-cell="' + i + '" aria-label="' + esc(message("drop", t.title)) + '"' : "div";
      return "<" + tag + ' class="ng-cell' + (hoverIdx === i ? " hov" : "") + '"><span class="ic"><span class="g">' + I[t.key] + '</span><span class="ok">' + I.check + '</span></span>' +
        '<span class="tt"><span class="t">' + t.title + '</span><span class="s">' + t.sub + '</span><span class="s2">Done!</span></span></' + (interactive ? "button" : "div") + ">";
    }).join("");
  }
  document.getElementById("ngStatic").innerHTML = '<div class="ng-drag"><div class="ng-hint">' + I.down + '<span>Drop onto a tile to run it</span></div><div class="ng-grid">' + cellsHTML(false, 1) + "</div></div>";
  [].forEach.call(document.querySelectorAll(".cap .ci"), function (el) { el.innerHTML = I[el.getAttribute("data-icon")]; });
  [].forEach.call(document.querySelectorAll(".list .fi"), function (el) { var k = el.getAttribute("data-icon"); el.innerHTML = I[k === "note" ? "mnote" : k]; });

  // ════════════ 試玩 ════════════
  var K = { IDLE_W: 185, IDLE_H: 32, FLARE: 12, OPEN_W: 460, ZONE_H: 280, ZONE_HALF: 380, PAD: 14, GAP: 8 };
  // 動態偏好可能在看網頁時才改：載入時讀一次，之後也聽 change
  var mqReduce = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduce = !!(mqReduce && mqReduce.matches);
  var IMG = ["PNG", "JPG", "JPEG", "HEIC", "AVIF", "TIFF", "BMP"];
  // 無聲預覽用的示範曲目：沒有音訊，只示範介面怎麼顯示與切歌
  var TRACKS = [
    { title: "Evening Study", dur: 204, hue: 0 },
    { title: "Morning Notes", dur: 187, hue: 70 },
    { title: "Late Train", dur: 231, hue: 200 }
  ];
  function fresh() {
    return {
      files: [
        { id: "sunrise.png", name: "sunrise.png", ext: "png", kind: "image" },
        { id: "brief.pdf", name: "brief.pdf", ext: "pdf", kind: "doc" },
        { id: "notes.txt", name: "notes.txt", ext: "txt", kind: "doc" },
        { id: "clip.mov", name: "clip.mov", ext: "mov", kind: "doc" }
      ],
      selected: null, drag: null, picked: null, expanded: false, dragMode: false, hovering: false, tab: "music",
      hoverIdx: null, doneIdx: null, convertFile: null, fmt: null, cstate: "idle", progress: 0, output: null,
      hasTrack: false, playing: false, track: 0, pos: 0, awake: false, notice: null, toast: null, converted: false, result: null,
      returnTo: null, focusNext: null
    };
  }
  var S = fresh();
  var timers = {};
  function later(n, ms, fn) { clearTimeout(timers[n]); timers[n] = setTimeout(fn, ms); }
  function cancel(n) { clearTimeout(timers[n]); }
  function set(p) { for (var k in p) S[k] = p[k]; render(); }

  var ng = document.getElementById("ng"), ngC = document.getElementById("ngC"), shadow = document.getElementById("ngShadow");
  var fgrid = document.getElementById("fgrid"), zone = document.getElementById("zone"), ghost = document.getElementById("ghost"), toast = document.getElementById("toast");
  function panelFocused() { return ng.contains(document.activeElement); }
  var kbMode = false;
  var KB_KEYS = ["Tab", "Enter", " ", "Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"];
  addEventListener("keydown", function (e) { if (KB_KEYS.indexOf(e.key) >= 0) kbMode = true; }, true);
  addEventListener("pointerdown", function () { kbMode = false; }, true);
  function holdOpen() { return compact() || (kbMode && panelFocused()); }

  // 格式清單＝SupportedFormats.targets(forInputExt:)，假設沒有安裝 FFmpeg
  function formatsFor(ext) {
    switch (ext) {
      case "png": case "jpg": case "jpeg": case "heic": case "avif": case "tiff": case "bmp":
        return [{ cat: "Image", list: IMG.filter(function (x) { return x.toLowerCase() !== ext; }) }, { cat: "Document", list: ["PDF"] }];
      case "pdf": return [{ cat: "Image", list: ["PNG", "JPG"] }, { cat: "Document", list: ["TXT", "DOCX"] }];
      case "txt": return [{ cat: "Document", list: ["HTML", "PDF"] }];
      case "md": case "rtf": case "html": case "docx": return [{ cat: "Document", list: ["PDF"] }];
      case "mov": return [{ cat: "Video", list: ["MP4", "GIF"] }, { cat: "Audio", list: ["WAV", "M4A"] }];
      case "mp4": return [{ cat: "Video", list: ["MOV", "GIF"] }, { cat: "Audio", list: ["WAV", "M4A"] }];
      case "gif": return [{ cat: "Image", list: IMG }];
      case "wav": return [{ cat: "Audio", list: ["M4A"] }];
      case "m4a": return [{ cat: "Audio", list: ["WAV"] }];
      default: return [];
    }
  }

  // ── 尺寸：spring(response 0.40, dampingFraction 0.82)，換目標時保留速度。
  // 窄螢幕不再整塊縮小（字會小到看不清），改成面板寬度跟著螢幕，最寬 460。
  var sp = { w: 209, vw: 0, h: 32, vh: 0 }, raf = 0, last = 0;
  function vw() { return document.documentElement.clientWidth; }
  function openW() { return Math.min(K.OPEN_W, vw() - 16); }
  function ns() { return Math.min(1, (vw() - 16) / K.OPEN_W); }
  function idleWidth() { var music = S.playing && S.hasTrack; return music ? K.IDLE_W + (S.awake ? 112 : 92) : S.awake ? K.IDLE_W + 60 : K.IDLE_W; }
  function surfaceHeight() {
    var v = window.visualViewport;
    // Browser toolbars change the visible height without changing the screen size.
    // Do not reflow the surface during pinch zoom; the browser owns that gesture.
    var height = v && Math.abs(v.scale - 1) < .01 ? v.height : innerHeight;
    var top = document.getElementById("mb").getBoundingClientRect().bottom;
    var bottom = parseFloat(getComputedStyle(toast).bottom) || 16;
    return Math.max(44, Math.floor(height - top - bottom));
  }
  function target() {
    var w = S.expanded ? openW() : compact() ? 92 : (idleWidth() + 2 * K.FLARE) * ns();
    // App 的空檔 Tools 是 206；網頁字型排出來的內容要 226 才不會被裁掉，這裡刻意不同
    var h = !S.expanded ? K.IDLE_H * ns() : S.dragMode ? 196 : S.tab === "music" ? 244 : (S.convertFile ? 300 : 226);
    if (compact()) {
      ngC.style.width = openW() + "px";
      var available = surfaceHeight();
      ngC.style.maxHeight = available + "px";
      h = S.expanded ? Math.min(ngC.scrollHeight, available) : 28;
    } else ngC.style.maxHeight = "";
    return { w: w, h: h };
  }
  function settled(t) { return Math.abs(sp.w - t.w) < .3 && Math.abs(sp.h - t.h) < .3 && Math.abs(sp.vw) < 1 && Math.abs(sp.vh) < 1; }
  function kick() {
    var t = target();
    if (reduce) { if (raf) { cancelAnimationFrame(raf); raf = 0; } sp.w = t.w; sp.h = t.h; sp.vw = sp.vh = 0; geom(); return; }
    if (settled(t)) { geom(); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function frame(now) {
    var dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
    var t = target(), k = 246.74, c = 25.76, n = 8, h = dt / n;
    for (var i = 0; i < n; i++) {
      sp.vw += (-k * (sp.w - t.w) - c * sp.vw) * h; sp.w += sp.vw * h;
      sp.vh += (-k * (sp.h - t.h) - c * sp.vh) * h; sp.h += sp.vh * h;
    }
    if (settled(t)) { sp.w = t.w; sp.h = t.h; sp.vw = sp.vh = 0; raf = 0; } else raf = requestAnimationFrame(frame);
    geom();
  }
  function q(v) { return Math.round(v * 100) / 100; }
  function geom() {
    var ow = openW(), phone = compact();
    var w = phone ? Math.min(sp.w, ow) : sp.w, h = phone ? Math.min(sp.h, surfaceHeight()) : sp.h, left = vw() / 2 - w / 2;
    ng.style.width = w + "px"; ng.style.height = h + "px"; ng.style.left = left + "px";
    shadow.style.width = w + "px"; shadow.style.height = h + "px"; shadow.style.left = left + "px";
    if (phone) {
      // A stable rounded shell avoids iOS retaining the old animated path mask.
      ng.style.clipPath = "none";
      ng.style.borderRadius = S.expanded ? "0 0 20px 20px" : "0 0 12px 12px";
    }
    else if (S.expanded) { ng.style.clipPath = "none"; ng.style.borderRadius = "0 0 20px 20px"; }
    else {
      // NotchExtensionShape：上緣向外張開 12、下緣圓角 7
      var f = Math.min(K.FLARE, w / 4), L = f, R = w - f, r = Math.max(0, Math.min(7, (w - 2 * f) / 2, h - f));
      ng.style.clipPath = "path('M0,0 Q" + q(L) + ",0 " + q(L) + "," + q(f) + " L" + q(L) + "," + q(h - r) + " Q" + q(L) + "," + q(h) + " " + q(L + r) + "," + q(h) +
        " L" + q(R - r) + "," + q(h) + " Q" + q(R) + "," + q(h) + " " + q(R) + "," + q(h - r) + " L" + q(R) + "," + q(f) + " Q" + q(R) + ",0 " + q(w) + ",0 Z')";
      ng.style.borderRadius = "0";
    }
    ngC.style.width = ow + "px";
    ngC.style.left = ((w - ow) / 2) + "px";
  }
  addEventListener("resize", function () { menuOpen(false, false); render(true); if (S.drag) zoneGeom(); });
  var viewportFrame = 0;
  if (window.visualViewport) visualViewport.addEventListener("resize", function () {
    if (!compact() || Math.abs(visualViewport.scale - 1) >= .01 || viewportFrame) return;
    viewportFrame = requestAnimationFrame(function () { viewportFrame = 0; kick(); });
  });

  // ── 畫面
  var lastFinder = "", lastPanel = "";
  function fileIcon(f) { return f.kind === "image" ? '<img src="/notchglass-assets/v7-20261004/media/sunrise-thumb.jpg" alt="">' : f.kind === "folder" ? I.folder : I.docBig(esc((f.ext || "").toUpperCase())); }
  function renderFinder() {
    var key = S.files.map(function (f) { return f.name; }).join("|") + "|" + lang;
    if (key !== lastFinder) {
      lastFinder = key;
      var had = fgrid.contains(document.activeElement) ? document.activeElement.getAttribute("data-id") : null;
      fgrid.innerHTML = S.files.map(function (f) {
        return '<button type="button" class="ff' + (f.isNew ? " new" : "") + '" data-id="' + esc(f.id) + '" aria-label="' + esc(f.name) + '. ' +
          esc(T("Drag it to the notch, or press Enter to pick it up.", "拖到瀏海，或按 Enter 拿起來。")) + '"><span class="ib">' + fileIcon(f) + '</span><span class="nm">' + esc(f.name) + "</span></button>";
      }).join("");
      if (had) { var b = fgrid.querySelector('[data-id="' + CSS.escape(had) + '"]'); if (b) b.focus({ preventScroll: true }); }
    }
    [].forEach.call(fgrid.children, function (b) { b.classList.toggle("sel", b.getAttribute("data-id") === S.selected); });
    var result = document.getElementById("demo-result"), text = S.result ? message("converted", S.result) : "";
    if (result.textContent !== text) result.textContent = text;
  }
  function panelKey() {
    var idle = !S.expanded && ((S.playing && S.hasTrack) || S.awake);
    return [S.expanded, S.dragMode, S.tab, S.convertFile && S.convertFile.name, S.fmt, S.cstate, S.output, S.hasTrack, S.playing, S.track, S.awake, S.notice, idle, lang].join("|");
  }
  function fmtTime(sec) { var t = Math.max(0, Math.floor(sec)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); }
  function tabsHTML() {
    return '<div class="ng-tabs"><button type="button" class="ng-tab' + (S.tab === "music" ? " on" : "") + '" data-act="tab-music">Music</button>' +
      '<button type="button" class="ng-tab' + (S.tab === "convert" ? " on" : "") + '" data-act="tab-tools">Tools</button><span class="ng-fill"></span>' +
      (S.notice ? '<span class="ng-note ng-in">' + esc(S.notice) + "</span>" : "") +
      '<button type="button" class="ng-ib' + (S.awake ? " on" : "") + '" data-act="awake" aria-label="' + (S.awake ? T("Turn off Keep Awake (simulated)", "關閉保持喚醒（示意）") : T("Keep screen awake (simulated)", "保持螢幕喚醒（示意）")) + '">' + I.cup(S.awake) + "</button>" +
      '<button type="button" class="ng-ib" data-act="settings" aria-label="' + T("Settings (simulated)", "設定（示意）") + '">' + I.gear + "</button>" +
      '<button type="button" class="ng-ib" data-act="close" aria-label="' + T("Close", "關閉") + '">' + I.x + "</button></div><div class=\"ng-div\"></div>";
  }
  function artStyle(extra) { var h = TRACKS[S.track].hue; return h ? ' style="filter:' + (extra || "") + "hue-rotate(" + h + 'deg)"' : (extra ? ' style="filter:' + extra + '"' : ""); }
  function musicHTML() {
    var has = S.hasTrack, tr = TRACKS[S.track];
    var cover = has ? '<img class="aura' + (S.playing ? "" : " paused") + '" src="/notchglass-assets/v7-20261004/media/album-art.jpg" alt=""' + artStyle("blur(26px) saturate(1.4) ") + '><img class="art" src="/notchglass-assets/v7-20261004/media/album-art.jpg" alt="' + esc(message("art", tr.title)) + '"' + artStyle("") + ">"
      : '<div class="ng-ph">' + I.note + "</div>";
    return '<div class="ng-body ng-in"><div class="ng-music"><div class="ng-cover">' + cover + '</div><div class="ng-mcol">' +
      '<div><div class="ng-title">' + (has ? esc(tr.title) : "Nothing playing") + '</div><div class="ng-sub">' + (has ? "NotchGlass Demo · Silent preview" : "Open Apple Music, Spotify, or YouTube Music") + "</div></div>" +
      '<div class="ng-prog' + (has ? "" : " dim2") + '"><span class="ng-time" data-dyn="pos">0:00</span>' +
      '<div class="ng-track" role="slider" tabindex="0" data-act="seek" aria-label="' + T("Playback position", "播放位置") + '" aria-valuemin="0" aria-valuemax="' + (has ? tr.dur : 0) + '" aria-valuenow="0"' + (has ? "" : ' aria-disabled="true"') + '><span><i data-dyn="bar"></i></span></div>' +
      '<span class="ng-time r">' + (has ? fmtTime(tr.dur) : "0:00") + "</span></div>" +
      '<div class="ng-ctrl' + (has ? "" : " dim") + '"><button type="button" class="ng-mb" data-act="prev" aria-label="' + T("Previous track", "上一首") + '">' + I.prev + "</button>" +
      '<button type="button" class="ng-mb p" data-act="play" aria-label="' + (S.playing ? T("Pause", "暫停") : T("Play", "播放")) + '">' + (S.playing ? I.pause : I.play) + "</button>" +
      '<button type="button" class="ng-mb" data-act="next" aria-label="' + T("Next track", "下一首") + '">' + I.next + "</button></div></div></div></div>";
  }
  function convertHTML() {
    var cf = S.convertFile;
    if (!cf) {
      return '<div class="ng-body ng-in"><div class="ng-eh">' + I.down2 + '<span>Drag files to the notch, then drop on a tile below</span></div><div class="ng-grid" style="margin:8px 0 0">' + cellsHTML(false, null) + "</div></div>";
    }
    var groups = formatsFor(cf.ext), icon = ["mp4", "mov", "gif"].indexOf(cf.ext) >= 0 ? I.film : ["wav", "m4a"].indexOf(cf.ext) >= 0 ? I.mnote : ["png", "jpg", "jpeg", "heic", "webp", "avif", "tiff", "bmp"].indexOf(cf.ext) >= 0 ? I.photo : I.doc;
    var h = '<div class="ng-body ng-in"><div class="ng-cv"><div class="ng-chip"><span style="color:rgba(255,255,255,.62);display:flex">' + icon.replace('width="16" height="16"', 'width="12" height="12"') + '</span><span class="n">' + esc(cf.name) +
      '</span><span class="ng-ext">' + esc(cf.ext.toUpperCase()) + '</span><button type="button" class="ng-x" data-act="remove" aria-label="' + T("Remove this file from the list", "從清單移除這個檔案") + '">' + I.xs + "</button></div>";
    if (groups.length) {
      h += '<div class="ng-div"></div><div>' + groups.map(function (g) {
        return '<span class="ng-cat">' + g.cat + '</span><div class="ng-fl">' + g.list.map(function (x) {
          return '<button type="button" class="ng-fmt' + (S.fmt === x ? " on" : "") + '" data-act="fmt" data-fmt="' + x + '" aria-pressed="' + (S.fmt === x) + '"><span>' + x + "</span></button>";
        }).join("") + "</div>";
      }).join("") + "</div>";
    }
    if (S.cstate === "idle") h += '<button type="button" class="ng-go" data-act="convert"' + (S.fmt ? "" : " disabled") + ">" + I.conv.replace('width="17" height="17"', 'width="12" height="12"').replace('stroke-width="1.8"', 'stroke-width="2.6"') + "Convert</button>";
    else if (S.cstate === "converting") h += '<div class="ng-busy" role="status" tabindex="-1" data-focus="busy"><div class="ng-b4"><i data-dyn="cbar"></i></div><div class="ng-pct" data-dyn="cpct">Converting 0%</div></div>';
    else h += '<div class="ng-done ng-in">' + I.okc + '<div class="w"><b>Done</b><span>' + esc(S.output || "") + '</span></div><button type="button" class="ng-link b" data-act="show">Show</button><button type="button" class="ng-link" data-act="another" style="margin-left:4px">Convert another</button></div>';
    return h + "</div></div>";
  }
  function idleHTML() {
    var music = S.playing && S.hasTrack;
    var bars = [15, 19, 21, 17, 20].map(function (hh, i) { return '<i style="height:' + q(hh * 16 / 21) + 'px;animation-duration:' + [0.52, 0.71, 0.44, 0.63, 0.83][i] + 's"></i>'; }).join("");
    return '<div class="ng-idle ng-in" data-dyn="idle"><span class="l">' + (S.awake ? I.cupIdle : "") + (music ? '<img src="/notchglass-assets/v7-20261004/media/album-art.jpg" alt=""' + artStyle("") + ">" : "") + "</span>" +
      (music ? '<span class="ng-bars' + (S.playing ? "" : " paused") + '">' + bars + "</span>" : "") + "</div>";
  }
  // 重畫面板時保住鍵盤焦點：記下原本的按鈕，重畫後聚焦同一個，或明確指定的下一步
  function focusKey(el) {
    var t = el && el.closest ? el.closest("[data-act],[data-cell],[data-focus]") : null;
    return t ? [t.getAttribute("data-act"), t.getAttribute("data-fmt"), t.getAttribute("data-cell"), t.getAttribute("data-focus")].join("|") : "*";
  }
  function restoreFocus(had) {
    var tgt = null;
    if (S.focusNext) { tgt = ngC.querySelector(S.focusNext); S.focusNext = null; }
    if (!tgt && had) [].some.call(ngC.querySelectorAll("[data-act],[data-cell],[data-focus]"), function (el) { if (focusKey(el) === had) { tgt = el; return true; } return false; });
    if (!tgt && had) tgt = ngC.querySelector('[data-act="convert"],[data-act="show"],[data-cell],[data-act="tab-tools"],button');
    if (tgt) tgt.focus({ preventScroll: true });
  }
  function renderPanel(force) {
    ng.classList.toggle("glass", S.expanded);
    shadow.classList.toggle("on", S.expanded);
    document.body.classList.toggle("ng-open", S.expanded);
    var key = panelKey();
    if (key !== lastPanel || force) {
      lastPanel = key;
      var had = panelFocused() ? focusKey(document.activeElement) : null;
      var html = "";
      if (S.expanded && S.dragMode) html = '<div class="ng-drag ng-in"><div class="ng-hint">' + I.down + '<span>' + (compact() ? esc(copies[lang].pickAction) : "Drop onto a tile to run it") + '</span>' + (compact() ? '<button type="button" class="ng-ib" data-act="close" aria-label="' + T("Close", "關閉") + '">' + I.x + '</button>' : "") + '</div><div class="ng-grid">' + cellsHTML(true, null) + "</div></div>";
      else if (S.expanded) html = tabsHTML() + (S.tab === "music" ? musicHTML() : convertHTML());
      ngC.innerHTML = html;
      var idle = !S.expanded && ((S.playing && S.hasTrack) || S.awake);
      var old = ng.querySelector('[data-dyn="idle"]'); if (old) old.remove();
      if (idle) ng.insertAdjacentHTML("beforeend", idleHTML());
      if (had || S.focusNext) restoreFocus(had);
    }
    // 只改會連續變動的部分，不重畫（鍵盤焦點才不會跑掉）
    [].forEach.call(ngC.querySelectorAll("[data-cell]"), function (b) {
      var i = +b.getAttribute("data-cell");
      b.classList.toggle("hov", S.hoverIdx === i && S.doneIdx !== i);
      b.classList.toggle("done", S.doneIdx === i);
    });
    var dur = TRACKS[S.track].dur, pos = S.hasTrack ? S.pos : 0;
    var posEl = ngC.querySelector('[data-dyn="pos"]'), bar = ngC.querySelector('[data-dyn="bar"]'), seek = ngC.querySelector('[data-act="seek"]');
    if (posEl) posEl.textContent = fmtTime(pos);
    if (bar) bar.style.width = (S.hasTrack ? pos / dur * 100 : 0) + "%";
    if (seek) { seek.setAttribute("aria-valuenow", String(Math.round(pos))); seek.setAttribute("aria-valuetext", fmtTime(pos) + T(" of ", " / ") + fmtTime(S.hasTrack ? dur : 0)); }
    var cbar = ngC.querySelector('[data-dyn="cbar"]'), cpct = ngC.querySelector('[data-dyn="cpct"]');
    if (cbar) cbar.style.width = Math.round(S.progress * 100) + "%";
    if (cpct) cpct.textContent = "Converting " + Math.round(S.progress * 100) + "%";
  }
  function zoneGeom() {
    zone.style.left = (vw() / 2 - K.ZONE_HALF) + "px"; zone.style.width = (2 * K.ZONE_HALF) + "px"; zone.style.height = K.ZONE_H + "px";
  }
  function renderOverlays() {
    var showZone = !!S.drag && !S.dragMode;
    if (zone.hidden === showZone) { zone.hidden = !showZone; if (showZone) zoneGeom(); }
    if (S.drag) {
      var f = S.files.filter(function (x) { return x.id === S.drag.id; })[0];
      if (ghost.hidden || ghost.getAttribute("data-id") !== S.drag.id) {
        ghost.setAttribute("data-id", S.drag.id);
        ghost.innerHTML = fileIcon(f) + '<span class="nm">' + esc(f.name) + "</span>";
        ghost.hidden = false;
      }
      ghost.style.transform = "translate(" + (S.drag.x - 60) + "px," + (S.drag.y - 30) + "px)";
    } else if (!ghost.hidden) ghost.hidden = true;
  }
  function render(force) { renderFinder(); renderPanel(force); renderOverlays(); stickyText(); kick(); }

  function setToast(t) {
    S.toast = t;
    if (!t) { toast.hidden = true; return; }
    var text = typeof t.text === "function" ? t.text() : t.text;
    toast.className = "toast ng-in" + (t.cancel ? "" : " plain");
    toast.innerHTML = "<span>" + esc(text) + "</span>" + (t.cancel ? '<button type="button" id="toastCancel">' + T("Cancel", "取消") + "</button>" : "");
    toast.hidden = false;
    if (t.cancel) document.getElementById("toastCancel").addEventListener("click", cancelPick);
  }
  function note(en, zh, ms) {
    setToast({ text: function () { return T(en, zh); }, cancel: false });
    later("toast", ms || 4200, function () { setToast(null); });
  }
  function noteKey(key, arg) {
    setToast({ text: function () { return message(key, arg); }, cancel: false });
    later("toast", 4200, function () { setToast(null); });
  }

  // ── 便條紙：轉檔成功後換一句
  var stickyP = document.querySelector("#sticky p");
  var stickyState = "";
  function stickyText() {
    var st = S.converted ? "done" : "start";
    if (st === stickyState && stickyP.getAttribute("data-lang") === lang) return;
    stickyState = st; stickyP.setAttribute("data-lang", lang);
    stickyP.innerHTML = copies[lang][st === "done" ? "stickyDone" : "sticky"];
  }

  // ── 判斷位置（視窗座標）
  function inZone(p) { return p.y < K.ZONE_H && Math.abs(p.x - vw() / 2) < K.ZONE_HALF; }
  function cellAt(p) {
    if (compact()) {
      var result = null;
      [].some.call(ngC.querySelectorAll("[data-cell]"), function (b) {
        var r = b.getBoundingClientRect();
        if (p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom) { result = +b.getAttribute("data-cell"); return true; }
        return false;
      });
      return result;
    }
    var ow = openW(), left = vw() / 2 - ow / 2;
    if (p.x < left || p.x > left + ow || p.y > 196) return null;
    var cw = (ow - 2 * K.PAD - 3 * K.GAP) / 4;
    return Math.max(0, Math.min(3, Math.floor((p.x - left - K.PAD) / (cw + K.GAP))));
  }

  // ── 拖曳檔案
  var pend = null, kbPick = false, touchPick = null;
  fgrid.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".ff"); if (!b || (e.button && e.button !== 0)) return;
    touchPick = null;
    if (e.pointerType !== "touch") e.preventDefault();
    pend = { id: b.getAttribute("data-id"), x: e.clientX, y: e.clientY, touch: e.pointerType === "touch" };
    if (!pend.touch) { try { b.setPointerCapture(e.pointerId); } catch (err) {} }
    set({ selected: pend.id });
  });
  fgrid.addEventListener("click", function (e) {
    var b = e.target.closest(".ff"); if (!b) return;
    // Expand after click dispatch, not pointerup: an immediate surface must not
    // intercept the same finger tap and accidentally run the tile beneath it.
    if (e.detail !== 0 && touchPick === b.getAttribute("data-id")) { touchPick = null; pick(b.getAttribute("data-id")); return; }
    if (e.detail !== 0) return;
    kbPick = true; pick(b.getAttribute("data-id"));
  });
  function onMove(e) {
    if (!pend) return;
    var p = { x: e.clientX, y: e.clientY };
    // Let a finger scroll natively; only a stationary tap selects a file.
    if (pend.touch) { if (Math.hypot(p.x - pend.x, p.y - pend.y) > 8) pend = null; return; }
    if (!S.drag && Math.hypot(p.x - pend.x, p.y - pend.y) < 5) return;
    var upd = { drag: { id: pend.id, x: p.x, y: p.y }, picked: null };
    if (!S.drag && S.toast && S.toast.cancel) setToast(null);
    if (inZone(p)) {
      if (!S.dragMode || !S.expanded) { cancel("collapse"); cancel("expand"); upd.expanded = true; upd.dragMode = true; }
      upd.hoverIdx = cellAt(p);
    } else {
      upd.hoverIdx = null;
      if (S.dragMode) { upd.expanded = false; upd.dragMode = false; }
    }
    set(upd);
  }
  function onUp() {
    var p = pend; pend = null;
    if (!p) return;
    if (!S.drag) { if (p.touch) touchPick = p.id; else pick(p.id); return; }
    var idx = S.hoverIdx, id = S.drag.id, wasDrag = S.dragMode;
    set({ drag: null, hoverIdx: null });
    if (idx !== null && wasDrag) drop(id, idx);
    else if (wasDrag) later("collapse", 1200, function () { if (!S.hovering && !holdOpen()) collapse(); });
  }
  fgrid.addEventListener("pointermove", onMove);
  fgrid.addEventListener("pointerup", onUp);
  fgrid.addEventListener("pointercancel", function () { pend = null; touchPick = null; set({ drag: null, hoverIdx: null }); });

  function pick(id) {
    var f = S.files.filter(function (x) { return x.id === id; })[0]; if (!f) return;
    cancel("collapse"); cancel("expand"); cancel("toast");
    menuOpen(false, false);
    set({ picked: id, selected: id, returnTo: id, expanded: true, dragMode: true, hoverIdx: null });
    setToast({ text: function () { return message("picked", f.name); }, cancel: true });
    if (kbPick) { kbPick = false; var c = ngC.querySelector("[data-cell]"); if (c) c.focus({ preventScroll: true }); }
  }
  // 收合時焦點如果在面板裡，送回原本那個檔案，不讓它掉到頁面最上面
  function focusEntry() {
    var b = S.returnTo ? fgrid.querySelector('[data-id="' + CSS.escape(S.returnTo) + '"]') : null;
    (b || fgrid.querySelector(".ff")).focus({ preventScroll: true });
  }
  function cancelPick() {
    var had = panelFocused() || toast.contains(document.activeElement);
    setToast(null); set({ picked: null }); collapse();
    if (had) focusEntry();
  }
  function collapse() {
    var had = panelFocused();
    cancel("expand"); cancel("collapse"); cancel("keep");
    set({ expanded: false, dragMode: false, hoverIdx: null });
    if (had) focusEntry();
  }

  function drop(id, idx) {
    var f = S.files.filter(function (x) { return x.id === id; })[0]; if (!f) return;
    var kb = kbMode && panelFocused();
    cancel("collapse");
    if (idx === 1) {
      var g = formatsFor(f.ext);
      setToast(null);
      set({ picked: null, drag: null, returnTo: id, doneIdx: 1, convertFile: f, fmt: g.length ? g[0].list[0] : null, cstate: "idle", progress: 0, output: null });
      // App：先標記完成，立刻切到 Tools 分頁，保持展開 5 秒；用鍵盤時把焦點交給 Convert 按鈕
      later("switch", 140, function () {
        if (kb || panelFocused()) S.focusNext = '[data-act="convert"]';
        set({ dragMode: false, tab: "convert", expanded: true, doneIdx: null, hoverIdx: null });
        later("keep", 5000, function () { if (!S.hovering && !holdOpen() && S.cstate !== "converting") collapse(); });
      });
      return;
    }
    set({ picked: null, drag: null, returnTo: id, doneIdx: idx, hoverIdx: null });
    if (idx === 0) noteKey("clip", f.name);
    else if (idx === 2) noteKey("air", f.name);
    else noteKey("cloud", f.name);
    later("done", 2000, function () { set({ doneIdx: null }); });
    later("collapse", 1200, function () { if (kb || (!S.hovering && !holdOpen())) collapse(); });
  }

  // ── 面板裡的按鈕
  function track() { return TRACKS[S.track]; }
  function seekBy(sec) { if (S.hasTrack) set({ pos: Math.max(0, Math.min(track().dur, S.pos + sec)) }); }
  ng.addEventListener("click", function (e) {
    var cell = e.target.closest("[data-cell]");
    if (cell) { if (S.picked) drop(S.picked, +cell.getAttribute("data-cell")); return; }
    var a = e.target.closest("[data-act]");
    if (!a) { if (!S.expanded) { cancel("expand"); set({ expanded: true }); } return; }
    var act = a.getAttribute("data-act");
    if (act === "tab-music") set({ tab: "music" });
    else if (act === "tab-tools") set({ tab: "convert" });
    else if (act === "awake") {
      var on = !S.awake; set({ awake: on }); flash(on ? "Screen will stay awake" : "Normal sleep restored");
      note(on ? "Simulated: in the app, this keeps your display from sleeping. Nothing changed here." : "Simulated: in the app, this restores normal sleep. Nothing changed here.",
           on ? "示意：在 App 裡，這會讓螢幕不因閒置而關閉。這裡沒有改任何設定。" : "示意：在 App 裡，這會恢復正常睡眠。這裡沒有改任何設定。");
    }
    else if (act === "settings") { flash("Settings open in their own window"); note("Simulated: in the app, this opens Settings in its own window.", "示意：在 App 裡，這會打開設定視窗。"); }
    else if (act === "close") { if (S.picked) cancelPick(); else collapse(); }
    else if (act === "fmt") { if (S.cstate !== "converting") set({ fmt: a.getAttribute("data-fmt"), cstate: "idle", output: null }); }
    else if (act === "convert") convert();
    else if (act === "show") { set({ selected: S.output }); var el = fgrid.querySelector('[data-id="' + CSS.escape(S.output) + '"]'); if (el) el.scrollIntoView({ block: "nearest" }); }
    else if (act === "another" || act === "remove") {
      clearInterval(convTimer);
      if (panelFocused()) S.focusNext = '[data-act="tab-tools"]';
      set({ convertFile: null, fmt: null, cstate: "idle", progress: 0, output: null });
    }
    else if (act === "play") { if (S.hasTrack) set({ playing: !S.playing }); musicBtnText(); }
    else if (act === "prev") { if (S.hasTrack) set(S.pos > 3 ? { pos: 0 } : { track: (S.track + TRACKS.length - 1) % TRACKS.length, pos: 0 }); }
    else if (act === "next") { if (S.hasTrack) set({ track: (S.track + 1) % TRACKS.length, pos: 0 }); }
    else if (act === "seek") {
      if (!S.hasTrack || !e.clientX) return;   // 鍵盤觸發的 click 沒有座標，交給方向鍵
      var r = a.getBoundingClientRect(); set({ pos: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * track().dur });
    }
  });
  // 時間軸滑桿：方向鍵 ±5 秒、Page Up／Down ±20 秒、Home／End 到頭尾
  ng.addEventListener("keydown", function (e) {
    var a = e.target.closest('[data-act="seek"]'); if (!a || !S.hasTrack) return;
    var k = e.key, d = track().dur;
    if (k === "ArrowRight" || k === "ArrowUp") seekBy(5);
    else if (k === "ArrowLeft" || k === "ArrowDown") seekBy(-5);
    else if (k === "PageUp") seekBy(20);
    else if (k === "PageDown") seekBy(-20);
    else if (k === "Home") set({ pos: 0 });
    else if (k === "End") set({ pos: d });
    else return;
    e.preventDefault();
  });
  ng.addEventListener("pointerover", function (e) {
    var cell = e.target.closest("[data-cell]");
    if (S.picked && cell) { var i = +cell.getAttribute("data-cell"); if (S.hoverIdx !== i) set({ hoverIdx: i }); }
  });
  ng.addEventListener("pointerout", function (e) {
    var cell = e.target.closest("[data-cell]");
    if (S.picked && cell && !cell.contains(e.relatedTarget)) set({ hoverIdx: null });
  });
  // 滑過瀏海：0.16 秒後展開，離開 0.6 秒後收合（App 的計時）；焦點在面板裡時不收合
  ng.addEventListener("pointerenter", function (e) {
    if (e.pointerType === "touch" || pend) return;
    cancel("collapse"); cancel("keep");
    S.hovering = true;
    if (!S.expanded && !S.dragMode) later("expand", 160, function () { if (S.hovering) set({ expanded: true }); });
  });
  ng.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "touch") return;
    cancel("expand"); S.hovering = false;
    if (S.expanded && !S.dragMode) later("collapse", 600, function () { if (!S.hovering && !S.dragMode && !holdOpen()) collapse(); });
  });
  ng.addEventListener("focusin", function () { if (kbMode) { cancel("collapse"); cancel("keep"); } });
  ng.addEventListener("focusout", function (e) {
    if (e.relatedTarget && ng.contains(e.relatedTarget)) return;
    // 焦點離開面板（不是重畫造成的暫時失焦）才安排收合
    later("collapse", 600, function () { if (S.expanded && !S.dragMode && !S.picked && !S.hovering && !holdOpen()) collapse(); });
  });
  document.addEventListener("pointerdown", function (e) {
    if (ng.contains(e.target) || toast.contains(e.target) || e.target.closest(".ff")) return;
    if (S.picked) cancelPick();
    else if (S.expanded && e.pointerType === "touch") collapse();
    if (S.selected && hero.contains(e.target)) set({ selected: null });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (S.picked) cancelPick(); else if (S.expanded) collapse();
  });
  function flash(text) { set({ notice: text }); later("notice", 2200, function () { set({ notice: null }); }); }

  // ── 轉檔（模擬：時間抓真實 App 的大概量級）
  var convTimer = 0;
  demoReset.addEventListener("click", function () {
    Object.keys(timers).forEach(cancel);
    clearInterval(convTimer); pend = null; touchPick = null;
    setToast(null); S = fresh(); lastFinder = lastPanel = "";
    render(true); musicBtnText();
  });
  function convert() {
    var cf = S.convertFile; if (!cf || !S.fmt || S.cstate === "converting") return;
    var src = cf.ext, to = S.fmt.toLowerCase();
    var video = ["mov", "mp4", "gif"].indexOf(src) >= 0, audio = ["wav", "m4a"].indexOf(src) >= 0;
    var ms = video ? (to === "wav" || to === "m4a" ? 1000 : 2400) : audio ? 900 : src === "pdf" ? (to === "docx" ? 1300 : to === "txt" ? 600 : 1100) : 500;
    if (reduce) ms = 200;
    if (panelFocused()) S.focusNext = '[data-focus="busy"]';
    set({ cstate: "converting", progress: 0 });
    var t0 = performance.now();
    clearInterval(convTimer);
    convTimer = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / ms);
      if (k >= 1) { clearInterval(convTimer); finish(); } else set({ progress: 1 - Math.pow(1 - k, 2) });
    }, 40);
  }
  function finish() {
    var f = S.convertFile; if (!f) return;
    var to = S.fmt.toLowerCase(), base = f.name.replace(/\.[^.]+$/, "");
    var taken = function (n) { return S.files.some(function (x) { return x.name === n; }); };
    var name, ext = to, kind = "doc", i;
    if (f.ext === "pdf" && (to === "png" || to === "jpg")) { name = base + " Pages"; ext = ""; kind = "folder"; for (i = 2; taken(name); i++) name = base + " Pages " + i; }
    else {
      name = base + "." + to; for (i = 2; taken(name); i++) name = base + " " + i + "." + to;
      if (f.kind === "image" && IMG.indexOf(to.toUpperCase()) >= 0) kind = "image";
    }
    var files = S.files.map(function (x) { var y = {}; for (var k in x) y[k] = x[k]; y.isNew = false; return y; });
    files.push({ id: name, name: name, ext: ext, kind: kind, isNew: true });
    if (panelFocused()) S.focusNext = '[data-act="show"]';
    setToast(null);
    set({ cstate: "done", progress: 1, output: name, files: files, converted: true, result: name });
  }

  // ── 音樂：無聲預覽，在本頁的瀏海裡示範介面
  var musicBtnT = document.getElementById("musicBtnT"), musicBtn = document.getElementById("musicBtn");
  function musicBtnText() {
    musicBtnT.textContent = compact() || !S.hasTrack ? T("Preview the music controls (silent)", "預覽音樂控制（無聲）")
      : S.playing ? T("Silent preview running. Point at the notch ↑", "無聲預覽中，把滑鼠移到瀏海 ↑") : T("Resume the silent preview", "繼續無聲預覽");
  }
  musicBtn.addEventListener("click", function () {
    menuOpen(false, false);
    if (compact()) {
      cancel("switch"); cancel("collapse"); cancel("expand");
      setToast(null);
      set({ hasTrack: true, playing: true, picked: null, dragMode: false, expanded: true, tab: "music", focusNext: kbMode ? '[data-act="play"]' : null });
      musicBtnText(); return;
    }
    if (!S.hasTrack) set({ hasTrack: true, playing: true, pos: 0 }); else set({ playing: !S.playing });
    musicBtnText();
  });
  setInterval(function () {
    if (document.hidden || !(S.playing && S.hasTrack)) return;
    S.pos += .25;
    if (S.pos >= track().dur) { S.pos = 0; S.track = (S.track + 1) % TRACKS.length; render(); } else renderPanel();
  }, 250);

  // ── 可拖動的視窗：只有影片、文字、照片這類裝飾視窗；Finder、格式表、價格、說明固定。
  // 位移有上限、不會拖出畫面，雙擊標題列或按「放回原位」就復原。
  var winReset = document.getElementById("winReset"), movedWins = [];
  function resetWin(w) { w._dx = w._dy = 0; w.style.translate = ""; w.style.zIndex = ""; }
  function resetWins() { movedWins.forEach(resetWin); movedWins = []; winReset.hidden = true; }
  winReset.addEventListener("click", resetWins);
  addEventListener("resize", function () { if (vw() < 1100 && movedWins.length) resetWins(); });
  var z = 10;
  [].forEach.call(document.querySelectorAll("[data-drag]"), function (w) {
    var bar = w.querySelector(".bar"), st = null;
    w._dx = w._dy = 0;
    bar.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || vw() < 1100 || e.button !== 0) return;
      st = { x: e.clientX, y: e.clientY, dx: w._dx, dy: w._dy, r: w.getBoundingClientRect() };
      bar.setPointerCapture(e.pointerId); bar.style.cursor = "grabbing";
      w.style.zIndex = ++z; w.style.position = "relative";
    });
    bar.addEventListener("pointermove", function (e) {
      if (!st) return;
      var dx = st.dx + e.clientX - st.x, dy = st.dy + e.clientY - st.y;
      var baseL = st.r.left - st.dx, baseR = st.r.right - st.dx;
      dx = Math.max(-160, Math.min(160, dx));
      dx = Math.max(8 - baseL, Math.min(vw() - 8 - baseR, dx));
      dy = Math.max(-100, Math.min(100, dy));
      w._dx = dx; w._dy = dy; w.style.translate = dx + "px " + dy + "px";
    });
    bar.addEventListener("pointerup", function () {
      if (!st) return;
      st = null; bar.style.cursor = "";
      if ((w._dx || w._dy) && movedWins.indexOf(w) < 0) movedWins.push(w);
      winReset.hidden = movedWins.length === 0;
    });
    bar.addEventListener("dblclick", function () { resetWin(w); movedWins = movedWins.filter(function (x) { return x !== w; }); winReset.hidden = movedWins.length === 0; });
  });

  // ── QuickTime 視窗：看得到的播放／暫停、可用鍵盤的進度滑桿；手動暫停後不會自己恢復；看不到就暫停
  var userPaused = {};
  var vids = [].slice.call(document.querySelectorAll(".qt video"));
  var conserveData = !!(navigator.connection && navigator.connection.saveData);
  function syncVideoLabels() {
    [].forEach.call(document.querySelectorAll(".qt .pp"), function (b) {
      var v = document.getElementById(b.getAttribute("data-video")), p = v.paused;
      b.classList.toggle("paused", p);
      b.setAttribute("aria-label", p ? T("Play video", "播放影片") : T("Pause video", "暫停影片"));
    });
    [].forEach.call(document.querySelectorAll(".qt .trk"), function (t) { t.setAttribute("aria-label", T("Video position", "影片位置")); });
    [].forEach.call(document.querySelectorAll(".video-error"), function (p) { if (!p.hidden) p.textContent = copies[lang].videoError; });
  }
  vids.forEach(function (v) {
    var win = v.closest(".qt"), pp = win.querySelector(".pp"), trk = win.querySelector(".trk"), bar = win.querySelector(".trk i"), tm = win.querySelector(".tm");
    v.preload = compact() || conserveData || reduce ? "none" : "metadata";
    var error = document.createElement("p"); error.className = "video-error"; error.hidden = true; error.setAttribute("role", "status"); win.appendChild(error);
    function loading(on) { pp.setAttribute("aria-busy", String(on)); win.setAttribute("aria-busy", String(on)); }
    function failed() { loading(false); error.textContent = copies[lang].videoError; error.hidden = false; syncVideoLabels(); }
    function startVideo() {
      error.hidden = true;
      loading(true);
      if (v.error) v.load();
      v.play().catch(function (e) { if (e.name === "AbortError" && v.paused) { loading(false); syncVideoLabels(); } else failed(); });
    }
    if (reduce) userPaused[v.id] = true;
    function aria() {
      var d = v.duration || 0;
      trk.setAttribute("aria-valuemax", String(Math.round(d)));
      trk.setAttribute("aria-valuenow", String(Math.round(v.currentTime)));
      trk.setAttribute("aria-valuetext", fmtTime(v.currentTime) + T(" of ", " / ") + fmtTime(d));
    }
    pp.addEventListener("click", function () { if (v.paused) { userPaused[v.id] = false; startVideo(); } else { userPaused[v.id] = true; v.pause(); } });
    trk.addEventListener("click", function (e) { var r = trk.getBoundingClientRect(); if (v.duration && e.clientX) v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration; });
    trk.addEventListener("keydown", function (e) {
      var d = v.duration; if (!d) return;
      var k = e.key, t = v.currentTime;
      if (k === "ArrowRight" || k === "ArrowUp") t += 1;
      else if (k === "ArrowLeft" || k === "ArrowDown") t -= 1;
      else if (k === "PageUp") t += d / 10;
      else if (k === "PageDown") t -= d / 10;
      else if (k === "Home") t = 0;
      else if (k === "End") t = d;
      else return;
      e.preventDefault();
      v.currentTime = Math.max(0, Math.min(d, t));
      if (v.duration) bar.style.width = (v.currentTime / v.duration * 100) + "%";
      tm.textContent = fmtTime(v.currentTime); aria();
    });
    v.addEventListener("timeupdate", function () { if (v.duration) bar.style.width = (v.currentTime / v.duration * 100) + "%"; tm.textContent = fmtTime(v.currentTime); aria(); });
    v.addEventListener("loadedmetadata", aria);
    v.addEventListener("error", failed);
    v.addEventListener("waiting", function () { if (!v.paused) loading(true); });
    v.addEventListener("playing", function () { loading(false); error.hidden = true; });
    v.addEventListener("pause", function () { loading(false); });
    v.addEventListener("play", syncVideoLabels); v.addEventListener("pause", syncVideoLabels);
  });
  if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var v = e.target; if (e.isIntersecting) { if (!compact() && !conserveData && !userPaused[v.id] && !reduce) v.play().catch(function () {}); } else if (!v.paused) v.pause(); });
    }, { threshold: .25 });
    vids.forEach(function (v) { vio.observe(v); });
  }
  // 看網頁途中打開「減少動態」：停掉自動播放的影片與面板動畫，之後也不會自己恢復
  function onReduceChange(e) {
    reduce = e.matches;
    if (!reduce) return;
    vids.forEach(function (v) { if (!v.paused) v.pause(); userPaused[v.id] = true; });
    kick();
  }
  if (mqReduce) { if (mqReduce.addEventListener) mqReduce.addEventListener("change", onReduceChange); else if (mqReduce.addListener) mqReduce.addListener(onReduceChange); }

  applyLang(lang);
  mbTone();
  geom();
})();
