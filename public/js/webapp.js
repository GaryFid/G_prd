// Основные настройки
tg.expand(); // Раскрываем на весь экран
tg.enableClosingConfirmation(); // Подтверждение закрытия

// Установка темы
document.documentElement.className = tg.colorScheme;

// Обработка данных пользователя
const user = tg.initDataUnsafe.user;
if (user) {
    // Отправляем данные на сервер для авторизации
    fetch('/api/telegram-auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            photo_url: user.photo_url
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Успешная авторизация');
            // Сохраняем данные пользователя
            localStorage.setItem('user', JSON.stringify(data.user));
        }
    })
    .catch(error => console.error('Ошибка авторизации:', error));
}

// Обработка кнопки "Назад"
const backButton = document.getElementById('backButton');
if (backButton) {
    backButton.addEventListener('click', () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            tg.close();
        }
    });
}

// Обработка кнопки "Пригласить друзей"
const inviteButton = document.getElementById('inviteFriends');
if (inviteButton) {
    inviteButton.addEventListener('click', (e) => {
        e.preventDefault();
        tg.shareGame();
    });
}

// Функция для показа уведомлений
function showNotification(message, isError = false) {
    tg.showPopup({
        title: isError ? 'Ошибка' : 'Уведомление',
        message: message,
        buttons: [{
            type: 'ok'
        }]
    });
}

// Экспорт функций для использования в других файлах
window.webapp = {
    tg,
    showNotification,
    user: user || null
}; 