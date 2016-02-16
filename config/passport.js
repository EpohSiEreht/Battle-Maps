var LocalStrategy = require('passport-local').Strategy,
	User          = require('../app/models/user');

module.exports = function(passport) {
	// Serialize user for session
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});
	// Deserialize the user
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	// Local signup
	passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
	        // Find user in db
	        User.findOne({ 'local.email' :  email }, function(err, user) {
	            // if there are any errors, return the error
	            if (err) { return done(err); }
	            // check to see if theres already a user with that email
	            if (user) {
	                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
	            } else {
	            	console.log('USERNAME', req.body.username);
	            	console.log('CHARACTER', req.body.character);
	            	console.log('REQ BODDIEESSS', req.body);
	                // If user doesn't exist, create new user
	                var newUser            = new User();

	                // Set user credentials
	                newUser.local.email    = email;
	                newUser.local.username = req.body.username;
	                newUser.local.latitude = "";
	                newUser.local.longitude = "";
	                newUser.local.character = req.body.character;
	                newUser.local.lives = 5;
	                newUser.local.exp = 125;
	                newUser.local.lvl = 5;
	                newUser.local.trainer = req.body.trainer;
	                newUser.local.password = newUser.generateHash(password);
	                // Save user
	                newUser.save(function(err) {
	                    if (err) { throw err; }
	                    return done(null, newUser);
	                });
	            }
	        });    
        });
    }));

	// Local login
	passport.use('local-login', new LocalStrategy({
		usernameField     : 'email',
		passwordField     : 'password',
		passReqToCallback : true
	},
	function(req, email, password, done) {
		User.findOne({ 'local.email' : email }, function(err, user) {
			if (err) { return done(err) };
			if (!user) { return done(null,false, req.flash('loginMessage', 'No user found.')); }
			if (!user.validPassword(password)) { return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); }
			return done(null, user);
		});
	}
	));
};