const { Scenes } = require('telegraf');
const { GameManager } = require('../public/js/game-logic');

const gameScene = new Scenes.BaseScene('game');

// Хранилище активных игр
const activeGames = new Map();

gameScene.enter(async (ctx) => {
    try {
        // Получаем настройки игры из контекста
        const gameData = ctx.scene.state.gameData;
        if (!gameData) {
            await ctx.reply('Ошибка: не найдены настройки игры');
            return ctx.scene.enter('menu');
        }

        // Создаем новую игру
        const game = new GameManager(gameData.playerCount);
        activeGames.set(ctx.from.id, game);

        // Отправляем начальное состояние игры
        await sendGameState(ctx);

    } catch (error) {
        console.error('Ошибка при входе в игру:', error);
        await ctx.reply('Произошла ошибка при начале игры');
        return ctx.scene.enter('menu');
    }
});

// Отправка состояния игры
async function sendGameState(ctx) {
    const game = activeGames.get(ctx.from.id);
    if (!game) return;

    const state = game.getGameState();
    const player = game.players[state.currentPlayer];

    let message = `🎮 Стадия ${state.stage}\n`;
    message += `👤 Ход: ${player.name}\n`;
    message += `🎴 Карт в колоде: ${state.deckCount}\n\n`;
    message += `Верхняя карта: ${state.topCard.rank}${getSuitEmoji(state.topCard.suit)}\n\n`;

    // Информация о картах игроков
    state.players.forEach(p => {
        message += `${p.isActive ? '👉 ' : ''}${p.name}: ${p.cardCount} карт`;
        if (p.activeCard) {
            message += ` (${p.activeCard.rank}${getSuitEmoji(p.activeCard.suit)})`;
        }
        message += '\n';
    });

    // Кнопки управления
    const keyboard = {
        inline_keyboard: [
            [
                { text: '🎴 Взять карту', callback_data: 'draw' },
                { text: '➡️ Сыграть карту', callback_data: 'play' }
            ],
            [
                { text: '↪️ Положить игроку', callback_data: 'give' },
                { text: '⏭️ Пропустить', callback_data: 'skip' }
            ],
            [{ text: '📋 Правила', callback_data: 'rules' }]
        ]
    };

    await ctx.reply(message, { reply_markup: keyboard });
}

// Получение эмодзи масти
function getSuitEmoji(suit) {
    const suits = {
        'hearts': '♥️',
        'diamonds': '♦️',
        'clubs': '♣️',
        'spades': '♠️'
    };
    return suits[suit] || '';
}

// Обработка действий игрока
gameScene.action('draw', async (ctx) => {
    const game = activeGames.get(ctx.from.id);
    if (!game) return;

    if (game.drawCard(game.currentPlayerIndex)) {
        await ctx.answerCbQuery('Вы взяли карту');
    } else {
        await ctx.answerCbQuery('Вы не можете взять карту');
    }
    await sendGameState(ctx);
});

gameScene.action('play', async (ctx) => {
    const game = activeGames.get(ctx.from.id);
    if (!game) return;

    if (game.makeMove(game.currentPlayerIndex)) {
        await ctx.answerCbQuery('Карта сыграна');
    } else {
        await ctx.answerCbQuery('Невозможно сыграть эту карту');
    }
    await sendGameState(ctx);
});

gameScene.action('give', async (ctx) => {
    const game = activeGames.get(ctx.from.id);
    if (!game) return;

    // Создаем клавиатуру с игроками
    const keyboard = {
        inline_keyboard: game.players
            .filter(p => p.id !== game.currentPlayerIndex)
            .map(p => [{
                text: p.name,
                callback_data: `give_${p.id}`
            }])
    };

    await ctx.reply('Выберите игрока:', { reply_markup: keyboard });
});

// Обработка выбора игрока для передачи карты
gameScene.action(/^give_(\d+)$/, async (ctx) => {
    const game = activeGames.get(ctx.from.id);
    if (!game) return;

    const targetId = parseInt(ctx.match[1]);
    if (game.makeMove(game.currentPlayerIndex, targetId)) {
        await ctx.answerCbQuery('Карта передана игроку');
    } else {
        await ctx.answerCbQuery('Невозможно передать карту');
    }
    await sendGameState(ctx);
});

gameScene.action('skip', async (ctx) => {
    const game = activeGames.get(ctx.from.id);
    if (!game) return;

    game.nextTurn();
    await ctx.answerCbQuery('Ход пропущен');
    await sendGameState(ctx);
});

gameScene.action('rules', async (ctx) => {
    const game = activeGames.get(ctx.from.id);
    if (!game) return;

    let rules = '📋 Правила игры:\n\n';
    if (game.gameStage === 1) {
        rules += '1️⃣ Стадия 1:\n';
        rules += '• Ходите картой на 1 ранг выше\n';
        rules += '• Масти не важны\n';
        rules += '• 2 бьёт только туз (A)\n';
    } else if (game.gameStage === 2) {
        rules += '2️⃣ Стадия 2:\n';
        rules += '• Ходите картой той же масти\n';
        rules += '• Действует правило "Последняя!"\n';
        rules += '• Можно спрашивать "Сколько карт?"\n';
    }

    await ctx.reply(rules);
});

// Очистка при выходе из сцены
gameScene.leave((ctx) => {
    activeGames.delete(ctx.from.id);
});

module.exports = { gameScene }; 