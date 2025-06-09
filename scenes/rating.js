const { Scenes } = require('telegraf');

const ratingScene = new Scenes.BaseScene('rating');

ratingScene.enter((ctx) => ctx.reply('Рейтинг игроков (заглушка).'));

ratingScene.on('text', (ctx) => ctx.reply('Здесь будет рейтинг игроков.'));

module.exports = { ratingScene }; 