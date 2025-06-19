// === Универсальная авторизация через Telegram WebApp ===
async function ensureTelegramAuth() {
    if (!window.Telegram || !window.Telegram.WebApp) {
        throw new Error('Открывайте игру только через Telegram WebApp!');
    }
    if (!window.Telegram.WebApp.initDataUnsafe || !window.Telegram.WebApp.initDataUnsafe.user) {
        throw new Error('Telegram не передал данные пользователя. Попробуйте открыть игру заново через Telegram.');
    }
    const user = window.Telegram.WebApp.initDataUnsafe.user;
    const res = await fetch('/api/telegram-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            photo_url: user.photo_url
        })
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
        alert('Ошибка авторизации: ' + (data.message || ''));
        throw new Error('Telegram auth failed');
    }
    localStorage.setItem('jwtToken', data.token);
}

// Получить заголовки авторизации для fetch
function getAuthHeaders(extra = {}) {
    const token = localStorage.getItem('jwtToken');
    return {
        ...extra,
        Authorization: token ? `Bearer ${token}` : ''
    };
}

// Автоматическая повторная авторизация при 401
async function autoReauthOn401(fetchFn) {
    let response = await fetchFn();
    if (response.status === 401) {
        await ensureTelegramAuth();
        response = await fetchFn();
    }
    return response;
} 