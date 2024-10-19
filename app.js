var express = require('express');
var path = require('path');
const app = express();
var logger = require('morgan');
const cors = require('cors');
var usersRouter = require('./app/routes/users');
var transactionsRouter = require('./app/routes/transaction');
require('dotenv').config();

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
  credentials: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

require('./config/database');

app.use('/users', usersRouter);
app.use('/transactions', transactionsRouter);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
