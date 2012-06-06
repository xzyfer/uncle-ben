
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

    // save the profile
    new profiles.model(_u.extend({ 'hash' : profileHash }, result)).save(function(err) {
        if(err) {
            connection.connections[0].close();
            new Error(err.message);
        }

        // fetch the saved profile
        profiles.model.findOne({ 'hash' : profileHash }, function (err, profile) {
            if(err) {
                connection.connections[0].close();
                new Error(err.message);
            }

            var timing = {
                hash: timingHash
              , onContentLoad: result.log.pages[0].pageTimings.onContentLoad
              , onLoad: result.log.pages[0].pageTimings.onLoad
              , timeCreated: result.log.pages[0].startedDateTime
              , profile: profile.id
            };

            // save the simplified timing data
            new timings.model(timing).save(function(err) {
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
    });
};

exports.list = function(req, res, next) {
    var hash = req.param('hash');
    var connection = req.connectToDb();

    timings.model.find({ 'hash' : hash }, function (err, timings) {
        if(err) {
            connection.connections[0].close();
            new Error(err.message);
        }

        profiles.model.findById(timings[0].profile, function(err, profile) {
            if(err) {
                connection.connections[0].close();
                new Error(err.message);
            }

            var url = profile.log.pages[0].id;

            connection.connections[0].close();
            res.render('profile/list', { title: 'Profile History - ' + url, url: url,  timings: timings });
        });
    });
}

exports.show = function(req, res, next) {
    var hash = req.param('hash');
    var format = req.param('format');
    var connection = req.connectToDb();

    timings.model.find({ 'hash' : hash }, function (err, timings) {
        if(err) {
            connection.connections[0].close();
            new Error(err.message);
        }

        profiles.model.findById(timings[0].profile, function(err, profile) {
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
