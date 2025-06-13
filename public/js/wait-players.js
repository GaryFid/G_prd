// --- wait-players.js без import/export ---

// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Конфигурация
const config = {
    maxPlayers: 4,
    minPlayers: 2,
    playerPositions: [
        { top: '20%', left: '20%' },
        { top: '20%', left: '80%' },
        { top: '80%', left: '20%' },
        { top: '80%', left: '80%' }
    ],
    particleCount: 30
};

// Состояние игры
let gameState = {
    players: [],
    isHost: false,
    roomId: null,
    interval: null
};

// DOM элементы
const elements = {
    gameTable: document.querySelector('.game-table'),
    connectedPlayers: document.querySelector('.connected-players'),
    startGameBtn: document.querySelector('.start-game-btn'),
    addBotBtn: document.querySelector('.add-bot-btn'),
    backgroundEffects: document.querySelector('.background-effects')
};

// Инициализация частиц
function initParticles() {
    for (let i = 0; i < config.particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        elements.backgroundEffects.appendChild(particle);
    }
}

// Создание слота игрока
function createPlayerSlot(position, index) {
    const slot = document.createElement('div');
    slot.className = 'player-slot empty';
    slot.style.top = position.top;
    slot.style.left = position.left;
    slot.innerHTML = `
        <div class="player-avatar">
            <img src="images/empty-avatar.png" alt="Empty slot">
        </div>
        <div class="player-name">Пустой слот</div>
    `;
    elements.gameTable.appendChild(slot);
    return slot;
}

// Обновление слота игрока
function updatePlayerSlot(slot, player) {
    slot.className = 'player-slot appearing';
    const avatar = slot.querySelector('.player-avatar img');
    const name = slot.querySelector('.player-name');
    
    avatar.src = player.avatar || 'images/default-avatar.png';
    name.textContent = player.name;
    
    if (player.isBot) {
        slot.classList.add('bot');
    }
    
    if (player.isReady) {
        slot.classList.add('ready');
    }
    
    // Анимация появления
    setTimeout(() => {
        slot.classList.remove('appearing');
    }, 600);
}

// Обновление состояния игры
function updateGameState() {
    elements.connectedPlayers.textContent = `${gameState.players.length}/${config.maxPlayers}`;
    elements.startGameBtn.disabled = gameState.players.length < config.minPlayers || !gameState.isHost;
    elements.addBotBtn.disabled = gameState.players.length >= config.maxPlayers;
}

// Добавление бота
async function addBot() {
    if (gameState.players.length >= config.maxPlayers) return;

    try {
        const response = await fetch('/api/add-bot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ roomId: gameState.roomId })
        });

        if (!response.ok) throw new Error('Failed to add bot');

        const bot = await response.json();
        gameState.players.push(bot);
        updatePlayerSlot(document.querySelectorAll('.player-slot')[gameState.players.length - 1], bot);
        updateGameState();
    } catch (error) {
        console.error('Error adding bot:', error);
        // Показать уведомление об ошибке
        showNotification('Не удалось добавить бота', 'error');
    }
}

// Начало игры
async function startGame() {
    if (gameState.players.length < config.minPlayers || !gameState.isHost) return;

    try {
        const response = await fetch('/api/start-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ roomId: gameState.roomId })
        });

        if (!response.ok) throw new Error('Failed to start game');

        // Переход к игре
        window.location.href = '/game.html';
    } catch (error) {
        console.error('Error starting game:', error);
        showNotification('Не удалось начать игру', 'error');
    }
}

// Показ уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 100);
}

// Обновление состояния комнаты
async function updateRoom() {
    try {
        const response = await fetch(`/api/room/${gameState.roomId}`);
        if (!response.ok) throw new Error('Failed to fetch room state');

        const roomState = await response.json();
        
        // Обновление списка игроков
        roomState.players.forEach((player, index) => {
            if (!gameState.players[index] || gameState.players[index].id !== player.id) {
                gameState.players[index] = player;
                updatePlayerSlot(document.querySelectorAll('.player-slot')[index], player);
            }
        });

        // Удаление лишних игроков
        if (roomState.players.length < gameState.players.length) {
            gameState.players = roomState.players;
            document.querySelectorAll('.player-slot').forEach((slot, index) => {
                if (index >= roomState.players.length) {
                    slot.className = 'player-slot empty';
                    slot.querySelector('.player-avatar img').src = 'images/empty-avatar.png';
                    slot.querySelector('.player-name').textContent = 'Пустой слот';
                }
            });
        }

        updateGameState();

        // Проверка начала игры
        if (roomState.status === 'playing') {
            window.location.href = '/game.html';
        }
    } catch (error) {
        console.error('Error updating room:', error);
    }
}

// Инициализация
async function init() {
    try {
        // Получение параметров из URL
        const urlParams = new URLSearchParams(window.location.search);
        gameState.roomId = urlParams.get('roomId');
        gameState.isHost = urlParams.get('isHost') === 'true';

        if (!gameState.roomId) throw new Error('No room ID provided');

        // Создание слотов игроков
        config.playerPositions.forEach((position, index) => {
            createPlayerSlot(position, index);
        });

        // Инициализация частиц
        initParticles();

        // Первое обновление состояния комнаты
        await updateRoom();

        // Запуск периодического обновления
        gameState.interval = setInterval(updateRoom, 2000);
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Ошибка инициализации комнаты', 'error');
    }
}

// Запуск инициализации при загрузке страницы
document.addEventListener('DOMContentLoaded', init);

// Очистка при уходе со страницы
window.addEventListener('beforeunload', () => {
    if (gameState.interval) {
        clearInterval(gameState.interval);
    }
}); 