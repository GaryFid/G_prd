// Безопасная инициализация Telegram WebApp
let tg = null;

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем доступность Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.expand();
        initGame();
    } else {
        console.warn('Telegram WebApp не доступен. Возможно, приложение запущено вне Telegram.');
    }
});

class Game {
    constructor() {
        this.gameState = {
    players: [],
            currentPlayer: null,
    deck: [],
            discardPile: [],
            stage: 'stage1'
        };
        
        this.isTelegram = window.Telegram?.WebApp != null;
        this.init();
    }

    async init() {
    try {
            // Инициализация Telegram WebApp если доступен
            if (this.isTelegram) {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
            }

            // Получаем начальное состояние игры
            await this.initializeGame();
            
            // Настраиваем обработчики событий только после загрузки DOM
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });

            // Первичная отрисовка
            this.renderGame();
    } catch (error) {
            console.error('Ошибка инициализации игры:', error);
    }
}

    async initializeGame() {
        try {
            const response = await fetch('/api/game/state');
            const data = await response.json();
            
            if (data.success) {
                this.gameState = data.gameState;
                this.renderGame();
            } else {
                // Если игра не найдена, создаем новую
                await this.createNewGame();
            }
        } catch (error) {
            console.error('Ошибка при получении состояния игры:', error);
            // В случае ошибки также пытаемся создать новую игру
            await this.createNewGame();
        }
    }

    async createNewGame() {
    try {
            const response = await fetch('/api/game/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
                body: JSON.stringify({
                    withAI: !this.isTelegram // Если не в Telegram, играем с ИИ
                })
        });
            
        const data = await response.json();
        if (data.success) {
                this.gameState = data.gameState;
                this.renderGame();
        }
    } catch (error) {
            console.error('Ошибка при создании игры:', error);
    }
}

    setupEventListeners() {
        // Проверяем существование элементов перед добавлением обработчиков
        const playerHand = document.querySelector('.player-hand');
        const drawCardBtn = document.getElementById('draw-card');

        if (playerHand) {
            playerHand.addEventListener('click', (e) => {
                const cardElement = e.target.closest('.card');
                if (cardElement && !cardElement.classList.contains('flipped')) {
                    this.handleCardClick(cardElement);
                }
            });
        }

        if (drawCardBtn) {
            drawCardBtn.addEventListener('click', () => {
                this.drawCard();
            });
        }
    }

    handleCardClick(cardElement) {
        const cardId = cardElement.dataset.cardId;
        if (this.isValidMove(cardId)) {
            this.playCard(cardId);
        }
    }

    isValidMove(cardId) {
        const card = this.findCard(cardId);
        const topDiscard = this.gameState.discardPile[this.gameState.discardPile.length - 1];
        
        return card && topDiscard && (
            card.suit === topDiscard.suit || 
            card.value === topDiscard.value
        );
    }

    findCard(cardId) {
        const currentPlayer = this.gameState.players.find(p => p.id === this.gameState.currentPlayer);
        return currentPlayer?.cards.find(c => c.id === cardId);
    }

    async playCard(cardId) {
        try {
            const response = await fetch('/api/game/play-card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cardId })
            });
            
            const data = await response.json();
            if (data.success) {
                this.gameState = data.gameState;
                this.renderGame();

                // Если игра в Telegram, отправляем данные в приложение
                if (this.isTelegram) {
                    window.Telegram.WebApp.sendData(JSON.stringify({
                        action: 'cardPlayed',
                        gameState: this.gameState
                    }));
                }
            }
        } catch (error) {
            console.error('Ошибка при игре картой:', error);
        }
    }

    async drawCard() {
        try {
            const response = await fetch('/api/game/draw-card', {
                method: 'POST'
            });
            
            const data = await response.json();
            if (data.success) {
                this.gameState = data.gameState;
                this.renderGame();

                // Если игра в Telegram, отправляем данные в приложение
                if (this.isTelegram) {
                    window.Telegram.WebApp.sendData(JSON.stringify({
                        action: 'cardDrawn',
                        gameState: this.gameState
                    }));
                }
            }
        } catch (error) {
            console.error('Ошибка при взятии карты:', error);
        }
    }

    renderGame() {
        // Проверяем, загружен ли DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.renderGameContent());
        } else {
            this.renderGameContent();
        }
    }

    renderGameContent() {
        this.renderPlayers();
        this.renderCards();
        this.renderGameInfo();
        this.updateControls();
    }

    renderPlayers() {
        const container = document.querySelector('.players-container');
        container.innerHTML = '';
        
        this.gameState.players.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player';
            playerElement.style.cssText = this.getPlayerPosition(index, this.gameState.players.length);
            
            playerElement.innerHTML = `
                <div class="player-avatar" style="background-image: url(${player.avatar || 'img/default-avatar.png'})"></div>
                <div class="player-name">${player.username}</div>
                <div class="player-cards-count">${player.cards.length} карт</div>
            `;
            
            container.appendChild(playerElement);
        });
    }

    getPlayerPosition(index, totalPlayers) {
        const angle = (index * 360 / totalPlayers) - 90;
        const radius = 40;
        const x = 50 + radius * Math.cos(angle * Math.PI / 180);
        const y = 50 + radius * Math.sin(angle * Math.PI / 180);
        return `left: ${x}%; top: ${y}%;`;
    }

    renderCards() {
        // Отображение карт в руке текущего игрока
        const handContainer = document.querySelector('.player-hand');
        const currentPlayer = this.gameState.players.find(p => p.id === this.gameState.currentPlayer);
        
        if (currentPlayer) {
            handContainer.innerHTML = currentPlayer.cards.map(card => `
                <div class="card ${card.faceUp ? 'flipped' : ''}" data-card-id="${card.id}">
                    <div class="card-inner">
                        <div class="card-front">
                            <span class="card-value ${card.isRed ? 'red' : ''}">${card.value}${card.suit}</span>
                        </div>
                        <div class="card-back"></div>
                    </div>
                </div>
            `).join('');
        }

        // Отображение верхней карты в сбросе
        const discardPile = document.querySelector('.discard');
        if (this.gameState.discardPile.length > 0) {
            const topCard = this.gameState.discardPile[this.gameState.discardPile.length - 1];
            discardPile.innerHTML = `
                <div class="card flipped">
                    <div class="card-inner">
                        <div class="card-front">
                            <span class="card-value ${topCard.isRed ? 'red' : ''}">${topCard.value}${topCard.suit}</span>
                        </div>
                        <div class="card-back"></div>
                    </div>
                </div>
            `;
        }
    }

    renderGameInfo() {
        const stageInfo = document.querySelector('.game-stage-info');
        stageInfo.innerHTML = `
            <div class="stage-number">Стадия 1</div>
            <div class="stage-description">Сбросьте карту той же масти или значения</div>
        `;
    }

    updateControls() {
        const drawButton = document.getElementById('draw-card');
        drawButton.disabled = !this.isCurrentPlayersTurn();
    }

    isCurrentPlayersTurn() {
        return this.gameState.currentPlayer === this.getCurrentPlayerId();
    }

    getCurrentPlayerId() {
        // Здесь должна быть логика получения ID текущего игрока
        // Временно возвращаем ID из gameState
        return this.gameState.currentPlayer;
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
}); 