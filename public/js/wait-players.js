// --- wait-players.js без import/export ---

class WaitingRoom {
    constructor() {
        this.maxPlayers = 4;
        this.players = [];
        this.isTelegram = window.Telegram?.WebApp != null;
        
        this.init();
    }

    init() {
        // Инициализация Telegram WebApp если доступен
        if (this.isTelegram) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }

        // Настройка слотов для игроков
        this.setupPlayerSlots();
        
        // Добавляем обработчики событий
        this.setupEventListeners();
        
        // Начинаем проверку подключения игроков
        this.startPolling();
    }

    setupPlayerSlots() {
        const slotsContainer = document.querySelector('.players-slots');
        const positions = this.calculatePlayerPositions();

        // Создаем слоты для игроков
        positions.forEach((pos, index) => {
            const slot = document.createElement('div');
            slot.className = 'player-slot empty';
            slot.style.left = pos.x + '%';
            slot.style.top = pos.y + '%';
            
            slot.innerHTML = `
                <div class="player-avatar">
                    <img src="/img/empty-avatar.png" alt="Empty slot">
                </div>
                <div class="player-name">Ожидание игрока...</div>
            `;
            
            slotsContainer.appendChild(slot);
        });
    }

    calculatePlayerPositions() {
        const positions = [];
        const radius = 35; // Расстояние от центра стола
        
        for (let i = 0; i < this.maxPlayers; i++) {
            const angle = (i * 360 / this.maxPlayers + 45) * Math.PI / 180;
            positions.push({
                x: 50 + radius * Math.cos(angle),
                y: 50 + radius * Math.sin(angle)
            });
        }
        
        return positions;
    }

    setupEventListeners() {
        // Обработчик для кнопки добавления бота
        const addBotBtn = document.getElementById('add-bot');
        if (addBotBtn) {
            addBotBtn.addEventListener('click', () => this.addBot());
        }

        // Обработчик для кнопки начала игры
        const startGameBtn = document.getElementById('start-game');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startGame());
        }
    }

    async startPolling() {
        try {
            const response = await fetch('/api/game/waiting-room/status');
            const data = await response.json();
            
            if (data.success) {
                this.updatePlayers(data.players);
                this.updateStatus(data.players.length);
                
                // Если игра готова к запуску, активируем кнопку
                const startGameBtn = document.getElementById('start-game');
                if (startGameBtn) {
                    startGameBtn.disabled = data.players.length < 2;
                }
            }
        } catch (error) {
            console.error('Ошибка при получении статуса комнаты:', error);
        }

        // Продолжаем опрос каждые 2 секунды
        setTimeout(() => this.startPolling(), 2000);
    }

    updatePlayers(players) {
        const slots = document.querySelectorAll('.player-slot');
        const playersList = document.querySelector('.players-list');
        
        // Обновляем слоты
        slots.forEach((slot, index) => {
            const player = players[index];
            
            if (player) {
                slot.className = 'player-slot';
                slot.innerHTML = `
                    <div class="player-avatar">
                        <img src="${player.avatar || '/img/default-avatar.png'}" alt="${player.username}">
                    </div>
                    <div class="player-name">${player.username}</div>
                `;
                
                // Добавляем анимацию если это новый игрок
                if (!this.players[index]) {
                    slot.classList.add('appearing');
                    setTimeout(() => slot.classList.remove('appearing'), 300);
                }
            } else {
                slot.className = 'player-slot empty';
                slot.innerHTML = `
                    <div class="player-avatar">
                        <img src="/img/empty-avatar.png" alt="Empty slot">
                    </div>
                    <div class="player-name">Ожидание игрока...</div>
                `;
            }
        });

        // Обновляем список игроков
        if (playersList) {
            playersList.innerHTML = players.map(player => `
                <div class="player-item">
                    <img src="${player.avatar || '/img/default-avatar.png'}" alt="${player.username}">
                    <span>${player.username}</span>
                </div>
            `).join('');
        }

        this.players = players;
    }

    updateStatus(playerCount) {
        const countElement = document.querySelector('.players-count');
        if (countElement) {
            countElement.textContent = `${playerCount}/${this.maxPlayers} игроков готовы`;
        }
    }

    async addBot() {
        try {
            const response = await fetch('/api/game/waiting-room/add-bot', {
                method: 'POST'
            });
            
            const data = await response.json();
            if (data.success) {
                this.updatePlayers(data.players);
                this.updateStatus(data.players.length);
            }
        } catch (error) {
            console.error('Ошибка при добавлении бота:', error);
        }
    }

    async startGame() {
        try {
            const response = await fetch('/api/game/start', {
                method: 'POST'
            });
            
            const data = await response.json();
            if (data.success) {
                // Если игра в Telegram, отправляем данные в приложение
                if (this.isTelegram) {
                    window.Telegram.WebApp.sendData(JSON.stringify({
                        action: 'gameStarted',
                        gameId: data.gameId
                    }));
                } else {
                    // Иначе перенаправляем на страницу игры
                    window.location.href = `/game?id=${data.gameId}`;
                }
            }
        } catch (error) {
            console.error('Ошибка при запуске игры:', error);
        }
    }
}

// Инициализация комнаты ожидания
const waitingRoom = new WaitingRoom(); 