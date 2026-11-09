const { redis } = require('./_util');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
  try {
    const v = await redis(['GET', 'kothaboli:downloads']);
    res.status(200).json({ count: Number(v || 0) });
  } catch (e) {
    res.status(200).json({ count: 0 });
  }
};
