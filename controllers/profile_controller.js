
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
    var format = req.param('format');
    var url = req.param('url');
    var cmd = 'phantomjs --cookies-file=/tmp/uncle-ben/cookies.txt ' + req.app.set('helpers') + '/netsniff.js "' + url + '"';

    var output = shell.exec(cmd, {silent:true}).output;
    var result = JSON.parse(output);

    var Profile = new db.profiles(result);

    // save the profile
    Profile.save(function(err) {
        if (err) return next(err);

        req.app.emit('event:create_profile', { profile: Profile }, req);

        if(format === undefined)
            res.redirect('/profile/' + Profile.hash);
        if(format === 'json')
            res.send({ result : 'ok', hash: Profile.hash });
    });
};


/**
 * Show Profile
 *
 * @param {Request Object} req
 * @param {Response Object} res
 * @param {Callback} next
 *
 * @api public
 * @url /profile/:hash.:format?
 */

controller.show = function(req, res, next) {
    var hash = req.param('hash');
    var format = req.param('format');

    db.profiles
        .findOne({ 'hash' : hash })
        .run(function(err, record) {
            if (err) return next(err);

            db.reports
                .find({ profile: record._id })
                .populate('average')
                .run(function(err, reports) {
                    if (err) return next(err);

                    var myReports = {};
                    _u.map(reports, function(item) {
                        myReports[item.type] = item
                    });

                    if(format === undefined) {
                        res.render('profile/show', {
                            title: record.getUrl()
                          , url: record.getUrl()
                          , hash: hash
                          , runDate: moment(record.timeCreated)
                          , reports: myReports
                          , hostname: os.hostname()
                        });
                    }
                    if(format === 'json')
                        res.send(record);
                    if(format === 'jsonp')
                        res.send(req.query.callback + '({log:' + JSON.stringify(record.log) + '});');
                });
        });
};


/**
 * Url History
 *
 * @param {Request Object} req
 * @param {Response Object} res
 * @param {Callback} next
 *
 * @api public
 * @url /profile/:url_hash/history.:format?
 */

controller.history = function(req, res, next) {
    var hash = req.param('hash');
    var format = req.param('format');

    db.profiles
        .findOne({ 'hash' : hash })
        .run(function(err, record) {
            if (err) return next(err);

            db.reports
                .find({ profile: record._id })
                .populate('average')
                .run(function(err, reports) {
                    if (err) return next(err);

                    var myReports = {};
                    _u.map(reports, function(item) {
                        myReports[item.type] = item
                    });

                    var url = record.getUrl();

                    if(format === undefined) {
                        res.render('profile/history', {
                            title: 'Profile History - ' + url,
                            url: url,
                            reports: myReports,
                        });
                    }
                    if(format === 'json')
                        res.send({ url : url, history : records, reports: reports });
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
