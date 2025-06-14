const { Pool } = require('pg');

// Парсинг URL подключения к базе данных Render
const getDatabaseConfig = () => {
    if (process.env.DATABASE_URL) {
        // Для Render
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Требуется для Render
            }
        };
    }
    
    // Для локальной разработки
    return {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'pidr_game',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432
    };
};

const pool = new Pool(getDatabaseConfig());

// Обработка ошибок подключения
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Проверка подключения
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to the database');
        client.release();
    } catch (err) {
        console.error('Database connection error:', err);
    }
};

testConnection();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
}; 