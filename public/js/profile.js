// --- profile.js без import/export ---

// Загрузка данных профиля
async function loadProfile() {
    const response = await autoReauthOn401(() => fetch('/api/user/profile', { headers: getAuthHeaders() }));
    const data = await response.json();
    
    if (data.success && data.user) {
        // Обновляем основную информацию
        document.querySelector('.profile-avatar').src = data.user.photo_url || 'img/default-avatar.png';
        document.querySelector('.profile-name').textContent = data.user.username || 'Игрок';
        document.querySelector('.profile-id').textContent = `ID: ${data.user.id}`;
        document.querySelector('.profile-balance').textContent = `${data.user.coins || 0} монет`;
        
        // Обновляем статистику
        const stats = data.user.stats || {};
        document.querySelector('.stats-item:nth-child(1) .stats-value').textContent = stats.gamesPlayed || '0';
        document.querySelector('.stats-item:nth-child(2) .stats-value').textContent = stats.gamesWon || '0';
        document.querySelector('.stats-item:nth-child(3) .stats-value').textContent = stats.rating || '0';
        
        // Обновляем достижения
        const achievements = data.user.achievements || [];
        const achievementsContainer = document.querySelector('.achievements-list');
        achievementsContainer.innerHTML = achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            </div>
        `).join('');
        
        // Обновляем историю игр
        loadGameHistory();
    }
}

// Загрузка истории игр
async function loadGameHistory() {
    try {
        const response = await fetch('/api/user/game-history', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.games) {
            const historyContainer = document.querySelector('.game-history');
            historyContainer.innerHTML = data.games.map(game => `
                <div class="history-item ${game.result}">
                    <div class="history-date">${formatDate(game.date)}</div>
                    <div class="history-details">
                        <div class="history-result">${game.result === 'win' ? 'Победа' : 'Поражение'}</div>
                        <div class="history-points">${game.points > 0 ? '+' : ''}${game.points}</div>
                    </div>
                    <div class="history-players">
                        ${game.players.map(player => `
                            <div class="history-player">
                                <img src="${player.photo_url || 'img/default-avatar.png'}" alt="${player.username}">
                                <span>${player.username}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка при загрузке истории игр:', error);
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureTelegramAuth();
    } catch (e) {
        alert('Ошибка авторизации: ' + e.message);
        return;
    }
    loadProfile();
    
    // Обработчики для вкладок
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetSection = this.dataset.section;
            
            // Обновляем активную вкладку
            document.querySelector('.profile-tab.active').classList.remove('active');
            this.classList.add('active');
            
            // Показываем соответствующий раздел
            document.querySelector('.profile-section.active').classList.remove('active');
            document.querySelector(`.profile-section[data-section="${targetSection}"]`).classList.add('active');
        });
    });
}); 