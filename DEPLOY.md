# KothaBoli website: Vercel deploy

## 1. Environment Variables (Vercel > Project > Settings > Environment Variables)
- TELEGRAM_BOT_TOKEN : BotFather token (NEVER put it inside index.html or GitHub)
- TELEGRAM_CHAT_ID   : 7973775679
- DOWNLOAD_URL       : (optional now) defaults to the GitHub release asset:
  https://github.com/ahmad15earn/KothaBoli-website/releases/download/v1.1.0/KothaBoli-Setup.exe
  Set it if you attach a newer exe in a later release, or leave it empty.

- New releases: upload the new KothaBoli-Setup.exe to a GitHub release on
  ahmad15earn/KothaBoli-website (Releases > New release), then either set
  DOWNLOAD_URL or update the fallback URL inside api/download.js.

## 2. Download counter
Works with **no database**: the counter reads the GitHub release asset's
own download_count (real number, no storage needed).
Optional exact on-site counter: add **Upstash Redis** (Vercel > Project >
Storage, free). It adds UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
(or KV_REST_API_URL / KV_REST_API_TOKEN) automatically - redeploy after.

## 3. Telegram setup
Open your bot in Telegram and press **Start** once (a bot cannot message you before that).

## 4. Test message (paste in browser, replace <TOKEN>)
https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=7973775679&text=KothaBoli%20test

## Files
- api/download.js : checks email, sends it to Telegram, adds +1 to the counter, returns the download link
- api/count.js    : returns the current download count
