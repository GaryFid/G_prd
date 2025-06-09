const { sequelize, testConnection } = require('../config/db');
const { DataTypes } = require('sequelize');
require('dotenv').config();

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    telegramId: {
        type: DataTypes.STRING,
        unique: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    avatar: DataTypes.STRING,
    balance: {
        type: DataTypes.INTEGER,
        defaultValue: 1000
    },
    gamesPlayed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    gamesWon: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    rating: {
        type: DataTypes.INTEGER,
        defaultValue: 1000
    },
    authType: {
        type: DataTypes.STRING,
        defaultValue: 'telegram'
    },
    registrationDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true
});

// Метод для безопасного возврата данных пользователя
User.prototype.toPublicJSON = function() {
    const values = { ...this.get() };
    delete values.id; // Удаляем внутренний ID
    return values;
};

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

const Game = require('./game');
const Friendship = require('./friendship');

// Экспортируем модели и функции
module.exports = {
    sequelize,
    User,
    Game,
    Friendship,
    initDatabase
}; 