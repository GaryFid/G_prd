// --- game-setup.js без import/export ---

// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние настроек
let gameSettings = {
    playerCount: 2,
    gameMode: 'classic',
    timeLimit: false,
    randomEvents: false,
    aiOpponent: false
};

// Управление количеством игроков
function decrementPlayers() {
    if (gameSettings.playerCount > 2) {
        gameSettings.playerCount--;
        updatePlayerCount();
    }
}

function incrementPlayers() {
    if (gameSettings.playerCount < 6) {
        gameSettings.playerCount++;
        updatePlayerCount();
    }
}

function updatePlayerCount() {
    const countElement = document.getElementById('playerCount');
    countElement.textContent = gameSettings.playerCount;
    
    // Обновляем текст "игрока/игроков"
    const smallElement = countElement.nextElementSibling;
    if (gameSettings.playerCount === 1) {
        smallElement.textContent = 'игрок';
    } else if (gameSettings.playerCount < 5) {
        smallElement.textContent = 'игрока';
    } else {
        smallElement.textContent = 'игроков';
    }
}

// Управление режимами игры
document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
        // Убираем активный класс у всех карточек
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
        // Добавляем активный класс выбранной карточке
        card.classList.add('active');
        // Сохраняем выбранный режим
        gameSettings.gameMode = card.dataset.mode;
    });
});

// Управление дополнительными настройками
document.getElementById('timeLimit').addEventListener('change', (e) => {
    gameSettings.timeLimit = e.target.checked;
});

document.getElementById('randomEvents').addEventListener('change', (e) => {
    gameSettings.randomEvents = e.target.checked;
});

document.getElementById('aiOpponent').addEventListener('change', (e) => {
    gameSettings.aiOpponent = e.target.checked;
});

// Начало игры
async function startGame() {
    try {
        const response = await fetch('/api/game/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameSettings),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Переходим на страницу игры
            window.location.href = `game.html?id=${data.gameId}`;
        } else {
            // Показываем ошибку
            tg.showPopup({
                title: 'Ошибка',
                message: data.error || 'Не удалось создать игру',
                buttons: [{ type: 'ok' }]
            });
        }
    } catch (error) {
        console.error('Ошибка при создании игры:', error);
        tg.showPopup({
            title: 'Ошибка',
            message: 'Произошла ошибка при создании игры',
            buttons: [{ type: 'ok' }]
        });
    }
}

// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
    updatePlayerCount();
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