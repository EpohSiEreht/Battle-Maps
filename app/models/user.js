var mongoose = require('mongoose'),
	bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
	local : {
		email: {type: String},
		password: {type: String},
		username: {type: String},
		latitude: {type: Number},
		longitude: {type: Number},
		character: {type: String},
		lives: {type: Number},
		exp: {type: Number},
		lvl: {type: Number},
		trainer: {type: String},
		created_at: {type: Date, default: Date.now},
    	updated_at: {type: Date, default: Date.now}

	},
	google : {
		id: {type: String},
		token: {type: String},
		email: {type: String},
		name: {type: String}
	}
});

// Methods
userSchema.pre('save', function(next){
    now = new Date();
    this.updated_at = now;
    if(!this.created_at) {
        this.created_at = now
    }
    next();
});
userSchema.index({location: '2dsphere'});
// Generate a hash (a fixed-length string of bits)
userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
// Validate password
userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.local.password);
};

// Create model for users so that it can be utitlized in our app
module.exports = mongoose.model('User', userSchema);

