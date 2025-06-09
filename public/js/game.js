// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние игры
let gameState = {
    players: [],
    currentPlayer: 0,
    deck: [],
    table: [],
    myHand: [],
    isMyTurn: false
};

// Инициализация игры
async function initGame() {
    try {
        const response = await fetch('/api/game/init', {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            gameState = {
                ...gameState,
                ...data.gameState
            };
            renderGame();
        }
    } catch (error) {
        console.error('Ошибка при инициализации игры:', error);
    }
}

// Отрисовка игрового стола
function renderGame() {
    // Отрисовка карт на столе
    const tableElement = document.querySelector('.game-table');
    tableElement.innerHTML = gameState.table.map(card => createCardElement(card)).join('');
    
    // Отрисовка руки игрока
    const handElement = document.querySelector('.player-hand');
    handElement.innerHTML = gameState.myHand.map(card => createCardElement(card, true)).join('');
    
    // Обновление информации о текущем ходе
    const turnInfo = document.querySelector('.turn-info');
    if (turnInfo) {
        turnInfo.textContent = gameState.isMyTurn ? 'Ваш ход' : `Ход игрока ${gameState.players[gameState.currentPlayer].name}`;
    }
}

// Создание HTML элемента карты
function createCardElement(card, isPlayable = false) {
    return `
        <div class="card ${isPlayable ? 'playable' : ''}" data-card-id="${card.id}">
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-value">${card.value}</div>
                    <div class="card-suit">${getSuitSymbol(card.suit)}</div>
                </div>
                <div class="card-back"></div>
            </div>
        </div>
    `;
}

// Получение символа масти
function getSuitSymbol(suit) {
    const suits = {
        'hearts': '♥',
        'diamonds': '♦',
        'clubs': '♣',
        'spades': '♠'
    };
    return suits[suit] || suit;
}

// Обработка хода игрока
async function makeMove(cardId) {
    if (!gameState.isMyTurn) return;
    
    try {
        const response = await fetch('/api/game/move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ cardId })
        });
        const data = await response.json();
        
        if (data.success) {
            gameState = {
                ...gameState,
                ...data.gameState
            };
            renderGame();
        }
    } catch (error) {
        console.error('Ошибка при выполнении хода:', error);
    }
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    // Обработка клика по карте
    document.querySelector('.player-hand').addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (card && card.classList.contains('playable')) {
            makeMove(card.dataset.cardId);
        }
    });
    
    // Обработка кнопки "Взять карту"
    document.querySelector('.draw-card').addEventListener('click', async () => {
        if (!gameState.isMyTurn) return;
        
        try {
            const response = await fetch('/api/game/draw', {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                gameState = {
                    ...gameState,
                    ...data.gameState
                };
                renderGame();
            }
        } catch (error) {
            console.error('Ошибка при взятии карты:', error);
        }
    });
}); 