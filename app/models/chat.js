var mongoose = require('mongoose');

var opts = {
	useMongoClient:true,
	auth: {
		authdb: 'heroku_kw3mx5qs'
	} 
}
mongoose.connect(process.env.MONGODB_URI,opts);
// mongoose.connect(process.env.MONGODB_URI || 'localhost:27017/Huddlie');

var schema = mongoose.Schema;

var chatSchema = new schema({
	chatId: {type: String, required: true},
	initiator: {type: String, required: true},
	initiatorSocketId: String,
	users: [String],
	socketIds: [String],
	userSocketPairs: [{socketId: String, username: String}],//[{user:"x", socketId: "y"}];
	controller:String,
	chatHistory: String,
	sharedDiv: String,
	totalUsers: {type: Number, min: 0},
	totalAlltimeUsers: {type: Number, min: 1},
	startTime: {type: Date},
	endTime: {type: Date},
	totalTime: {type: Number, min: 0},
	sharedProductsCount: {type: Number, min: 0},
	productCount: {type: Number, min: 0},
	sessionOpen: {type: Boolean}
}, {collection: 'chat-data'});

var ChatData = mongoose.model('HuddlieChatData', chatSchema);

var createChat = function(newChat, cb){
	var data = new ChatData;
	var id ='';
	var isNotUnique = true;

	if (newChat.rmid){
		id = newChat.rmid;
	}

	// id = (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace( /\./g , '-');

	data.chatId = id;

	data.users 		= [newChat.name];
	data.socketIds = [newChat.socketId];

	var pair = {username: newChat.name, socketId: newChat.socketId};
	var pairArray = [];
	pairArray.push(pair);
	data.userSocketPairs = pairArray;

	data.initiator 	= newChat.name;
	data.initiatorSocketId = newChat.socketId;
	data.controller	= newChat.name;
	data.totalUsers = 1;
	data.chatHistory = '';
	data.sharedDiv = '';

	var currentDateTime = new Date();

	data.totalAlltimeUsers = 1;
	data.startTime = currentDateTime;
	data.endTime = currentDateTime;
	data.totalTime = 0;
	data.sharedProductsCount = 0;
	data.productCount = 0;

	data.sessionOpen = true;

	data.save(function (err, doc){
		if (err){
			cb(false);
		}
		else
		{
			cb(true, id);
		}
	});
}

var joinChat = function(details, cb){
	ChatData.findOne({'chatId':details.chatId}, function(err, doc){
		if (err){
			cb(false);
		}
		else
		{
			var users = doc.users;
			users.push(details.name);

			var socketIds = doc.socketIds;
			socketIds.push(details.socketId);

			var pair = {username: details.name, socketId: details.socketId};
			var pairArray = doc.userSocketPairs;
			pairArray.push(pair);

			var totalUsers = doc.totalUsers;
			totalUsers++;

			doc.users = users;
			doc.socketIds = socketIds;
			doc.userSocketPairs = pairArray;
			doc.totalUsers = totalUsers;

			var totalAlltimeUsers = doc.totalAlltimeUsers;
			totalAlltimeUsers++;
			doc.totalAlltimeUsers = totalAlltimeUsers;

			doc.save();

			setTimeout(function(){
				cb(true, totalUsers);
			}, 1000);
		}
	});
}

var leaveChat = function(socketId, cb){
	ChatData.findOne({'socketIds': socketId}, function(err, doc){
		if (err || doc == null){

		}
		else
		{
			var chatId = doc.chatId;
			
			var chatHistory = doc.chatHistory;
			var totalUsers = doc.totalUsers;
			var users = doc.users;
			var socketIds = doc.socketIds;
			var userSocketPairs = doc.userSocketPairs;

			var indexToRemove = -1;
			var userIndex = -1;
			var socketIndex = -1;
			var username = '';
			var message = '';

			if (userSocketPairs && userSocketPairs.constructor === Array
					&& userSocketPairs.length > 0){
				for (i=0; i< userSocketPairs.length; i++){
					if (userSocketPairs[i].socketId == socketId){
						indexToRemove = i;
						username = userSocketPairs[i].username;
						break;
					}
				}
			}

			if (indexToRemove >= 0){

				userIndex = users.indexOf(username);
				socketIndex = socketIds.indexOf(socketId);

				if (userIndex >= 0 && socketIndex >= 0){

					//Message start
					message = '<b>-- '+username+' has left --</b>';
				
					if (chatHistory == ''){
						chatHistory += message;
					}
					else
					{
						chatHistory += '<br/>'+message;
					}
					//Message end

					//rest of fields
					totalUsers--;
					users.splice(userIndex, 1);
					socketIds.splice(socketIndex, 1);
					userSocketPairs.splice(indexToRemove, 1);

					//rest of fields end

					doc.chatHistory = chatHistory;
					doc.totalUsers = totalUsers;
					doc.users = users;
					doc.socketIds = socketIds;
					doc.userSocketPairs = userSocketPairs;

					doc.save();
					setTimeout(function(){
						cb(true, doc.chatId, doc.chatHistory, doc.totalUsers);
					});
				}
	
			}			
		}
	});
}

var newChatMessage = function(details, cb){
	ChatData.findOne({'chatId':details.chatId}, function(err, doc){
		if (err){
			cb(false);
		}
		else
		{
			var chatHistory = doc.chatHistory;
			if (chatHistory == ''){
				chatHistory += details.message;
			}
			else
			{
				chatHistory += '<br/>'+details.message;
			}

			doc.chatHistory = chatHistory;

			doc.save();
			setTimeout(function(){
				cb(true, chatHistory);
			}, 1000);	

		}
	});
}

var updateSharedDiv = function(details, cb){
	ChatData.findOne({'chatId':details.chatId}, function(err, doc){
		if (err){

		}
		else
		{
			doc.sharedDiv = details.sharedDiv;
			doc.save();
			setTimeout(function(){
				cb(true);
			}, 1000);
		}
	});
}

var getSharedDiv = function(details, cb){
	ChatData.findOne({'chatId':details.chatId}, function(err, doc){
		if (err){

		}
		else
		{
			cb(true, doc.sharedDiv);
		}
	});
}

var getChat = function(chatId, cb){
	ChatData.findOne({'chatId': chatId}, function(err, doc){
		if (err){

		}
		else
		{
			cb(doc);
		}
	});
}

var checkIsInitiatorAndGetChatId = function(socketId, cb){
	ChatData.findOne({'initiatorSocketId': socketId}, function(err, doc){
		if (err || doc == null){
			cb(false);
		}
		else
		{
			cb(true, doc.chatId, doc.initiator);
		}
	});
}

var removeChat = function(chatId){
	ChatData.findOne({'chatId': chatId}, function(err, doc){
		if (err || doc == null){

		}
		else
		{
			doc.remove();
		}
	});

}

var endChat = function(chatId, attemptNumber, cb){
	console.log('endSession Called');
	ChatData.findOne({'chatId': chatId}, function(err, doc){
		if (err || doc == null){
			cb(false, attemptNumber+1, chatId);
		}
		else
		{
			var currentDateTime = new Date();
			doc.endTime = currentDateTime;
			doc.totalTime = Math.abs(currentDateTime - doc.startTime);

			doc.users = [];
			doc.socketIds = [];
			doc.userSocketPairs = [];
			doc.controller = '';
			doc.totalUsers = 0;
			doc.sharedDiv = '';

			doc.sessionOpen = false;

			doc.save();
			console.log('sessionEnded');
			setTimeout(function(){
				cb(true);
			}, 1000);
		}
	});
}

var updateProductCount = function(chat, attemptNumber, cb){
	ChatData.findOne({'chatId': chat.chatId}, function(err, doc){
		if (err || doc == null){
			cb(false, attemptNumber+1, chat);
		}
		else
		{
			var productCount = doc.productCount;
			productCount++;

			doc.productCount = productCount;

			doc.save();
			setTimeout(function(){
				cb(true);
			}, 1000);
		}
	});
}

var updateSharedProductsCount = function(chat, attemptNumber, cb){
	ChatData.findOne({'chatId': chat.chatId}, function(err, doc){
		if (err || doc == null){
			cb(false, attemptNumber+1, chat);
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


exports.createChat = createChat;
exports.getChat = getChat;
exports.joinChat = joinChat;
exports.newChatMessage = newChatMessage;
exports.updateSharedDiv = updateSharedDiv;
exports.getSharedDiv = getSharedDiv;
exports.checkIsInitiatorAndGetChatId = checkIsInitiatorAndGetChatId;
exports.removeChat = removeChat;
exports.leaveChat = leaveChat;
exports.endChat = endChat;
exports.updateProductCount = updateProductCount;
exports.updateSharedProductsCount = updateSharedProductsCount;
