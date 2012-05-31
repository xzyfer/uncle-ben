
var shell = require('shelljs')
  , profiles = require('../models/profiles')
;

exports.create = function(req, res, next) {
	var url = req.param('url');
	var cmd = 'phantomjs ~/netsniff.js "' + url + '"';

	var result = JSON.parse(shell.exec(cmd, {silent:true}).output);

	var connection = req.connectToDb();

	var profile = new profiles.model(result).save(function (err) {
		if(err) new Error(err.message);
		connection.connections[0].close();
	});

	res.render('index', { title: 'Express', url: url, result: result });
	next();
};
