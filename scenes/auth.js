const { Scenes } = require('telegraf');

const authScene = new Scenes.BaseScene('auth');

authScene.enter((ctx) => ctx.reply('Вы в сцене авторизации (заглушка).'));

authScene.on('text', (ctx) => ctx.reply('Введите команду или используйте меню.'));

module.exports = { authScene }; 