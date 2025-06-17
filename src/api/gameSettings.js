const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Получение настроек игры
router.get('/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const result = await db.query(
            'SELECT * FROM game_rooms WHERE room_id = $1',
            [roomId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Комната не найдена' });
        }

        const room = result.rows[0];
        const playersResult = await db.query(
            'SELECT COUNT(*) as count FROM players WHERE room_id = $1',
            [roomId]
        );

        const settings = {
            maxPlayers: room.max_players,
            minPlayers: room.min_players,
            currentPlayers: parseInt(playersResult.rows[0].count),
            status: room.status
        };

        res.json(settings);
    } catch (error) {
        console.error('Error fetching game settings:', error);
        res.status(500).json({ error: 'Ошибка при получении настроек игры' });
    }
});

// Создание новой комнаты
router.post('/create', async (req, res) => {
    try {
        const { roomId, maxPlayers, minPlayers, hostId, hostName } = req.body;

        // Валидация
        if (maxPlayers < 4 || maxPlayers > 9) {
            return res.status(400).json({ error: 'Количество игроков должно быть от 4 до 9' });
        }
        if (minPlayers < 4 || minPlayers > maxPlayers) {
            return res.status(400).json({ error: 'Минимальное количество игроков должно быть не менее 4' });
        }

        // Создаем комнату
        await db.query(
            'INSERT INTO game_rooms (room_id, max_players, min_players) VALUES ($1, $2, $3)',
            [roomId, maxPlayers, minPlayers]
        );

        // Добавляем хоста как первого игрока
        await db.query(
            'INSERT INTO players (room_id, player_id, player_name, is_host, position) VALUES ($1, $2, $3, true, 0)',
            [roomId, hostId, hostName]
        );

        res.json({ message: 'Комната успешно создана' });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Ошибка при создании комнаты' });
    }
});

// Обновление количества игроков
router.patch('/:roomId/players', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { playerId, playerName, isBot } = req.body;

        // Проверяем существование комнаты
        const roomResult = await db.query(
            'SELECT * FROM game_rooms WHERE room_id = $1',
            [roomId]
        );

        if (roomResult.rows.length === 0) {
            return res.status(404).json({ error: 'Комната не найдена' });
        }

        // Получаем текущее количество игроков
        const playersResult = await db.query(
            'SELECT COUNT(*) as count FROM players WHERE room_id = $1',
            [roomId]
        );

        const currentPlayers = parseInt(playersResult.rows[0].count);
        const maxPlayers = roomResult.rows[0].max_players;

        if (currentPlayers >= maxPlayers) {
            return res.status(400).json({ error: 'Достигнуто максимальное количество игроков' });
        }

        // Добавляем нового игрока
        await db.query(
            'INSERT INTO players (room_id, player_id, player_name, is_bot, position) VALUES ($1, $2, $3, $4, $5)',
            [roomId, playerId, playerName, isBot, currentPlayers]
        );

        // Обновляем количество игроков в комнате
        await db.query(
            'UPDATE game_rooms SET current_players = current_players + 1 WHERE room_id = $1',
            [roomId]
        );

        res.json({ message: 'Игрок успешно добавлен' });
    } catch (error) {
        console.error('Error updating players:', error);
        res.status(500).json({ error: 'Ошибка при обновлении игроков' });
    }
});

// Новый эндпоинт для получения состояния комнаты
router.get('/room/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        // Получаем игроков
        const playersResult = await db.query(
            'SELECT player_id, player_name, is_bot, is_ready, is_host, position FROM players WHERE room_id = $1 ORDER BY position ASC',
            [roomId]
        );
        // Получаем статус комнаты
        const roomResult = await db.query(
            'SELECT status FROM game_rooms WHERE room_id = $1',
            [roomId]
        );
        if (roomResult.rows.length === 0) {
            return res.status(404).json({ error: 'Комната не найдена' });
        }
        res.json({
            players: playersResult.rows,
            status: roomResult.rows[0].status
        });
    } catch (error) {
        console.error('Error fetching room state:', error);
        res.status(500).json({ error: 'Ошибка при получении состояния комнаты' });
    }
});

// Эндпоинт для получения списка всех комнат
router.get('/rooms', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT room_id, max_players, min_players, status, 
                    (SELECT player_name FROM players WHERE room_id = game_rooms.room_id AND is_host = true LIMIT 1) as host_name,
                    (SELECT COUNT(*) FROM players WHERE room_id = game_rooms.room_id) as current_players
             FROM game_rooms
             WHERE status = 'waiting'
             ORDER BY created_at DESC`
        );
        res.json({ rooms: result.rows });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Ошибка при получении списка комнат' });
    }
});

module.exports = router; 