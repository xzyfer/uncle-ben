
// Set all global variables

var shell = require('shelljs')
  , sha1 = require('sha1')
  , _u = require('underscore')
  , microtime = require('microtime')
  , moment = require('moment')
  , controller = {}
  , app
  , db
;

// Constructor

module.exports = function (_app) {
    app = _app
    db  = app.set('db')
    return controller
}

/**
 * New Profile
 *
 * @param {Request Object} req
 * @param {Response Object} res
 * @param {Callback} next
 *
 * @api public
 * @url /
 * @url /profile
 */
controller.new = function(req, res, next) {
    res.render('profile/new', {
        title: 'Uncle Ben'
    });
}


/**
 * Create Profile
 *
 * @param {Request Object} req
 * @param {Response Object} res
 * @param {Callback} next
 *
 * @api public
 * @url /profile
 */
controller.create = function(req, res, next) {
    var url = req.param('url');
    var cmd = 'phantomjs ' + req.app.set('helpers') + '/netsniff.js "' + url + '"';

    var output = shell.exec(cmd, {silent:true}).output;
    var result = JSON.parse(output);

    var Profile = new db.profiles(result);

    var Timing = new db.timings({
        url             : url
      , time            : Profile.getTotalTime()
      , firstByte       : Profile.getEntry(0).timings.wait
      , requestCount    : Profile.getRequestCount()
      , weight          : Profile.getTotalSize()
      , onContentLoad   : Profile.getPage().pageTimings.onContentLoad
      , onLoad          : Profile.getPage().pageTimings.onLoad
      , timeCreated     : Profile.getPage().startedDateTime
    });

    Timing.save(function(err) {
        if (err) return next(err)

        Profile._creator = Timing._id;

        // save the profile
        Profile.save(function(err) {
            if (err) return next(err)

            res.redirect('/profile/' + Timing.hash);
        });
    });
};

controller.show = function(req, res, next) {
    var hash = req.param('hash');
    var format = req.param('format');

    db.timings.findOne({ 'hash' : hash }, function (err, record) {
        if (err) return next(err)

        db.profiles.findOne({ _creator: record._id }).run(function(err, profile) {
            if (err) return next(err)

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

controller.history = function(req, res, next) {
    var hash = req.param('url_hash');

    db.timings.find({ 'urlHash' : hash }, function (err, records) {
        if (err) return next(err)

        var url = records[0].url;

        res.render('profile/history', { title: 'Profile History - ' + url, url: url, timings: records });
    });
};

controller.recent = function(req, res, next) {
    var format = req.param('format');
    var connection = req.connectToDb();

    db.profiles.find()
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
