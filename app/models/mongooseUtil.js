
var mongoose = require ('mongoose');

// var dbURI = process.env.MONGODB_URI || 'localhost:27017/Huddlie';
// var dbURI2 = 'mongodb://huddlieServices9!:servicesMaster9!@ds151994.mlab.com:51994/heroku_gvn2dr71';

var dbURI = 'mongodb://huddlieServices9!:servicesMaster9!@ds217475-a0.mlab.com:17475,ds217475-a1.mlab.com:17475/heroku_kw3mx5qs?replicaSet=rs-ds217475';

// var MongoClient = require('mongodb').MongoClient;

// MongoClient.connect("mongodb://huddlieServices9!:servicesMaster9!@ds217475-a0.mlab.com:17475,ds217475-a1.mlab.com:17475/heroku_kw3mx5qs?replicaSet=rs-ds217475", function(err, db) {
//   // test.equal(null, err);
//   // test.ok(db != null);
//   console.log('CONNECTED USING MONGOCLIENT');
//   if (err)
//   {
//   	console.log('MONGOCLIENT ERR:'+err);
//   }
//   else
//   {
//   	console.log('MONGOCLIENT DBNAME = ');
//   	db.db('heroku_kw3mx5qs').collection('amazonSearchCacheStagingColl').findOne({}, function(err2, res2){
//   		if (err2)
//   		{
//   			console.log('MONGOCLIENT FINDONE Err'+err2);
//   		}
//   		else
//   		{
//   			console.log(res2);
//   		}
//   	})
//   }
//   // db.collection("replicaset_mongo_client_collection").update({a:1}, {b:1}, {upsert:true}, function(err, result) {
//   //   test.equal(null, err);
//   //   test.equal(1, result);

//   //   db.close();
//   //   test.done();
//   // });
// });

var options = {
	useMongoClient : true
}

mongoose.connect(dbURI, options);
// mongoose.connect(process.env.MONGODB_URI || 'localhost:27017/Huddlie');

mongoose.connection.on('connected', function () {  
 console.log('Mongoose default connection open to ' + dbURI);
}); 


mongoose.connection.on('error',function (err) {  
  console.log('Mongoose default connection error: ' + err);
}); 


mongoose.connection.on('disconnected', function () {  
  console.log('Mongoose default connection disconnected'); 
});

 // If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log('Mongoose default connection disconnected through app      termination'); 
    process.exit(0); 
  }); 
}); 

exports.mongooseItem = mongoose;