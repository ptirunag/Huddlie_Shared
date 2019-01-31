var mongoose = require('mongoose');


mongoose.connect(process.env.MONGODB_URI || 'localhost:27017/Huddlie');

var schema = mongoose.Schema;

var productSchema = new schema({
	retailer: {type: String, required: true},
	itemId: {type: String, required: true},
	similarItems: {type: schema.Types.Mixed},
	mapVariations: {type: schema.Types.Mixed},
	allVariations: {type: schema.Types.Mixed},
	parentItem: {type: schema.Types.Mixed},
	createdDate: {type: Date},
	modifiedDate: {type: Date}
}, {collection: 'productCache-data'});

var ProductData = mongoose.model('ProductCacheData', productSchema);