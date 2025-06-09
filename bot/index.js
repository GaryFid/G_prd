const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

class Bot {
    constructor() {
        if (!config.telegram.token) {
            throw new Error('BOT_TOKEN не установлен в переменных окружения');
        }

        this.bot = new TelegramBot(config.telegram.token, { polling: true });
        this.webAppUrl = config.app.url;
        
        this.setupCommands();
        this.setupHandlers();
    }

    setupCommands() {
        // Устанавливаем команды бота
        this.bot.setMyCommands([
            { command: '/start', description: 'Начать игру' },
            { command: '/webapp', description: 'Открыть веб-приложение' },
            { command: '/help', description: 'Помощь' }
        ]);

        // Устанавливаем кнопку меню
        this.bot.setMyDescription('P.I.D.R. - Увлекательная игра для компании друзей! 🎮');
        this.bot.setMyShortDescription('Играйте в P.I.D.R. с друзьями!');
        
        // Устанавливаем кнопку меню с веб-приложением
        this.bot.setChatMenuButton({
            menu_button: {
                type: 'web_app',
                text: 'Открыть игру',
                web_app: { url: this.webAppUrl }
            }
        }).catch(error => {
            console.error('Ошибка при установке кнопки меню:', error);
        });
    }

    setupHandlers() {
        // Обработчик команды /start
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            const keyboard = {
                inline_keyboard: [
                    [{
                        text: '🎮 Играть',
                        web_app: { url: this.webAppUrl }
                    }],
                    [{
                        text: '📢 Пригласить друзей',
                        switch_inline_query: ''
                    }]
                ]
            };

            this.bot.sendMessage(chatId, 
                'Добро пожаловать в P.I.D.R.!\n\n' +
                '🎮 Нажмите кнопку "Играть" чтобы начать\n' +
                '📢 Пригласите друзей для совместной игры',
                { reply_markup: keyboard }
            );
        });

        // Обработчик команды /webapp
        this.bot.onText(/\/webapp/, (msg) => {
            const chatId = msg.chat.id;
            const keyboard = {
                inline_keyboard: [[{
                    text: '🎮 Открыть игру',
                    web_app: { url: this.webAppUrl }
                }]]
            };

            this.bot.sendMessage(chatId, 
                'Нажмите кнопку ниже, чтобы открыть игру:',
                { reply_markup: keyboard }
            );
        });

        // Обработчик команды /help
        this.bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id;
            this.bot.sendMessage(chatId,
                '🎮 *P.I.D.R. - Помощь*\n\n' +
                'Доступные команды:\n' +
                '/start - Начать игру\n' +
                '/webapp - Открыть веб-приложение\n' +
                '/help - Показать это сообщение\n\n' +
                'Также вы можете использовать кнопку меню для быстрого доступа к игре.',
                { parse_mode: 'Markdown' }
            );
        });

        // Обработчик ошибок
        this.bot.on('polling_error', (error) => {
            console.error('Ошибка бота:', error);
        });
    }
}

module.exports = new Bot(); 