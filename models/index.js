const { sequelize, testConnection } = require('../config/db');
const { DataTypes } = require('sequelize');
require('dotenv').config();

const User = require('./user');
const Game = require('./game');
const Friendship = require('./friendship');

// Функция инициализации базы данных
async function initDatabase() {
    try {
        // Проверяем подключение
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Не удалось подключиться к базе данных');
        }

        // Синхронизируем модели с базой данных
        await sequelize.sync({ alter: true });
        console.log('✅ База данных успешно инициализирована');
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка при инициализации базы данных:', error);
        throw error;
    }
}

// Экспортируем модели и функции
module.exports = {
    sequelize,
    User,
    Game,
    Friendship,
    initDatabase
}; 