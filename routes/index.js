
/*
 * GET home page.
 */

var shell = require('shelljs')
  , pretty = require('pretty-data').pd
  , mongodb = require('mongodb')
;

exports.index = function(req, res){
	var url = req.param('url');
	var cmd = 'phantomjs ~/netsniff.js "' + url + '"';
	var result = pretty.jsonmin(shell.exec(cmd, {silent:true}).output);

	var server = new mongodb.Server('127.0.0.1', 27017, {});

	new mongodb.Db('test', server, {}).open(function(err, client) {
		if(err) console.log(err.message);

		client.createCollection('test_collection', function(err, collection) {
			if(err) console.log(err.message);

			client.collection('test_collection', function(err, collection) {
				if(err) console.log(err.message);

				collection.insert(JSON.parse(result), {});

				client.close();
			});
		});


	});

	res.render('index', { title: 'Express', url: url, result: result });
};
