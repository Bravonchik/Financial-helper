const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
    const router = express.Router();
    router.use(authMiddleware);

    // GET /api/goals
    router.get('/', async (req, res) => {
        try {
            const rows = await db.all(
                'SELECT * FROM goals WHERE user_id = ? ORDER BY id',
                [req.userId]
            );
            res.json(rows);
        } catch (err) {
            console.error('GET /goals error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/goals
    router.post('/', async (req, res) => {
        try {
            const { name, target_amount, saved_amount, icon, color } = req.body;
            if (!name || !target_amount)
                return res.status(400).json({ error: 'Заполните название и сумму' });

            const result = await db.run(
                'INSERT INTO goals (user_id, name, target_amount, saved_amount, icon, color) VALUES (?,?,?,?,?,?) RETURNING *',
                [req.userId, name, parseFloat(target_amount), parseFloat(saved_amount) || 0, icon || 'star', color || '#667eea']
            );
            res.json(result.rows[0]);
        } catch (err) {
            console.error('POST /goals error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/goals/:id
    router.put('/:id', async (req, res) => {
        try {
            const goal = await db.get(
                'SELECT * FROM goals WHERE id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );
            if (!goal) return res.status(404).json({ error: 'Цель не найдена' });

            const { name, target_amount, saved_amount, icon, color } = req.body;
            await db.run(
                'UPDATE goals SET name=?, target_amount=?, saved_amount=?, icon=?, color=? WHERE id = ? AND user_id = ?',
                [name, parseFloat(target_amount), parseFloat(saved_amount) || 0, icon || goal.icon, color || goal.color, req.params.id, req.userId]
            );

            const updated = await db.get('SELECT * FROM goals WHERE id = ?', [req.params.id]);
            res.json(updated);
        } catch (err) {
            console.error('PUT /goals/:id error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/goals/:id/fund
    router.post('/:id/fund', async (req, res) => {
        try {
            const goal = await db.get(
                'SELECT * FROM goals WHERE id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );
            if (!goal) return res.status(404).json({ error: 'Цель не найдена' });

            const amount = parseFloat(req.body.amount);
            if (!amount || amount <= 0)
                return res.status(400).json({ error: 'Введите сумму' });

            // Не превышаем целевую сумму
            const actualAmount = Math.min(amount, goal.target_amount - goal.saved_amount);
            if (actualAmount <= 0)
                return res.status(400).json({ error: 'Цель уже достигнута' });

            const newSaved = goal.saved_amount + actualAmount;
            await db.run(
                'UPDATE goals SET saved_amount=? WHERE id = ? AND user_id = ?',
                [newSaved, req.params.id, req.userId]
            );

            // Создаём транзакцию-расход, чтобы баланс уменьшился
            const today = new Date().toISOString().slice(0, 10);
            await db.run(
                'INSERT INTO transactions (user_id, date, category, description, type, amount, recurring) VALUES (?,?,?,?,?,?,?)',
                [req.userId, today, 'Цели', `Накопление: ${goal.name}`, 'expense', actualAmount, 0]
            );

            const updated = await db.get('SELECT * FROM goals WHERE id = ?', [req.params.id]);
            res.json(updated);
        } catch (err) {
            console.error('POST /goals/:id/fund error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /api/goals/:id
    router.delete('/:id', async (req, res) => {
        try {
            const goal = await db.get(
                'SELECT * FROM goals WHERE id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );
            if (!goal) return res.status(404).json({ error: 'Цель не найдена' });

            await db.run(
                'DELETE FROM goals WHERE id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );
            res.json({ ok: true });
        } catch (err) {
            console.error('DELETE /goals/:id error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
