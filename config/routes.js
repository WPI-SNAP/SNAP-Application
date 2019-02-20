const mysql = require('mysql');
const moment = require('moment');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const http = require('http');
const bcrypt = require('bcrypt');
const saltRounds = 10;

let greatestRideId = 48;

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
        res.render('student/studentHome.ejs', {});
    });

    // Direct to the Gateway Shuttle Info page
    app.get('/shuttleInfo', function (req, res) {
        res.render('student/shuttleInfo.ejs', {});
    });

    // Direct to the SNAP Policy Page
    app.get('/policy', function (req, res) {
        res.render('student/policy.ejs', {});
    });

    // Adds the SNAP Ride Request newRequest to the AWS MySQL DB
    app.post('/studentSubmitRequest', function (req, res) {
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
            greatestRideId = fields;
            greatestRideId++;
            console.log("Greatest rideId = " + greatestRideId);
            res.redirect('/');
        });
    });

    ////////////////////////////////////////////////////////////////////
    // WPI Dispatchers
    ////////////////////////////////////////////////////////////////////
// Displays index (home) page
    app.get('/dispatcher', function (req, res) {
// Connect to the dispatcher database
        console.log("In route /");

        let allNewRequests = [];
        let currNewRequest = 0;
        let allProcessRequests = [];
        let currProcessRequest = 0;

        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });
        // Execute the insert statement
        dispatcherDB.query('SELECT * FROM newRequests', (err, rows) => {
            if (err) {
                return console.error(err.message);
            }
            else {

                for (let i in rows) {
                    allNewRequests[currNewRequest++] = {
                        idnewRequests: rows[i].idnewRequests,
                        rideTo: rows[i].rideTo,
                        rideFrom: rows[i].rideFrom,
                        numPassengers: rows[i].numPassengers,
                        accommodations: rows[i].accommodations,
                        timeIn: rows[i].timeIn
                    };
                }

                // Execute the insert statement
                dispatcherDB.query('SELECT * FROM inProcessRequests', (err, rows) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    else {
                        for (let i in rows) {
                            allProcessRequests[currProcessRequest++] = {
                                idinProcessRequests: rows[i].idinProcessRequests,
                                rideTo: rows[i].rideTo,
                                rideFrom: rows[i].rideFrom,
                                numPassengers: rows[i].numPassengers,
                                accommodations: rows[i].accommodations,
                                vanNumber: rows[i].vanNumber,
                                timeIn: rows[i].timeIn
                            };
                        }
                        dispatcherDB.end();

                        res.render('dispatcher/index.ejs', {
                            newRequestRows: allNewRequests,
                            inProcessRows: allProcessRequests
                        });
                    }
                });
            }
        });
    });

    // Displays AddRequest Page
    app.get('/addRequest', function (req, res) {
        res.render('dispatcher/addRequest.ejs');
    });

    // Displays Admin Page
    app.get('/admin', function (req, res) {
        res.render('dispatcher/admin.ejs');
    });

    // Adds the newRequest to the AWS MySQL DB
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

        let newRequest = [req.body.goingTo, req.body.comingFrom, req.body.numPassengers, req.body.accommodations, moment(new Date()).toString()];

        // Execute the insert statement
        dispatcherDB.query(addRequestStmt, newRequest, (err, results, fields) => {
            if (err) {
                return console.error(err.message);
            }
            // Retrieve inserted id
            console.log("Going to: " + req.body.goingTo);
            dispatcherDB.end();

            greatestRideId = results.insertId;
            console.log("Greatest rideId = " + greatestRideId);

            // Sends the user back to the home page
            res.redirect('/dispatcher');
        });
    });

    // Displays AssignRequest Page
    app.get('/assignNewRequest/*', function (req, res) {
        console.log("Inside assignRequest");
        let id = '';
        let allRequests = [];
        let currChar = '';
        let numSlash = 0;

        //Parse the URL and find the eventid
        for (let i=0; i<req.url.length; i++){
            currChar = req.url.charAt(i);
            if(currChar === '/'){
                numSlash++;
                continue;
            }
            if(numSlash === 2) id += currChar;
        }

        console.log('Got URL: ' + req.url);
        console.log('Looking for eventid: ' + id);

        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Execute the insert statement
        dispatcherDB.query('SELECT * FROM newRequests WHERE idnewRequests = ?', [id], (err, rows) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                for (let i in rows) {
                    allRequests = {
                        idnewRequests: rows[0].idnewRequests,
                        rideTo: rows[0].rideTo,
                        rideFrom: rows[0].rideFrom,
                        numPassengers: rows[0].numPassengers,
                        accommodations: rows[0].accommodations,
                        vanNumber: rows[0].vanNumber,
                        timeIn: rows[0].timeIn
                    };
                }
                dispatcherDB.end();
                res.render('dispatcher/assignNewRequest.ejs', {
                    request: allRequests
                });
            }
        });

    });

    // Adds the newRequest to the AWS MySQL DB
    app.post('/submitAssignNewRequest', function (req, res) {
        console.log("Inside submitAssignRequest");
        // Connect to the dispatcher database
        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });
        // Prepared statement to insert into newrequests table
        let addRequestStmt = 'INSERT INTO inProcessRequests(idinProcessRequests, rideTo, rideFrom, numPassengers, ' +
            'accommodations, vanNumber, timeIn) VALUES (?, ?, ?, ?, ?, ?, ?)';

        let newRequest = [req.body.requestID, req.body.goingTo, req.body.comingFrom, req.body.numPassengers, req.body.accommodations, req.body.vanNumber, req.body.timeIn];

        // Execute the insert statement
        dispatcherDB.query(addRequestStmt, newRequest, (err, results, fields) => {
            if (err) {
                return console.error(err.message);
            }
            // Retrieve inserted id
            console.log("Going to: " + req.body.goingTo);
        });

        // Execute the insert statement
        dispatcherDB.query('DELETE FROM newRequests WHERE idnewRequests = ?', [req.body.requestID], function (error, results, fields) {
            if (error) throw error;
            console.log('deleted ' + results.affectedRows + ' rows');
            dispatcherDB.end();
            // Sends the user back to the home page
            res.redirect('/dispatcher');
        });

    });

    // Displays DeleteRequest Page
    app.get('/deleteNewRequest/*', function (req, res) {
        console.log("Inside deleteRequest");
        let id = '';

        let allRequests = [];

        let currChar = '';
        let numSlash = 0;
        //Parse the URL and find the eventid
        for (let i=0; i<req.url.length; i++){
            currChar = req.url.charAt(i);
            if(currChar === '/'){
                numSlash++;
                continue;
            }
            if(numSlash === 2) id += currChar;
        }

        console.log('Got URL: ' + req.url);
        console.log('Looking for eventid: ' + id);

        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Execute the insert statement
        dispatcherDB.query('SELECT * FROM newRequests WHERE idnewrequests = ?', [id], (err, rows) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                for (let i in rows) {
                    allRequests = {
                        idnewRequests: rows[0].idnewRequests,
                        rideTo: rows[0].rideTo,
                        rideFrom: rows[0].rideFrom,
                        numPassengers: rows[0].numPassengers,
                        accommodations: rows[0].accommodations,
                        timeIn: rows[0].timeIn
                    };
                }
                dispatcherDB.end();
                res.render('dispatcher/deleteNewRequest.ejs', {
                    request: allRequests
                });
            }
        });
    });

    // Deletes requests from the AWS MySQL DB
    app.post('/submitDeleteNewRequest', function (req, res) {
        console.log("Inside submitDeleteRequest");
        // Connect to the dispatcher database
        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Prepared statement to insert into archivedRequests table
        let addArchivedRequestStmt = 'INSERT INTO archivedRequests(idarchivedRequests, rideTo, rideFrom, numPassengers, ' +
            'accommodations, timeIn) VALUES (?, ?, ?, ?, ?, ?)';

        let newRequest = [req.body.requestID, req.body.goingTo, req.body.comingFrom, req.body.numPassengers, req.body.accommodations, req.body.timeIn];

        // Execute the insert statement
        dispatcherDB.query(addArchivedRequestStmt, newRequest, (err, results, fields) => {
            if (err) {
                return console.error(err.message);
            }
            dispatcherDB.query('DELETE FROM newRequests WHERE idnewRequests = ?', [req.body.requestID], function (error, results, fields) {
                if (error) throw error;
                console.log('deleted ' + results.affectedRows + ' rows');
                // Sends the user back to the home page
                dispatcherDB.end();
                res.redirect('/dispatcher');
            });

        });


    });

    ////////////////////////////////////////////////////////////////
    // Do same steps for inProcess Requests
    ////////////////////////////////////////////////////////////////

    // Displays AssignProcessRequest Page
    app.get('/assignProcessRequest/*', function (req, res) {
        console.log("Inside assignProcessRequest");
        let id = '';

        let allRequests = [];


        let currChar = '';
        let numSlash = 0;
        //Parse the URL and find the eventid
        for (let i=0; i<req.url.length; i++){
            currChar = req.url.charAt(i);
            if(currChar === '/'){
                numSlash++;
                continue;
            }
            if(numSlash === 2) id += currChar;
        }

        console.log('Got URL: ' + req.url);
        console.log('Looking for eventid: ' + id);

        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Execute the insert statement
        dispatcherDB.query('SELECT * FROM inProcessRequests WHERE idinProcessRequests = ?', [id], (err, rows) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                for (let i in rows) {
                    allRequests = {
                        idinProcessRequests: rows[0].idinProcessRequests,
                        rideTo: rows[0].rideTo,
                        rideFrom: rows[0].rideFrom,
                        numPassengers: rows[0].numPassengers,
                        accommodations: rows[0].accommodations,
                        vanNumber: rows[0].vanNumber,
                        timeIn: rows[0].timeIn
                    };
                }
                dispatcherDB.end();
                res.render('dispatcher/assignProcessRequest.ejs', {
                    request: allRequests
                });
            }
        });

    });

    // Adds the newRequest to the AWS MySQL DB
    app.post('/submitAssignProcessRequest', function (req, res) {
        console.log("Inside submitAssignRequest");
        // Connect to the dispatcher database
        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Prepared statement to UPDATE into inProcessRequests table
        let updateRequestStmt = 'UPDATE inProcessRequests SET rideTo = ?, rideFrom = ?, numPassengers = ?,' +
            'accommodations = ?, vanNumber = ?, timeIn = ? WHERE idinProcessRequests = ?';

        let updateRequest = [req.body.goingTo, req.body.comingFrom, req.body.numPassengers, req.body.accommodations,
            req.body.vanNumber, req.body.timeIn, req.body.requestID];

        // Execute the insert statement
        dispatcherDB.query(updateRequestStmt, updateRequest, (err, results, fields) => {
            if (err) {
                return console.error(err.message);
            }

            dispatcherDB.end();
            res.redirect('/dispatcher');
        });


    });

    // Displays DeleteRequest Page
    app.get('/deleteProcessRequest/*', function (req, res) {
        console.log("Inside deleteRequest");
        let id = '';

        let allRequests = [];

        let currChar = '';
        let numSlash = 0;
        //Parse the URL and find the eventid
        for (let i=0; i<req.url.length; i++){
            currChar = req.url.charAt(i);
            if(currChar === '/'){
                numSlash++;
                continue;
            }
            if(numSlash === 2) id += currChar;
        }

        console.log('Got URL: ' + req.url);
        console.log('Looking for eventid: ' + id);

        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Execute the insert statement
        dispatcherDB.query('SELECT * FROM inProcessRequests WHERE idinProcessRequests = ?', [id], (err, rows) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                for (let i in rows) {
                    allRequests = {
                        idinProcessRequests: rows[0].idinProcessRequests,
                        rideTo: rows[0].rideTo,
                        rideFrom: rows[0].rideFrom,
                        numPassengers: rows[0].numPassengers,
                        accommodations: rows[0].accommodations,
                        vanNumber: rows[0].vanNumber,
                        timeIn: rows[0].timeIn
                    };
                }
                dispatcherDB.end();
                res.render('dispatcher/deleteProcessRequest.ejs', {
                    request: allRequests
                });
            }
        });
    });

    // Deletes requests from the AWS MySQL DB
    app.post('/submitDeleteProcessRequest', function (req, res) {
        console.log("Inside submitDeleteRequest");
        // Connect to the dispatcher database
        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Prepared statement to insert into archivedRequests table
        let addArchivedRequestStmt = 'INSERT INTO archivedRequests(idarchivedRequests, rideTo, rideFrom, numPassengers, ' +
            'accommodations, vanNumber, timeIn) VALUES (?, ?, ?, ?, ?, ?, ?)';

        let newRequest = [req.body.requestID, req.body.goingTo, req.body.comingFrom, req.body.numPassengers, req.body.accommodations, req.body.vanNumber, req.body.timeIn];

        // Execute the insert statement
        dispatcherDB.query(addArchivedRequestStmt, newRequest, (err, results, fields) => {
            if (err) {
                return console.error(err.message);
            }
            // Execute the insert statement
            dispatcherDB.query('DELETE FROM inProcessRequests WHERE idinProcessRequests = ?', [req.body.requestID], function (error, results, fields) {
                if (error) throw error;
                console.log('deleted ' + results.affectedRows + ' rows');
                // Sends the user back to the home page
                dispatcherDB.end();
                res.redirect('/dispatcher');
            });
        });
    });

    // Display Maintenance Page
    app.get('/maintenance', function (req, res) {
        let allMaintenance = [];
        let currMaintenance = 0;

        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Select Vans that are in maintenance (isMaintenanced = TRUE)
        dispatcherDB.query('SELECT * FROM vanStatus WHERE isMaintenanced = TRUE', (err, rows) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                for (let i in rows) {
                    allMaintenance[currMaintenance++] = {
                        idvanStatus: rows[i].idvanStatus,
                        vanNumber: rows[i].vanNumber,
                        vanInfo:rows[i].vanInfo
                    };
                }
                dispatcherDB.end();

                res.render('dispatcher/maintenance.ejs', {
                    maintenanceRows: allMaintenance
                });
            }
        })
    });

    // Display Maintenance Page
    app.get('/vanStatus', function (req, res) {
        let allVanStatus = [];
        let currVanStatus = 0;

        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Select all from vanStatus database
        dispatcherDB.query('SELECT * FROM vanStatus', (err, rows) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                for (let i in rows){
                    let bool= " " ;
                    if(rows[i].isMaintenanced == 0) {
                        bool = "false";
                    }else{
                        bool="true";
                    }
                    allVanStatus[currVanStatus++] = {
                        idvanStatus: rows[i].idvanStatus,
                        vanNumber: rows[i].vanNumber,
                        isMaintenanced:bool,
                        vanInfo:rows[i].vanInfo
                    };
                }
                dispatcherDB.end();

                res.render('dispatcher/vanStatus.ejs', {
                    vanStatusRows: allVanStatus
                });
            }
        })
    });

    app.get('/viewArchive', function (req, res) {
        console.log("Inside viewArchive");

        let allArchivedRequests = [];
        let currArchivedRequest = 0;

        let dispatcherDB = mysql.createConnection({
            host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
            port: '3306',
            user: 'masterAdmin',
            password: 'Pa55word',
            database: 'snapDB'
        });

        // Query all results from the archivedRequests table
        dispatcherDB.query('SELECT * FROM archivedRequests', (err, rows) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                for (let i in rows) {
                    allArchivedRequests[currArchivedRequest++] = {
                        idarchivedRequests: rows[i].idarchivedRequests,
                        rideTo: rows[i].rideTo,
                        rideFrom: rows[i].rideFrom,
                        numPassengers: rows[i].numPassengers,
                        accommodations: rows[i].accommodations,
                        vanNumber: rows[i].vanNumber,
                        timeIn: rows[i].timeIn
                    };
                }
                dispatcherDB.end();

                res.render('dispatcher/archive.ejs', {
                    archivedRequestRows: allArchivedRequests
                });
            }
        })
    });

    ////////////////////////////////////////////////////////////////////
    // Local Login for Super User
    ////////////////////////////////////////////////////////////////////
    app.get('/superLogin', function (req, res) {
        res.render('super/superLogin.ejs', {});
    });

    //Process superUser login form
    app.post('/submitSuperLogin', passport.authenticate('local-login', {
        successRedirect: '/superHome',
        failureRedirect: '/superLogin',
        failureFlash: true
    }));

    app.get('/superHome', function (req, res) {
        if(!req.isAuthenticated()) res.redirect('/superLogin');
        else {
            res.render('super/superDashboard.ejs', {});
        }
    });

    // Brings them to the admin sign up form
    app.get('/addSuperUser', function (req, res) {
        if(!req.isAuthenticated()) res.redirect('/superLogin');
        else {
            res.render('super/signUp.ejs', {});
        }
    });

    // Adds the SNAP Ride Request newRequest to the AWS MySQL DB
    app.post('/submitSuperUser', function (req, res) {
        if(!req.isAuthenticated()) res.redirect('/superLogin');
        else {
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
                bcrypt.hash(req.body.password1, saltRounds).then(function (hash) {
                    // Store hash in your password DB.
                    let newSuperRequest = [req.body.username, hash];

                    // Execute the insert statement
                    dispatcherDB.query(addSuperstmt, newSuperRequest, (err, results, fields) => {
                        if (err) {
                            return console.error(err.message);
                        }
                        console.log(results.insertId);
                        dispatcherDB.end();
                        // Sends the user back to the home page
                        res.redirect('/superHome');
                    });

                });
            }
        }
    });
};