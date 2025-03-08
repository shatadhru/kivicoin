const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB Connected'))
//   .catch(err => console.error(err));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


module.exports = app;
