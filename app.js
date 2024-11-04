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

const app = express();

// Middleware settings
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(cors());

// Routes
app.use('/', indexRouter);
app.use('/recipes', recipeRouter);

module.exports = app;
