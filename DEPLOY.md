# KothaBoli website: Vercel deploy

## 0. Distribution trust — the honest picture

Chrome's **"This file isn't commonly downloaded, and it may be dangerous"**
is a *reputation* warning, driven by (a) the file having no Authenticode
signature and (b) a low download count. Nothing can be "hidden" or disabled
on our side; trust is earned by real signing + real usage over time:

1. **Code signing (the main fix we can buy).** Options, cheapest first:
   - **Azure Trusted Signing** (~$9.99/month, individual ID) — Microsoft
     manages the cert; SmartScreen reputation accrues fastest. Needs
     identity verification and is region-gated.
   - **Certum "Open Source Code Signing"** (~EUR 25/year) — cheap OV cert.
   - **Any OV Authenticode cert** (Sectigo/GlobalSign/DigiCert,
     ~$100-300/year) — remove warnings in roughly 2-4 weeks of downloads.
   - **EV cert** (~$300+/year, requires hardware token) — immediate
     SmartScreen reputation.
   Signing is wired into the build: after ISCC, run
   `powershell -ExecutionPolicy Bypass -File tools\sign.ps1` with either
   `KOTHABOLI_PFX`(+pass) or `KOTHABOLI_CERT_THUMB` set. It signs the
   installer with SHA256 + timestamp and verifies the result.
2. **Download reputation** — grows on its own as more users download the
   same file; a signed installer with dozens of downloads usually clears
   the Chrome warning within weeks. Nothing can shortcut this, and that is
   by design (it is the anti-malware system working as intended).
3. **Delivery hardening (done)** — the site serves the installer over
   HTTPS with `Content-Disposition: attachment`, `X-Content-Type-Options:
   nosniff`, and publishes SHA256 checksums in
   `downloads/CHECKSUMS.txt` so anyone can verify integrity:
   `certutil -hashfile KothaBoli-Setup.exe SHA256`.

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
