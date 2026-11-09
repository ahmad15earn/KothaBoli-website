// Shared helpers for the KothaBoli website API.
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const RELEASE = 'https://api.github.com/repos/ahmad15earn/KothaBoli-website/releases/latest';

async function redis(cmd) {
  if (!URL_ || !TOK) return null;
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOK, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  return j.result;
}

// Zero-database fallback counter: the GitHub release asset itself keeps a
// download_count, so the site can show a real number without Upstash.
async function githubDownloads(assetName) {
  try {
    const r = await fetch(RELEASE, { headers: { 'User-Agent': 'kothaboli-site' } });
    const rel = await r.json();
    const assets = rel && rel.assets ? rel.assets : [];
    for (const a of assets) {
      if (!assetName || a.name.endsWith(assetName)) return Number(a.download_count) || 0;
    }
    return assets.reduce((s, a) => s + (Number(a.download_count) || 0), 0);
  } catch (e) { return 0; }
}

module.exports = { redis, githubDownloads };
