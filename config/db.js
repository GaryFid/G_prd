const { Sequelize } = require('sequelize');
require('dotenv').config();

// Функция для создания URL базы данных из компонентов
function buildDatabaseUrl() {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    // Если нет полного URL, собираем из отдельных параметров
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 5432;
    const database = process.env.DB_NAME || 'pidr_game';
    const username = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';

    return `postgres://${username}:${password}@${host}:${port}/${database}`;
}

// Конфигурация Sequelize
const sequelize = new Sequelize(buildDatabaseUrl(), {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 60000, // увеличиваем время ожидания до 60 секунд
        idle: 10000
    },
    retry: {
        match: [
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeConnectionTimedOutError/,
            /SequelizeConnectionAcquireTimeoutError/,
            /SequelizeConnectionDeadError/
        ],
        max: 5, // максимальное количество попыток
        backoffBase: 1000, // начальная задержка в мс
        backoffExponent: 1.5 // множитель задержки
    }
});

// Функция для тестирования соединения
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Успешное подключение к базе данных');
        return true;
    } catch (error) {
        console.error('❌ Ошибка подключения к базе данных:', error.message);
        if (error.parent) {
            console.error('Детали ошибки:', {
                code: error.parent.code,
                errno: error.parent.errno,
                syscall: error.parent.syscall,
                hostname: error.parent.hostname
            });
        }
        return false;
    }
}

// Экспортируем объект с дополнительными методами
module.exports = {
    sequelize,
    testConnection,
    buildDatabaseUrl
}; 