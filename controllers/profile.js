
var shell = require('shelljs')
  , sha1 = require('sha1')
  , profiles = require('../models/profiles')
  , timings = require('../models/timings')
  , _u = require('underscore')
  , microtime = require('microtime')
  , moment = require('moment')
;

exports.new = function(req, res, next) {
    res.render('profile/new', {title: 'Uncle Ben'});
};

exports.create = function(req, res, next) {
    var url = req.param('url');
    var cmd = 'phantomjs ' + req.app.set('helpers') + '/netsniff.js "' + url + '"';

    var output = shell.exec(cmd, {silent:true}).output;
    var result = JSON.parse(output);

    var connection = req.connectToDb();
    var Profile = new profiles.model(result);

    var Timing = new timings.model({
        url             : url
      , time            : Profile.getTotalTime()
      , firstByte       : Profile.getEntry(0).timings.wait
      , requestCount    : Profile.getRequestCount()
      , weight          : Profile.getTotalSize()
      , onContentLoad   : Profile.getPage().pageTimings.onContentLoad
      , onLoad          : Profile.getPage().pageTimings.onLoad
      , timeCreated     : Profile.getPage().startedDateTime
    });

    // save the timing data
    Timing.save(function(err) {
        if(err) next(err);

        Profile._creator = Timing._id;

        // save the profile
        Profile.save(function(err) {
            if(err) next(err);

            // return the response
            if(req.isXMLHttpRequest)
                res.send(result);
            else
                res.redirect('/profiles/' + Timing.hash);
        });
    });
};

exports.show = function(req, res, next) {
    var hash = req.param('hash');
    var format = req.param('format');
    var connection = req.connectToDb();

    timings.model.findOne({ 'hash' : hash }, function (err, record) {
        if(err) next(err);

        profiles.model.findOne({ _creator: record._id }).run(function(err, profile) {
            if(err) next(err);

            var url = profile.log.pages[0].id;

            if(format === undefined) {
                res.render('profile/show', {
                    title: url
                  , url: url
                  , hash: hash
                  , urlHash: record.urlHash
                  , runDate: moment(record.timeCreated)
                  , timing: record
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
    var hash = req.param('url_hash');
    var connection = req.connectToDb();

    timings.model.find({ 'urlHash' : hash }, function (err, records) {
        if(err) next(err);

        var url = records[0].url;

        res.render('profile/history', { title: 'Profile History - ' + url, url: url, timings: records });
    });
};

exports.recent = function(req, res, next) {
    var format = req.param('format');
    var connection = req.connectToDb();

    profiles.model.find()
        .sort('_id', -1)
        .populate('_creator')
        .limit(req.param('limit') || 5)
        .run(function(err, records) {
            if(err) next(err);

            timings = _u.map(records, function(record) {
                return record._creator;
            })

            if(format === undefined)
                res.render('profile/recent', { title: 'Recent profiles', timings: timings });
            if(format === 'html')
                res.render('profile/recent', { title: 'Recent profiles', timings: timings });
            if(format === 'json')
                res.send(timings);
        });
};
