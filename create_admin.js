/**
 * Скрипт создания/сброса пароля администратора.
 * Запуск: node create_admin.js [логин] [пароль]
 * Пример: node create_admin.js admin admin123
 */

const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db', 'financial.db');

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

(async () => {
    if (password.length < 6) {
        console.error('❌ Пароль должен быть не менее 6 символов');
        process.exit(1);
    }

    const SQL = await initSqlJs();

    let db;
    if (fs.existsSync(DB_PATH)) {
        db = new SQL.Database(fs.readFileSync(DB_PATH));
        console.log('📂 База данных загружена');
    } else {
        console.error('❌ База данных не найдена. Сначала запустите сервер (node server.js)');
        process.exit(1);
    }

    // Добавить колонку is_admin если нет
    try {
        db.run('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0');
    } catch (_) {}

    const hash = bcrypt.hashSync(password, 12);
    const exists = db.exec(
        'SELECT id FROM users WHERE username = ?', [username]
    );

    if (exists.length && exists[0].values.length) {
        // Обновить существующего
        db.run(
            'UPDATE users SET password_hash = ?, is_admin = 1 WHERE username = ?',
            [hash, username]
        );
        console.log(`✅ Пользователь "${username}" обновлён — выдан статус администратора`);
    } else {
        // Создать нового
        db.run(
            'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)',
            [username, hash]
        );
        console.log(`✅ Администратор "${username}" создан`);
    }

    // Сохранить БД
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    db.close();

    console.log('');
    console.log('════════════════════════════════════');
    console.log('  Данные для входа:');
    console.log(`  Логин:  ${username}`);
    console.log(`  Пароль: ${password}`);
    console.log('  Адрес:  http://localhost:3000/admin.html');
    console.log('════════════════════════════════════');
})();
