var mongoose = require('mongoose');
var chatModel = require('../models/chat.js');

var opts = {
	useMongoClient : true,
	replset: {
		auto_reconnect: false,
		connectWithNoPrimary: true,
		ssl: true,
		sslValidate: false,
		socketOptions: {
			keepAlive: 1000,
			connectTimeoutMS: 30000
		}
	}
}
mongoose.connect(process.env.MONGODB_URI,opts);
// mongoose.connect(process.env.MONGODB_URI || 'localhost:27017/Huddlie');

var schema = mongoose.Schema;

var visitStatsSchema = new schema({
	visitorId: {type: String, required: true},
	socketId: {type: String, required: true},
	pageViews: {type: Number, min: 0},
	exitView: String,
	productCount: {type:Number, min: 0},
	sharedProductsCount: {type:Number, min: 0},
	startTime: {type: Date},
	endTime: {type: Date},
	totalTime: {type: Number, min: 0},//time spent in milliseconds
	chatId: String,
	initiator: {type: Boolean},
	addCart: {type: Boolean},
	addCartCount: {type: Number, min: 0},
	checkOutCart: {type: Boolean},
	checkOutCartCount: {type: Number, min: 0}
}, {collection: 'visitStats-data'});

var VisitStatsData = mongoose.model('VisitStatisticsData', visitStatsSchema);

var visitStart = function (user, attemptNumber, cb){
	var data = new VisitStatsData;

	var currentDateTime = new Date();

	data.visitorId = user.huddlieId;
	data.socketId = user.socketId;
	data.pageViews = 0;
	data.exitView = 'home';
	data.productCount = 0;
	data.sharedProductsCount = 0;
	data.startTime = currentDateTime;
	data.endTime = currentDateTime;
	data.totalTime = 0;
	data.chatId = '';
	data.initiator = false;
	data.addCart = false;
	data.addCartCount = 0;
	data.checkOutCart = false;
	data.checkOutCartCount = 0;

	data.save(function(err, doc){
		if (err || !doc || doc == null){
			cb(false, attemptNumber+1, user);
			console.log(err);
		}
		else
		{
			cb(true);
		}
	});
}

var visitEnd = function (user, attemptNumber, cb){
	VisitStatsData.findOne({'socketId': user.socketId}, function(err, doc){
		if (err || !doc || doc == null)
		{
			cb(false, attemptNumber+1, user);
		}
		else
		{
			doc.endTime = user.endTime;
			doc.totalTime = Math.abs(user.endTime - doc.startTime);
			doc.save();
			setTimeout(function(){
				cb(true);
			}, 1000);
		}
	});
}

var updateView = function (user, attemptNumber, cb){
	VisitStatsData.findOne({'socketId': user.socketId}, function(err, doc){
		if (err || !doc || doc == null)
		{
			cb(false, attemptNumber+1, user);
		}
		else
		{
			var pageViews = doc.pageViews;
			pageViews++;

			doc.pageViews = pageViews;
			doc.exitView = user.currentView;

			if (user.currentView == 'productDetail'){
				var productCount = doc.productCount;
				productCount++;

				doc.productCount = productCount;

				if (doc.chatId && doc.chatId != '' && doc.initiator && doc.initiator == true)
				{
					chatModel.updateProductCount({chatId: doc.chatId}, 0, chatProductCountUpdateCB);
				}
			}

			doc.save();
			setTimeout(function(){
				cb(true);
			}, 1000);
		}
	});
}

function chatProductCountUpdateCB (isSuccess, attemptNumber, chat)
{
	if (isSuccess && isSuccess == true){

	}
	else
	{
		if (attemptNumber && attemptNumber < 5)
		{
			chatModel.updateProductCount(chat, attemptNumber, chatProductCountUpdateCB);
		}
	}
}

var updateSharedProductsCount = function (user, attemptNumber, cb){
	VisitStatsData.findOne({'socketId': user.socketId}, function(err, doc){
		if (err || !doc || doc == null)
		{
			cb(false, attemptNumber+1, user);
		}
		else
		{
			var sharedProductsCount = doc.sharedProductsCount;
			sharedProductsCount++;

			doc.sharedProductsCount = sharedProductsCount;

			doc.save();
			setTimeout(function(){
				cb(true);
			}, 1000);
		}
	});
}

var updateCartCount = function (user, attemptNumber, cb){
	VisitStatsData.findOne({'socketId': user.socketId}, function(err, doc){
		if (err || !doc || doc == null)
		{
			cb(false, attemptNumber+1, user);
		}
		else
		{
			var addCartCount = doc.addCartCount;
			addCartCount++;

			doc.addCart = true;
			doc.addCartCount = addCartCount;

			doc.save();
			setTimeout(function(){
				cb(true);
			}, 1000);
		}
	});
}

var updateCheckOut = function (user, attemptNumber, cb){
	VisitStatsData.findOne({'socketId': user.socketId}, function(err, doc){
		if (err || !doc || doc == null)
		{
			cb(false, attemptNumber+1, user);
		}
		else
		{
			var checkOutCartCount = doc.checkOutCartCount;
			checkOutCartCount++;

			doc.checkOutCart = true;
			doc.checkOutCartCount = checkOutCartCount;

			doc.save();
			setTimeout(function(){
				cb(true);
			}, 1000);
		}
	});
}

var updateHuddle = function (user, attemptNumber, cb){
	VisitStatsData.findOne({'socketId': user.socketId}, function(err, doc){
		if (err || !doc || doc == null)
		{
			cb(false, attemptNumber+1, user);
		}
		else
		{
			doc.chatId = user.chatId;
			doc.initiator = user.initiator;

			doc.save();
			setTimeout(function(){
				cb(true);
			}, 1000);
		}
	});
}

exports.visitStart = visitStart;
exports.visitEnd = visitEnd;
exports.updateView = updateView;
exports.updateSharedProductsCount = updateSharedProductsCount;
exports.updateCartCount = updateCartCount;
exports.updateCheckOut = updateCheckOut;
exports.updateHuddle = updateHuddle;