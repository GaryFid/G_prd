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
            playerCount: this.PLAYER_LIMITS.MIN,
            gameMode: 'classic',
            withAI: false,
            aiTestMode: false
        };

        // Получение DOM элементов
        this.elements = {
            tableOptions: document.querySelectorAll('.table-option'),
            modeCards: document.querySelectorAll('.mode-card'),
            aiOpponent: document.getElementById('aiOpponent'),
            testMode: document.getElementById('testMode'),
            startGameBtn: document.querySelector('.start-game-btn'),
            rulesBtn: document.querySelector('[data-action="showRules"]')
        };

        // Привязка методов к контексту
        this.selectTable = this.selectTable.bind(this);
        this.selectMode = this.selectMode.bind(this);
        this.startGame = this.startGame.bind(this);
        this.showRules = this.showRules.bind(this);

        // Инициализация
        this.init();
    }

    init() {
        // Привязка обработчиков событий
        this.bindEvents();

        // Активация начального режима и стола
        this.selectMode('classic');
        this.selectTable(this.settings.playerCount);

        console.log('GameSetup initialized with player limits:', this.PLAYER_LIMITS);
    }

    bindEvents() {
        // Обработчики для выбора стола
        this.elements.tableOptions.forEach(table => {
            table.addEventListener('click', () => {
                const players = parseInt(table.getAttribute('data-players'));
                this.selectTable(players);
            });
        });

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

        // Обработчик для кнопки "Начать игру"
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.addEventListener('click', this.startGame);
        }

        // Обработчик для кнопки "Правила"
        if (this.elements.rulesBtn) {
            this.elements.rulesBtn.addEventListener('click', this.showRules);
        }
    }

    selectTable(players) {
        if (players < this.PLAYER_LIMITS.MIN || players > this.PLAYER_LIMITS.MAX) {
            return;
        }

        this.settings.playerCount = players;
        
        // Обновляем визуальное состояние столов
        this.elements.tableOptions.forEach(table => {
            const tablePlayers = parseInt(table.getAttribute('data-players'));
            if (tablePlayers === players) {
                table.classList.add('active');
                // Добавляем анимацию выбора
                table.querySelector('.table-oval').style.transform = 'scale(0.85) scaleX(1.5)';
            } else {
                table.classList.remove('active');
                table.querySelector('.table-oval').style.transform = 'scale(0.8) scaleX(1.5)';
            }
        });

        console.log('Selected table for', players, 'players');
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

    startGame() {
        try {
            // Сохраняем настройки в localStorage
            localStorage.setItem('gameSettings', JSON.stringify(this.settings));
            console.log('Game settings saved:', this.settings);

            // Отправляем данные в Telegram WebApp
            if (this.tg && this.tg.isExpanded) {
                this.tg.sendData(JSON.stringify({
                    action: 'start_game',
                    settings: this.settings
                }));
            }

            // Переходим на страницу ожидания игроков
            window.location.href = 'wait-players.html';
        } catch (error) {
            console.error('Error starting game:', error);
            alert('Произошла ошибка при запуске игры. Пожалуйста, попробуйте еще раз.');
        }
    }

    showRules() {
        window.location.href = 'rules.html';
    }
}

// Создаем экземпляр класса при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new GameSetup();
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

// === Глобальные функции для кнопок ===
async function createTable() {
    try {
        // Получаем имя игрока (из Telegram WebApp или localStorage)
        let playerName = 'Игрок';
        let playerId = null;
        if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            playerName = Telegram.WebApp.initDataUnsafe.first_name || Telegram.WebApp.initDataUnsafe.username || 'Игрок';
            playerId = Telegram.WebApp.initDataUnsafe.user?.id || null;
        } else if (localStorage.getItem('user')) {
            const user = JSON.parse(localStorage.getItem('user'));
            playerName = user.first_name || user.username || 'Игрок';
            playerId = user.id || null;
        }
        // Получаем выбранное количество игроков
        let playerCount = 4;
        const activeTable = document.querySelector('.table-option.active');
        if (activeTable) {
            playerCount = parseInt(activeTable.getAttribute('data-players'));
        }
        // Генерируем уникальный roomId
        const roomId = Math.random().toString(36).substr(2, 9);
        // Запрос на создание комнаты
        const res = await fetch('/api/settings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId,
                maxPlayers: playerCount,
                minPlayers: playerCount,
                hostId: playerId || roomId,
                hostName: playerName
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка создания стола');
        // Сохраняем roomId и роль хоста
        localStorage.setItem('roomId', roomId);
        localStorage.setItem('isHost', 'true');
        // Переходим на страницу ожидания игроков
        window.location.href = `wait-players.html?roomId=${roomId}&isHost=true`;
    } catch (error) {
        alert('Ошибка при создании стола: ' + error.message);
    }
}

function openTablesList() {
    window.location.href = 'tables-list.html';
} 