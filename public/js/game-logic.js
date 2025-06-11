// Константы для карт
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

// Класс для карты
class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
        this.id = `${rank}_of_${suit}`;
        this.imageUrl = `/img/cards/${this.id}.png`;
    }

    // Получить значение ранга карты
    getRankValue() {
        return RANKS.indexOf(this.rank);
    }

    // Проверить, может ли эта карта побить другую
    canBeat(otherCard) {
        // В первой стадии масти не важны
        const thisRankValue = this.getRankValue();
        const otherRankValue = otherCard.getRankValue();

        // Особое правило: 2 бьёт только туз (A)
        if (this.rank === '2' && otherCard.rank === 'A') {
            return true;
        }

        // Обычное правило: карта должна быть на 1 ранг выше
        return thisRankValue === otherRankValue + 1;
    }
}

// Класс для колоды карт
class Deck {
    constructor() {
        this.cards = [];
        this.initializeDeck();
    }

    // Создание новой колоды
    initializeDeck() {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                this.cards.push(new Card(rank, suit));
            }
        }
        this.shuffle();
    }

    // Перемешивание колоды
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    // Взять карту из колоды
    drawCard() {
        return this.cards.pop();
    }

    // Проверить, есть ли ещё карты
    isEmpty() {
        return this.cards.length === 0;
    }

    // Получить количество оставшихся карт
    getCount() {
        return this.cards.length;
    }
}

// Класс для игрока
class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.closedCards = []; // Закрытые карты (2 штуки)
        this.openCards = [];   // Открытые карты (начинается с 1)
        this.isActive = false; // Флаг активного хода
    }

    // Получить активную карту (верхняя открытая)
    get activeCard() {
        return this.openCards[this.openCards.length - 1];
    }

    // Добавить закрытую карту
    addClosedCard(card) {
        this.closedCards.push(card);
    }

    // Добавить открытую карту
    addOpenCard(card) {
        this.openCards.push(card);
    }

    // Проверить, может ли игрок сделать ход
    canMove(topCard) {
        if (!this.activeCard || !topCard) return false;
        return this.activeCard.canBeat(topCard);
    }

    // Получить количество всех карт
    getCardCount() {
        return this.closedCards.length + this.openCards.length;
    }
}

// Класс для управления игрой
class GameManager {
    constructor(playerCount) {
        this.deck = new Deck();
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameStage = 1;
        this.topCard = null;
        this.initialize(playerCount);
    }

    // Инициализация игры
    initialize(playerCount) {
        // Создаем игроков
        for (let i = 0; i < playerCount; i++) {
            this.players.push(new Player(i, `Игрок ${i + 1}`));
        }

        // Раздаем начальные карты
        this.dealInitialCards();

        // Устанавливаем первого игрока активным
        this.players[0].isActive = true;
    }

    // Раздача начальных карт
    dealInitialCards() {
        // Раздаем по 2 закрытые карты каждому игроку
        for (let i = 0; i < 2; i++) {
            for (const player of this.players) {
                const card = this.deck.drawCard();
                player.addClosedCard(card);
            }
        }

        // Раздаем по 1 открытой карте каждому игроку
        for (const player of this.players) {
            const card = this.deck.drawCard();
            player.addOpenCard(card);
        }

        // Открываем первую карту на стол
        this.topCard = this.deck.drawCard();
    }

    // Сделать ход
    makeMove(playerId, targetPlayerId = null) {
        const player = this.players[playerId];
        
        // Проверяем, может ли игрок сделать ход
        if (!player.isActive || !player.canMove(this.topCard)) {
            return false;
        }

        // Если targetPlayerId указан, кладем карту этому игроку
        if (targetPlayerId !== null) {
            const targetPlayer = this.players[targetPlayerId];
            targetPlayer.addOpenCard(player.activeCard);
        } else {
            // Иначе кладем карту на стол
            this.topCard = player.activeCard;
        }

        // Удаляем карту у текущего игрока
        player.openCards.pop();

        // Передаем ход следующему игроку
        this.nextTurn();
        return true;
    }

    // Взять карту из колоды
    drawCard(playerId) {
        const player = this.players[playerId];
        if (!player.isActive || this.deck.isEmpty()) {
            return false;
        }

        const card = this.deck.drawCard();
        player.addOpenCard(card);

        // Если взятая карта не подходит, передаем ход
        if (!player.canMove(this.topCard)) {
            this.nextTurn();
        }

        return true;
    }

    // Передать ход следующему игроку
    nextTurn() {
        this.players[this.currentPlayerIndex].isActive = false;
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.players[this.currentPlayerIndex].isActive = true;

        // Проверяем, нужно ли переходить ко второй стадии
        if (this.deck.isEmpty() && this.gameStage === 1) {
            this.gameStage = 2;
        }
    }

    // Получить состояние игры
    getGameState() {
        return {
            stage: this.gameStage,
            currentPlayer: this.currentPlayerIndex,
            deckCount: this.deck.getCount(),
            topCard: this.topCard,
            players: this.players.map(player => ({
                id: player.id,
                name: player.name,
                cardCount: player.getCardCount(),
                activeCard: player.activeCard,
                isActive: player.isActive
            }))
        };
    }
}

// Экспортируем классы для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Card,
        Deck,
        Player,
        GameManager,
        RANKS,
        SUITS
    };
} 