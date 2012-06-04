
var shell = require('shelljs')
  , profiles = require('../models/profiles')
;

exports.new = function(req, res, next) {
	res.render('profile/new', {title: 'New profile'});
}

exports.create = function(req, res, next) {
	var url = req.param('url');
	var cmd = 'phantomjs ' + req.app.set('helpers') + '/netsniff.js "' + url + '"';

	var result = JSON.parse(shell.exec(cmd, {silent:true}).output);

	var connection = req.connectToDb();

	var profile = new profiles.model(result).save(function (err) {
		if(err) new Error(err.message);
		connection.connections[0].close();
	});

	if(req.isXMLHttpRequest)
		res.send(result);
	else
		res.render('profile/create', { title: 'Profile - ' + url, url: url, result: result });
};
