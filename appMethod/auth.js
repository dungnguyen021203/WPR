const express = require('express');
const authController = require('../authControllers/auth');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post('/register', authController.register )

router.post('/login', authController.login );

router.post('/composePage', upload.single('file'), authController.isLoggedIn, authController.composePage )

router.get('/logout', authController.logout);

module.exports = router;