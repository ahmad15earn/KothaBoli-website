const { redis } = require('./_util');
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const email = String((body && body.email) || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });

  // DOWNLOAD_URL env wins; GitHub release asset is the permanent fallback
  // so the download never breaks even if env vars drift.
  const link = process.env.DOWNLOAD_URL
    || 'https://github.com/ahmad15earn/KothaBoli-website/releases/download/v1.1.0/KothaBoli-Setup-v1.1.0.exe';
  if (!link) return res.status(500).json({ ok: false, error: 'not_configured' });

  // simple abuse limit: 10 requests / hour / IP (only when Redis is configured)
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const key = 'kothaboli:rl:' + ip;
    const n = await redis(['INCR', key]);
    if (n === 1) await redis(['EXPIRE', key, 3600]);
    if (n > 10) return res.status(429).json({ ok: false, error: 'rate_limited' });
  } catch (e) {}

  let count = 0;
  try { count = Number(await redis(['INCR', 'kothaboli:downloads'])) || 0; } catch (e) {}

  // email goes to Telegram only (nothing stored on the server)
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID || '7973775679';
  if (token) {
    try {
      const when = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });
      await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: 'KothaBoli নতুন ডাউনলোড' + (count ? ' #' + count : '') + '\nইমেইল: ' + email + '\nসময় (BD): ' + when })
      });
    } catch (e) { console.error('telegram failed'); }
  }
  res.status(200).json({ ok: true, url: link, count });
};
