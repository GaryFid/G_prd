const express = require('express');
const router = express.Router();
const { Game, User } = require('../models');
const logger = require('../utils/logger');

// Middleware для проверки авторизации
const checkAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Необходима авторизация' });
    }
    next();
};

// Middleware для проверки существования игры
const checkGame = async (req, res, next) => {
    try {
        const gameId = req.session.gameId;
        if (!gameId) {
            return res.status(400).json({ success: false, message: 'Игра не найдена' });
        }

        const game = await Game.findByPk(gameId);
        if (!game) {
            return res.status(404).json({ success: false, message: 'Игра не найдена' });
        }

        req.game = game;
        next();
    } catch (error) {
        logger.error('Ошибка при проверке игры:', error);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
};

// Создание новой игры
router.post('/game/create', checkAuth, async (req, res) => {
    try {
        const { withAI } = req.body;
        const userId = req.session.userId;

        // Создаем новую игру
        const game = await Game.create({
            status: 'waiting',
            withAI: withAI || false,
            currentPlayerId: userId,
            startTime: new Date(),
            gameStage: 'stage1'
        });

        // Получаем данные пользователя
        const user = await User.findByPk(userId);
        
        // Инициализируем игроков
        game.players = [{
            id: userId,
            username: user.username,
            avatar: user.avatar,
            cards: []
        }];

        // Если игра с ИИ, добавляем бота
        if (withAI) {
            game.players.push({
                id: 'ai',
                username: 'Бот',
                avatar: '/img/bot-avatar.png',
                cards: []
            });
        }

        // Инициализируем колоду и раздаем карты
        game.initializeDeck();
        game.dealInitialCards();

        // Сохраняем ID игры в сессии
        req.session.gameId = game.id;
        
        // Сохраняем изменения
        await game.save();

        res.json({
            success: true,
            gameState: {
                players: game.players,
                currentPlayer: game.currentPlayerId,
                deck: game.deck,
                discardPile: game.discardPile,
                stage: game.gameStage
            }
        });
    } catch (error) {
        logger.error('Ошибка при создании игры:', error);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
});

// Получение состояния игры
router.get('/game/state', checkAuth, checkGame, async (req, res) => {
    try {
        const game = req.game;
        res.json({
            success: true,
            gameState: {
                players: game.players,
                currentPlayer: game.currentPlayerId,
                deck: game.deck,
                discardPile: game.discardPile,
                stage: game.gameStage
            }
        });
    } catch (error) {
        logger.error('Ошибка при получении состояния игры:', error);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
});

// Сыграть карту
router.post('/game/play-card', checkAuth, checkGame, async (req, res) => {
    try {
        const { cardId } = req.body;
        const game = req.game;
        const userId = req.session.userId;

        if (game.currentPlayerId !== userId) {
            return res.status(403).json({ success: false, message: 'Сейчас не ваш ход' });
        }

        // Находим карту в руке игрока
        const currentPlayer = game.players.find(p => p.id === userId);
        const cardIndex = currentPlayer.cards.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) {
            return res.status(400).json({ success: false, message: 'Карта не найдена' });
        }

        const card = currentPlayer.cards[cardIndex];
        const topDiscard = game.discardPile[game.discardPile.length - 1];

        // Проверяем, можно ли сыграть карту
        if (card.suit !== topDiscard.suit && card.value !== topDiscard.value) {
            return res.status(400).json({ success: false, message: 'Недопустимый ход' });
        }

        // Играем карту
        currentPlayer.cards.splice(cardIndex, 1);
        game.discardPile.push(card);

        // Проверяем условие победы
        if (currentPlayer.cards.length === 0) {
            game.status = 'finished';
            game.winnerId = userId;
            game.endTime = new Date();
            
            // Обновляем статистику игрока
            const user = await User.findByPk(userId);
            if (user) {
                user.gamesWon = (user.gamesWon || 0) + 1;
                user.rating += 10;
                await user.save();
            }
        } else {
            // Передаем ход следующему игроку
            const currentPlayerIndex = game.players.findIndex(p => p.id === userId);
            const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
            game.currentPlayerId = game.players[nextPlayerIndex].id;

            // Если следующий игрок - бот, делаем его ход
            if (game.withAI && game.players[nextPlayerIndex].id === 'ai') {
                await makeAIMove(game);
            }
        }

        await game.save();

        res.json({
            success: true,
            gameState: {
                players: game.players,
                currentPlayer: game.currentPlayerId,
                deck: game.deck,
                discardPile: game.discardPile,
                stage: game.gameStage,
                status: game.status,
                winner: game.winnerId
            }
        });
    } catch (error) {
        logger.error('Ошибка при игре картой:', error);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
});

// Взять карту
router.post('/game/draw-card', checkAuth, checkGame, async (req, res) => {
    try {
        const game = req.game;
        const userId = req.session.userId;

        if (game.currentPlayerId !== userId) {
            return res.status(403).json({ success: false, message: 'Сейчас не ваш ход' });
        }

        // Если колода пуста, перемешиваем сброс
        if (game.deck.length === 0) {
            const topDiscard = game.discardPile.pop();
            game.deck = game.discardPile;
            game.discardPile = [topDiscard];
            
            // Перемешиваем колоду
            for (let i = game.deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [game.deck[i], game.deck[j]] = [game.deck[j], game.deck[i]];
            }
        }

        // Берем карту
        const currentPlayer = game.players.find(p => p.id === userId);
        const card = game.deck.pop();
        currentPlayer.cards.push(card);

        // Передаем ход следующему игроку
        const currentPlayerIndex = game.players.findIndex(p => p.id === userId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
        game.currentPlayerId = game.players[nextPlayerIndex].id;

        // Если следующий игрок - бот, делаем его ход
        if (game.withAI && game.players[nextPlayerIndex].id === 'ai') {
            await makeAIMove(game);
        }

        await game.save();

        res.json({
            success: true,
            gameState: {
                players: game.players,
                currentPlayer: game.currentPlayerId,
                deck: game.deck,
                discardPile: game.discardPile,
                stage: game.gameStage
            }
        });
    } catch (error) {
        logger.error('Ошибка при взятии карты:', error);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
});

// Функция для хода бота
async function makeAIMove(game) {
    const aiPlayer = game.players.find(p => p.id === 'ai');
    const topDiscard = game.discardPile[game.discardPile.length - 1];

    // Ищем подходящую карту
    const playableCard = aiPlayer.cards.find(card => 
        card.suit === topDiscard.suit || card.value === topDiscard.value
    );

    if (playableCard) {
        // Играем карту
        const cardIndex = aiPlayer.cards.findIndex(c => c.id === playableCard.id);
        aiPlayer.cards.splice(cardIndex, 1);
        game.discardPile.push(playableCard);

        // Проверяем победу
        if (aiPlayer.cards.length === 0) {
            game.status = 'finished';
            game.winnerId = 'ai';
            game.endTime = new Date();
        }
    } else {
        // Берем карту
        if (game.deck.length === 0) {
            const topDiscard = game.discardPile.pop();
            game.deck = game.discardPile;
            game.discardPile = [topDiscard];
            
            // Перемешиваем колоду
            for (let i = game.deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [game.deck[i], game.deck[j]] = [game.deck[j], game.deck[i]];
            }
        }

        const card = game.deck.pop();
        aiPlayer.cards.push(card);
    }

    // Передаем ход следующему игроку
    const aiIndex = game.players.findIndex(p => p.id === 'ai');
    const nextPlayerIndex = (aiIndex + 1) % game.players.length;
    game.currentPlayerId = game.players[nextPlayerIndex].id;
}

// Добавление бота в игру
router.post('/add-bot', checkAuth, checkGame, async (req, res) => {
    try {
        const game = req.game;
        // Проверяем, не превышено ли максимальное количество игроков
        if (game.players.length >= 9) {
            return res.status(400).json({ success: false, message: 'Достигнуто максимальное количество игроков' });
        }
        // Проверяем, есть ли уже бот
        if (game.players.some(p => p.id === 'ai')) {
            return res.status(400).json({ success: false, message: 'Бот уже добавлен' });
        }
        // Добавляем бота
        const bot = {
            id: 'ai',
            username: 'Бот',
            avatar: '/img/bot-avatar.png',
            cards: []
        };
        game.players.push(bot);
        await game.save();
        res.json(bot);
    } catch (error) {
        logger.error('Ошибка при добавлении бота:', error);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router; 