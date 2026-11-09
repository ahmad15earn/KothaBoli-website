const { redis } = require('./_util');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
  let count = 0;
  try { count = Number(await redis(['GET', 'kothaboli:downloads'])) || 0; } catch (e) {}
  // No Redis configured? Fall back to the GitHub release asset's own
  // download counter - the number is still real, no database needed.
  if (!count) count = await require('./_util').githubDownloads('Setup');
  res.status(200).json({ count });
};
