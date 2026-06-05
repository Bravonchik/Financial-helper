const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

async function seedNewUser(db, userId) {
    const now = new Date();
    const ago = days => {
        const d = new Date(now);
        d.setDate(d.getDate() - days);
        return d.toISOString().split('T')[0];
    };
    // Стипендия всегда 25-го числа — вычисляем точную дату
    const stip = (monthsBack) => {
        const d = new Date(now);
        d.setDate(1);
        // Если сегодня ещё не прошло 25-е — начинаем с прошлого месяца
        const offset = now.getDate() < 25 ? 1 : 0;
        d.setMonth(d.getMonth() - offset - monthsBack);
        d.setDate(25);
        return d.toISOString().split('T')[0];
    };

    await db.run(
        'INSERT INTO profiles (user_id) VALUES (?) ON CONFLICT DO NOTHING',
        [userId]
    );

    const txs = [
        // ── Месяц 1 (текущий) ──────────────────────────────────────────
        [stip(0), 'Стипендия',        'Стипендия за месяц',        'income',  4700],
        [ago(2),  'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(3),  'Продукты',         'Пятёрочка',                 'expense',  430],
        [ago(4),  'Транспорт',        'ЛУКОЙЛ — заправка',         'expense', 1850],
        [ago(5),  'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(6),  'Продукты',         'Красное и Белое',           'expense',  640],
        [ago(7),  'Транспорт',        'Автомойка',                 'expense',  400],
        [ago(8),  'Продукты',         'Магнит',                    'expense',  380],
        [ago(9),  'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(10), 'Продукты',         'Лента',                     'expense', 2350],
        [ago(11), 'Связь',            'Мобильная связь',           'expense',  450],
        [ago(13), 'Транспорт',        'Башнефть — заправка',       'expense', 1700],
        [ago(14), 'Продукты',         'Пятёрочка',                 'expense',  290],
        [ago(15), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(16), 'Развлечения',      'Кино',                      'expense',  420],
        [ago(18), 'Продукты',         'Монетка',                   'expense', 1900],
        [ago(20), 'Транспорт',        'Автомойка',                 'expense',  350],
        [ago(22), 'Продукты',         'Пятёрочка',                 'expense',  510],

        // ── Месяц 2 (~30–60 дней назад) ───────────────────────────────
        [stip(1), 'Стипендия',        'Стипендия за месяц',        'income',  4700],
        [ago(33), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(34), 'Продукты',         'Пятёрочка',                 'expense',  460],
        [ago(35), 'Транспорт',        'Салават — заправка',        'expense', 1550],
        [ago(36), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(37), 'Продукты',         'Красное и Белое',           'expense',  580],
        [ago(38), 'Транспорт',        'Автомойка',                 'expense',  400],
        [ago(39), 'Продукты',         'Магнит',                    'expense',  420],
        [ago(41), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(42), 'Продукты',         'Лента',                     'expense', 2800],
        [ago(43), 'Связь',            'Мобильная связь',           'expense',  450],
        [ago(44), 'Транспорт',        'ЛУКОЙЛ — заправка',         'expense', 2100],
        [ago(45), 'Продукты',         'Пятёрочка',                 'expense',  330],
        [ago(47), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(48), 'Развлечения',      'Кино',                      'expense',  480],
        [ago(50), 'Продукты',         'Монетка',                   'expense', 1650],
        [ago(52), 'Личная гигиена',   'Шампунь, гель для душа',    'expense',  340],
        [ago(54), 'Продукты',         'Пятёрочка',                 'expense',  390],

        // ── Месяц 3 (~60–90 дней назад) ───────────────────────────────
        [stip(2), 'Стипендия',        'Стипендия за месяц',        'income',  4700],
        [ago(63), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(64), 'Транспорт',        'Башнефть — заправка',       'expense', 1900],
        [ago(65), 'Продукты',         'Пятёрочка',                 'expense',  370],
        [ago(66), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(67), 'Продукты',         'Красное и Белое',           'expense',  510],
        [ago(68), 'Транспорт',        'Автомойка',                 'expense',  450],
        [ago(69), 'Продукты',         'Магнит',                    'expense',  560],
        [ago(71), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(72), 'Продукты',         'Лента',                     'expense', 3100],
        [ago(73), 'Связь',            'Мобильная связь',           'expense',  450],
        [ago(74), 'Транспорт',        'Салават — заправка',        'expense', 1700],
        [ago(75), 'Продукты',         'Пятёрочка',                 'expense',  320],
        [ago(77), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(79), 'Продукты',         'Монетка',                   'expense', 2100],
        [ago(80), 'Развлечения',      'Кино',                      'expense',  420],
        [ago(82), 'Транспорт',        'Автомойка',                 'expense',  400],
        [ago(84), 'Продукты',         'Пятёрочка',                 'expense',  480],

        // ── Месяц 4 (~90–120 дней назад) ──────────────────────────────
        [stip(3), 'Стипендия',        'Стипендия за месяц',        'income',  4700],
        [ago(93), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(94), 'Транспорт',        'ЛУКОЙЛ — заправка',         'expense', 2300],
        [ago(95), 'Продукты',         'Пятёрочка',                 'expense',  350],
        [ago(96), 'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(97), 'Продукты',         'Красное и Белое',           'expense',  590],
        [ago(98), 'Транспорт',        'Автомойка',                 'expense',  400],
        [ago(99), 'Продукты',         'Магнит',                    'expense',  490],
        [ago(101),'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(102),'Продукты',         'Лента',                     'expense', 2600],
        [ago(103),'Связь',            'Мобильная связь',           'expense',  450],
        [ago(104),'Транспорт',        'Башнефть — заправка',       'expense', 1800],
        [ago(105),'Личная гигиена',   'Шампунь, зубная паста',     'expense',  290],
        [ago(107),'Продукты',         'Пятёрочка',                 'expense',  310],
        [ago(108),'Подработка',       'Курьер (смена)',             'income',  2000],
        [ago(110),'Продукты',         'Монетка',                   'expense', 1950],
        [ago(112),'Развлечения',      'Кино',                      'expense',  380],
        [ago(114),'Продукты',         'Пятёрочка',                 'expense',  280],
    ];
    for (const [date, cat, desc, type, amount] of txs) {
        await db.run(
            'INSERT INTO transactions (user_id,date,category,description,type,amount) VALUES (?,?,?,?,?,?)',
            [userId, date, cat, desc, type, amount]
        );
    }

    const cats = [
        ['Продукты',       9000, '#3b82f6'],
        ['Транспорт',      6000, '#f97316'],
        ['Развлечения',    1500, '#8b5cf6'],
        ['Связь',           450, '#14b8a6'],
        ['Личная гигиена',  700, '#ec4899'],
    ];
    for (const [name, budget, color] of cats) {
        await db.run(
            'INSERT INTO budget_categories (user_id,name,budget,color) VALUES (?,?,?,?) ON CONFLICT DO NOTHING',
            [userId, name, budget, color]
        );
    }

    const goals = [
        ['Новый телефон',    22000,  7500, 'mobile-alt', '#3b82f6'],
        ['Поездка летом',    25000,  4200, 'plane',      '#10b981'],
        ['Ноутбук для учёбы',40000,  2000, 'laptop',     '#8b5cf6'],
    ];
    for (const [name, target, saved, icon, color] of goals) {
        await db.run(
            'INSERT INTO goals (user_id,name,target_amount,saved_amount,icon,color) VALUES (?,?,?,?,?,?)',
            [userId, name, target, saved, icon, color]
        );
    }
}

module.exports = function(db) {
    const router = express.Router();

    // POST /api/auth/register
    router.post('/register', async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password)
                return res.status(400).json({ error: 'Заполните все поля' });
            if (username.length < 3)
                return res.status(400).json({ error: 'Имя пользователя минимум 3 символа' });
            if (password.length < 6)
                return res.status(400).json({ error: 'Пароль минимум 6 символов' });

            const exists = await db.get('SELECT id FROM users WHERE username = ?', [username]);
            if (exists) return res.status(409).json({ error: 'Пользователь уже существует' });

            const hash   = await bcrypt.hash(password, 10);
            const result = await db.run(
                'INSERT INTO users (username, password_hash) VALUES (?,?) RETURNING id',
                [username, hash]
            );
            const userId = result.rows[0].id;

            await seedNewUser(db, userId);

            const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '30d' });
            res.json({ token, user: { id: userId, username } });
        } catch (err) {
            console.error('POST /register error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/auth/login
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password)
                return res.status(400).json({ error: 'Заполните все поля' });

            const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
            }

            const isAdmin = user.is_admin === 1;
            const token = jwt.sign(
                { userId: user.id, username: user.username, isAdmin },
                JWT_SECRET,
                { expiresIn: '30d' }
            );
            res.json({ token, user: { id: user.id, username: user.username, isAdmin } });
        } catch (err) {
            console.error('POST /login error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/auth/me
    router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
        try {
            const user = await db.get(
                'SELECT id, username, created_at FROM users WHERE id = ?',
                [req.userId]
            );
            res.json({ user });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
