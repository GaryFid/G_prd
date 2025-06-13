const express = require('express');
const router = express.Router();
const { Game, User } = require('../models');
const logger = require('../utils/logger');

// Получение состояния игры
router.get('/game/state', async (req, res) => {
    try {
        const gameId = req.session.gameId;
        if (!gameId) {
            return res.status(400).json({ success: false, message: 'Игра не найдена' });
        }

        const game = await Game.findByPk(gameId);
        if (!game) {
            return res.status(404).json({ success: false, message: 'Игра не найдена' });
        }

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
router.post('/game/play-card', async (req, res) => {
    try {
        const { cardId } = req.body;
        const gameId = req.session.gameId;
        const userId = req.session.userId;

        if (!gameId || !cardId) {
            return res.status(400).json({ success: false, message: 'Неверные параметры' });
        }

        const game = await Game.findByPk(gameId);
        if (!game) {
            return res.status(404).json({ success: false, message: 'Игра не найдена' });
        }

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
router.post('/game/draw-card', async (req, res) => {
    try {
        const gameId = req.session.gameId;
        const userId = req.session.userId;

        if (!gameId) {
            return res.status(400).json({ success: false, message: 'Неверные параметры' });
        }

        const game = await Game.findByPk(gameId);
        if (!game) {
            return res.status(404).json({ success: false, message: 'Игра не найдена' });
        }

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

module.exports = router; 