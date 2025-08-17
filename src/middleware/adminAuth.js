// middleware/adminAuth.js
export function adminBasicAuth(req, res, next) {
    const ADMIN_USER = process.env.ADMIN_USER || 'admin@company.com';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'supersecret';
  
    // Expect JSON body or Basic header
    const header = req.headers.authorization || '';
    if (header.startsWith('Basic ')) {
      const b64 = header.slice(6);
      const [u, p] = Buffer.from(b64, 'base64').toString('utf8').split(':');
      if (u === ADMIN_USER && p === ADMIN_PASS) {
        req.admin = { username: ADMIN_USER };
        return next();
      }
    }
  
    // also accept JSON payload for /admin/login
    if (req.body && req.body.username && req.body.password) {
      if (req.body.username === ADMIN_USER && req.body.password === ADMIN_PASS) {
        req.admin = { username: ADMIN_USER };
        return next();
      }
    }
  
    return res.status(401).json({ error: 'unauthorized' });
  }
  