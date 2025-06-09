require('dotenv').config();

const config = {
    app: {
        url: process.env.APP_URL || 'http://localhost:3000',
        baseUrl: process.env.BASE_URL || 'http://localhost:3000'
    },
    database: {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        ssl: process.env.NODE_ENV === 'production',
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        }
    },
    telegram: {
        token: process.env.BOT_TOKEN,
        username: process.env.BOT_USERNAME,
        enabled: !!process.env.BOT_TOKEN
    },
    session: {
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 24 часа
            secure: process.env.NODE_ENV === 'production'
        },
        resave: false,
        saveUninitialized: false
    },
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    }
};

// Проверка обязательных переменных окружения
const requiredEnvVars = ['DATABASE_URL', 'BOT_TOKEN', 'BOT_USERNAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Отсутствуют обязательные переменные окружения:', missingEnvVars.join(', '));
    process.exit(1);
}

module.exports = config; 