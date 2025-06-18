// --- shop.js без import/export ---

// Загрузка данных магазина
async function loadShopData() {
    try {
        const response = await fetch('/api/shop/data', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            // Обновляем баланс
            updateBalance(data.balance);
            // Обновляем категории
            updateCategories(data.categories);
            // Обновляем товары
            updateItems(data.items);
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных магазина:', error);
    }
}

// Обновление баланса
function updateBalance(balance = 1000) {
    document.querySelector('.stat-value').textContent = balance;
}

// Обновление категорий
function updateCategories(categories = []) {
    const defaultCategories = [
        { id: 'themes', name: 'Темы', icon: 'fa-palette' },
        { id: 'effects', name: 'Эффекты', icon: 'fa-hat-wizard' },
        { id: 'bonuses', name: 'Бонусы', icon: 'fa-gift' }
    ];
    
    const finalCategories = categories.length ? categories : defaultCategories;
    
    const container = document.querySelector('.shop-categories');
    container.innerHTML = finalCategories.map((category, index) => `
        <div class="category-card ${index === 0 ? 'active' : ''}" data-category="${category.id}">
            <i class="fas ${category.icon}"></i>
            <span>${category.name}</span>
        </div>
    `).join('');
    
    // Добавляем обработчики
    container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            // Убираем активный класс у всех категорий
            container.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
            // Добавляем активный класс выбранной категории
            card.classList.add('active');
            // Фильтруем товары
            filterItems(card.dataset.category);
        });
    });
}

// Обновление товаров
function updateItems(items = []) {
    const defaultItems = [
        {
            id: 'dark_theme',
            name: 'Темная тема',
            description: 'Стильный темный интерфейс',
            price: 500,
            icon: 'fa-paint-brush',
            category: 'themes'
        },
        {
            id: 'card_animation',
            name: 'Анимация карт',
            description: 'Красивые эффекты при игре',
            price: 750,
            icon: 'fa-magic',
            category: 'effects'
        },
        {
            id: 'vip_status',
            name: 'VIP статус',
            description: 'Особые привилегии',
            price: 1000,
            icon: 'fa-star',
            category: 'bonuses'
        }
    ];
    
    const finalItems = items.length ? items : defaultItems;
    
    const container = document.querySelector('.shop-items');
    container.innerHTML = finalItems.map(item => `
        <div class="shop-item" data-category="${item.category}">
            <div class="item-preview">
                <i class="fas ${item.icon}"></i>
            </div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="item-price">
                    <i class="fas fa-coins"></i>
                    <span>${item.price}</span>
                </div>
            </div>
            <button class="btn" onclick="buyItem('${item.id}')">Купить</button>
        </div>
    `).join('');
}

// Фильтрация товаров
function filterItems(category) {
    const items = document.querySelectorAll('.shop-item');
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Покупка товара
async function buyItem(itemId) {
    try {
        const response = await fetch('/api/shop/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemId }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Обновляем баланс
            updateBalance(data.newBalance);
            // Показываем уведомление об успешной покупке
            tg.showPopup({
                title: 'Успешно!',
                message: 'Покупка совершена успешно',
                buttons: [{ type: 'ok' }]
            });
        } else {
            // Показываем ошибку
            tg.showPopup({
                title: 'Ошибка',
                message: data.error || 'Не удалось совершить покупку',
                buttons: [{ type: 'ok' }]
            });
        }
    } catch (error) {
        console.error('Ошибка при покупке:', error);
        tg.showPopup({
            title: 'Ошибка',
            message: 'Произошла ошибка при покупке',
            buttons: [{ type: 'ok' }]
        });
    }
}

// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
    loadShopData();
}); 