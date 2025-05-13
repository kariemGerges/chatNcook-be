require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

// Routes
const indexRouter = require('./routes/index');
const recipeRouter = require('./routes/recipes');
const config = require('./config');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Middleware settings
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(
        `${new Date().toISOString()} - ${req.method} ${req.originalUrl}`
    );
    next();
});

// Routes
app.use('/', indexRouter);
app.use('/recipes', recipeRouter);
// Routes
app.get('/', (req, res) => {
    res.send('Gemini AI Integration Backend is running!');
});
app.use('/api/ai', aiRoutes);

// Global Error Handler (simple example)
// This should be the last middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack || err);
    // Avoid sending stack traces to client in production
    const statusCode = err.statusCode || 500;
    const message =
        process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'An unexpected error occurred.'
            : err.message;
    res.status(statusCode).json({ error: message });
});

// 404 Handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

module.exports = app;
