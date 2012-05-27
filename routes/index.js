
/*
 * GET home page.
 */

var shell = require('shelljs')
  , pretty = require('pretty-data').pd
;

exports.index = function(req, res){
	var url = req.param('url');
	var cmd = 'phantomjs ~/netsniff.js "' + url + '"';
	var result = shell.exec(cmd, {silent:true}).output;

	res.render('index', { title: 'Express', url: url, result: result });
};
