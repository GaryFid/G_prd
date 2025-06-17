// Загрузка и отображение списка столов
window.addEventListener('DOMContentLoaded', async () => {
    const listEl = document.getElementById('tables-list');
    const noTablesEl = document.getElementById('no-tables');
    try {
        // Получаем список комнат с сервера
        const res = await fetch('/api/settings/rooms');
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
        // Получаем имя игрока (из Telegram WebApp или localStorage)
        let playerName = 'Игрок';
        let playerId = null;
        if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            playerName = Telegram.WebApp.initDataUnsafe.first_name || Telegram.WebApp.initDataUnsafe.username || 'Игрок';
            playerId = Telegram.WebApp.initDataUnsafe.user?.id || null;
        } else if (localStorage.getItem('user')) {
            const user = JSON.parse(localStorage.getItem('user'));
            playerName = user.first_name || user.username || 'Игрок';
            playerId = user.id || null;
        }
        // Запрос на добавление игрока
        const res = await fetch(`/api/settings/${roomId}/players`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: playerId || Math.random().toString(36).substr(2, 9),
                playerName,
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