
/*
 * GET home page.
 */

var shell = require('shelljs')
  , pretty = require('pretty-data').pd
  , profiles = require('../models/profiles')
;

exports.index = function(req, res){
	var url = req.param('url');
	var cmd = 'phantomjs ~/netsniff.js "' + url + '"';
	var result = pretty.jsonmin(shell.exec(cmd, {silent:true}).output);

	connection = req.connectToDb();

	var profile = new profiles.model(JSON.parse(result)).save(function (err) {
		if(err) new Error(err.message);
		connection.close();
	});

	res.render('index', { title: 'Express', url: url, result: result });
};
