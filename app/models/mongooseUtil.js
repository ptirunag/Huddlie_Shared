var mongoose = require ('mongoose');

var dbURI = process.env.MONGODB_URI || 'localhost:27017/Huddlie';
mongoose.connect(dbURI);
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