const express = require('express');
const bcrypt  = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
    const router = express.Router();
    router.use(authMiddleware);

    // GET /api/profile
    router.get('/', async (req, res) => {
        try {
            const user    = await db.get(
                'SELECT id, username, created_at FROM users WHERE id = ?',
                [req.userId]
            );
            const profile = await db.get(
                'SELECT * FROM profiles WHERE user_id = ?',
                [req.userId]
            ) || { user_id: req.userId, first_name: '', last_name: '', phone: '', email: '', avatar: '' };
            res.json({ ...user, ...profile });
        } catch (err) {
            console.error('GET /profile error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/profile — сохраняет имя, фамилию, email, телефон
    router.put('/', async (req, res) => {
        try {
            const { first_name, last_name, phone, email } = req.body;
            const existing = await db.get(
                'SELECT user_id FROM profiles WHERE user_id=?',
                [req.userId]
            );
            if (existing) {
                await db.run(
                    'UPDATE profiles SET first_name=?, last_name=?, phone=?, email=? WHERE user_id=?',
                    [first_name || '', last_name || '', phone || '', email || '', req.userId]
                );
            } else {
                await db.run(
                    'INSERT INTO profiles (user_id, first_name, last_name, phone, email) VALUES (?,?,?,?,?)',
                    [req.userId, first_name || '', last_name || '', phone || '', email || '']
                );
            }
            res.json({ ok: true });
        } catch (err) {
            console.error('PUT /profile error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/profile/avatar — фото профиля (сжатый base64 с клиента)
    router.put('/avatar', async (req, res) => {
        try {
            const { avatar } = req.body;
            if (!avatar) return res.status(400).json({ error: 'Нет данных изображения' });
            if (avatar.length > 2 * 1024 * 1024)
                return res.status(413).json({ error: 'Изображение слишком большое, попробуйте меньше' });

            const existing = await db.get(
                'SELECT user_id FROM profiles WHERE user_id=?',
                [req.userId]
            );
            if (existing) {
                await db.run('UPDATE profiles SET avatar=? WHERE user_id=?', [avatar, req.userId]);
            } else {
                await db.run('INSERT INTO profiles (user_id, avatar) VALUES (?,?)', [req.userId, avatar]);
            }
            res.json({ ok: true });
        } catch (err) {
            console.error('PUT /profile/avatar error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/profile/password
    router.put('/password', async (req, res) => {
        try {
            const { current_password, new_password } = req.body;
            if (!current_password || !new_password)
                return res.status(400).json({ error: 'Заполните все поля' });
            if (new_password.length < 6)
                return res.status(400).json({ error: 'Пароль минимум 6 символов' });

            const user = await db.get('SELECT * FROM users WHERE id = ?', [req.userId]);
            if (!(await bcrypt.compare(current_password, user.password_hash))) {
                return res.status(401).json({ error: 'Неверный текущий пароль' });
            }

            const hash = await bcrypt.hash(new_password, 10);
            await db.run('UPDATE users SET password_hash=? WHERE id=?', [hash, req.userId]);
            res.json({ ok: true });
        } catch (err) {
            console.error('PUT /profile/password error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
