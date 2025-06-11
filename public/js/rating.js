// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Константы для рангов
const RANKS = {
    0: { name: 'Новичок', color: '#808080' },
    1000: { name: 'Бронзовый игрок', color: '#CD7F32' },
    2000: { name: 'Серебряный игрок', color: '#C0C0C0' },
    3000: { name: 'Золотой игрок', color: '#FFD700' },
    5000: { name: 'Платиновый игрок', color: '#E5E4E2' },
    7500: { name: 'Бриллиантовый игрок', color: '#B9F2FF' },
    10000: { name: 'Легенда', color: '#FF4500' }
};

class RatingManager {
    constructor() {
        this.currentRating = 0;
        this.history = [];
        this.elements = {
            ratingValue: document.querySelector('.rating-value'),
            ratingBar: document.querySelector('.rating-bar'),
            rankBadge: document.querySelector('.rank-badge'),
            historyList: document.querySelector('.history-list')
        };

        this.init();
    }

    async init() {
        try {
            // В реальном приложении здесь будет запрос к серверу
            await this.loadRatingData();
            this.updateUI();
        } catch (error) {
            console.error('Ошибка при загрузке рейтинга:', error);
        }
    }

    async loadRatingData() {
        // Здесь будет реальный запрос к API
        // Пока используем тестовые данные
        this.currentRating = 2350;
        this.history = [
            { date: '2024-03-24T15:30:00', points: 25, type: 'win' },
            { date: '2024-03-24T14:15:00', points: -15, type: 'lose' },
            { date: '2024-03-24T12:45:00', points: 30, type: 'win' }
        ];
    }

    getRank(rating) {
        let currentRank = { name: 'Новичок', color: '#808080' };
        for (const [threshold, rank] of Object.entries(RANKS)) {
            if (rating >= threshold) {
                currentRank = rank;
            } else {
                break;
            }
        }
        return currentRank;
    }

    updateUI() {
        // Обновляем значение рейтинга
        this.elements.ratingValue.textContent = this.currentRating;

        // Обновляем прогресс-бар
        const progress = (this.currentRating / 10000) * 100;
        this.elements.ratingBar.style.width = `${progress}%`;

        // Обновляем значок ранга
        const rank = this.getRank(this.currentRating);
        this.elements.rankBadge.innerHTML = `
            <i class="fas fa-trophy"></i>
            ${rank.name}
        `;
        this.elements.rankBadge.style.borderColor = rank.color;
        this.elements.rankBadge.style.color = rank.color;

        // Обновляем историю
        this.updateHistory();
    }

    updateHistory() {
        this.elements.historyList.innerHTML = this.history.map(game => `
            <div class="history-item">
                <div class="history-info">
                    <div>Рейтинговая игра</div>
                    <div class="history-date">${this.formatDate(game.date)}</div>
                </div>
                <div class="history-result">
                    <div class="history-points ${game.type}">${game.points > 0 ? '+' : ''}${game.points}</div>
                    <i class="fas fa-arrow-${game.type === 'win' ? 'up' : 'down'}" 
                       style="color: ${game.type === 'win' ? '#4CAF50' : '#F44336'}"></i>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Создаем экземпляр менеджера рейтинга при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new RatingManager();
}); 