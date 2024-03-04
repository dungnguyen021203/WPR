const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const externalCSS = path.join(__dirname, './externalCSS');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();

dotenv.config({path: './.env'});

app.set('view engine', 'ejs');

app.use(express.static(externalCSS));


app.use(express.urlencoded({ extended: false}));
app.use(express.json());
app.use(cookieParser());

app.use('/', require('./appMethod/pages'));
app.use('/auth', require('./appMethod/auth'));

app.listen(8000, () => {
    console.log("Server started on port 8000");
});


