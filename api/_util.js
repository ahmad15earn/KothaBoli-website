// Shared helpers for the KothaBoli website API.
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const RELEASE = 'https://api.github.com/repos/ahmad15earn/KothaBoli-website/releases/latest';
const ABACUS = 'https://abacus.jasoncameron.dev';

async function redis(cmd) {
  if (!URL_ || !TOK) return null;
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOK, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  return j.result;
}

// Zero-config public counter (no database needed): Abacus keeps a single
// number for us; redis keeps exact control if the user ever adds it, and
// the GitHub release asset's own download_count is the last fallback.
async function countUp() {
  try {
    const n = await redis(['INCR', 'kothaboli:downloads']);
    if (n) return Number(n) || null;
  } catch (e) {}
  try {
    const r = await fetch(ABACUS + '/hit/kothabolidownloads/hits');
    const j = await r.json();
    if (j && typeof j.value === 'number') return j.value;
  } catch (e) {}
  const gh = await githubDownloads('Setup');
  return gh > 0 ? gh : 1;
}

async function countGet() {
  try {
    const n = await redis(['GET', 'kothaboli:downloads']);
    if (n) return Number(n) || 0;
  } catch (e) {}
  try {
    const r = await fetch(ABACUS + '/get/kothabolidownloads/hits');
    const j = await r.json();
    if (j && typeof j.value === 'number') return j.value;
  } catch (e) {}
  return await githubDownloads('Setup');
}

// The GitHub release asset's own download count (reference only).
async function githubDownloads(assetName) {
  try {
    const rel = await (await fetch(RELEASE, { headers: { 'User-Agent': 'kothaboli-site' } })).json();
    const assets = rel && rel.assets ? rel.assets : [];
    for (const a of assets) {
      if (!assetName || a.name.endsWith(assetName)) return Number(a.download_count) || 0;
    }
    return assets.reduce((s, a) => s + (Number(a.download_count) || 0), 0);
  } catch (e) { return 0; }
}

module.exports = { redis, countUp, countGet, githubDownloads };
