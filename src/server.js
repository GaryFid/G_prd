const express = require('express');
const path = require('path');
const gameSettingsRouter = require('./api/gameSettings');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/settings', gameSettingsRouter);
app.use('/api', gameSettingsRouter);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Что-то пошло не так!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 