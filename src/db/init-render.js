const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

async function initDatabase() {
    try {
        // Читаем SQL файл
        const sqlPath = path.join(__dirname, 'init.sql');
        const sqlContent = await fs.readFile(sqlPath, 'utf8');

        // Подключаемся к базе данных и выполняем SQL
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sqlContent);
            await client.query('COMMIT');
            console.log('Database initialized successfully');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Запускаем инициализацию
initDatabase(); 