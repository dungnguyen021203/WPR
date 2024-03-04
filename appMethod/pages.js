const mysql = require('mysql2');
const express = require('express');
const authController = require('../authControllers/auth');

const router = express.Router();

const conn = mysql.createConnection({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

router.get('/', authController.isLoggedIn, (req, res) => {
  res.render('index.ejs', {
    user: req.user
  });
});

router.get('/register', (req, res) => {
  res.render('register.ejs')
});

router.get('/login', (req, res) => {
  res.render('login.ejs');
});

router.get('/inboxPage', authController.isLoggedIn, authController.inbox);

router.get('/outBoxPage', authController.isLoggedIn, authController.outbox);

router.get('/composePage', authController.isLoggedIn, (req, res) => {
  conn.query('SELECT user_email FROM User', (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error retrieving user emails');
    }
    res.render('composePage.ejs', { users: results });
  });
});

router.get('/details/:id', authController.isLoggedIn, authController.details);

router.get('/details2/:id', authController.isLoggedIn, authController.details2);


module.exports = router;