
/**
 * Module dependencies.
 */

var express = require('express')
  , controllers = require('./controllers')
  , mongoose = require('mongoose')
;

var app = module.exports = express.createServer();

// Resources

app.resource = function(path, obj) {
  this.get(path, obj.new);
  this.post(path, obj.create);
  // this.get(path + '/:hash', obj.list);
  this.get(path + '/:hash.:format', obj.show);
  this.get(path + '/:hash', obj.show);
};

// Configuration

app.configure(function(){
  app.set('helpers', __dirname + '/helpers');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
  app.use(function(req, res, next) {
    req.connectToDb = (function() {
      return mongoose.connect('127.0.0.1', 'test', 27017, {});
    });
    next();
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.resource('/profiles', controllers.Profiles);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
