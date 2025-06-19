// === Универсальная авторизация через Telegram WebApp ===
async function ensureTelegramAuth() {
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
        const user = Telegram.WebApp.initDataUnsafe.user;
        const res = await fetch('/api/telegram-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                photo_url: user.photo_url
            })
        });
        const data = await res.json();
        if (!res.ok) {
            alert('Ошибка авторизации: ' + (data.message || ''));
            throw new Error('Telegram auth failed');
        }
        // Проверяем, что сессия реально установлена
        const profileRes = await fetch('/api/me', { credentials: 'include' });
        if (!profileRes.ok) {
            alert('Ошибка: сессия не установлена. Попробуйте перезагрузить страницу.');
            throw new Error('Session not established');
        }
    }
} 