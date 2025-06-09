const { Scenes } = require('telegraf');

const menuScene = new Scenes.BaseScene('menu');

menuScene.enter((ctx) => ctx.reply('Главное меню (заглушка).'));

menuScene.on('text', (ctx) => ctx.reply('Выберите действие из меню.'));

module.exports = { menuScene }; 