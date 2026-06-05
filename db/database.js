require('dotenv').config();
const { Pool } = require('pg');

// ──────────────────────────────────────────────
// Пул подключений PostgreSQL
// ──────────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL &&
         !process.env.DATABASE_URL.includes('localhost') &&
         !process.env.DATABASE_URL.includes('127.0.0.1')
        ? { rejectUnauthorized: false }
        : false,
});

// Конвертируем SQLite-стиль ? → PostgreSQL $1, $2, ...
function toPg(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
}

// ──────────────────────────────────────────────
// Обёртка над пулом PostgreSQL
// ──────────────────────────────────────────────
const db = {
    // Запрос без возврата данных (INSERT, UPDATE, DELETE)
    // Возвращает объект result: result.rows[0] содержит RETURNING-данные
    async run(sql, params = []) {
        return await pool.query(toPg(sql), params);
    },

    // Получить одну строку как объект (или null)
    async get(sql, params = []) {
        const result = await pool.query(toPg(sql), params);
        return result.rows[0] || null;
    },

    // Получить все строки как массив объектов
    async all(sql, params = []) {
        const result = await pool.query(toPg(sql), params);
        return result.rows;
    },
};

// ──────────────────────────────────────────────
// Инициализация схемы (вызывается один раз при старте)
// ──────────────────────────────────────────────
async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL  PRIMARY KEY,
            username      TEXT    UNIQUE NOT NULL,
            password_hash TEXT    NOT NULL,
            is_admin      INTEGER DEFAULT 0,
            created_at    TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS profiles (
            user_id    INTEGER PRIMARY KEY,
            first_name TEXT DEFAULT '',
            last_name  TEXT DEFAULT '',
            phone      TEXT DEFAULT '',
            email      TEXT DEFAULT '',
            avatar     TEXT DEFAULT '',
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id             SERIAL  PRIMARY KEY,
            user_id        INTEGER NOT NULL,
            date           TEXT    NOT NULL,
            category       TEXT    NOT NULL,
            description    TEXT    NOT NULL,
            type           TEXT    NOT NULL,
            amount         REAL    NOT NULL,
            recurring      INTEGER DEFAULT 0,
            recurring_auto INTEGER DEFAULT 0,
            created_at     TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS budget_categories (
            id      SERIAL  PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name    TEXT    NOT NULL,
            budget  REAL    NOT NULL,
            color   TEXT    DEFAULT '#3b82f6',
            UNIQUE(user_id, name),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS goals (
            id             SERIAL  PRIMARY KEY,
            user_id        INTEGER NOT NULL,
            name           TEXT    NOT NULL,
            target_amount  REAL    NOT NULL,
            saved_amount   REAL    DEFAULT 0,
            icon           TEXT    DEFAULT 'star',
            color          TEXT    DEFAULT '#667eea',
            created_at     TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS recurring_templates (
            id           SERIAL  PRIMARY KEY,
            user_id      INTEGER NOT NULL,
            category     TEXT    NOT NULL,
            description  TEXT    NOT NULL,
            type         TEXT    NOT NULL,
            amount       REAL    NOT NULL,
            day_of_month INTEGER DEFAULT 1,
            UNIQUE(user_id, category, description, type),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    console.log('✅ Схема PostgreSQL проверена/создана');
    return db;
}

// ──────────────────────────────────────────────
// Повторяющиеся транзакции (async)
// ──────────────────────────────────────────────
async function ensureRecurringForUser(db, userId) {
    const now  = new Date();
    const mon  = now.getMonth() + 1;
    const year = now.getFullYear();
    const key  = `${year}-${String(mon).padStart(2, '0')}`;

    const templates = await db.all(
        'SELECT * FROM recurring_templates WHERE user_id = ?', [userId]
    );
    if (!templates.length) return;

    const daysInMonth = new Date(year, mon, 0).getDate();

    for (const tpl of templates) {
        const existing = await db.get(`
            SELECT id FROM transactions
            WHERE user_id = ? AND category = ? AND description = ?
              AND type = ? AND recurring_auto = 1
              AND date LIKE ?
        `, [userId, tpl.category, tpl.description, tpl.type, key + '%']);

        if (!existing) {
            const day  = String(Math.min(tpl.day_of_month, daysInMonth)).padStart(2, '0');
            const date = `${year}-${String(mon).padStart(2, '0')}-${day}`;
            await db.run(`
                INSERT INTO transactions
                    (user_id, date, category, description, type, amount, recurring, recurring_auto)
                VALUES (?, ?, ?, ?, ?, ?, 1, 1)
            `, [userId, date, tpl.category, tpl.description, tpl.type, tpl.amount]);
        }
    }
}

module.exports = { initDB, ensureRecurringForUser };
