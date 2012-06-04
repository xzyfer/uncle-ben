
var shell = require('shelljs')
  , sha1 = require('sha1')
  , profiles = require('../models/profiles')
  , timings = require('../models/timings')
;

exports.new = function(req, res, next) {
	res.render('profile/new', {title: 'New profile'});
}

exports.create = function(req, res, next) {
	var url = req.param('url');
	var cmd = 'phantomjs ' + req.app.set('helpers') + '/netsniff.js "' + url + '"';

	var output = shell.exec(cmd, {silent:true}).output;
	var result = JSON.parse(output);
	var timing = {
		hash: sha1(result.log.pages[0].id),
		onContentLoad: result.log.pages[0].pageTimings.onContentLoad,
		onLoad: result.log.pages[0].pageTimings.onLoad,
	};

	var connection = req.connectToDb();

	var profile = new profiles.model(result).save(function (err) {
		if(err) new Error(err.message);
		connection.connections[0].close();
	});

	var timing = new timings.model(timing).save(function (err) {
		if(err) new Error(err.message);
		connection.connections[0].close();
	});

	if(req.isXMLHttpRequest)
		res.send(result);
	else
		res.render('profile/create', { title: 'Profile - ' + url, url: url, result: result });
};
