const mysql = require('mysql');
const moment = require('moment');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = function (app, config, passport) {

    ////////////////////////////////////////////////////////////////////
    // WPI Students
    ////////////////////////////////////////////////////////////////////

    // Direct to the home page
    app.get('/', function (req, res) {
        /*
        if (req.isAuthenticated()) {
            res.render('superLogin.ejs',
                {
                    user: req.user
                });
        } else {
            res.render('superLogin.ejs',
                {
                    user: null
                });
        }
        */
        res.render('studentHome.ejs', {});
    });

    // Direct to the home page
    app.get('/dispatcher', function (req, res) {
        res.render('index.ejs', {});
    });

    // Direct to the Gateway Shuttle Info page
    app.get('/shuttleInfo', function (req, res) {
        res.render('shuttleInfo.ejs', {});
    });

    // Direct to the SNAP Policy Page
    app.get('/policy', function (req, res) {
        res.render('policy.ejs', {});
    });

    // Adds the SNAP Ride Request newRequest to the AWS MySQL DB
    app.post('/submitRequest', function (req, res) {
        // Connect to the dispatcher database
        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Prepared statement to insert into newrequests table
        let addRequestStmt = 'INSERT INTO newRequests(rideTo, rideFrom, numPassengers, ' +
            'accommodations, timeIn) VALUES (?, ?, ?, ?, ?)';

        if (req.body.accommodations === "Insert Accommodations...") {
            req.body.accommodations = "";
        }

        let newRequest = [req.body.goingTo, req.body.comingFrom, req.body.numPassengers, req.body.accommodations, moment(new Date()).toString()];

        // Execute the insert statement
        dispatcherDB.query(addRequestStmt, newRequest, (err, results, fields) => {
            if (err) {
                return console.error(err.message);
            }
            dispatcherDB.end();
            // Sends the user back to the home page
            res.redirect('/');
        });
    });

    ////////////////////////////////////////////////////////////////////
    // WPI Dispatchers
    ////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////
    // Local Login for Super User
    ////////////////////////////////////////////////////////////////////
    app.get('/superLogin', function (req, res) {
        res.render('superLogin.ejs', {});
    });

    //Process superUser login form
    app.post('/submitSuperLogin', passport.authenticate('local-login', {
        successRedirect: '/superHome',
        failureRedirect: '/superLogin',
        failureFlash: true
    }));

    //TODO: Create Admin dashboard
    app.get('/superHome', function (req, res) {
        res.render('superDashboard.ejs', {});
    });

    // Direct to the home page
    app.get('/signUp', function (req, res) {
        res.render('signUp.ejs', {});
    });

    // Direct to the home page
    app.get('/addSuperUser', function (req, res) {
        res.render('signUp.ejs', {});
    });


    // Adds the SNAP Ride Request newRequest to the AWS MySQL DB
    app.post('/submitSuperUser', function (req, res) {

        if (req.body.password1 !== req.body.password2) {
            throw "Passwords are not matching."
        } else {

            // Connect to the dispatcher database
            let dispatcherDB = mysql.createConnection({
                host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
                port: '3306',
                user: 'masterAdmin',
                password: 'Pa55word',
                database: 'snapDB'
            });

            // Prepared statement to insert into newrequests table
            let addSuperstmt = 'INSERT INTO superUsers(username, password) VALUES (?, ?)';
            bcrypt.hash(req.body.password1, saltRounds).then(function(hash) {
                // Store hash in your password DB.
                let newSuperRequest = [req.body.firstName, req.body.lastName, req.body.emailAddress, hash];

                // Execute the insert statement
                dispatcherDB.query(addSuperstmt, newSuperRequest, (err, results, fields) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    dispatcherDB.end();
                    // Sends the user back to the home page
                    res.redirect('/superHome');
                });

            });
        }
    });

};