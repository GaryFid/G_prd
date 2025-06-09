const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { User, initDatabase } = require('./models');
const config = require('./config');

const app = express();

// Настройка Express
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// Инициализация бота
let bot = null;
if (config.telegram.enabled && config.telegram.token) {
    try {
        bot = require('./bot');
        console.log('Telegram бот успешно запущен');
    } catch (error) {
        console.error('Ошибка при запуске бота:', error);
    }
} else {
    console.log('Telegram бот отключен');
}

// Маршруты
app.get('/auth/telegram', (req, res) => {
    if (!config.telegram.enabled || !config.telegram.username) {
        return res.status(500).json({ success: false, message: 'Вход через Telegram временно недоступен' });
    }
    const authToken = Date.now().toString(36) + Math.random().toString(36).substr(2);
    res.redirect(`https://t.me/${config.telegram.username}?start=auth_${authToken}`);
});

// Telegram WebApp авто-авторизация
app.post('/api/telegram-auth', async (req, res) => {
    try {
        const { id, username, first_name, last_name, photo_url } = req.body;
        if (!id) return res.status(400).json({ success: false, message: 'No telegram id' });
        
        let user = await User.findOne({ where: { telegramId: id.toString() } });
        if (!user) {
            user = await User.create({
                telegramId: id.toString(),
                username: username || first_name || 'Игрок',
                firstName: first_name,
                lastName: last_name,
                avatar: photo_url,
                authType: 'telegram',
                registrationDate: new Date(),
                balance: 1000, // Начальный баланс
                gamesPlayed: 0,
                gamesWon: 0,
                rating: 1000
            });
        } else {
            // Обновим данные если изменились
            let changed = false;
            if (user.username !== (username || first_name || 'Игрок')) { user.username = username || first_name || 'Игрок'; changed = true; }
            if (user.firstName !== first_name) { user.firstName = first_name; changed = true; }
            if (user.lastName !== last_name) { user.lastName = last_name; changed = true; }
            if (user.avatar !== photo_url) { user.avatar = photo_url; changed = true; }
            if (changed) await user.save();
        }

        // Сохраняем в сессию
        req.session.user = user.toPublicJSON();
        
        res.json({ 
            success: true, 
            user: user.toPublicJSON(),
            message: 'Авторизация успешна'
        });
    } catch (error) {
        console.error('Ошибка в /api/telegram-auth:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Проверка статуса авторизации
app.get('/api/auth/status', (req, res) => {
    res.json({
        isAuthenticated: !!req.session.user,
        user: req.session.user || null
    });
});

// Инициализация базы данных и запуск сервера
initDatabase()
    .then(() => {
        app.listen(config.server.port, () => {
            console.log(`Сервер запущен на порту ${config.server.port}`);
        });
    })
    .catch(error => {
        console.error('Ошибка при инициализации базы данных:', error);
        process.exit(1);
    }); 