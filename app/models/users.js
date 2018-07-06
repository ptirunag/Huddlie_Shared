var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
	sessionId: {type: String, required: true},
	username: String,
	viewConfig: {
		shopView: Boolean,
		confView: Boolean,
		searchItemView: Boolean,
		itemDetailView: Boolean,
		showItems: Boolean
	},
	confId: String,
	shopId: String,
	sharedShopId: String,
	vidContId: String
}, {collection: 'user-data'});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.user.password);
};

userSchema.methods.updateUser = function(request, response){

	this.user.name = request.body.name;
	this.user.address = request.body.address;
	this.user.save();
	response.redirect('/user');
};

module.exports = mongoose.model('User', userSchema);