const express = require('express');
const router = express.Router();

// Модель для хранения настроек игры
const gameSettings = new Map();

// Получение настроек игры
router.get('/:roomId', (req, res) => {
    const { roomId } = req.params;
    const settings = gameSettings.get(roomId) || {
        maxPlayers: 9, // Максимум 9 игроков по правилам
        minPlayers: 4, // Минимум 4 игрока по правилам
        currentPlayers: 1 // Создатель комнаты уже считается игроком
    };
    res.json(settings);
});

// Обновление настроек игры
router.post('/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { maxPlayers, minPlayers } = req.body;
    
    // Валидация
    if (maxPlayers < 4 || maxPlayers > 9) {
        return res.status(400).json({ error: 'Количество игроков должно быть от 4 до 9' });
    }
    if (minPlayers < 4 || minPlayers > maxPlayers) {
        return res.status(400).json({ error: 'Минимальное количество игроков должно быть не менее 4' });
    }

    const settings = {
        maxPlayers,
        minPlayers,
        currentPlayers: 1 // Создатель комнаты уже считается игроком
    };
    
    gameSettings.set(roomId, settings);
    res.json(settings);
});

// Обновление количества текущих игроков
router.patch('/:roomId/players', (req, res) => {
    const { roomId } = req.params;
    const { currentPlayers } = req.body;
    
    const settings = gameSettings.get(roomId);
    if (!settings) {
        return res.status(404).json({ error: 'Комната не найдена' });
    }
    
    settings.currentPlayers = currentPlayers;
    gameSettings.set(roomId, settings);
    res.json(settings);
});

module.exports = router; 