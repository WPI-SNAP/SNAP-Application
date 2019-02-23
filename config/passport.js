let LocalStrategy = require('passport-local').Strategy;
const metadata = require('passport-saml-metadata');
let SamlStrategy = require('passport-saml').Strategy;
let mysql = require('mysql');
let bcrypt = require('bcrypt');

let connection = mysql.createConnection({
    host: 'snapdispatcherdb.ca40maoxylrp.us-east-1.rds.amazonaws.com',
    port: '3306',
    user: 'masterAdmin',
    password: 'Pa55word',
    database: 'snapDB'
});

// expose this function to our app using module.exports
module.exports = function (app, passport, config) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.username);
    });

    // used to deserialize the user
    passport.deserializeUser(function (username, done) {

        let deserializeStmt = "SELECT * FROM superUsers WHERE username = ?";

        connection.query(deserializeStmt, username, function (err, rows) {
            done(err, rows[0]);
        });
    });


    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, username, password, done) {

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            connection.query("select * from users where username = '" + username + "'", function (err, rows) {
                console.log(rows);
                console.log("above row object");
                if (err)
                    return done(err);
                if (rows.length) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {

                    // if there is no user with that email
                    // create the user
                    var newUserMysql = new Object();

                    newUserMysql.username = username;
                    newUserMysql.password = password; // use the generateHash function in our user model

                    var insertQuery = "INSERT INTO superUsers (username, password) values ('" + username + "','" + password + "')";
                    console.log(insertQuery);
                    connection.query(insertQuery, function (err, rows) {
                        newUserMysql.id = rows.insertId;

                        return done(null, newUserMysql);
                    });
                }
            });
        }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, username, password, done) { // callback with email and password from our form

            let loginStatement = "SELECT * FROM superUsers WHERE username = ?";
            let loginInfo = [req.body.username];
            connection.query(loginStatement, loginInfo, function (err, rows) {
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }
                bcrypt.compare(req.body.password.toString(), rows[0].password.toString(), function (err, res) {
                    if(err) {
                        console.log(err);
                    }
                    // all is well, return successful user
                    console.log(res);
                    if (res === true) {
                        return done(null, rows[0]);
                    }
                    else {
                        return done(null, false, req.flash('loginMessage', 'Invalid username or password'));
                    }
                });

            });

        }));

    ////////////////////////////////////////////////////////////
    // SAML Logins
    ////////////////////////////////////////////////////////////
    metadata.fetch(config.passport.saml.metadata)
        .then(function (reader) {
            const strategyConfig = metadata.toPassportConfig(reader);
            strategyConfig.realm = config.passport.saml.issuer, strategyConfig.protocol = 'samlp';

            passport.use('saml', new SamlStrategy(strategyConfig, function (profile, done) {
                profile = metadata.claimsToCamelCase(profile, reader.claimSchema);
                return done(null, profile);
            }));

            passport.serializeUser(function(user, done) {
                done(null, user);
            });

            passport.deserializeUser(function(user, done) {
                done(null, user);
            });
        })
        .catch((err) => {
            console.error('Error loading SAML metadata', err);
            process.exit(1);
        });
};