const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
    const router = express.Router();
    router.use(authMiddleware);

    // GET /api/budgets
    router.get('/', async (req, res) => {
        try {
            const rows = await db.all(
                'SELECT * FROM budget_categories WHERE user_id = ? ORDER BY id',
                [req.userId]
            );
            res.json(rows);
        } catch (err) {
            console.error('GET /budgets error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/budgets
    router.post('/', async (req, res) => {
        try {
            const { name, budget, color } = req.body;
            if (!name || !budget)
                return res.status(400).json({ error: 'Заполните все поля' });

            const exists = await db.get(
                'SELECT id FROM budget_categories WHERE user_id = ? AND name = ?',
                [req.userId, name]
            );
            if (exists) return res.status(409).json({ error: 'Категория уже существует' });

            const result = await db.run(
                'INSERT INTO budget_categories (user_id, name, budget, color) VALUES (?,?,?,?) RETURNING *',
                [req.userId, name, parseFloat(budget), color || '#3b82f6']
            );
            res.json(result.rows[0]);
        } catch (err) {
            console.error('POST /budgets error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/budgets/:id
    router.put('/:id', async (req, res) => {
        try {
            const { name, budget, color } = req.body;
            const cat = await db.get(
                'SELECT * FROM budget_categories WHERE id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );
            if (!cat) return res.status(404).json({ error: 'Категория не найдена' });

            await db.run(
                'UPDATE budget_categories SET name=?, budget=?, color=? WHERE id = ? AND user_id = ?',
                [name, parseFloat(budget), color || cat.color, req.params.id, req.userId]
            );

            const updated = await db.get(
                'SELECT * FROM budget_categories WHERE id = ?',
                [req.params.id]
            );
            res.json(updated);
        } catch (err) {
            console.error('PUT /budgets/:id error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /api/budgets/:id
    router.delete('/:id', async (req, res) => {
        try {
            const cat = await db.get(
                'SELECT * FROM budget_categories WHERE id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );
            if (!cat) return res.status(404).json({ error: 'Категория не найдена' });

            await db.run(
                'DELETE FROM budget_categories WHERE id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );
            res.json({ ok: true });
        } catch (err) {
            console.error('DELETE /budgets/:id error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
