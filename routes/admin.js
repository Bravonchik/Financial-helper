const express = require('express');
const bcrypt  = require('bcryptjs');
const { adminMiddleware } = require('../middleware/adminAuth');

module.exports = function(db) {
    const router = express.Router();
    router.use(adminMiddleware);

    // GET /api/admin/stats — общая статистика сайта
    router.get('/stats', async (req, res) => {
        try {
            const [rUsers, rTx, rIncome, rExpense, rAdmins] = await Promise.all([
                db.get('SELECT COUNT(*)::int AS cnt FROM users'),
                db.get('SELECT COUNT(*)::int AS cnt FROM transactions'),
                db.get("SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE type='income'"),
                db.get("SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE type='expense'"),
                db.get('SELECT COUNT(*)::int AS cnt FROM users WHERE is_admin=1'),
            ]);

            res.json({
                totalUsers:        rUsers?.cnt  ?? 0,
                adminCount:        rAdmins?.cnt ?? 0,
                totalTransactions: rTx?.cnt     ?? 0,
                totalIncome:       rIncome?.s   ?? 0,
                totalExpense:      rExpense?.s  ?? 0,
            });
        } catch (err) {
            console.error('GET /admin/stats error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/admin/users — список всех пользователей
    router.get('/users', async (req, res) => {
        try {
            const users = await db.all(`
                SELECT
                    u.id,
                    u.username,
                    u.is_admin,
                    u.created_at,
                    COUNT(t.id)::int                                                      AS tx_count,
                    COALESCE(SUM(CASE WHEN t.type='income'  THEN t.amount ELSE 0 END), 0) AS total_income,
                    COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END), 0) AS total_expense
                FROM users u
                LEFT JOIN transactions t ON t.user_id = u.id
                GROUP BY u.id
                ORDER BY u.created_at DESC
            `);
            res.json(users);
        } catch (err) {
            console.error('GET /admin/users error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/admin/users/:id — данные одного пользователя
    router.get('/users/:id', async (req, res) => {
        try {
            const user = await db.get(
                'SELECT id, username, is_admin, created_at FROM users WHERE id=?',
                [req.params.id]
            );
            if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

            const [txs, goals, budgets] = await Promise.all([
                db.all('SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC LIMIT 20', [req.params.id]),
                db.all('SELECT * FROM goals WHERE user_id=?', [req.params.id]),
                db.all('SELECT * FROM budget_categories WHERE user_id=?', [req.params.id]),
            ]);

            res.json({ user, transactions: txs, goals, budgets });
        } catch (err) {
            console.error('GET /admin/users/:id error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH /api/admin/users/:id/role — сделать/снять администратора
    router.patch('/users/:id/role', async (req, res) => {
        try {
            const { isAdmin } = req.body;
            if (typeof isAdmin !== 'boolean')
                return res.status(400).json({ error: 'Поле isAdmin (boolean) обязательно' });

            const user = await db.get(
                'SELECT id, username FROM users WHERE id=?',
                [req.params.id]
            );
            if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
            if (user.id === req.userId && !isAdmin) {
                return res.status(400).json({ error: 'Нельзя снять права у самого себя' });
            }

            await db.run(
                'UPDATE users SET is_admin=? WHERE id=?',
                [isAdmin ? 1 : 0, req.params.id]
            );
            res.json({ success: true, username: user.username, isAdmin });
        } catch (err) {
            console.error('PATCH /admin/users/:id/role error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH /api/admin/users/:id/password — сброс пароля пользователя
    router.patch('/users/:id/password', async (req, res) => {
        try {
            const { newPassword } = req.body;
            if (!newPassword || newPassword.length < 6)
                return res.status(400).json({ error: 'Пароль минимум 6 символов' });

            const user = await db.get('SELECT id FROM users WHERE id=?', [req.params.id]);
            if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

            const hash = await bcrypt.hash(newPassword, 10);
            await db.run('UPDATE users SET password_hash=? WHERE id=?', [hash, req.params.id]);
            res.json({ success: true });
        } catch (err) {
            console.error('PATCH /admin/users/:id/password error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /api/admin/users/:id — удалить пользователя и все его данные
    router.delete('/users/:id', async (req, res) => {
        try {
            const uid = parseInt(req.params.id);
            if (uid === req.userId)
                return res.status(400).json({ error: 'Нельзя удалить самого себя' });

            const user = await db.get('SELECT id, username FROM users WHERE id=?', [uid]);
            if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

            // Удаляем все данные пользователя последовательно
            await db.run('DELETE FROM transactions WHERE user_id=?',        [uid]);
            await db.run('DELETE FROM budget_categories WHERE user_id=?',   [uid]);
            await db.run('DELETE FROM goals WHERE user_id=?',               [uid]);
            await db.run('DELETE FROM recurring_templates WHERE user_id=?', [uid]);
            await db.run('DELETE FROM profiles WHERE user_id=?',            [uid]);
            await db.run('DELETE FROM users WHERE id=?',                    [uid]);

            res.json({ success: true, deleted: user.username });
        } catch (err) {
            console.error('DELETE /admin/users/:id error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
