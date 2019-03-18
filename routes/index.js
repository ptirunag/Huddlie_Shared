var express = require('express');
var router = express.Router();
var User       = require('../app/models/users');
var uuid = require('uuid/v1');


/* GET home page. */
router.get('/', routeDefault);
router.get('/home', routeDefault2);
router.get('/loaderio-766dffee52f236abf585a0036a6d3219', routeDefaultz);

function routeDefault(req, res, next) {

	var cookie = req.cookies.HuddlieId;

	if (cookie){
		console.log('cookie = '+cookie);
	}
	else
	{
		var cookieVal = uuid();
		res.cookie('HuddlieId',cookieVal,{maxAge: 1000*60*60*24*30, httpOnly: false});
	}


	if (req.session.username){
		console.log('1');
		res.render('/index.html');
	}
	else {
		var viewConfig;
		req.session.username = req.sessionID;
		console.log('2');
		res.render('/index.html');
	}
}

function routeDefault2(req, res, next) {
	res.redirect('/');
}

function routeDefaultz(req, res, next) {
	console.log('YES GOT VERIFICATION REQUEST');
	res.send('loaderio-766dffee52f236abf585a0036a6d3219');
}

module.exports = router;