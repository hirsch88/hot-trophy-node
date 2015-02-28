// server.js

// http://www.odindesign-themes.com/theBebop/comic/
// http://themeforest.net/item/fc-football-club-template-soccer-psd/9326478?WT.oss_phrase=soccer&WT.oss_rank=6&WT.z_author=uouapps&WT.ac=search_thumb

// http://bootstrapzero.com/
// http://github.hubspot.com/offline/docs/welcome/
// http://clrs.cc/
// http://tympanus.net/Development/IconHoverEffects/#set-9

// BASE SETUP
// =============================================================================
// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
//var fs = require('fs');
var logger = require('morgan');
//var methodOverride = require('method-override');
var glob = require('glob');
var log = require('./lib/logger');

// CONFIG -------------------------------
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('./config/config');


// MONGO DB -------------------------------
var mongoose = require('mongoose');
mongoose.connect(config.db);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
    log.success('Mongoose', 'Connection open to ' + config.db);
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
    log.error('Mongoose', 'Default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
    log.error('Mongoose', 'Default connection disconnected');
});


// PKG -------------------------------
var pkg = require('./package.json');


// PASSPORT JS -------------------------------
// Initialize Passport!  Note: no need to use session middleware when each
// request carries authentication credentials, as is the case with HTTP Basic.
var passport = require('./middleware/Passport');
app.use(passport.initialize());


// SERVER CONFIG -------------------------------
var port = process.env.PORT || config.port;        // set our port

app.use(logger('dev'));

// configure app to use bodyParser()
// this will let us get the data from a POST
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//app.use(methodOverride());
//app.disable('etag');


// MIDDLEWARE
// =============================================================================
var MiddleWareRouter = express.Router();              // get an instance of the express Router


// STATIC RESPONSES -------------------------------
var staticResponses = [];
glob.sync('api/responses/*.js', {}).forEach(function (file) {
    staticResponses.push(
        require('./' + file)
    );
});
app.use(staticResponses);


// CUSTOM MIDDLEWARE -------------------------------
MiddleWareRouter.use(require('./middleware/ContentTypeValidator'));
app.use('/api', MiddleWareRouter);


// CONFIGURATIONS -------------------------------
app.all('/api', function (req, res, next) {
    // set origin policy etc so cross-domain access wont be an issue
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Authorization, Content-Type, Accept");
    next();
});


// ERROR HANDLING -------------------------------
var errorHandlings = [];
glob.sync('./middleware/errorHandling/*.js', {}).forEach(function (file) {
    errorHandlings.push(
        require('./' + file)
    );
});
app.use(errorHandlings);


// ROUTES FOR OUR API
// =============================================================================


// LOGIN ROUTES -------------------------------
// curl -v -I -H "Content-Type:application/json" http://127.0.0.1:2002/api/auth/login
// curl -v -I -H "Content-Type:application/json" --user bob:secret http://127.0.0.1:2002/
var AuthCtrl = require('./api/controllers/Auth');
app.post('/api/auth/login',
    // Authenticate using HTTP Basic credentials, with session support disabled.
    passport.authenticate('basic', {session: false}),
    AuthCtrl.login
);


// SECURE ROUTES WITH ACCESS TOKEN -------------------------------
app.all('/api/secure/*',
    passport.authenticate('bearer', {session: false}),
    function (req, res, next) {
        console.log('*** SECURE ****');
        next();// pass control to the next handler
    }
);

// REGISTER OUR ROUTES -------------------------------
var routes = require('./config/routes');
app.use('/api', routes);



// START THE SERVER
// =============================================================================
app.listen(port);
log.divide();
log.success('Express', 'Is up and running @ port ' + port);
log.info('Environment', process.env.NODE_ENV);
module.exports = app;





// OLD STUFF =============================================================================
// PROTECTED ROUTES -------------------------------
//// all of our routes will be prefixed with /auth
////var AuthRoutes = require('./api/routes/AuthRoutes');
//app.use('/api/auth', [
//    require('./api/routes/auth/AuthRoutes')
//]);
//
//// all of our routes will be prefixed with /public
////var TeamRoutes = require('./api/routes/TeamRoutes');
//app.use('/api/public', [
//    require('./api/routes/secure/TeamRoutes')
//]);
//
//// all of our routes will be prefixed with /api
////var TeamRoutes = require('./api/routes/TeamRoutes');
//app.use('/api/secure', [
//    require('./api/routes/secure/TeamRoutes')
//]);
//app.all('/api/public/*', function (req, res, next) {
//    console.log('--- PUBLIC ---');
//    next();// pass control to the next handler
//});
//app.all('/api/auth/*', function (req, res, next) {
//    console.log('___ AUTH ___');
//    next();// pass control to the next handler
//});
//app.all('/api/secure/*', function (req, res, next) {
//    console.log('*** SECURE ****');
//    next();// pass control to the next handler
//});
