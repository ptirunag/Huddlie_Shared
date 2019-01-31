var mongoose = require('mongoose');

// var opts = {
// 	useMongoClient : true,
// 	replset: {
// 		auto_reconnect: false,
// 		connectWithNoPrimary: true,
// 		ssl: true,
// 		sslValidate: false,
// 		socketOptions: {
// 			keepAlive: 1000,
// 			connectTimeoutMS: 30000
// 		}
// 	}
// }
// mongoose.connect(process.env.MONGODB_URI,opts);
mongoose.connect(process.env.MONGODB_URI || 'localhost:27017/Huddlie');

var schema = mongoose.Schema;

var itemSchema = new schema({
	retailer: {type: String, required: true},
	itemId: {type: String, required: true},
	similarItems: {type: schema.Types.Mixed},
	mapVariations: {type: schema.Types.Mixed},
	allVariations: {type: schema.Types.Mixed},
	parentItem: {type: schema.Types.Mixed},
	createdDate: {type: Date},
	modifiedDate: {type: Date}
}, {collection: 'amazonItemCache-data'});

var ItemData = mongoose.model('AmazonItemCacheData', itemSchema);

var insertCache = function (cac, cb){
	var data = new ItemData;

	data.retailer = cac.retailer;
	data.itemId = cac.itemId;
	data.similarItems = cac.similarItems;
	data.mapVariations = cac.mapVariations;
	data.allVariations = cac.allVariations;
	data.parentItem = cac.parentItem;
	var today = new Date();

	data.createdDate = today;
	data.modifiedDate = today;

	data.save(function(err, doc){
		if (err || !doc || doc == null){
			cb(false);
			console.log(err);
		}
		else
		{
			cb(true);
		}
	})
}

var getOneCache = function(cac, cb){
	ItemData.findOne({
		'retailer': cac.retailer,
		'itemId': cac.itemId
	}, function(err, doc){
		if (err || !doc || doc == null){
			cb(false, doc);
		}
		else
		{
			cb(true, doc);
		}
	});
}

exports.insertCache = insertCache;
exports.getOneCache = getOneCache;












