const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Пример заглушки для проверки
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'auth pong' });
});

// Маршрут для Telegram авторизации
router.post('/telegram-auth', async (req, res) => {
  try {
    const { id, username, first_name, last_name, photo_url } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID пользователя обязателен' 
      });
    }

    // Ищем или создаем пользователя
    let user = await User.findOne({ where: { telegramId: id } });
    
    if (!user) {
      user = await User.create({
        telegramId: id,
        username: username || first_name || 'Игрок',
        firstName: first_name,
        lastName: last_name,
        photoUrl: photo_url,
        rating: 1000,
        coins: 100,
        level: 1
      });
    } else {
      // Обновляем существующего пользователя
      await user.update({
        username: username || first_name || user.username,
        firstName: first_name || user.firstName,
        lastName: last_name || user.lastName,
        photoUrl: photo_url || user.photoUrl
      });
    }

    // Устанавливаем сессию
    req.session.userId = user.id;
    req.session.telegramId = id;

    res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        rating: user.rating,
        coins: user.coins,
        level: user.level
      }
    });
  } catch (error) {
    console.error('Ошибка при авторизации через Telegram:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при авторизации' 
    });
  }
});

// Проверка текущей сессии
router.get('/telegram/check', (req, res) => {
  if (req.session.userId && req.session.telegramId) {
    res.json({
      success: true,
      user: {
        id: req.session.userId,
        telegramId: req.session.telegramId
      }
    });
  } else {
    res.json({
      success: false,
      message: 'Не авторизован'
    });
  }
});

module.exports = router; 