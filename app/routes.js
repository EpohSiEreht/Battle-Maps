var User            = require('../app/models/user');

module.exports = function(app, passport) {
	// Homepage
	app.get('/', function(req, res) {
		res.render('index.ejs');
	});
	// Login
	app.get('/login', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});
	// Signup
	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});
	// Process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile',
		failureRedirect : '/signup',
		failureFlash    : true
	}));
	// Process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile',
		failureRedirect : '/login',
		failureFlash    : true
	}));
	// Profile
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user  // get the user out of session and pass to template
			});
	});
	// Logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	// Retrieve records for all users in the db
    app.get('/users', function(req, res){
        // Uses Mongoose schema to run the search (empty conditions)
        var query = User.find({});
        query.exec(function(err, users){
            if(err)
                res.send(err);
            // If no errors are found, it responds with a JSON of all users
            res.json(users);
        });
    });
    app.put('/users', function(req, res){
        // Uses Mongoose schema to run the search (empty conditions)
        User.findByIdAndUpdate(req.params.id, req.user.local, { new: true }, function(err, user){
		  	console.log(user, 'user?');
		  	if (err) { console.log('Unsucessful') };
		    res.json( user );
		  });
    });
    // Retrieve current user
    app.get('/currentUser', function(req, res){
		res.send(req.user);
    });
    // Retrieve records for specific user in the db
    app.get('/users/:id', function(req, res){
    	User.findById( req.params.id, function( err, user ){
		    if (err) {};
		    res.json( user.local );
		  });
    });
    app.patch('/users/:id', function(req, res){
    	console.log(req.body, "req.body.local");

      User.findOne({_id: req.params.id}, function(err, dbUser) {

      	dbUser.local.latitude = req.body.local.latitude;
      	dbUser.local.longitude = req.body.local.longitude;
      	dbUser.local.exp = req.body.local.exp;
      	dbUser.local.lives = req.body.local.lives;
      	dbUser.local.lvl = req.body.local.lvl;
      	dbUser.local.character = req.body.local.character;

      	dbUser.save(function(err, updatedUser) {
		  	if (err) { console.log('Unsucessful') };
		    res.json( updatedUser );

      	});
      });

	  // User.findByIdAndUpdate(req.params.id, { latitude: 50.7400308, longitude: -73.98994330000001 }, { new: true }, function(err, user){
	  // 	console.log(user, "user");
	  // 	console.log(err, "err");
	  // 	if (err) { console.log('Unsucessful') };
	  //   res.json( user );
	  // });

	});


};

// Route middleware to confirm user login
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect('/');
}

function getUserId(req, res) {
	return res.send(req.user);
}