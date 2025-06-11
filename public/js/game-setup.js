// --- game-setup.js без import/export ---

// Константы для карт
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние настроек игры
let gameSettings = {
    playerCount: 4,
    gameMode: 'standard',
    withAI: false,
    hints: false
};

// Класс для управления настройками игры
class GameSetup {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        this.playerCountElement = document.getElementById('playerCount');
        this.playerCountText = this.playerCountElement.nextElementSibling;
        this.aiHelperToggle = document.getElementById('aiHelper');
        this.hintsToggle = document.getElementById('hints');
        this.startGameBtn = document.querySelector('.start-game-btn');
        this.modeCards = document.querySelectorAll('.mode-card');
    }

    bindEvents() {
        // Обработчики изменения количества игроков
        window.incrementPlayers = () => this.changePlayerCount(1);
        window.decrementPlayers = () => this.changePlayerCount(-1);

        // Обработчики режимов игры
        this.modeCards.forEach(card => {
            card.addEventListener('click', () => this.setGameMode(card.dataset.mode));
        });

        // Обработчики настроек
        this.aiHelperToggle.addEventListener('change', (e) => {
            gameSettings.withAI = e.target.checked;
        });

        this.hintsToggle.addEventListener('change', (e) => {
            gameSettings.hints = e.target.checked;
        });

        // Обработчик начала игры
        window.startGame = () => this.startGame();
    }

    changePlayerCount(delta) {
        const newCount = gameSettings.playerCount + delta;
        if (newCount >= 4 && newCount <= 9) {
            gameSettings.playerCount = newCount;
            this.updateUI();
        }
    }

    setGameMode(mode) {
        gameSettings.gameMode = mode;
        this.modeCards.forEach(card => {
            card.classList.toggle('active', card.dataset.mode === mode);
        });
    }

    updateUI() {
        // Обновляем отображение количества игроков
        this.playerCountElement.textContent = gameSettings.playerCount;
        
        // Обновляем текст (игрок/игрока/игроков)
        const count = gameSettings.playerCount;
        if (count === 1) {
            this.playerCountText.textContent = 'игрок';
        } else if (count >= 2 && count <= 4) {
            this.playerCountText.textContent = 'игрока';
        } else {
            this.playerCountText.textContent = 'игроков';
        }
    }

    async startGame() {
        try {
            // Сохраняем настройки в localStorage для веб-версии
            localStorage.setItem('gameSettings', JSON.stringify(gameSettings));

            // Отправляем данные в Telegram WebApp
            if (tg && tg.isExpanded) {
                tg.sendData(JSON.stringify({
                    action: 'start_game',
                    settings: gameSettings
                }));
            }

            // Для веб-версии переходим на страницу игры
            window.location.href = 'game.html';
        } catch (error) {
            console.error('Ошибка при начале игры:', error);
            if (tg && tg.isExpanded) {
                tg.showAlert('Произошла ошибка при начале игры. Пожалуйста, попробуйте еще раз.');
            }
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new GameSetup();
    
    // Устанавливаем цвета Telegram WebApp если они доступны
    if (tg.isExpanded) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor);
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor);
    }
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