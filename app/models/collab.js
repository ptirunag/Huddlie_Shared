var mongoose = require('mongoose');

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

var collabSchema = new schema({
	visitorId: {type: String, required: true},
	socketId: {type: String, required: true},
	wishlistId: {type: String},
	wishlistName: {type: String},
	items:[{type: schema.Types.Mixed}],
	finilized: {type: Boolean}
}, {collection: 'collab-data'});

var CollabData = mongoose.model('CollabData', collabSchema);

var createWishlistAndAddItem = function(data, attemptNumber, cb) {
	var visitorId = data.visitorId;
	var socketId = data.socketId;
	var wishlistId = data.wishlistId;
	var wishlistName = data.wishlistName;
	var items = [];
	items.push(data.item);
	var finilized = false;

	var collab = new CollabData;
	collab.visitorId = visitorId;
	collab.socketId = socketId;
	collab.wishlistId = wishlistId;
	collab.wishlistName = wishlistName;
	collab.items = items;
	collab.finilized = finilized;
	collab.save(function(err, doc){
		if (err || !doc || doc == null){
			cb(false, attemptNumber+1, data);
			console.log(err);
		}
		else
		{
			var wishlist = {wishlistId:doc.wishlistId,
							wishlistName:doc.wishlistName,
							itemCount:doc.items.length}
			cb(true, 0, {wishlist:wishlist});
		}
	});
}

var insertWishlistItem = function (data, attemptNumber, cb) {
	var visitorId = data.visitorId;
	var wishlistId = data.wishlistId;
	var item = data.item;

	CollabData.findOne({'visitorId': visitorId, 
						'wishlistId': wishlistId, 
						'finilized': false}, function(err, doc){
		if (err || !doc || doc == null) 
		{
			cb(false, attemptNumber+1, data);
			console.log(err);
		}
		else
		{
			var items = doc.items;
			items.push(item);
			doc.items = items;
			doc.save(function(err2, doc2){
				if (err2 || !doc2 || doc2 == null){
					cb(false, attemptNumber+1, data);
					console.log(err2);
				}
				else
				{
					var wishlist = {wishlistId:doc2.wishlistId,
									wishlistName:doc2.wishlistName,
									itemCount:doc2.items.length}
					cb(true, 0, {wishlist:wishlist});
				}
			});
		}
	})
}

var getWishlist = function (data, attemptNumber, cb) {
	var visitorId = data.visitorId;
	var wishlistId = data.wishlistId;

	CollabData.findOne({'visitorId': visitorId,
						'wishlistId': visitorId}, function(err, doc){
		if (err || !doc || doc == null)
		{
			cb(false, attemptNumber+1, data);
			console.log(err);
		}
		else
		{
			var returnData = {
				wishlistId: doc.wishlistId,
				wishlistName: doc.wishlistName,
				items: doc.items,
				finilized: doc.finilized
			}
			cb(true);
		}
	});
}

var getActiveWishlists = function (data, attemptNumber, cb) {
	var visitorId = data.visitorId;

	var wishlists = [];

	var cursor = CollabData.find({'visitorId': visitorId, 'finilized': false}).cursor();
	cursor.on('data', function(doc){
		var wishlist = {
			wishlistId: doc.wishlistId,
			wishlistName: doc.wishlistName,
			itemCount: doc.items.length
		}
		wishlists.push(wishlist);
	});

	cursor.on('close', function(){
		if (wishlists.length > 0)
		{
			cb(true, attemptNumber, wishlists);	
		}
		else
		{
			cb(false, attemptNumber+1, data);
		}
	});
}

exports.createWishlistAndAddItem = createWishlistAndAddItem;
exports.insertWishlistItem = insertWishlistItem;
exports.getWishlist = getWishlist;
exports.getActiveWishlists = getActiveWishlists;