// --- game-setup.js без import/export ---

// Константы для карт
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

// Класс для управления настройками игры
class GameSetup {
    constructor() {
        // Инициализация Telegram WebApp
        this.tg = window.Telegram.WebApp;
        this.tg.expand();
        this.tg.enableClosingConfirmation();

        // Константы для настроек игры
        this.PLAYER_LIMITS = {
            MIN: 4,
            MAX: 9
        };

        // Настройки игры по умолчанию
        this.settings = {
            playerCount: this.PLAYER_LIMITS.MIN, // Начинаем с минимального количества
            gameMode: 'classic',
            withAI: false,
            aiTestMode: false
        };

        // Получение DOM элементов
        this.elements = {
            playerCount: document.getElementById('playerCount'),
            countDisplay: document.querySelector('.count-display small'),
            playerRange: document.querySelector('.player-range small'),
            modeCards: document.querySelectorAll('.mode-card'),
            aiOpponent: document.getElementById('aiOpponent'),
            testMode: document.getElementById('testMode'),
            startGameBtn: document.querySelector('.start-game-btn'),
            rulesBtn: document.querySelector('[data-action="showRules"]')
        };

        // Привязка методов к контексту
        this.updatePlayerCount = this.updatePlayerCount.bind(this);
        this.decrementPlayers = this.decrementPlayers.bind(this);
        this.incrementPlayers = this.incrementPlayers.bind(this);
        this.selectMode = this.selectMode.bind(this);
        this.startGame = this.startGame.bind(this);
        this.showRules = this.showRules.bind(this);

        // Инициализация
        this.init();
    }

    init() {
        // Установка начальных значений
        this.updatePlayerCount(this.settings.playerCount);
        
        // Обновляем текст с диапазоном игроков
        if (this.elements.playerRange) {
            this.elements.playerRange.textContent = `Допустимое количество: от ${this.PLAYER_LIMITS.MIN} до ${this.PLAYER_LIMITS.MAX} игроков`;
        }
        
        // Привязка обработчиков событий
        this.bindEvents();

        // Активация начального режима
        this.selectMode('classic');

        console.log('GameSetup initialized with player limits:', this.PLAYER_LIMITS);
    }

    bindEvents() {
        // Обработчики для режимов игры
        this.elements.modeCards.forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.getAttribute('data-mode');
                this.selectMode(mode);
            });
        });

        // Обработчики для переключателей
        if (this.elements.aiOpponent) {
            this.elements.aiOpponent.addEventListener('change', (e) => {
                this.settings.withAI = e.target.checked;
                if (!e.target.checked && this.elements.testMode) {
                    this.elements.testMode.checked = false;
                    this.settings.aiTestMode = false;
                }
            });
        }

        if (this.elements.testMode) {
            this.elements.testMode.addEventListener('change', (e) => {
                this.settings.aiTestMode = e.target.checked;
                if (e.target.checked && this.elements.aiOpponent) {
                    this.elements.aiOpponent.checked = true;
                    this.settings.withAI = true;
                }
            });
        }

        // Глобальные функции для HTML
        window.decrementPlayers = this.decrementPlayers;
        window.incrementPlayers = this.incrementPlayers;
        window.startGame = this.startGame;
        window.showRules = this.showRules;
    }

    updatePlayerCount(count) {
        // Ограничение количества игроков
        this.settings.playerCount = Math.max(
            this.PLAYER_LIMITS.MIN,
            Math.min(this.PLAYER_LIMITS.MAX, count)
        );
        
        if (this.elements.playerCount) {
            this.elements.playerCount.textContent = this.settings.playerCount;
        }
        
        if (this.elements.countDisplay) {
            const lastDigit = this.settings.playerCount % 10;
            const lastTwoDigits = this.settings.playerCount % 100;
            
            if (lastDigit === 1 && lastTwoDigits !== 11) {
                this.elements.countDisplay.textContent = 'игрок';
            } else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
                this.elements.countDisplay.textContent = 'игрока';
            } else {
                this.elements.countDisplay.textContent = 'игроков';
            }
        }

        // Проверка валидности количества игроков перед отправкой
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.disabled = 
                this.settings.playerCount < this.PLAYER_LIMITS.MIN || 
                this.settings.playerCount > this.PLAYER_LIMITS.MAX;
        }
    }

    decrementPlayers() {
        this.updatePlayerCount(this.settings.playerCount - 1);
    }

    incrementPlayers() {
        this.updatePlayerCount(this.settings.playerCount + 1);
    }

    selectMode(mode) {
        this.settings.gameMode = mode;
        this.elements.modeCards.forEach(card => {
            card.classList.remove('active');
            if (card.getAttribute('data-mode') === mode) {
                card.classList.add('active');
            }
        });
    }

    showRules() {
        window.location.href = 'rules.html';
    }

    startGame() {
        try {
            // Проверка валидности количества игроков
            if (this.settings.playerCount < this.PLAYER_LIMITS.MIN || 
                this.settings.playerCount > this.PLAYER_LIMITS.MAX) {
                throw new Error(`Количество игроков должно быть от ${this.PLAYER_LIMITS.MIN} до ${this.PLAYER_LIMITS.MAX}`);
            }

            // Сохраняем настройки локально
            localStorage.setItem('gameSettings', JSON.stringify(this.settings));
            
            // Формируем данные для отправки
            const gameData = {
                action: 'start_game',
                settings: this.settings
            };
            
            console.log('Отправка настроек игры:', gameData);
            
            // Отправляем данные в бота
            this.tg.sendData(JSON.stringify(gameData));
            
            // Закрываем WebApp
            this.tg.close();
        } catch (error) {
            console.error('Ошибка при начале игры:', error);
            this.tg.showPopup({
                title: 'Ошибка',
                message: error.message || 'Не удалось начать игру. Пожалуйста, попробуйте еще раз.',
                buttons: [{type: 'ok'}]
            });
        }
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.gameSetup = new GameSetup();
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