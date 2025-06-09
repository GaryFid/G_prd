const { Scenes } = require('telegraf');

const shopScene = new Scenes.BaseScene('shop');

shopScene.enter((ctx) => ctx.reply('Магазин (заглушка).'));

shopScene.on('text', (ctx) => ctx.reply('Здесь будет магазин.'));

module.exports = { shopScene }; 