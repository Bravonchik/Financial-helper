require('dotenv').config();
const express  = require('express');
const path     = require('path');
const { initDB, ensureRecurringForUser } = require('./db/database');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Ждём инициализации БД перед запуском сервера
initDB().then(db => {
    // Передаём db во все роуты
    app.use('/api/auth',         require('./routes/auth')(db));
    app.use('/api/transactions', require('./routes/transactions')(db, ensureRecurringForUser));
    app.use('/api/budgets',      require('./routes/budgets')(db));
    app.use('/api/goals',        require('./routes/goals')(db));
    app.use('/api/profile',      require('./routes/profile')(db));
    app.use('/api/admin',        require('./routes/admin')(db));

    // Fallback → index.html (SPA)
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Не найдено' });
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`✅ Сервер запущен: http://localhost:${PORT}`));
}).catch(err => {
    console.error('❌ Ошибка инициализации БД:', err);
    process.exit(1);
});
