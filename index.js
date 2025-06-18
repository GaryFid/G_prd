require('dotenv').config();
const express = require('express');
const { Telegraf, Scenes, session } = require('telegraf');
const passport = require('passport');
const expressSession = require('express-session');
const config = require('./config/config');
const path = require('path');
const { sequelize, testConnection } = require('./config/db');
const { initDatabase, User } = require('./models');
const logger = require('./utils/logger');
const { Pool } = require('pg');
const pgSession = require('connect-pg-simple')(expressSession);
const gameSettingsRouter = require('./src/api/gameSettings');

// Импорт сцен и обработчиков
const { authScene } = require('./scenes/auth');
const { menuScene } = require('./scenes/menu');
const { gameSetupScene } = require('./scenes/gameSetup');
const { gameScene } = require('./scenes/game');
const { rulesScene } = require('./scenes/rules');
const { ratingScene } = require('./scenes/rating');
const { shopScene } = require('./scenes/shop');

// Импорт стратегий аутентификации
require('./config/passport');

// Инициализация бота Telegram
let bot;
let botStartAttempts = 0;
const MAX_BOT_START_ATTEMPTS = 3;

// Создаём отдельный pool для сессий
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATA_BASE,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initBot() {
  if (!config.telegram.botToken) {
    console.log('Токен бота не найден, пропускаем инициализацию бота');
    return;
  }

  try {
    bot = new Telegraf(config.telegram.botToken);

    // Настройка сцен
    const stage = new Scenes.Stage([
      authScene,
      menuScene,
      gameSetupScene,
      gameScene,
      rulesScene,
      ratingScene,
      shopScene
    ]);

    // Middleware
    bot.use(session());
    bot.use(stage.middleware());

    // Обработчик команды /start
    bot.command('start', ctx => ctx.scene.enter('auth'));
    
    // Обработчик данных от мини-приложения
    bot.on('web_app_data', async (ctx) => {
      const data = ctx.webAppData.data;
      
      try {
        switch (data) {
          case 'start_game':
            await ctx.scene.enter('gameSetup');
            break;
          case 'play_ai':
            ctx.session.withAI = true;
            await ctx.scene.enter('gameSetup');
            break;
          case 'rating':
            await ctx.scene.enter('rating');
            break;
          case 'rules':
            await ctx.scene.enter('rules');
            break;
          default:
            await ctx.reply('Получена неизвестная команда от мини-приложения.');
        }
      } catch (error) {
        console.error('Ошибка обработки web_app_data:', error);
        await ctx.reply('Произошла ошибка при обработке команды.');
      }
    });

    // Запускаем бота с обработкой конфликтов
    while (botStartAttempts < MAX_BOT_START_ATTEMPTS) {
      try {
        await bot.launch({
          dropPendingUpdates: true,
          allowedUpdates: ['message', 'callback_query', 'web_app_data']
        });
        console.log('Telegram бот успешно запущен');
        break;
      } catch (error) {
        botStartAttempts++;
        if (error.response?.error_code === 409) {
          console.log(`Попытка ${botStartAttempts}/${MAX_BOT_START_ATTEMPTS}: Обнаружен конфликт с другой инстанцией бота`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Ждем 5 секунд перед следующей попыткой
        } else {
          console.error('Критическая ошибка запуска бота:', error);
          break;
        }
      }
    }

    if (botStartAttempts >= MAX_BOT_START_ATTEMPTS) {
      console.error('Не удалось запустить бота после нескольких попыток');
    }
  } catch (error) {
    console.error('Ошибка инициализации бота:', error);
  }
}

// Асинхронная функция запуска приложения
async function startApp() {
  try {
    // Проверка подключения к PostgreSQL и инициализация базы данных
    try {
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Не удалось подключиться к базе данных');
      }
      console.log('Подключение к PostgreSQL успешно!');
      
      await initDatabase();
      console.log('База данных успешно инициализирована');

      // Создаем таблицу для сессий если её нет
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        );
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
      `);
      
    } catch (err) {
      console.error('Ошибка работы с базой данных:', err);
      process.exit(1);
    }

    // Веб-сервер для авторизации через OAuth
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Настройка middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Настройка сессий с использованием PostgreSQL
    app.use(expressSession({
      store: new pgSession({
        pool: pgPool, // Используем pg.Pool, а не Sequelize!
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 60
      }),
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      }
    }));

    // Инициализация passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Настройка для обслуживания статических файлов
    app.use(express.static(path.join(__dirname, 'public'), {
      maxAge: '1d',
      etag: true,
      lastModified: true
    }));

    // Маршруты
    app.use('/auth', require('./routes/auth'));
    app.use('/api', require('./routes/api'));
    app.use('/api/settings', gameSettingsRouter);

    // Основные маршруты для веб-приложения
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    app.get('/webapp', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // SPA fallback — для всех остальных путей, кроме API и статики
    app.get('*', (req, res) => {
      // Не отдаём index.html для API и статики
      if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/js') || req.path.startsWith('/css') || req.path.startsWith('/img') || req.path.startsWith('/uploads')) {
        res.status(404).send('Not found');
      } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
      }
    });

    app.get('/game-setup', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'game-setup.html'));
    });

    app.get('/game', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'game.html'));
    });

    // Новый роут для Telegram WebApp авто-добавления
    app.post('/api/telegram-auth', async (req, res) => {
      try {
        const { id, username, first_name, last_name, photo_url } = req.body;
        if (!id) return res.status(400).json({ success: false, message: 'No telegram id' });
        let user = await User.findOne({ where: { telegramId: id.toString() } });
        if (!user) {
          user = await User.create({
            telegramId: id.toString(),
            username: username || first_name || 'Игрок',
            firstName: first_name,
            lastName: last_name,
            avatar: photo_url,
            authType: 'telegram',
            registrationDate: new Date()
          });
        } else {
          // Обновим имя/аватар если изменились
          let changed = false;
          if (user.username !== (username || first_name || 'Игрок')) { user.username = username || first_name || 'Игрок'; changed = true; }
          if (user.firstName !== first_name) { user.firstName = first_name; changed = true; }
          if (user.lastName !== last_name) { user.lastName = last_name; changed = true; }
          if (user.avatar !== photo_url) { user.avatar = photo_url; changed = true; }
          if (changed) await user.save();
        }
        res.json({ success: true, user: user.toPublicJSON() });
      } catch (error) {
        console.error('Ошибка в /api/telegram-auth:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
      }
    });

    // Запуск сервера СРАЗУ, до запуска бота
    console.log('Готов к запуску сервера, сейчас будет listen...');
    app.listen(PORT, '0.0.0.0', () => {
      console.log('Сервер реально слушает порт!');
      console.log(`Сервер запущен на порту ${PORT}`);
      logger.session({
        event: 'server_started',
        port: PORT,
        mode: process.env.NODE_ENV || 'development',
        appUrl: config.app.url,
        baseUrl: config.app.baseUrl
      });
    });

    // А потом уже запуск бота (асинхронно, не блокируя сервер)
    initBot();

    // Graceful shutdown
    async function cleanup() {
      console.log('Выполняется graceful shutdown...');
      
      // Останавливаем бота если нужно
      if (bot) {
        console.log('Останавливаем бота...');
        try {
          await bot.stop();
          console.log('Бот остановлен');
        } catch (error) {
          console.error('Ошибка при остановке бота:', error);
        }
      }
      
      // Закрываем соединение с базой данных
      try {
        await sequelize.close();
        console.log('Соединение с базой данных закрыто');
      } catch (error) {
        console.error('Ошибка при закрытии соединения с базой данных:', error);
      }
      
      process.exit(0);
    }

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    console.error('Ошибка запуска приложения:', error);
    process.exit(1);
  }
}

// Запускаем приложение
startApp(); 