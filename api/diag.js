// Diagnostics endpoint (no secrets): tells whether the notification part of
// this deployment is configured on the server, so the user can fix the
// Vercel env vars without reopening the code.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    telegram_configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    chat_configured: Boolean(process.env.TELEGRAM_CHAT_ID || true),
    download_hosted: true,
    counter_provider: process.env.UPSTASH_REDIS_REST_URL ? 'redis' : 'abacus',
  });
};
