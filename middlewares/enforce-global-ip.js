// middlewares/enforce-global-ip.js
const GlobalIp = require('../models/Global-Ip-model');

// Always log on load
console.log('[IPGUARD] middleware file loaded:', __filename);

function getClientIP(req) {
  const cf  = req.headers['cf-connecting-ip'];  // Cloudflare (if any)
  const xff = req.headers['x-forwarded-for'];   // Nginx/ELB
  const xri = req.headers['x-real-ip'];         // Nginx

  let ip =
    (cf && cf.trim()) ||
    (Array.isArray(xff) ? xff[0] : (xff ? xff.split(',')[0].trim() : '')) ||
    (xri && xri.trim()) ||
    req.ip ||
    req.connection?.remoteAddress ||
    '';

  if (ip && ip.startsWith('::ffff:')) ip = ip.substring(7);
  if (ip && ip.includes('%')) ip = ip.split('%')[0];
  if (ip === '::1') ip = '127.0.0.1'; // normalize localhost

  return ip;
}

module.exports = async function enforceGlobalIp(req, res, next) {
  console.log(`[IPGUARD] invoked => ${req.method} ${req.originalUrl}`);
  try {
    const clientIp = getClientIP(req);
    console.log(`[IPGUARD] computed IP: ${clientIp}`);
    console.log(`[IPGUARD] headers: xff=${req.headers['x-forwarded-for'] || '-'} x-real-ip=${req.headers['x-real-ip'] || '-'} req.ip=${req.ip}`);

    const rules = await GlobalIp.find({ active: true }).select('value');
    const list = rules.map(r => r.value);
    console.log(`[IPGUARD] active rules (${list.length}):`, list);

    if (!rules.length) {
      console.warn('[IPGUARD] DENY — allowlist empty');
      return res.status(401).json({ success: false, message: 'IP allowlist is empty. Contact admin.' });
    }

    const allowed = list.includes(clientIp); // exact match only
    console.log(`[IPGUARD] decision: ${allowed ? 'ALLOW' : 'DENY '} for ${clientIp}`);

    if (!allowed) {
      return res.status(401).json({ success: false, message: `Access blocked from IP ${clientIp}` });
    }

    return next();
  } catch (e) {
    console.error('[IPGUARD] Error:', e);
    return res.status(500).json({ success: false, message: e.message });
  }
};
