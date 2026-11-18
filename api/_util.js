// Shared helpers for the KothaBoli website API.
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const RELEASES = 'https://api.github.com/repos/ahmad15earn/KothaBoli-website/releases?per_page=100';
const ABACUS = 'https://abacus.jasoncameron.dev';

async function redis(cmd) {
  if (!URL_ || !TOK) return null;
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOK, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  return j.result;
}

// ---------------------------------------------------------------------------
// Honest download counter.
//
// Two independent, REAL sources are combined:
//   1. Abacus — one hit per completed download through the site's email gate.
//      Free and zero-config, but the service can reset.
//   2. GitHub releases — the download_count GitHub itself records for every
//      installer asset (.exe / .dmg) of every published version. This is the
//      lifetime history: it never resets and cannot be inflated by us.
//
// The page shows the LARGER of the two. No baseline, no offset, no made-up
// number: a visitor only ever sees downloads that really happened, and the
// count never jumps backwards when Abacus resets.
// ---------------------------------------------------------------------------
const INSTALLER = /\.(exe|dmg|msi|pkg)$/i;
let _gh = { v: 0, at: 0 };          // warm-lambda cache (10 min) for GitHub

async function githubDownloads() {
  const now = Date.now();
  if (_gh.v && now - _gh.at < 10 * 60 * 1000) return _gh.v;
  try {
    const headers = { 'User-Agent': 'kothaboli-site', Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
    const r = await fetch(RELEASES, { headers });
    if (!r.ok) return _gh.v;
    const rels = await r.json();
    if (!Array.isArray(rels)) return _gh.v;
    let total = 0;
    for (const rel of rels) {
      for (const a of rel.assets || []) {
        if (INSTALLER.test(a.name || '')) total += Number(a.download_count) || 0;
      }
    }
    if (total > 0) _gh = { v: total, at: now };
    return total || _gh.v;
  } catch (e) { return _gh.v; }
}

async function abacus(path) {
  try {
    const r = await fetch(ABACUS + '/' + path + '/kothabolidownloads/hits');
    const j = await r.json();
    if (j && typeof j.value === 'number') return j.value;
  } catch (e) {}
  return 0;
}

// Read the current count (the /api/count route caches this for 20s).
async function countGet() {
  try {
    const n = await redis(['GET', 'kothaboli:downloads']);
    if (n) return Number(n) || 0;
  } catch (e) {}
  const [a, gh] = await Promise.all([abacus('get'), githubDownloads()]);
  return Math.max(a, gh);
}

// Record one more real download and report the new total.
async function countUp() {
  try {
    const n = await redis(['INCR', 'kothaboli:downloads']);
    if (n) return Number(n) || 0;
  } catch (e) {}
  const [hit, gh] = await Promise.all([abacus('hit'), githubDownloads()]);
  return Math.max(hit, gh);
}

module.exports = { redis, countUp, countGet, githubDownloads };
