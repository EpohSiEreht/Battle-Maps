// Modules and Middleware
var express         = require('express'),
	app             = express(),
	port            = process.env.PORT || 8080,
	mongoose        = require('mongoose'),
	passport        = require('passport'),
	flash           = require('connect-flash'),
	morgan          = require('morgan'),
	cookieParser    = require('cookie-parser'),
	bodyParser      = require('body-parser'),
	methodOverride  = require('method-override'),
	session         = require('express-session'),
	configDB        = require('./config/database.js');

// Database configuration
mongoose.connect(configDB.url);

// Require passport configuration
require('./config/passport')(passport); // pass pasport for config

// Set up express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies
app.use(bodyParser.urlencoded({extended: true})); // get information from html forms
app.use(bodyParser.text());                                     // allows bodyParser to look at raw text
app.use(bodyParser.json({ type: 'application/vnd.api+json'})); 
app.use(bodyParser.json());  
app.use(methodOverride());

// Set up EJS template
app.set('view engine', 'ejs');

// Allow anything in the './app/public' to be served with manual routing
app.use(express.static('./app/public'));
// Use BowerComponents
app.use('/bower_components',  express.static(__dirname + '/bower_components')); 

// Passport configuration
app.use(session({
		secret: 'otterattack',
		resave:true,
		saveUninitialized:true
	})); // session stuff
app.use(passport.initialize()); // initialize passport
app.use(passport.session()); // persistent login sessions
app.use(flash()); // user connect-flash for flash messages stored in session

// Routes
require('./app/routes.js')(app, passport); // load our routes and passport into our app

// Listener
app.listen(port);
console.log('Successful landing on port ' + port);