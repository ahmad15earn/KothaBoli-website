const { countUp, countGet } = require('./_util');
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const email = String((body && body.email) || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });

  // Keep the shell small so the function never idles into a 504.
  const MAX_MS = 6000;

  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const key = 'kothaboli:rl:' + ip;
    let n = 1;
    try { n = Number(await redis(['INCR', key])) || 1; if (n === 1) await redis(['EXPIRE', key, 3600]); } catch (e) {}
    if (n > 25) return res.status(429).json({ ok: false, error: 'rate_limited' });
  } catch (e) {}

  const count = await countUp();

  // email goes to Telegram only (nothing stored on the server).
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID || '7973775679';
  if (token) {
    try {
      const when = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });
      await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(MAX_MS),
        body: JSON.stringify({ chat_id: chat, text: 'KothaBoli নতুন ডাউনলোড' + (count ? ' #' + count : '') + '\nইমেইল: ' + email + '\nসময় (BD): ' + when })
      });
    } catch (e) { console.error('telegram failed'); }
  }

  // Primary: the exe ships inside this very project (`downloads/`), so the
  // click never leaves this domain - fast and reliable. Fallback: raw
  // GitHub (proven to work when release-assets CDN stalls), then env.
  const link = process.env.DOWNLOAD_URL
    || '/downloads/KothaBoli-Setup.exe'
    || 'https://raw.githubusercontent.com/ahmad15earn/KothaBoli-website/main/downloads/KothaBoli-Setup.exe';
  res.status(200).json({ ok: true, url: link, count });
};
