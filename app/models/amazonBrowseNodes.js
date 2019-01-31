var mongoose = require('mongoose');

// var opts = {
// 	useMongoClient:true,
// 	auth: {
// 		authdb: 'heroku_kw3mx5qs'
// 	} 
// }
// mongoose.connect(process.env.MONGODB_URI,opts);
mongoose.connect(process.env.MONGODB_URI || 'localhost:27017/Huddlie');

var schema = mongoose.Schema;

var treeSchema = new schema({
	nodeId: {type: String, required: true},
	nodeName: {type: String, required: true},
	parentNodeId:String,
	parentName: String,
	rootNodeId: String,
	rootNodeName: String,
	order: {type: Number, min: 0},
	childrenCount: {type: Number, min: 0},
	retailer: String,
	finalized: String,
	displayBrands: {type: schema.Types.Mixed},
	pathString: String,
	path: [{
		pathNodeId: String,
		pathNodeName: String
	}]
}, {collection: 'amazonBrowseNodeTree-data'});

var TreeData = mongoose.model('BrowseNodeTreeData', treeSchema);

var errLog = [];

var insertNode = function(node, cb){
	var data = new TreeData;

	data.nodeId = node.nodeId;
	data.nodeName = node.nodeName;
	data.parentNodeId = node.parentNodeId;
	data.parentName = node.parentName;
	data.order = node.order;
	data.retailer = node.retailer;

	data.save(function(err, doc){
		if (err){
			cb(false);
			console.log(err);
		}
		else
		{
			cb(true, {nodeId: doc.nodeId, nodeName: doc.nodeName, parentNodeId: doc.parentNodeId, parentName: doc.parentName, order: doc.order});
		}
	});
}

var removeAllNodes = function(cb){
	console.log('remove clicked');
	// TreeData.remove({$or : [{'finalized':'false'},{'finalized':{$exists:false}}]}, function(){
	// });
	// TreeData.find({$or : [{'finalized':'false'},{'finalized':{$exists:false}}]}).then(function(doc){
	// 	if (doc && doc.length > 0){
	// 		var nodes = [];
	// 		for(i=0; i<doc.length; i++){
	// 			nodes.push(doc[i]);
	// 		}
	// 		cb(nodes);
	// 	}
	// });
	var nodes = [];
	var cursor = TreeData.find({$or : [{'finalized':'false'},{'finalized':{$exists:false}}]}).cursor();
	
	cursor.on('data', function(doc){
		nodes.push(doc);
		doc.remove();
	});

	cursor.on('close', function(){
		cb(nodes);
	});
}

var getAllNodes = function(cb){
	TreeData.find().then(function(doc){
		console.log('i was here first');
		cb(doc);
	});
}

var finalize = function(cb){
	// TreeData.find().then(function(doc){
	// 	if (doc.length > 0){
	// 		for (i=0; i< doc.length; i++){
	// 			var node = doc[i];
	// 			if (!node.finalized || node.finalized == 'false'){		
	// 				// console.log(node);
	// 				TreeData.findOne({'nodeId': node.nodeId,
	// 								'nodeName':node.nodeName,
	// 								'retailer':node.retailer}, function(err, doc2){
	// 									if (err){
	// 										console.log(err);
	// 										console.log(node);
	// 									}
	// 					if(doc2){
	// 						doc2.finalized = 'true';
	// 						doc2.save();
	// 					}
	// 				});
	// 			}
	// 			else
	// 			{
	// 				// console.log(node.finalized);
	// 			}
	// 		}
	// 	}
	// });
	var nodes = [];
	var cursor = TreeData.find({$or : [{'finalized':'false'},{'finalized':{$exists:false}}]}).cursor();

	cursor.on('data', function(doc){
		if (!doc.rootNodeId || (doc.rootNodeId == '' && doc.parentNodeId != '') || 
			!doc.path || (doc.path.length == 0 && doc.parentNodeId != '')){

		}
		else
		{
			nodes.push(doc);
			doc.finalized = 'true';
			doc.save();
		}
	});

	cursor.on('close', function(){
		cb(nodes);
	});
}

var setRootNodeIdAndName = function(){
	// TreeData.find().then(function(doc){
	// 	//{ $or:[ {'rootNodeId':''}, {'rootNodeName':''}]}
	// 	if (doc.length > 0){
	// 		for (i=0; i< doc.length; i++){
	// 			var node = doc[i];
	// 			if (!node.rootNodeId || !node.rootNodeName){		
	// 				console.log('i was here');
	// 				TreeData.findOne({'nodeId': node.nodeId,
	// 									'nodeName':node.nodeName,
	// 									'retailer':node.retailer}, function(err, doc2){
	// 					if (doc2 && doc2.path && doc2.path.length > 0){
	// 						var index = doc2.path.length - 1;
	// 						var rootNode = doc2.path[index];
							
	// 						doc2.rootNodeId = rootNode.pathNodeId;
	// 						doc2.rootNodeName = rootNode.pathNodeName;
	// 						doc2.save();			
	// 					}
	// 					else
	// 					{
	// 						if (err){
	// 							console.log(err);
	// 						}
	// 						console.log(node);
	// 					}
	// 				});
	// 			}
	// 		}
	// 	}
	// 	else
	// 	{
	// 		console.log('all nodes have roots');
	// 	}
	// });
	var cursor = TreeData.find({$or:[{'rootNodeId':{$exists:false}},
										{'rootNodeId':''},
										{'rootNodeName':{$exists:false}},
										{'rootNodeName':''}
									]}).cursor();
	var counter = 0;

	cursor.on('data',function(doc){
		counter++;
		console.log(doc);
		if (doc && doc.path && doc.path.length > 0){
			var index = doc.path.length - 1;
			var rootNode = doc.path[index];
			
			doc.rootNodeId = rootNode.pathNodeId;
			doc.rootNodeName = rootNode.pathNodeName;
			doc.save();			
		}
	});

	cursor.on('close',function(){
		console.log('done'+counter);
	});
}

var removeDuplicates = function(){
	var cursor = TreeData.find({}).cursor();
	var counter = 0;

	cursor.on('data', function(doc){
		var cursor2 = TreeData.find({'_id':{$ne: doc._id},
									'nodeId': doc.nodeId,
									'nodeName': doc.nodeName,
									'parentNodeId': doc.parendNodeId,
									'parentName': doc.parentName,
									'retailer': doc.retailer}).cursor();
		var counter2 = 0;

		cursor2.on('data', function(doc2){
			counter2++;
			doc2.remove();
		});
		cursor2.on('close', function(){
			if (counter2 > 0){
				counter+= counter2;
				console.log('done2');
				console.log('counter 2:'+counter2);
			}
		});
	});

	cursor.on('close', function(){
		console.log('done');
		console.log('counter:'+counter);
	});
}

var getMultiLevel = function(nodeId, retailer, cb){
	console.log(nodeId+'-'+retailer);
	TreeData.find({'rootNodeId': {$exists:true},'rootNodeId':nodeId, 'retailer':retailer})
		.sort({'order':1})
		.then(function(doc){
		TreeData.find({'rootNodeId':{$exists:false},'retailer':retailer}).then(function(doc2){
				cb(true,doc, doc2);
		});
	});
}

// var getMultiLevel2 = function (nodeId, cb) {
// 	var results = [];
// 	TreeData.find({'parentNodeId':nodeId}).sort('order').then(function(doc){
// 		if (doc.length > 0){
// 			results.push(doc);

// 			var moreChildren = true;
// 			var parentArray = doc;

// 			while (moreChildren){
// 				console.log('i was here');
// 				var childArray = [];
// 				var limit = parentArray.length - 1;

// 				for(i=0;i<parentArray.length;i++){
// 					console.log(limit);
// 					console.log('i was here 2: '+i);
// 					TreeData.find({'parentNodeId': parentArray[i].nodeId}).sort('order').then(function(doc2){
// 						if (doc2.length > 0){
// 							console.log('i was here 3');
// 							childArray = childArray.concat(doc2);
// 						}
// 					});

// 					if (i == limit){
// 						console.log(childArray);
// 						if (childArray.length > 0){
// 							console.log('i was here 4');
// 							results.push(childArray);
// 							parentArray = childArray;
// 							childArray = [];
// 						}
// 						else
// 						{
// 							console.log('i was here 5');
// 							moreChildren = false;
// 							cb(true, results);	
// 						}
// 					}
// 				}
// 			}
// 		}
// 	});
// }

var findOneNode = function(nodeId, cb){
	TreeData.findOne({'nodeId': nodeId}, function(err, doc){
		cb(doc);
	})
}

var findOneNodeForPath = function(nodeId, cb){
	TreeData.findOne({'nodeId': nodeId}, function(err, doc){
		if (doc.parentNodeId !== ''){
			cb(true, doc);
		}
		else {
			cb(false, doc);
		}
	});
}

var getPathChildren = function(nodeId, cb){
	TreeData.find({'parentNodeId': nodeId}).sort('order').then(function(doc){
		if (doc.length > 0){
			cb(doc);
		}
		else {
			var empty = [];
			cb(empty);
		}
	});
}

var getNodePathAndChildren = function(nodeId, nodeName, retailer, cb){

	var path = [];
	var children = [];
	var retailerVal = 'AMZNIN';
	var displayBrands = [];

	if (retailer == 'IN'){
		retailerVal = 'AMZNIN';
	}
	if (retailer == 'US'){
		retailerVal = 'AMZNUS';
	}

	TreeData.findOne({'nodeId': nodeId, 'nodeName': nodeName, 'retailer': retailerVal}, function(err, doc){
		if (err){
			cb(false, [], []);
		}
		else
		{
			if (doc && doc.path) {
				path = doc.path;
				if (doc.displayBrands && doc.displayBrands.constructor === Array && doc.displayBrands.length > 0)
				{
					displayBrands = doc.displayBrands;
				}

				TreeData.find({'parentNodeId': nodeId, 'parentName': nodeName, 'retailer': retailerVal}).then(function(doc2){
					if (doc2.length > 0){
						children = doc2;
					}

					cb(true, path, children, displayBrands);
				});
			}
			else 
			{
				cb(false, [], []);
			}

		}
	});

	// var path = [];
	// TreeData.findOne({'nodeId': nodeId}, function(err, doc){
	// 	var item = doc;
	// 	path.push(item);
	// 	var isParent = false;

	// 	if (item.parentNodeId !== ''){
	// 		console.log('true');
	// 		isParent = true;
	// 	}

	// 	while (isParent == true){
	// 		TreeData.findOne({'nodeId': item.parentNodeId}, function(err, doc2){
	// 			if (err){
	// 				console.log('err');
	// 			}
	// 			else {
	// 				console.log(item.parentNodeId+', '+doc2.nodeId);
	// 				item = doc2;
	// 				path.push(item);

	// 				if (item.parentNodeId == ''){
	// 					isParent = false;
	// 				}
	// 			}
	// 		});
	// 	}

	// 	cb(path);
	// });

}

var setPaths = function(){
	TreeData.find().then(function(doc){
		for (i=0; i< doc.length; i++){
			var node = doc[i];

			if (node.parentNodeId == ''){
				TreeData.findOne({'nodeId': node.nodeId}, function(err, doc2){
					var path = [];
					doc2.path = path;
					doc2.save();
				});
			}
			else {
				errLog = [];
				setPathForNode(true, node.nodeId, node.nodeName, node.parentNodeId, node.parentName, 0);	
			}
		}
	});
}

var newSetPaths = function(cb){
	var cursor = TreeData.find({}).toArray();
	// cb()

	// var total = 0;

	// cursor.on('data', function(doc){
	// 	if (doc.parentNodeId == ''){
	// 		doc.path = [];
	// 		doc.save();
	// 		console.log('1');
	// 	}
	// 	else
	// 	{
	// 		console.log('2');
	// 		var bool = true;
	// 		var level = 0;
	// 		var errCounter = 0;
	// 		var path = [];
			
	// 		var nodeId = doc.parentNodeId;
	// 		var nodeName = doc.parentName;
	// 		var retailer = doc.retailer;

	// 		var pathItem = {pathNodeId: nodeId, pathNodeName: nodeName};
	// 		path.push(pathItem);

	// 		while(bool == true && level < 20 && errCounter <20){
	// 			console.log(3);
	// 			TreeData.findOne({'nodeId':nodeId,
	// 											'nodeName':nodeName,
	// 											'retailer':retailer}, function(err, doc2){
	// 												console.log('yes');
	// 				if (err){
	// 					errCounter++;
	// 				}
	// 				else
	// 				{
	// 					if (doc2.parentNodeId != ''){
	// 						nodeId = doc2.parentNodeId;
	// 						nodeName = doc2.parentNodeName;

	// 						var pathItem2 = {pathNodeId: nodeId, pathNodeName: nodeName};
	// 						path.push(pathItem2);

	// 						level++;
	// 						errCounter = 0;
	// 					}
	// 					else
	// 					{
	// 						bool = false;
	// 					}
	// 				}

	// 			});
	// 		}

	// 		doc.path = path;
	// 		doc.save();
	// 		total++;
	// 		console.log(total);
	// 	}
	// });

	// cursor.on('close', function(){
	// 	console.log('done');
	// });
}

var getChildLevelNodes = function(cac, cb){
	
	var cursor = TreeData.find({'rootNodeId':cac.nodeId,
								'rootNodeName':cac.nodeName,
								'retailer':cac.retailer,
								'path':{$exists:true}}).cursor();
	
	var nodeArray = [];

	cursor.on('data', function(data){
		if (data && data != null && data.path 
				&& data.path.constructor === Array && data.path.length > 0){
			if (data.path.length <= cac.levels){
				nodeArray.push({
								'nodeId':data.nodeId,
								'nodeName':data.nodeName,
								'retailer':data.retailer,
								'dept':cac.dept
								});
			}
		}
	});

	cursor.on('close', function(){
		
		if (nodeArray.length > 0){
			cb(true, nodeArray);
		}
		else
		{
			cb(false);
		}
	});
}

var setPathForNode = function(isInitial, nodeId, nodeName, parentNodeId, parentName, count){
	if (isInitial){
		TreeData.findOne({'nodeId': nodeId, 'nodeName': nodeName}, function(err, doc){
			if (err){
				console.log('err11');
			}
			else
			{
				var path = [];
				var pathItem = {pathNodeId: parentNodeId, pathNodeName: parentName};
				path.push(pathItem);

				doc.path = path;
				doc.save(function (err, doc3){
					console.log('err12-'+(count+1));
					if (err){
						if (errLog.indexOf(nodeId) == -1){
							errLog.push(nodeId);
						}

						var cnt = count+1;
						setPathForNode(false, nodeId, nodeName, parentNodeId, parentName, cnt);
					}
					else
					{
						if (errLog.indexOf(nodeId) !== -1){
							const index = errLog.indexOf(nodeId);
	    
						    if (index !== -1) {
						        errLog.splice(index, 1);
						    }

						    console.log(errLog);
						}

						setTimeout(function(){
							TreeData.findOne({'nodeId': parentNodeId, 'nodeName': parentName}, function(err, doc2){
								if (!err && doc2 && doc2.parentNodeId && doc2.parentNodeId != ''){
									setPathForNode(false, nodeId, nodeName, doc2.parentNodeId, doc2.parentName, 0);
								}

								if (err){
									console.log('err13');
								}
								else {
								}
							});
						}, 1000);
					}
				});
			}
		});
	}
	else
	{
		TreeData.findOne({'nodeId': nodeId, 'nodeName': nodeName}, function(err, doc){
			if (err){
				console.log('err21'+nodeId+nodeName);
			}
			else
			{
				var path = doc.path;
				var pathItem = {pathNodeId: parentNodeId, pathNodeName: parentName};
				path.push(pathItem);

				doc.path = path;
				doc.save(function (err, doc3){
					if (err){
						console.log('err22-'+(count+1));
						if (errLog.indexOf(nodeId) == -1){
							errLog.push(nodeId);
						}
						
						var cnt = count+1;
						setPathForNode(false, nodeId, nodeName, parentNodeId, parentName, cnt);
					}
					else
					{
						if (errLog.indexOf(nodeId) !== -1){
							const index = errLog.indexOf(nodeId);
	    
						    if (index !== -1) {
						        errLog.splice(index, 1);
						    }

						    console.log(errLog);
						}

						setTimeout(function(){
							TreeData.findOne({'nodeId': parentNodeId, 'nodeName': parentName}, function(err, doc2){
								if (!err && doc2 && doc2.parentNodeId && doc2.parentNodeId != ''){
									setPathForNode(false, nodeId, nodeName, doc2.parentNodeId, doc2.parentName, 0);
								}

								if (err){
									console.log('err23');
								}
								else {
								}
							});
						}, 1000);
					}
				});
			}
		});
	}
}

getImmediateChildren = function(node, retailer, cb) {
	if (node.nodeId && node.nodeName && retailer
			&& node.nodeId != ''
			&& node.nodeName != ''
			&& retailer != ''
			&& (retailer == 'US' || retailer == 'IN')){
		var nodes = [];
		var retailerVal = '';

		switch(retailer){
			case 'IN':
				retailerVal = 'AMZNIN';
				break;
			case 'US':
				retailerVal = 'AMZNUS';
				break;
			default:
				break;
		}

		var cursor = TreeData.find({'parentNodeId': node.nodeId,
						'parentName': node.nodeName,
						'retailer': retailerVal}).cursor;
		cursor.on('data', function(doc){
			if (doc && doc.nodeId && doc.nodeName){
				nodes.push({'nodeId':doc.nodeId,
							'nodeName': doc.nodeName});
			}
		});
		cursor.on('close', function(){
			if (nodes.length > 0){
				cb(true, nodes);
			}
			else
			{
				cb(false);
			}
		});
	}
	else
	{
		cb(false);
	}
}



exports.insertNode = insertNode;
exports.removeAllNodes = removeAllNodes;
exports.findOneNodeForPath = findOneNodeForPath;
exports.getPathChildren = getPathChildren;

//////////////

exports.getAllNodes = getAllNodes;
exports.findOneNode = findOneNode;

exports.setPaths = setPaths;

exports.finalize = finalize;
exports.removeDuplicates = removeDuplicates;
exports.getChildLevelNodes = getChildLevelNodes;
exports.getImmediateChildren = getImmediateChildren;

exports.getNodePathAndChildren = getNodePathAndChildren;
exports.getMultiLevel = getMultiLevel;
exports.setRootNodeIdAndName = setRootNodeIdAndName;