const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');

function adminMiddleware(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    const token = header.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (!payload.isAdmin) {
            return res.status(403).json({ error: 'Доступ запрещён — требуются права администратора' });
        }
        req.userId   = payload.userId;
        req.username = payload.username;
        next();
    } catch {
        return res.status(401).json({ error: 'Токен недействителен или истёк' });
    }
}

module.exports = { adminMiddleware };
