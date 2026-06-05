const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'financial-helper-secret-key-change-in-prod';

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.username = payload.username;
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
