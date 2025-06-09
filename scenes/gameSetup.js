const { Scenes } = require('telegraf');

const gameSetupScene = new Scenes.BaseScene('gameSetup');

gameSetupScene.enter((ctx) => ctx.reply('Настройка игры (заглушка).'));

gameSetupScene.on('text', (ctx) => ctx.reply('Настройте игру или используйте меню.'));

module.exports = { gameSetupScene }; 