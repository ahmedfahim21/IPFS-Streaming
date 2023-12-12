const route1 = require('./route1');
const express = require('express');

const app = express();

app.use('/route1', route1);

module.exports = app;