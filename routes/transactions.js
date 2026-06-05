const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db, ensureRecurringForUser) {
    const router = express.Router();
    router.use(authMiddleware);

    // GET /api/transactions
    router.get('/', async (req, res) => {
        try {
            await ensureRecurringForUser(db, req.userId);
            const rows = await db.all(
                'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC',
                [req.userId]
            );
            res.json(rows);
        } catch (err) {
            console.error('GET /transactions error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/transactions
    router.post('/', async (req, res) => {
        try {
            const { date, category, description, type, amount, recurring } = req.body;
            if (!date || !category || !description || !type || !amount)
                return res.status(400).json({ error: 'Заполните все поля' });
            if (!['income', 'expense'].includes(type))
                return res.status(400).json({ error: 'Неверный тип операции' });

            const result = await db.run(
                'INSERT INTO transactions (user_id, date, category, description, type, amount, recurring) VALUES (?,?,?,?,?,?,?) RETURNING *',
                [req.userId, date, category, description, type, parseFloat(amount), recurring ? 1 : 0]
            );
            const row = result.rows[0];

            if (recurring) {
                const dayOfMonth = new Date(date).getDate();
                await db.run(
                    'INSERT INTO recurring_templates (user_id, category, description, type, amount, day_of_month) VALUES (?,?,?,?,?,?) ON CONFLICT DO NOTHING',
                    [req.userId, category, description, type, parseFloat(amount), dayOfMonth]
                );
            }

            res.json(row);
        } catch (err) {
            console.error('POST /transactions error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/transactions/:id
    router.put('/:id', async (req, res) => {
        try {
            const { date, category, description, type, amount, recurring } = req.body;
            const tx = await db.get(
                'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );
            if (!tx) return res.status(404).json({ error: 'Транзакция не найдена' });

            if (tx.recurring && !recurring) {
                await db.run(
                    'DELETE FROM recurring_templates WHERE user_id = ? AND category = ? AND description = ? AND type = ?',
                    [req.userId, tx.category, tx.description, tx.type]
                );
            }

            await db.run(
                'UPDATE transactions SET date=?, category=?, description=?, type=?, amount=?, recurring=? WHERE id = ? AND user_id = ?',
                [date, category, description, type, parseFloat(amount), recurring ? 1 : 0, req.params.id, req.userId]
            );

            if (recurring && !tx.recurring) {
                const dayOfMonth = new Date(date).getDate();
                await db.run(
                    'INSERT INTO recurring_templates (user_id, category, description, type, amount, day_of_month) VALUES (?,?,?,?,?,?) ON CONFLICT DO NOTHING',
                    [req.userId, category, description, type, parseFloat(amount), dayOfMonth]
                );
            }

            const updated = await db.get('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
            res.json(updated);
        } catch (err) {
            console.error('PUT /transactions/:id error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /api/transactions/:id
    router.delete('/:id', async (req, res) => {
        try {
            const tx = await db.get(
                'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );
            if (!tx) return res.status(404).json({ error: 'Транзакция не найдена' });

            if (tx.recurring) {
                await db.run(
                    'DELETE FROM recurring_templates WHERE user_id = ? AND category = ? AND description = ? AND type = ?',
                    [req.userId, tx.category, tx.description, tx.type]
                );
            }

            await db.run(
                'DELETE FROM transactions WHERE id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );
            res.json({ ok: true });
        } catch (err) {
            console.error('DELETE /transactions/:id error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
