// Community video submissions -> the developer's Telegram (sendVideo, same
// chat as the download notes). The browser sends the (client-compressed)
// bytes as application/octet-stream with metadata in the ?d= query string —
// Vercel request bodies are capped at ~4.5 MB, so the browser compresses
// bigger clips before uploading; large originals can be shared as a link.
// Nothing is stored on the server.
const { redis } = require('./_util');

const CATS = {
  problem: 'সমস্যার ভিডিও',
  experience: 'অভিজ্ঞতার ভিডিও',
  promo: 'প্রচারের ভিডিও',
};
const MAX_BYTES = 4.5 * 1024 * 1024;
const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

async function pull(stream, max) {
  const chunks = [];
  let size = 0;
  const reader = stream.getReader ? stream.getReader() : null;
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) throw new Error('too_large');
      chunks.push(value);
    }
  } else {
    for await (const c of stream) {
      size += c.length;
      if (size > max) throw new Error('too_large');
      chunks.push(c);
    }
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  // Metadata rides in the query string; the body is the raw video bytes.
  let meta = {};
  try { meta = JSON.parse(new URL(req.url, 'https://x').searchParams.get('d') || '{}'); } catch (e) {}
  const cat = CATS[String(meta.cat || '').slice(0, 20)] || 'ভিডিও';
  const name = String(meta.name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const email = String(meta.email || '').trim().slice(0, 80);
  const link = String(meta.link || '').trim().slice(0, 300);
  const consent = !!meta.consent;
  if (email && !EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });
  if (link && !/^https?:\/\/\S+$/i.test(link)) return res.status(400).json({ ok: false, error: 'invalid_link' });

  // 3 uploads / hour / IP — uploads are heavy, keep the bot unspammable.
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const key = 'kothaboli:vid:' + ip;
    let n = 1;
    try { n = Number(await redis(['INCR', key])) || 1; if (n === 1) await redis(['EXPIRE', key, 3600]); } catch (e) {}
    if (n > 3) return res.status(429).json({ ok: false, error: 'rate_limited' });
  } catch (e) {}

  let buf;
  try { buf = await pull(req.body || req, MAX_BYTES); } catch (e) {
    return res.status(413).json({ ok: false, error: 'too_large' });
  }
  if (!buf || buf.length < 2048) return res.status(400).json({ ok: false, error: 'no_file' });
  // Accept real video containers only: WebM/MKV (EBML header) or MP4 (ftyp).
  const isWebm = buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  const isMp4 = buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;
  if (!isWebm && !isMp4) return res.status(400).json({ ok: false, error: 'bad_file' });
  const mime = isMp4 ? 'video/mp4' : 'video/webm';
  const fname = isMp4 ? 'kothaboli.mp4' : 'kothaboli.webm';

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID || '7973775679';
  if (!token) return res.status(200).json({ ok: true, note: 'no_token' }); // local/dev only

  const when = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });
  const cap = [
    '🎬 KothaBoli কমিউনিটি ভিডিও',
    'ধরন: ' + cat,
    name ? 'নাম: ' + name : 'নাম: —',
    email ? 'ইমেইল: ' + email : 'ইমেইল: —',
    link ? 'লিংক: ' + link : 'লিংক: —',
    'শেয়ার-অনুমতি: ' + (consent ? 'হ্যাঁ ✅' : 'নেই'),
    'ফাইল: ' + (buf.length / 1048576).toFixed(1) + ' MB',
    'সময় (BD): ' + when,
  ].join('\n');

  try {
    const send = async (method) => {
      const fd = new FormData();
      fd.set('chat_id', chat);
      fd.set('caption', cap);
      fd.set('video', new Blob([buf], { type: mime }), fname);
      const r = await fetch('https://api.telegram.org/bot' + token + '/' + method, {
        method: 'POST', body: fd, signal: AbortSignal.timeout(50000),
      });
      return r.ok;
    };
    let okSend = await send('sendVideo');
    if (!okSend) okSend = await send('sendDocument'); // fallback for exotic codecs
    if (!okSend) return res.status(502).json({ ok: false, error: 'telegram_failed' });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'telegram_failed' });
  }
  res.status(200).json({ ok: true });
};
