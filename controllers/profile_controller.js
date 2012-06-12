
// Set all global variables

var shell = require('shelljs')
  , sha1 = require('sha1')
  , _u = require('underscore')
  , microtime = require('microtime')
  , moment = require('moment')
  , os = require('os')
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
    var cmd = 'phantomjs --cookies-file=/tmp/uncle-ben/cookies.txt ' + req.app.set('helpers') + '/netsniff.js "' + url + '"';

    var output = shell.exec(cmd, {silent:true}).output;
    var result = JSON.parse(output);

    var Profile = new db.profiles(result);

    var Timing = new db.timings(_u.extend({
        url             : url
      , time            : Profile.getTotalTime()
      , firstByte       : Profile.getEntry(0).timings.wait
      , requestCount    : Profile.getRequestCount()
      , weight          : Profile.getTotalSize()
      , onContentLoad   : Profile.getPage().pageTimings.onContentLoad
      , onLoad          : Profile.getPage().pageTimings.onLoad
      , timeCreated     : Profile.getPage().startedDateTime
      , profile         : Profile
    }, Profile.getResponsePerformanceData()));



    Timing.save(function(err) {
        if (err) return next(err)

        Profile._creator = Timing._id;

        // save the profile
        Profile.save(function(err) {
            if (err) return next(err)

            if(format === undefined)
                res.redirect('/profile/' + Timing.hash);
            if(format === 'json')
                res.send({ result : 'ok', hash: profile.hash });
        });
    });
};

controller.show = function(req, res, next) {
    var hash = req.param('hash');
    var format = req.param('format');

    db.timings
        .findOne({ 'hash' : hash })
        .populate('profile')
        .run(function(err, record) {
            if (err) return next(err);

            db.averages.findById(record.urlHash, function(err, average) {
                if (err) return next(err);

                var difference = {};
                _u.each(average.value, function(v, k) {
                    if(_u.isNumber(v)) {
                        difference[k] = parseInt(record[k] - v, 10);
                    }
                });

                if(format === undefined) {
                    res.render('profile/show', {
                        title: record.url
                      , url: record.url
                      , hash: hash
                      , urlHash: record.urlHash
                      , runDate: moment(record.timeCreated)
                      , timing: record
                      , difference: difference
                      , hostname: os.hostname()
                    });
                }
                if(format === 'json')
                    res.send(record);
                if(format === 'jsonp')
                    res.send(req.query.callback + '({log:' + JSON.stringify(record.profile.log) + '});');
            });
        });
};

controller.history = function(req, res, next) {
    var hash = req.param('url_hash');

    db.timings.find({ 'urlHash' : hash }, function (err, records) {
        if (err) return next(err);

        var url = records[0].url;

        db.averages.findById(hash, function(err, average) {
            if (err) return next(err);

            if(format === undefined) {
                res.render('profile/history', {
                    title: 'Profile History - ' + url,
                    url: url,
                    timings: records,
                    average: average.value
                });
            }
            if(format === 'json')
                res.send({ url : url, history : records, average : average.value });
        });
    });
};

controller.recent = function(req, res, next) {
    var format = req.param('format');

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
