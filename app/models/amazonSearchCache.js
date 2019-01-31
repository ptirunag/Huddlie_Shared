var mongoose = require('mongoose');
var amazonBrowseNodeTreeData = require('../models/amazonBrowseNodes');


// mongoose.connect(process.env.MONGODB_URI || 'localhost:27017/Huddlie');
mongoose.connect(process.env.MONGODB_URI, 	{
												autoReconnect: true,
												replicaSet: 'rs-ds217475'
											});

var schema = mongoose.Schema;

var cacheSchema = new schema({
	dept: {type: String, required: true},
	retailer: {type: String, required: true},
	keyw: {type: String},
	nodeId: {type: String},
	nodeName: {type: String},
	pagenum: {type: String},
	minPrice: {type: String},
	maxPrice: {type: String},
	brand: {type: String},
	displayBrands: {type: schema.Types.Mixed},
	discount: {type: String},
	isNodeBase: {type: Boolean},
	searchResponseItems: {type: schema.Types.Mixed},
	returnNodeId: {type: String},
	returnNodeName: {type: String},
	createdDate: {type: Date},
	modifiedDate: {type: Date}
}, {collection: 'amazonSearchCache-data'});

var CacheData = mongoose.model('AmazonSearchCacheData', cacheSchema);

var insertCache = function (cac, cb){
	CacheData.findOne({
		'dept': cac.dept,
		'retailer': cac.retailer,
		'keyw': cac.keyw,
		'nodeId': cac.nodeId,
		'nodeName': cac.nodeName,
		'pagenum': cac.pagenum,
		'minPrice': cac.minPrice,
		'maxPrice': cac.maxPrice,
		'brand': cac.brand,
		'discount': cac.discount,
		'createdDate':{$exists:true},
		'modifiedDate':{$exists:true}
	}, function(err2, doc2){
		if (err2 || !doc2 || doc2 == null){
			var data = new CacheData;

			data.dept = cac.dept;
			data.retailer = cac.retailer;
			data.keyw = cac.keyw;
			data.nodeId = cac.nodeId;
			data.nodeName = cac.nodeName;
			data.pagenum = cac.pagenum;
			data.minPrice = cac.minPrice;
			data.maxPrice = cac.maxPrice;
			data.brand = cac.brand;
			data.displayBrands = cac.displayBrands;
			data.discount = cac.discount;
			data.isNodeBase = cac.isNodeBase;
			data.searchResponseItems = cac.searchResponseItems;
			data.returnNodeId = cac.returnNodeId;
			data.returnNodeName = cac.returnNodeName;

			var today = new Date();
			// today.setDate(today.getDate()-1);
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
			});
		}
		else
		{
			doc2.displayBrands = cac.displayBrands;
			doc2.searchResponseItems = cac.searchResponseItems;
			doc2.returnNodeId = cac.returnNodeId;
			doc2.returnNodeName = cac.returnNodeName;

			var today = new Date();
			doc2.modifiedDate = today;

			if (!doc2.createdDate){
				doc2.createdDate = today;
			}

			doc2.save(function(err, doc){
				if (err || !doc || doc == null){
					cb(false);
					console.log(err);
				}
				else
				{	console.log('updated old entry');
					cb(true);
				}
			});
		}

	});
}

var getSearch = function(cac, cb){
	if (cac.nodeId && cac.nodeName && cac.retailer
		&& cac.nodeId != ''
		&& cac.nodeName != ''
		&& cac.retailer != ''
		&& (cac.retailer == 'US' || cac.retailer == 'IN')){
		var node = {
			'nodeId':cac.nodeId,
			'nodeName':cac.nodeName
		};

		amazonBrowseNodeTreeData.getImmediateChildren(node, cac.retailer, function(isSuccess, nodesReturned){
			var nodes = [];

			if (isSuccess == true){
				nodes = nodesReturned;
			}

			nodes.push(node);

			var nodeIdsOnly = [];
			var nodeNamesOnly = [];
			for (len=0; len<nodes.length; len++){
				nodeIdsOnly.push(nodes[len].nodeId);
				nodeNamesOnly.push(nodes[len].nodeName);
			}

			var searchResponseReturn = {
	            "dept":"",
	            "retailer":"",
	            "keywords":"",
	            "pagenum":"",
	            "browsenode":"",
	            "browsenodeName":"",
	            "minPrice":"",
	            "maxPrice":"",
	            "brand":"",
	            "displayBrands":[],
	            "discount":"",
	            "isNotInitialSearch": isNotInitialSearch,
	            "items":[],
	            "moreItems":[]
	        }

	        var otherMainQueryResults = [];
	        var maxQueryPageNum = 0;

			var cursor = CacheData.find({
										'dept':cac.dept,
										'retailer':cac.retailer,
										'keyw':cac.keyw,
										'nodeId':{$in: nodeIdsOnly},
										'nodeName':{$in: nodeNamesOnly},
										'createdDate':{$exists:true},
										'modifiedDate':{$exists:true}
										}).cursor();
			cursor.on('data', function(doc){
				var isInNodes = false;
				for (nodeIndex=0; nodeIndex < nodes.length; nodeIndex++){
					if (nodes[nodeIndex].nodeId == doc.nodeId
						&& nodes[nodeIndex].nodeName == doc.nodeName){
						isInNodes = true;
						break;
					}
				}

				if (isInNodes == true){
					if (doc.dept == cac.dept
						&& doc.retailer == cac.retailer
						&& doc.keyw == cac.keyw
						&& doc.nodeId == cac.nodeId
						&& doc.nodeName == cac.nodeName
						&& doc.minPrice == cac.minPrice
						&& doc.maxPrice == cac.maxPrice
						&& doc.brand == cac.brand
						&& doc.discount == cac.discount)
					{
						if (doc.pagenum == 1 || doc.pagenum == '1'){
							searchResponseReturn.dept = doc.dept;
				            searchResponseReturn.retailer = doc.retailer;
				            searchResponseReturn.keywords = doc.keyw;
				            searchResponseReturn.pagenum = doc.pagenum;
				            if (cac.getBrowseNodeFromResults == true){
				              searchResponseReturn.browsenode = doc.returnNodeId;
				              searchResponseReturn.browsenodeName = doc.returnNodeName;
				            }
				            else
				            {
				              searchResponseReturn.browsenode = doc.nodeId;
				              searchResponseReturn.browsenodeName = doc.nodeName; 
				            }
				            
				            searchResponseReturn.minPrice = doc.minPrice;
				            searchResponseReturn.maxPrice = doc.maxPrice;
				            searchResponseReturn.brand = doc.brand;
				            searchResponseReturn.displayBrands = doc.displayBrands;
				            searchResponseReturn.discount = doc.discount;
				            searchResponseReturn.items = doc.searchResponseItems;
						}	
						else
						{
							var tempItems = doc.searchResponseItems;
							if (tempItems && tempItems.constructor === Array && tempItems.length > 0){
								for (tempItemsIndex = 0; tempItemsIndex < tempItems.length; tempItemsIndex++){
									var item = tempItems[tempItemsIndex];

									var price = item.price;
									var brand = item.brand;
									 
								}
							}
						}
					}
				}
			});
			cursor.on('close', function(){

			});

		});
	}
	else
	{
		cb(false);
	}
}

var getOneCache = function(cac, cb){
	
	CacheData.findOne({
		'dept': cac.dept,
		'retailer': cac.retailer,
		'keyw': cac.keyw,
		'nodeId': cac.nodeId,
		'nodeName': cac.nodeName,
		'pagenum': cac.pagenum,
		'minPrice': cac.minPrice,
		'maxPrice': cac.maxPrice,
		'brand': cac.brand,
		'discount': cac.discount,
		'createdDate':{$exists:true},
		'modifiedDate':{$exists:true}
	}, function(err, doc){
		if (err || !doc || doc == null){
			cb(false, doc);
		}
		else
		{
			if (doc.modifiedDate){
				var one_day = 60*60*24*100; //60 sec * 60 min * 24 hrs * 100 ms/sec.
				var today = new Date();

				// console.log('dates:');
				// console.log(today);
				// console.log(doc.modifiedDate);
				// console.log(today - doc.modifiedDate);

				if ((today - doc.modifiedDate) < one_day){
					cb(true, doc);
				}
				else
				{
					// cb(false, doc);
					// TEMPORARILY ALLOWING OLD CACHE

					cb(true, doc);
				}
			}
			else
				{	
					cb(false, doc);
				}
		}
	});
}

var needsUpdating = function(cac, cb){

}

exports.insertCache = insertCache;
exports.getOneCache = getOneCache;