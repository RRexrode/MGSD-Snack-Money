var mysql = require('mysql2');
const express = require("express");
var app = express()
const port = 8085
const bp = require('body-parser')
const cookieParser = require("cookie-parser");
var session = require('express-session');
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))
const oneDay = 1000 * 60 * 60 * 24;
require('dotenv').config();
const nodemailer = require('nodemailer')

var weeks = ["8/10-8/12", "8/15-8/19", "8/22-8/26", "8/29-9/2", "9/7-9/9", "9/12-9/16", "9/19-9/23", "9/26-9/30",
"10/3-10/7", "10/12-10/14", "10/17-10/21", "10/24-10/28", "11/2-11/4", "11/7-11/10", "11/14-11/18", "11/21-22", "11/27-12/2",
"12/5-12/9", "12/12-12/16","12/19-12/21", "1/4-1/6", "1/9-1/13", "1/17-1/20", "1/23-1/27", "1/30-2/3", "2/6-2/10",
"2/14-2/17", "2/20-2/24", "2/27-3/3", "3/14-3/17", "3/20-3/24", "3/27-3/31", "4/3-4/6", "4/11-4/14", "4/17-4/21", "4/24-4/27",
"5/1-5/5", "5/8-5/12", "5/15-5/19", "5/22-5/24"];

app.use(session({
    secret: process.env.host,
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));


app.use(cookieParser());

var con = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database
});

app.use(express.static(__dirname + '/'));

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

app.set('view engine', 'ejs');
const d = new Date();

const transporter = nodemailer.createTransport({
    service: process.env.service,
    auth: {
        user: process.env.emailUser,
        pass: process.env.emailPassword
    }
})

app.get('/report', (req, res) => {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result1) {
            if (err) throw err;
            var sql = "SELECT * FROM ??";
            var inserts = [result1[0].firstName + result1[0].lastName]
            sql = mysql.format(sql, inserts)
            con.query(sql, function (err, result2) {
                if (err) throw err;
                res.render('report', {students: result2});
            });
        });
    }else {
        res.render('index')
    }
});

app.get("/yesEmailNeg", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            var name;
            var week = result[0].week;
            var sql = `SELECT * FROM ??;`;
            name = result[0].firstName + result[0].lastName;
            sql = mysql.format(sql, name);
            con.query(sql, function (err, results) {
                if (err) throw err;
                for (let i = 0; i < results.length;i++) {
                    if (results[i].balance < 0) {
                        const mailOptions = {
                            from: 'rexrodedev@gmail.com',
                            to: results[i].email,
                            subject: 'MGSD Snack Money Notification',
                            text: 'Dear Parent/Guardian, every school day we provide a snack to your child and we ask that ' +
                                'Parents/Guardians help cover the cost by sending $2 each week to class. Our records show ' +
                                'that your child ' + results[i].firstName + ' ' + results[i].lastName + ' has a balance of $' +
                                results[i].balance + '. Thank you!'
                        };
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });
                    }
                }
                res.send('Emails sent successfully!')
            });
        });
    }else {
        res.render('index')
    }
});

app.get("/emailNeg", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            res.render('emailNeg', {user: result});
        });
    }else {
        res.render('index')
    }
});

app.post('/submitNote/:id', function (req, res) {

    var studentNote = ' [' + req.body.note + ']';
    var name;

    if (studentNote !== "") {
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            name = result[0].firstName + result[0].lastName;
            var sql = `UPDATE ?? SET notes = concat(notes, ?) WHERE id = ?;`;
            var inserts = [result[0].firstName + result[0].lastName, studentNote, req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, async function (err, result) {
                if (err) throw err;
                res.redirect('/studentProfile/' + req.params.id)
            });
        });
    } else {
        res.send("Please fill in all fields!");
    }
});

app.get("/addNotes/:id", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            var sql = `SELECT * FROM ?? WHERE id = ?;`;
            var inserts = [result[0].firstName + result[0].lastName,req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, function (err, results) {
                if (err) throw err;
                res.render('addNotes', {user: result, student: results});
            });
        });
    }else {
        res.render('index')
    }
});

app.get("/previous", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "UPDATE user SET week = week - 1 WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            res.redirect('/profile')
        });
    }else {
        res.render('index')
    }
});

app.get("/forward", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "UPDATE user SET week = week + 1 WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            res.redirect('/profile')
        });
    }else {
        res.render('index')
    }
});

app.get("/yesTake2", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            var name;
            var week = result[0].week;
            var sql = `SELECT * FROM ??;`;
            name = result[0].firstName + result[0].lastName;
            sql = mysql.format(sql, name);
            con.query(sql, function (err, results) {
                if (err) throw err;
                for (let i = 0; i < results.length;i++) {
                    var sql = `UPDATE ?? SET balance = balance - 2 WHERE id = ?;`;
                    var inserts = [name, results[i].id]
                    sql = mysql.format(sql, inserts);
                    con.query(sql, function(err, result3) {
                        if(err) throw err;
                        var sql = `UPDATE ?? SET deductions = concat(deductions, ?) WHERE id = ?;`;
                        var inserts = [name, ' [' + weeks[week] + ': $-' + 2 + ']', results[i].id]
                        sql = mysql.format(sql, inserts);
                        con.query(sql, async function (err, result4) {
                            if (err) throw err;
                        });
                    });

                }
                res.redirect('/profile');
            });
        });
    }else {
        res.render('index')
    }
});

app.get("/take2", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            res.render('take2', {user: result});
        });
    }else {
        res.render('index')
    }
});

app.get("/yesDelete/:id", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            var sql = `DELETE FROM ?? WHERE id = ?;`;
            var inserts = [result[0].firstName + result[0].lastName,req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, function (err, results) {
                if (err) throw err;
                res.redirect("/profile")
            });
        });
    }else {
        res.render('index')
    }
});

app.get("/delete/:id", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            var sql = `SELECT * FROM ?? WHERE id = ?;`;
            var inserts = [result[0].firstName + result[0].lastName,req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, function (err, results) {
                if (err) throw err;
                res.render('delete', {user: result, student: results});
            });
        });
    }else {
        res.render('index')
    }
});

app.post('/submitEmail/:id', function (req, res) {

    var studentEmail = req.body.email;
    var name;

    if (studentEmail != "") {
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result1) {
            if (err) throw err;
            name = result1[0].firstName + result1[0].lastName;
            var sql = `SELECT * FROM ?? WHERE id = ?;`;
            var inserts = [result1[0].firstName + result1[0].lastName, req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, async function (err, result2) {
                if (err) throw err;
                const mailOptions = {
                    from: 'rexrodedev@gmail.com',
                    to: result2[0].email,
                    subject: 'MGSD Snack Money Notification',
                    text: studentEmail
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
                res.send('Email sent successfully!')
            });
        });
    } else {
        res.send("Please fill in all fields!");
    }
});

app.get("/email/:id", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            var sql = `SELECT * FROM ?? WHERE id = ?;`;
            var inserts = [result[0].firstName + result[0].lastName,req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, function (err, results) {
                if (err) throw err;
                res.render('email', {user: result, student: results});
            });
        });
    }else {
        res.render('index')
    }
});

app.post('/submitPIF/:id', function (req, res) {

    var studentPIF = req.body.PIF;
    var name;

    if (studentPIF != "") {
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            name = result[0].firstName + result[0].lastName;
            var sql = `UPDATE ?? SET paidInFull = ? WHERE id = ?;`;
            var inserts = [result[0].firstName + result[0].lastName, studentPIF, req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, async function (err, result) {
                if (err) throw err;
                res.redirect('/studentProfile/' + req.params.id)
            });
        });
    } else {
        res.send("Please fill in all fields!");
    }
});

app.get("/paidInFull/:id", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            var sql = `SELECT * FROM ?? WHERE id = ?;`;
            var inserts = [result[0].firstName + result[0].lastName,req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, function (err, results) {
                if (err) throw err;
                res.render('paidInFull', {user: result, student: results});
            });
        });
    }else {
        res.render('index')
    }
});

app.post('/deposit/:id', function (req, res) {

    var studentDeposit = req.body.num;
    var name;

    if (studentDeposit != "") {
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            name = result[0].firstName + result[0].lastName;
            var sql = `UPDATE ?? SET balance = balance + ? WHERE id = ?;`;
            var inserts = [result[0].firstName + result[0].lastName, studentDeposit, req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, async function (err, result) {
                if (err) throw err;
                var sql = `UPDATE ?? SET deposits = concat(deposits, ?) WHERE id = ?;`;
                var inserts = [name, ' [' + (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear()+ ': $' + studentDeposit + ']', req.params.id]
                sql = mysql.format(sql, inserts);
                con.query(sql, async function (err, result) {
                    if (err) throw err;
                    res.redirect('/studentProfile/' + req.params.id)
                });
            });
        });
    } else {
        res.send("Please fill in all fields!");
    }
});

app.get("/addMoney/:id", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            var sql = `SELECT * FROM ?? WHERE id = ?;`;
            var inserts = [result[0].firstName + result[0].lastName,req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, function (err, results) {
                if (err) throw err;
                res.render('addMoney', {user: result, student: results});
            });
        });
    }else {
        res.render('index')
    }

});

app.get("/studentProfile/:id", function (req, res) {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            var sql = `SELECT * FROM ?? WHERE id = ?;`;
            var inserts = [result[0].firstName + result[0].lastName,req.params.id]
            sql = mysql.format(sql, inserts);
            con.query(sql, function (err, results) {
                if (err) throw err;
                res.render('studentProfile', {user: result, student: results});
            });
        });
    }else {
        res.render('index')
    }

});

app.post('/submitStudent', function (req, res) {

    var studentFirstName = req.body.firstName;
    var studentLastName = req.body.lastName;
    var studentEmail = req.body.email;
    var studentBalance = 0;
    var studentPaidInFull = 'No'


    if (studentFirstName != "" && studentLastName != "" && studentEmail != "") {

        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;

            var sql = `INSERT INTO ?? (firstName, lastName, email, balance, deposits, deductions, paidInFull, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;
            var inserts = [result[0].firstName + result[0].lastName,studentFirstName, studentLastName, studentEmail, studentBalance, '\n', '\n', studentPaidInFull, '\n']
            sql = mysql.format(sql, inserts);
            con.query(sql, async function (err, result) {
                if (err) throw err;
                res.redirect('/profile')
            });
        });
    } else {
        res.send("Please fill in all fields!");
    }
});

app.get('/addStudent', (req, res) => {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result) {
            if (err) throw err;
            res.render('addStudent', {user: result});
        });
    }else {
        res.render('index')
    }
});

app.get('/profile', (req, res) => {
    session=req.session;
    if(session.userid){
        var sql = "SELECT * FROM user WHERE email = ?";
        var inserts = [session.userid]
        sql = mysql.format(sql, inserts)
        con.query(sql, function (err, result1) {
            if (err) throw err;
            var sql = "SELECT * FROM ??";
            var inserts = [result1[0].firstName + result1[0].lastName]
            sql = mysql.format(sql, inserts)
            con.query(sql, function (err, result2) {
                if (err) throw err;
                res.render('profile', {user: result1, students: result2, week: weeks});
            });
        });
    }else {
        res.render('index')
    }
});

app.post('/user', function(request, response) {
    // Capture the input fields
    let username = request.body.username;
    let password = request.body.password;
    // Ensure the input fields exists and are not empty
    if (username && password) {
        var sql = "SELECT * FROM ?? WHERE ?? = ? AND ?? = ?";
        var inserts = ['user', 'email', username, 'password', password]
        sql = mysql.format(sql, inserts)
        con.query(sql, function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the account exists
            if (results.length > 0) {
                session=request.session;
                session.userid=request.body.username;
                console.log(request.session)
                response.redirect('/profile')
            } else {
                response.send('Incorrect Username and/or Password!');
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.get('/success',(req,res) => {
    res.render('success')
});

app.post('/submitUser', function (req, res) {

    var userFirstName = req.body.firstName;
    var userLastName = req.body.lastName;
    var userEmail = req.body.email;
    var userPassword = req.body.password;


    if (userFirstName != "" && userLastName != "" && userEmail != "" && userPassword != "") {
        var sql = `INSERT INTO user (firstName, lastName, email, week, password) VALUES (?, ?, ?, ?, ?);`;
        var inserts = [userFirstName, userLastName, userEmail, '0', userPassword]
        sql = mysql.format(sql, inserts)
        con.query(sql, async function (err, result) {
            if (err) throw err;
            var sql = "CREATE TABLE ?? (id int NOT NULL AUTO_INCREMENT, firstName VARCHAR(255), lastName VARCHAR(255), email varchar(255), balance INT, deposits TEXT, deductions TEXT, paidInFull varchar(255), notes TEXT, PRIMARY KEY (id))";
            var inserts = [userFirstName + userLastName]
            sql = mysql.format(sql, inserts)
            con.query(sql, function (err, result) {
                if (err) throw err;
                res.redirect('/success')
            });
        });
    } else {
        res.send("Please fill in all fields!");
    }
});

app.get('/register',(req,res) => {
    res.render('register')
});

app.get('/',(req,res) => {
    res.render('index')
});

app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`App listening at port ${port}`)
})