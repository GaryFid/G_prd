const { Scenes } = require('telegraf');

const gameScene = new Scenes.BaseScene('game');

gameScene.enter((ctx) => ctx.reply('Игра началась (заглушка).'));

gameScene.on('text', (ctx) => ctx.reply('Играйте или используйте меню.'));

module.exports = { gameScene }; 