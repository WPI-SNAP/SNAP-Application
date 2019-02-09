const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
let mysql = require('mysql');
let mariadb = require('mariadb');
let path = require("path");
let ejs = require('ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Sets relative path for Express to serve files out of views folder
app.use(express.static(__dirname + '/public'));
//app.use(express.static(__dirname + '/views'));
app.use(express.static(path.join(__dirname, 'views')));

app.set('view engine', 'ejs');

// Create connection to mySQL database
// mariadb.createConnection({
//     //properties
//     socketPath: '/var/run/mysqld/mysqld.sock',
//     user: 'jnpalmstrom',
//     password: 'Robert35421!',
//     database: 'snapDB'
// }).then(conn => {
//     console.log(conn);
// });

// MariaDB Connection
pool = mariadb.createPool({
    socketPath: '/var/run/mysqld/mysqld.sock',
    user: 'jnpalmstrom',
    database: 'snapDB',
    connectionLimit: 5
});
pool.getConnection()
    .then(conn => {
        console.log("Connected baby!");
    }).catch(err => {
    console.log(err);
});


//Define express js routes
require('./routes/routes.js')(app);

// Listen for the server to start
app.listen(port, function () {
    console.log("App is running on PORT: " + port);
});