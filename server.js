const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const passport = require('passport');
let mysql = require('mysql');
let path = require("path");
let ejs = require('ejs');

require('./config/passport.js')(passport);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Sets relative path for Express to serve files out of views folder
app.use(express.static(path.join(__dirname + '/public')));
app.use(express.static(path.join(__dirname, 'views')));

app.set('view engine', 'ejs');

// Create connection to mySQL database
var connection = mysql.createConnection({
    //properties
    host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
    port: '3306',
    user: 'masterAdmin',
    password: 'Pa55word',
    database: 'snapDB'
});

connection.connect(function (err) {
    if(err) {
        console.log(err);
    }
    else {
        console.log("DB is connected!")
    }
});

//stuff for passport
app.use(session({secret: 'SNAPproject',
    saveUninitialized: true,
    resave: true}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//Define express js config
require('./config/routes.js')(app, passport);

// Listen for the server to start
app.listen(port, function () {
    console.log("App is running on PORT: " + port);
});