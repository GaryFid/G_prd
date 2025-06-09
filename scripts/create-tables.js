const { initDatabase } = require('../models');
const sequelize = require('../config/db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Подключение к базе данных успешно!');
    await initDatabase();
    console.log('Все таблицы успешно созданы и синхронизированы!');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка при создании таблиц:', err);
    process.exit(1);
  }
})(); 