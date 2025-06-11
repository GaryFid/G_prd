// --- game-setup.js без import/export ---

// Константы для карт
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Настройки игры
let gameSettings = {
    playerCount: 4,
    gameMode: 'classic',
    aiOpponent: false,
    testMode: false
};

// Управление количеством игроков
function updatePlayerCount(count) {
    const playerCountElement = document.getElementById('playerCount');
    const countDisplay = document.querySelector('.count-display small');
    
    // Ограничиваем количество игроков от 4 до 9
    if (count < 4) count = 4;
    if (count > 9) count = 9;
    
    gameSettings.playerCount = count;
    playerCountElement.textContent = count;
    
    // Обновляем текст (игрок/игрока/игроков)
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastDigit === 1 && lastTwoDigits !== 11) {
        countDisplay.textContent = 'игрок';
    } else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
        countDisplay.textContent = 'игрока';
    } else {
        countDisplay.textContent = 'игроков';
    }
}

function decrementPlayers() {
    updatePlayerCount(gameSettings.playerCount - 1);
}

function incrementPlayers() {
    updatePlayerCount(gameSettings.playerCount + 1);
}

// Управление режимом игры
function selectMode(mode) {
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('onclick').includes(mode)) {
            card.classList.add('active');
        }
    });
    gameSettings.gameMode = mode;
}

// Управление настройками
document.getElementById('aiOpponent').addEventListener('change', function(e) {
    gameSettings.aiOpponent = e.target.checked;
});

document.getElementById('testMode').addEventListener('change', function(e) {
    gameSettings.testMode = e.target.checked;
});

// Начало игры
function startGame() {
    // Отправляем настройки в основное приложение
    tg.sendData(JSON.stringify(gameSettings));
}

// Показать правила
function showRules() {
    window.location.href = 'rules.html';
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updatePlayerCount(4);
});

// Получение элементов интерфейса
const ovalTables = document.querySelectorAll('.oval-table');
const withAIToggle = document.getElementById('with-ai');
const aiTestModeToggle = document.getElementById('ai-test-mode');
const startGameBtn = document.getElementById('start-game-btn');
const backBtn = document.getElementById('back-btn');
const rulesBtn = document.getElementById('rules-btn');
const rulesModal = document.getElementById('rules-modal');
const closeModal = document.querySelector('.close-modal');

// Переменная для хранения выбранного количества игроков
let selectedPlayerCount = 4;

// Выбираем по умолчанию стол для 4 игроков
ovalTables[0].classList.add('selected');

// Обработчик выбора стола
ovalTables.forEach(table => {
    table.addEventListener('click', function() {
        // Убираем класс selected у всех столов
        ovalTables.forEach(t => t.classList.remove('selected'));
        
        // Добавляем класс selected к выбранному столу
        this.classList.add('selected');
        
        // Обновляем выбранное количество игроков
        selectedPlayerCount = parseInt(this.getAttribute('data-players'));
        console.log(`Выбрано игроков: ${selectedPlayerCount}`);
    });
});

// Обработчик переключения режима тестирования с ИИ
aiTestModeToggle.addEventListener('change', function() {
    if (this.checked) {
        // Если включен режим тестирования с ИИ, автоматически включаем и обычный режим с ботами
        withAIToggle.checked = true;
    }
});

// Обработчик переключения режима с ботами
withAIToggle.addEventListener('change', function() {
    if (!this.checked && aiTestModeToggle.checked) {
        // Если отключаем ботов, то отключаем и режим тестирования с ИИ
        aiTestModeToggle.checked = false;
    }
});

// Обработчик открытия модального окна с правилами
rulesBtn.addEventListener('click', function() {
    rulesModal.style.display = 'block';
});

// Обработчик закрытия модального окна с правилами
closeModal.addEventListener('click', function() {
    rulesModal.style.display = 'none';
});

// Закрытие модального окна при клике за его пределами
window.addEventListener('click', function(event) {
    if (event.target === rulesModal) {
        rulesModal.style.display = 'none';
    }
});

// Обработчик кнопки "Назад"
backBtn.addEventListener('click', function() {
    window.location.href = '/index.html';
});

// Обработчик кнопки "Начать игру"
startGameBtn.addEventListener('click', function() {
    try {
        // Сохраняем настройки игры
        const gameSettings = {
            playerCount: selectedPlayerCount,
            withAI: withAIToggle.checked,
            aiTestMode: aiTestModeToggle.checked
        };
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
        console.log(`Сохранены настройки игры: ${JSON.stringify(gameSettings)}`);
        // Если используем Telegram WebApp, отправляем данные в бота
        if (tg && tg.isExpanded) {
            const userData = JSON.parse(user);
            tg.sendData(JSON.stringify({
                action: 'start_game',
                userId: userData.id,
                playerCount: selectedPlayerCount,
                withAI: withAIToggle.checked,
                aiTestMode: aiTestModeToggle.checked
            }));
        }
        // Переходим на страницу игры
        window.location.href = '/game.html';
    } catch (error) {
        console.error('Ошибка при начале игры:', error);
        showToast('Произошла ошибка при начале игры. Пожалуйста, попробуйте еще раз.', 'error');
    }
});

// Универсальная функция для открытия модалки (не более одной одновременно)
window.safeShowModal = function(html, opts = {}) {
  const old = document.getElementById('universal-modal');
  if (old) old.remove();
  showModal(html, opts);
}; 