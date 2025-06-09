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
                window.location.href = 'index.html';
            }
        });
    }

    // Обработка категорий
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            categoryCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Обработка покупок
    const buyButtons = document.querySelectorAll('.buy-button');
    buyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.product-card');
            const title = card.querySelector('.product-title').textContent;
            const price = card.querySelector('.price-amount').textContent;
            
            // Здесь можно добавить интеграцию с платежной системой
            tg.showPopup({
                title: 'Подтверждение покупки',
                message: `Вы хотите купить ${title} за ${price}?`,
                buttons: [
                    {id: 'cancel', type: 'cancel', text: 'Отмена'},
                    {id: 'buy', type: 'ok', text: 'Купить'}
                ]
            }, function(buttonId) {
                if (buttonId === 'buy') {
                    // Здесь будет логика покупки
                    tg.showAlert('Покупка успешно совершена!');
                }
            });
        });
    });

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
}); 