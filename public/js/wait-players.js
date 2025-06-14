// --- wait-players.js без import/export ---

// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Конфигурация
const config = {
    maxPlayers: 9,
    minPlayers: 4,
    currentPlayers: 1,
    playerPositions: [
        { top: '10%', left: '20%' },
        { top: '10%', left: '50%' },
        { top: '10%', left: '80%' },
        { top: '45%', left: '10%' },
        { top: '45%', left: '50%' },
        { top: '45%', left: '90%' },
        { top: '80%', left: '20%' },
        { top: '80%', left: '50%' },
        { top: '80%', left: '80%' }
    ],
    particleCount: 30
};

// Состояние игры
let gameState = {
    players: [],
    isHost: false,
    roomId: null,
    interval: null,
    settings: null
};

// DOM элементы
const elements = {
    gameTable: document.querySelector('.game-table'),
    connectedPlayers: document.querySelector('.connected-players'),
    startGameBtn: document.querySelector('.start-game-btn'),
    addBotBtn: document.querySelector('.add-bot-btn'),
    backgroundEffects: document.querySelector('.background-effects'),
    readyStatus: document.querySelector('.ready-status')
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

// Загрузка настроек игры
async function loadGameSettings() {
    try {
        const response = await fetch(`/api/settings/${gameState.roomId}`);
        if (!response.ok) throw new Error('Failed to fetch game settings');
        
        const settings = await response.json();
        gameState.settings = settings;
        config.maxPlayers = settings.maxPlayers;
        config.minPlayers = settings.minPlayers;
        
        // Обновляем UI
        updateGameState();
    } catch (error) {
        console.error('Error loading game settings:', error);
        showNotification('Не удалось загрузить настройки игры', 'error');
    }
}

// Обновление состояния игры
function updateGameState() {
    if (!gameState.settings) return;

    const currentPlayers = gameState.players.length;
    elements.connectedPlayers.textContent = `${currentPlayers}/${gameState.settings.maxPlayers}`;
    elements.startGameBtn.disabled = currentPlayers < gameState.settings.minPlayers || !gameState.isHost;
    elements.addBotBtn.disabled = currentPlayers >= gameState.settings.maxPlayers;

    // Обновляем статус готовности
    const readyPlayers = gameState.players.filter(player => player.isReady).length;
    elements.readyStatus.textContent = `${readyPlayers}/${currentPlayers}`;
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
        
        // Обновляем список игроков
        gameState.players = roomState.players;
        
        // Обновляем слоты игроков
        gameState.players.forEach((player, index) => {
            const slot = document.querySelectorAll('.player-slot')[index];
            if (slot) {
                updatePlayerSlot(slot, player);
            }
        });

        // Очищаем пустые слоты
        for (let i = gameState.players.length; i < config.maxPlayers; i++) {
            const slot = document.querySelectorAll('.player-slot')[i];
            if (slot) {
                slot.className = 'player-slot empty';
                slot.querySelector('.player-avatar img').src = 'images/empty-avatar.png';
                slot.querySelector('.player-name').textContent = 'Пустой слот';
            }
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
        // Получаем roomId из URL или Telegram WebApp
        const urlParams = new URLSearchParams(window.location.search);
        gameState.roomId = urlParams.get('roomId') || tg.initDataUnsafe?.start_param;
        gameState.isHost = urlParams.get('isHost') === 'true' || false;

        if (!gameState.roomId) {
            throw new Error('Room ID not found');
        }

        // Инициализируем UI
        initParticles();
        
        // Загружаем настройки игры
        await loadGameSettings();
        
        // Создаем слоты для игроков
        for (let i = 0; i < gameState.settings.maxPlayers; i++) {
            const position = config.playerPositions[i] || { top: '50%', left: '50%' };
            createPlayerSlot(position, i);
        }

        // Запускаем обновление состояния комнаты
        await updateRoom();
        gameState.interval = setInterval(updateRoom, 2000);

        // Добавляем обработчики событий
        elements.startGameBtn.addEventListener('click', startGame);
        elements.addBotBtn.addEventListener('click', addBot);

    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Ошибка инициализации', 'error');
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