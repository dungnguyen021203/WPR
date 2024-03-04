const mysql = require('mysql2');
const md5 = require('md5');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const conn = mysql.createConnection({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).render('login', {
                message: 'Please provide an email and password'
            });
        }
        let salt = 'mysupersercretpassword';
        let hashedPassword = await md5(password + salt);

        conn.query('SELECT * FROM user WHERE user_email = ?', [email], async (error, results) => {
            console.log(results);
            if (!results || !(results[0].user_password === password || hashedPassword === results[0].user_password)) {
                res.status(401).render('login', {
                    message: 'Email or Password is incorrect'
                });
            } else {
                const userId = results[0].user_id;
                res.cookie('loggedInUserId', userId, {
                    expires: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                    httpOnly: true
                });
                res.status(200).redirect('/')
            }
        });
    } catch (error) {
        console.log(error);
    }
};


exports.register = (req, res) => {

    const { name, email, password, passwordConfirm } = req.body;

    conn.query('SELECT user_email FROM user WHERE user_email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
        }

        if (results.length > 0) {
            return res.render('register.ejs', {
                message: 'That email is already in use'
            })
        }
        else if (password.length < 6) {
            return res.render('register.ejs', {
                message: 'Password is too short'
            })
        }
        else if (results.length === '' || results.length === undefined) {
            return res.render('register.ejs', {
                message: 'Some field is left empty'
            })
        }
        else if (password !== passwordConfirm) {
            return res.render('register.ejs', {
                message: 'Password do not match'
            });
        }

        let salt = 'mysupersercretpassword';
        let hasedPassword = await md5(password + salt);

        conn.query('INSERT INTO user SET ?', { user_name: name, user_email: email, user_password: hasedPassword }, (error, results) => {
            if (error) {
                console.log(error);
            }

            else {
                console.log(results);
                return res.render('register.ejs', {
                    message: 'User registered'
                });
            }
        })
    });


}

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.loggedInUserId) {
        try {
            const loggedInUserId = req.cookies.loggedInUserId;

            conn.query('SELECT * FROM user WHERE user_id = ?', [loggedInUserId], (error, result) => {
                if (!result || result.length === 0) {
                    res.clearCookie('loggedInUserId');
                    return res.redirect('/login');
                }

                req.user = result[0];
                return next();
            });
        } catch (error) {
            console.log(error);
            return res.redirect('/login');
        }
    } else {
        return res.redirect('/login');
    }
};


exports.inbox = async (req, res) => {
    const userId = req.user.user_id;

    conn.query(
        'SELECT Message.*, User.user_name AS sender_name FROM Message JOIN User ON Message.mes_sender_id = User.user_id WHERE mes_receiver_id = ?',
        [userId],
        (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error fetching inbox messages');
            }
            res.render('inboxPage.ejs', { messages: results });
        }
    );
};

exports.outbox = async (req, res) => {
    const userId = req.user.user_id;

    conn.query(
        'SELECT Message.*, User.user_name AS receiver_name FROM Message JOIN User ON Message.mes_receiver_id = User.user_id WHERE Message.mes_sender_id = ?',
        [userId],
        (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error fetching outbox messages');
            }
            res.render('outBoxPage.ejs', { messages: results });
        }
    );
};

exports.logout = async (req, res) => {
    res.clearCookie('loggedInUserId');
    res.status(200).redirect('/');
};


exports.composePage = (req, res) => {
    const { email, title, body } = req.body;
    const senderId = req.user.user_id;
    const file = req.file;


    if (!email || !title || !body ) {
        return res.render('composePage.ejs', {
            message: 'Please fill in all required fields'
        });
    }

    conn.query('SELECT user_email FROM User', (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error retrieving user emails');
        }
        res.render('composePage.ejs', { users: results });
    });


    conn.query(
        'SELECT user_id FROM User WHERE user_email = ?',
        [email],
        (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error finding the receiver');
            }


            if (results.length === 0) {
                return res.render('composePage.ejs', {
                    message: 'Receiver email not found'
                });
            }

            const receiverId = results[0].user_id;

            conn.query('INSERT INTO Message (mes_sender_id, mes_receiver_id, title, mes_body, file) VALUES (?, ?, ?, ?, ?)',
                [senderId, receiverId, title, body, file.originalname],
                (insertError, insertResults) => {
                    if (insertError) {
                        console.error(insertError);
                        return res.status(500).send('Error saving the message');
                    }


                    console.log(insertResults);
                    return res.render('composePage.ejs', {
                        message: 'Sent'
                    });
                }
            );
        }
    )

};

exports.details = async (req, res) => {
    const emailId = req.params.id;
    const userId = req.user.user_id;

    conn.query(
        'SELECT Message.*, User.user_name AS sender_name, User.user_email AS sender_email FROM Message JOIN User ON Message.mes_sender_id = User.user_id WHERE Message.mes_id = ? AND Message.mes_receiver_id = ?',
        [emailId, userId],
        (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error fetching email details');
            }
            if (results.length === 0) {
                return res.status(404).send('Email not found');
            }

            const emailDetails = results[0];

            res.render('details.ejs', { email: emailDetails });
        }
    );
    
};

exports.details2 = async (req, res) => {
    const emailId = req.params.id;
    const userId = req.user.user_id;

    conn.query(
        'SELECT Message.*, User.user_name AS receiver_name, User.user_email AS receiver_email FROM Message JOIN User ON Message.mes_receiver_id = User.user_id WHERE Message.mes_id = ? AND Message.mes_sender_id = ?',
        [emailId, userId],
        (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error fetching sent email details');
            }
            if (results.length === 0) {
                return res.status(404).send('Sent email not found');
            }

            const emailDetails = results[0];

            res.render('details2.ejs', { email: emailDetails });
        }
    );
};

