
var shell = require('shelljs')
  , sha1 = require('sha1')
  , profiles = require('../models/profiles')
  , timings = require('../models/timings')
  , _u = require('underscore')
;

exports.new = function(req, res, next) {
    res.render('profile/new', {title: 'New profile'});
};

exports.create = function(req, res, next) {
    var url = req.param('url');
    var cmd = 'phantomjs --cookies-file=/tmp/uncle-ben/cookies.txt --web-security=no ' + req.app.set('helpers') + '/netsniff.js "' + url + '"';

    var output = shell.exec(cmd, {silent:true}).output;
    var result = JSON.parse(output);

    var connection = req.connectToDb();

    var profileHash = sha1(new Date().getTime().toString());
    var timingHash = sha1(result.log.pages[0].id);

    var Profile = new profiles.model(_u.extend({ 'hash' : profileHash }, result));

    var data = {
        hash            : timingHash
      , url             : url
      , time            : Profile.getTotalTime()
      , numRequests     : Profile.getRequestCount()
      , weight          : Profile.getTotalSize()
      , onContentLoad   : Profile.getPage().pageTimings.onContentLoad
      , onLoad          : Profile.getPage().pageTimings.onLoad
      , timeCreated     : Profile.getPage().startedDateTime
      // , profile         : Profile.id
    };

    var Timing = new timings.model(data);

    // save the timing data
    Timing.save(function(err) {
        if(err) {
            connection.connections[0].close();
            new Error(err.message);
        }

        Profile._creator = Timing._id;

        // save the profile
        Profile.save(function(err) {
            if(err) {
                connection.connections[0].close();
                new Error(err.message);
            }

            connection.connections[0].close();

            // return the response
            if(req.isXMLHttpRequest)
                res.send(result);
            else
                res.redirect('/profiles/' + timingHash);
        });
    });
};

exports.show = function(req, res, next) {
    var hash = req.param('hash');
    var format = req.param('format');
    var connection = req.connectToDb();

    timings.model.find({ 'hash' : hash }, function (err, timings) {
        if(err) {
            connection.connections[0].close();
            new Error(err.message);
        }

        profiles.model.findOne({ _creator: timings[0]._id }).run(function(err, profile) {
            if(err) {
                connection.connections[0].close();
                new Error(err.message);
            }

            var url = profile.log.pages[0].id;

            connection.connections[0].close();

            if(format === undefined) {
                res.render('profile/show', {
                    title: 'Profile - ' + url
                  , url: url
                  , hash: hash
                });
            }
            if(format === 'json')
                res.send(JSON.stringify(profile));
            if(format === 'jsonp')
                res.send(req.query.callback + '({log:' + JSON.stringify(profile.log) + '});');
        });
    });
};

exports.history = function(req, res, next) {
    var hash = req.param('hash');
    var connection = req.connectToDb();

    timings.model.find({ 'hash' : hash }, function (err, timings) {
        if(err) {
            connection.connections[0].close();
            new Error(err.message);
        }

        profiles.model.findOne({ _creator: timings[0]._id }).run(function(err, profile) {
            if(err) {
                connection.connections[0].close();
                new Error(err.message);
            }

            var url = profile.log.pages[0].id;

            connection.connections[0].close();
            res.render('profile/history', { title: 'Profile History - ' + url, url: url, timings: timings });
        });
    });
};

exports.recent = function(req, res, next) {
    var format = req.param('format');
    var connection = req.connectToDb();

    profiles.model.find()
        .sort('id', -1)
        .populate('_creator')
        .limit(req.param('limit') || 5)
        .run(function(err, records) {
            if(err) {
                connection.connections[0].close();
                new Error(err.message);
            }

            var timings = _u.map(records, function(a) { return a._creator; });

            if(err) {
                connection.connections[0].close();
                new Error(err.message);
            }

            if(format === undefined)
                res.render('profile/recent', { title: 'Recent profiles', timings: timings });
            if(format === 'html')
                res.render('profile/recent', { title: 'Recent profiles', timings: timings });
            if(format === 'json')
                res.send(timings);
        });
};
