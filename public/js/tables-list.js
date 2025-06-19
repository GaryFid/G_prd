// === Авторизация через Telegram WebApp ===
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
        // Жёстко проверяем, что сессия реально установлена
        const profileRes = await fetch('/api/me', { credentials: 'include' });
        if (!profileRes.ok) {
            alert('Ошибка: сессия не установлена. Попробуйте перезагрузить страницу.');
            throw new Error('Session not established');
        }
    }
}

// Загрузка и отображение списка столов
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureTelegramAuth();
    } catch (e) {
        alert('Ошибка авторизации: ' + e.message);
        return;
    }
    const listEl = document.getElementById('tables-list');
    const noTablesEl = document.getElementById('no-tables');
    try {
        // Получаем список комнат с сервера
        const res = await fetch('/api/settings/rooms', { headers: getAuthHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка получения списка столов');
        if (!data.rooms || data.rooms.length === 0) {
            noTablesEl.style.display = '';
            return;
        }
        data.rooms.forEach(room => {
            const div = document.createElement('div');
            div.className = 'table-item';
            div.innerHTML = `
                <div class="table-info">
                    <span class="table-host">${room.host_name || 'Без имени'}</span>
                    <span class="table-players">${room.current_players}/${room.max_players} игроков</span>
                </div>
                <button class="join-btn">Присоединиться</button>
            `;
            div.querySelector('.join-btn').onclick = () => joinTable(room.room_id);
            listEl.appendChild(div);
        });
    } catch (error) {
        noTablesEl.style.display = '';
        noTablesEl.textContent = 'Ошибка: ' + error.message;
    }
});

async function joinTable(roomId) {
    try {
        // Проверяем авторизацию пользователя
        const meRes = await fetch('/api/me', { credentials: 'include' });
        if (!meRes.ok) {
            await ensureTelegramAuth();
            const meRes2 = await fetch('/api/me', { credentials: 'include' });
            if (!meRes2.ok) throw new Error('Не удалось авторизоваться через Telegram');
        }
        // Получаем имя игрока (из Telegram WebApp или localStorage)
        let playerName = 'Игрок';
        let tgUsername = null;
        if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            playerName = window.Telegram.WebApp.initDataUnsafe.first_name || window.Telegram.WebApp.initDataUnsafe.username || 'Игрок';
            tgUsername = window.Telegram.WebApp.initDataUnsafe.username || null;
        } else if (localStorage.getItem('user')) {
            const user = JSON.parse(localStorage.getItem('user'));
            playerName = user.first_name || user.username || 'Игрок';
            tgUsername = user.username || null;
        }
        // Используем username с @, если есть
        let finalName = tgUsername ? `@${tgUsername}` : playerName;
        // Запрос на добавление игрока
        const res = await fetch(`/api/settings/${roomId}/players`, {
            method: 'PATCH',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                playerName: finalName,
                isBot: false
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка присоединения');
        // Сохраняем roomId и роль гостя
        localStorage.setItem('roomId', roomId);
        localStorage.setItem('isHost', 'false');
        // Переходим на страницу ожидания игроков
        window.location.href = `wait-players.html?roomId=${roomId}`;
    } catch (error) {
        alert('Ошибка при присоединении: ' + error.message);
    }
} 