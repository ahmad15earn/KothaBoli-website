// Website message form -> the developer's Telegram (same chat the download
// notifications land in). Nothing is stored on the server.
const { redis } = require('./_util');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const message = String((body && body.message) || '').trim();
  if (message.length < 2 || message.length > 800) return res.status(400).json({ ok: false, error: 'bad_message' });
  // Email is OPTIONAL: if given it lets the developer reply. If given but
  // malformed, reject so the Telegram text never carries a broken address.
  const email = String((body && body.email) || '').trim();
  if (email && (email.length > 254 || !/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(email))) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  // Light per-IP limit: 5 messages / hour, so the bot never gets spammed.
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const key = 'kothaboli:msg:' + ip;
    let n = 1;
    try { n = Number(await redis(['INCR', key])) || 1; if (n === 1) await redis(['EXPIRE', key, 3600]); } catch (e) {}
    if (n > 5) return res.status(429).json({ ok: false, error: 'rate_limited' });
  } catch (e) {}

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID || '7973775679';
  if (token) {
    try {
      const when = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });
      await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(6000),
        body: JSON.stringify({ chat_id: chat, text: 'KothaBoli ওয়েবসাইট মেসেজ' + (email ? ' (ইমেইল: ' + email + ')' : '') + '\n\n' + message + '\n\nসময় (BD): ' + when })
      });
    } catch (e) { console.error('telegram failed'); }
  }
  res.status(200).json({ ok: true });
};
