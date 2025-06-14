-- Создание таблицы для комнат
CREATE TABLE IF NOT EXISTS game_rooms (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) UNIQUE NOT NULL,
    max_players INTEGER NOT NULL,
    min_players INTEGER NOT NULL,
    current_players INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для игроков
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) REFERENCES game_rooms(room_id),
    player_id VARCHAR(255) NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    is_bot BOOLEAN DEFAULT FALSE,
    is_ready BOOLEAN DEFAULT FALSE,
    is_host BOOLEAN DEFAULT FALSE,
    position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_room_id ON game_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);

-- Создание функции для обновления timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для обновления timestamp
CREATE TRIGGER update_game_rooms_updated_at
    BEFORE UPDATE ON game_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 