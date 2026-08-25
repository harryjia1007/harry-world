# 在自己的電腦上定期跑惜物網擷取（macOS）

**為什麼要這樣做**：惜物網（shwoo.gov.taipei）封鎖雲端資料中心 IP，所以 Cloudflare
Worker 抓不到它（見 `../../HANDOFF.md` 第 8 節）。解法是從你自己的電腦（非資料中心 IP）
定期跑擷取。程式共用 repo 現有的 adapter，這裡只是排程外殼。

> ⚠️ 前提：你的電腦要能連到 shwoo。先測 `curl -m 10 https://shwoo.gov.taipei/robots.txt`——
> 幾秒內有回應就 OK；若逾時，代表你目前的網路（IP）也被 shwoo 擋，這台機器暫時不適用
> （例如人在國外、用某些 VPN 時可能被擋）。

需要 Node 18 以上：`node --version` 確認。

---

## 一次性設定

**1. 放 service_role 金鑰到本機檔案（不進版控）**
```bash
printf 'MOTO_SUPABASE_SERVICE_KEY=你的service_role金鑰\n' > ~/.moto-ingest.env
chmod 600 ~/.moto-ingest.env
```
（金鑰從 Supabase 後台 → Settings → API → service_role。這檔案只在你電腦上。）

**2. 先手動跑一次，確認會寫入**
```bash
cd <這個 repo 的路徑>
node projects/taiwan-moto-auction/ingestion/run-local.mjs
```
看到「shwoo 擷取完成，寫入 N 筆機車」就成功。若要試跑不寫入，前面加 `INGESTION_DRY_RUN=1`。

**3. 安裝排程（launchd，每 5 分鐘自動跑）**
```bash
NODE=$(which node)
REPO=$(pwd)                    # 確認現在在 repo 根目錄
sed "s|__NODE__|$NODE|g; s|__REPO__|$REPO|g" \
  projects/taiwan-moto-auction/ingestion/com.harryjia.moto-shwoo.plist.template \
  > ~/Library/LaunchAgents/com.harryjia.moto-shwoo.plist
launchctl load ~/Library/LaunchAgents/com.harryjia.moto-shwoo.plist
```

裝好後它會開機自動載入、每 5 分鐘跑一次，並把 log 寫到 repo 根目錄的 `.moto-shwoo.log`。

---

## 日常維護

- **看有沒有正常跑**：`tail -f .moto-shwoo.log`，或線上開 `https://harryjia.com/_health`
  看 shwoo 的 `last_synced_at`。
- **暫停**：`launchctl unload ~/Library/LaunchAgents/com.harryjia.moto-shwoo.plist`
- **重新啟用**：`launchctl load ~/Library/LaunchAgents/com.harryjia.moto-shwoo.plist`
- **改頻率**：編輯 `~/Library/LaunchAgents/com.harryjia.moto-shwoo.plist` 的 `StartInterval`
  （秒），再 unload + load 一次。

## 注意
- 電腦關機／睡眠時不會跑（launchd 會在下次醒來補跑一次）。要 24 小時不斷，才需要選項 1 的台灣 VPS。
- 司法院（judicial）那條仍由 Cloudflare Worker 每日自動跑，不需要這台機器。這裡只補 shwoo。
- 金鑰有寫入權限，`~/.moto-ingest.env` 不要外流、不要進 git（已在 .gitignore）。
