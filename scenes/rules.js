const { Scenes } = require('telegraf');

const rulesScene = new Scenes.BaseScene('rules');

rulesScene.enter((ctx) => ctx.reply('Правила игры (заглушка).'));

rulesScene.on('text', (ctx) => ctx.reply('Здесь будут правила игры.'));

module.exports = { rulesScene }; 