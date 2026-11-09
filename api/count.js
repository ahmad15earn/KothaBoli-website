const { countGet } = require('./_util');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
  const count = await countGet();
  res.status(200).json({ count });
};
