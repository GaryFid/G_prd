// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Настройка основного цвета из Telegram
if (tg && tg.themeParams) {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#3390ec');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
}

// Загрузка данных пользователя
async function loadUserData() {
    try {
        const response = await fetch('/api/user/profile', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.user) {
            // Обновляем статистику
            updateStatistics(data.user.stats);
            // Обновляем достижения
            updateAchievements(data.user.achievements);
            // Обновляем историю игр
            updateGameHistory(data.user.gameHistory);
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
    }
}

// Обновление статистики
function updateStatistics(stats = {}) {
    const defaultStats = {
        gamesPlayed: 42,
        winRate: 65,
        rating: 1234
    };
    
    const finalStats = { ...defaultStats, ...stats };
    
    document.querySelectorAll('.stat-card').forEach(card => {
        const label = card.querySelector('.stat-label').textContent.toLowerCase();
        if (label.includes('сыграно')) {
            card.querySelector('.stat-value').textContent = finalStats.gamesPlayed;
        } else if (label.includes('побед')) {
            card.querySelector('.stat-value').textContent = finalStats.winRate + '%';
        } else if (label.includes('рейтинг')) {
            card.querySelector('.stat-value').textContent = finalStats.rating;
        }
    });
}

// Обновление достижений
function updateAchievements(achievements = []) {
    const defaultAchievements = [
        { id: 'first_win', title: 'Первая победа', progress: 100, icon: '🏆' },
        { id: 'games_10', title: '10 игр', progress: 80, icon: '🎮' },
        { id: 'pro', title: 'Профессионал', progress: 60, icon: '⭐' }
    ];
    
    const finalAchievements = achievements.length ? achievements : defaultAchievements;
    
    const container = document.querySelector('.achievements-grid');
    container.innerHTML = finalAchievements.map(achievement => `
        <div class="achievement-card">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-progress">
                <div class="achievement-progress-bar" style="width: ${achievement.progress}%"></div>
            </div>
        </div>
    `).join('');
}

// Обновление истории игр
function updateGameHistory(history = []) {
    const defaultHistory = [
        { id: 42, result: 'win', title: 'Игра #42' },
        { id: 41, result: 'lose', title: 'Игра #41' },
        { id: 40, result: 'win', title: 'Игра #40' }
    ];
    
    const finalHistory = history.length ? history : defaultHistory;
    
    const container = document.querySelector('.game-history');
    container.innerHTML = finalHistory.map(game => `
        <div class="game-item">
            <span>${game.title}</span>
            <span class="game-result ${game.result}">${game.result === 'win' ? 'Победа' : 'Поражение'}</span>
        </div>
    `).join('');
}

// Загрузка последних игр
async function loadRecentGames() {
    try {
        const response = await fetch('/api/user/recent-games', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.games) {
            const gamesList = document.querySelector('.games-list');
            gamesList.innerHTML = data.games.map(game => `
                <li class="game-item">
                    <div class="game-result ${game.result === 'win' ? 'win' : 'lose'}">${game.result === 'win' ? 'W' : 'L'}</div>
                    <div class="game-info">
                        <div class="game-date">${formatDate(game.date)}</div>
                        <div class="game-score">${game.result === 'win' ? 'Победа' : 'Поражение'} • ${game.points > 0 ? '+' : ''}${game.points} очков</div>
                    </div>
                </li>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка при загрузке последних игр:', error);
    }
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
        return `Сегодня, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
        return `Вчера, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
        return date.toLocaleDateString('ru-RU', { 
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Обработчики нажатий на кнопки навигации
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        if (item.getAttribute('href') === '#') {
            e.preventDefault();
            // Здесь можно добавить обработку для модальных окон
        }
    });
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureTelegramAuth();
    } catch (e) {
        alert('Ошибка авторизации: ' + e.message);
        return;
    }
    loadUserData();
    loadRecentGames();
});

// Обработчики кнопок
document.getElementById('start-game')?.addEventListener('click', function() {
    var user = localStorage.getItem('user');
    if (!user) {
        alert('Необходимо войти через Telegram для начала игры!');
        return;
    }
    localStorage.setItem('gameSettings', JSON.stringify({ playerCount: 4, withAI: false }));
    window.location.href = '/game-setup';
});

document.getElementById('play-ai')?.addEventListener('click', function() {
    var user = localStorage.getItem('user');
    if (!user) {
        alert('Необходимо войти через Telegram для начала игры!');
        return;
    }
    localStorage.setItem('gameSettings', JSON.stringify({ playerCount: 4, withAI: true }));
    window.location.href = '/game-setup';
});

document.getElementById('shop')?.addEventListener('click', function() {
    window.location.href = '/shop.html';
});

document.getElementById('profile-page-btn')?.addEventListener('click', function() {
    window.location.href = '/profile.html';
});

document.getElementById('rules').addEventListener('click', function() {
    window.showModal('Правила', '<p>Правила игры будут здесь.</p>');
});

document.getElementById('rating').addEventListener('click', function() {
    window.showToast('Рейтинг игроков будет доступен в ближайшее время!', 'info');
});

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram WebApp
    const tg = window.Telegram.WebApp;
    tg.expand();

    // Кнопка "Назад"
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function() {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                tg.close();
            }
        });
    }

    // Обработка приглашения друзей
    const inviteFriendsButton = document.getElementById('inviteFriends');
    if (inviteFriendsButton) {
        inviteFriendsButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Здесь можно добавить логику для приглашения друзей через Telegram
            tg.showPopup({
                title: 'Пригласить друзей',
                message: 'Хотите пригласить друзей в игру?',
                buttons: [
                    {id: 'cancel', type: 'cancel', text: 'Отмена'},
                    {id: 'invite', type: 'ok', text: 'Пригласить'}
                ]
            }, function(buttonId) {
                if (buttonId === 'invite') {
                    // Здесь будет логика приглашения
                    tg.shareGame();
                }
            });
        });
    }

    // Нижняя навигация
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }
            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Обработка категорий
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }
            categoryCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// --- Модальное окно друзей ---
window.showFriendsModal = async function() {
  // Проверяем, нет ли уже открытого модального окна
  if (document.getElementById('friends-modal-bg')) return;

  // Создаем фон модального окна
  const modalBg = document.createElement('div');
  modalBg.id = 'friends-modal-bg';
  modalBg.style.position = 'fixed';
  modalBg.style.left = '0';
  modalBg.style.top = '0';
  modalBg.style.width = '100vw';
  modalBg.style.height = '100vh';
  modalBg.style.background = 'rgba(30,60,114,0.18)';
  modalBg.style.zIndex = 3000;
  modalBg.style.display = 'flex';
  modalBg.style.alignItems = 'center';
  modalBg.style.justifyContent = 'center';

  // Бокс модального окна
  const box = document.createElement('div');
  box.style.background = '#fff';
  box.style.borderRadius = '18px';
  box.style.padding = '32px 24px';
  box.style.maxWidth = '400px';
  box.style.width = '95vw';
  box.style.boxShadow = '0 8px 32px #1e3c72aa';
  box.style.position = 'relative';
  box.style.textAlign = 'center';

  // Кнопка закрытия
  const close = document.createElement('button');
  close.textContent = '×';
  close.style.position = 'absolute';
  close.style.right = '18px';
  close.style.top = '12px';
  close.style.fontSize = '2em';
  close.style.background = 'none';
  close.style.border = 'none';
  close.style.cursor = 'pointer';
  close.style.color = '#2196f3';
  close.onclick = () => modalBg.remove();
  box.appendChild(close);

  // Заголовок
  const title = document.createElement('h2');
  title.textContent = 'Ваши друзья';
  title.style.marginBottom = '18px';
  box.appendChild(title);

  // Список друзей (заглушка)
  const list = document.createElement('div');
  list.style.textAlign = 'left';
  list.style.maxHeight = '300px';
  list.style.overflowY = 'auto';
  list.innerHTML = '<div style="color:#888;">Здесь будет список ваших друзей.</div>';
  box.appendChild(list);

  // TODO: Заменить заглушку на реальный fetch друзей
  // try {
  //   const res = await fetch('/api/friends', { credentials: 'include' });
  //   const json = await res.json();
  //   if (json.success && Array.isArray(json.friends)) {
  //     list.innerHTML = '';
  //     json.friends.forEach(f => {
  //       const item = document.createElement('div');
  //       item.textContent = f.username || f.display_name || f.telegram_username || 'Без имени';
  //       list.appendChild(item);
  //     });
  //   } else {
  //     list.innerHTML = '<div style="color:#e53935">Ошибка загрузки друзей</div>';
  //   }
  // } catch (e) {
  //   list.innerHTML = '<div style="color:#e53935">Ошибка загрузки друзей</div>';
  // }

  modalBg.appendChild(box);
  document.body.appendChild(modalBg);
}

// Обработчики нижнего меню
document.getElementById('menu-home')?.addEventListener('click', function(e) {
    e.preventDefault();
    setActiveMenuItem(this);
    // Уже на главной странице
});

document.getElementById('menu-friends')?.addEventListener('click', function(e) {
    e.preventDefault();
    setActiveMenuItem(this);
    // TODO: Реализовать страницу друзей
    alert('Страница друзей в разработке');
});

document.getElementById('menu-profile')?.addEventListener('click', function(e) {
    e.preventDefault();
    setActiveMenuItem(this);
    window.location.href = '/profile.html';
});

document.getElementById('menu-rules')?.addEventListener('click', function(e) {
    e.preventDefault();
    setActiveMenuItem(this);
    // TODO: Реализовать страницу правил
    alert('Страница правил в разработке');
});

// Вспомогательная функция для установки активного пункта меню
function setActiveMenuItem(element) {
    document.querySelectorAll('.bottom-menu-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
}

// Модальные окна
function showWalletModal() {
    // Реализация модального окна кошелька
}

function showRatingModal() {
    // Реализация модального окна рейтинга
}

function showRulesModal() {
    // Реализация модального окна правил
}

// Утилиты
function safeShowModal(content, options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                ${options.title ? `<h2>${options.title}</h2>` : ''}
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.modal-close').onclick = () => {
        modal.remove();
        if (options.onClose) options.onClose();
    };
}

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Получаем данные пользователя из localStorage
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    // Обновляем UI с данными пользователя
    if (user) {
        // Обновляем баланс
        const balanceAmount = document.querySelector('.balance-amount');
        if (balanceAmount) {
            balanceAmount.textContent = user.balance || '0';
        }

        // Обновляем статистику
        const stats = document.querySelectorAll('.product-card');
        if (stats.length > 0) {
            // Игры сыграно
            if (stats[0]) {
                const title = stats[0].querySelector('.product-title');
                if (title) title.textContent = user.gamesPlayed || '0';
            }
            // Процент побед
            if (stats[1]) {
                const title = stats[1].querySelector('.product-title');
                if (title) {
                    const winRate = user.gamesPlayed > 0 
                        ? Math.round((user.gamesWon / user.gamesPlayed) * 100) 
                        : 0;
                    title.textContent = winRate + '%';
                }
            }
            // Рейтинг
            if (stats[2]) {
                const title = stats[2].querySelector('.product-title');
                if (title) title.textContent = user.rating || '0';
            }
        }
    }

    // Обработка всех ссылок
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            // Пропускаем специальные ссылки (например, кнопку приглашения)
            if (link.id === 'inviteFriends') return;

            e.preventDefault();
            const href = link.getAttribute('href');
            
            // Проверяем, что ссылка ведет на HTML страницу
            if (href && href.endsWith('.html')) {
                window.location.href = href;
            }
        });
    });

    // Анимации при загрузке
    document.querySelectorAll('.category-card, .product-card').forEach(card => {
        card.classList.add('fade-in');
    });

    // Обработка ошибок
    window.onerror = function(msg, url, lineNo, columnNo, error) {
        console.error('Ошибка:', msg, 'Файл:', url, 'Строка:', lineNo);
        if (window.webapp) {
            window.webapp.showNotification('Произошла ошибка: ' + msg, true);
        }
        return false;
    };
}); 