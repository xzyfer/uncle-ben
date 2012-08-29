
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
    var url = req.param('url').trim();
    var cmd = [req.app.set('phantomjs.path'), req.app.set('helpers') + '/netsniff.js' , '"' + url + '"'].join(' ');

    var output = shell.exec(cmd, {silent:true}).output;
    var result = JSON.parse(output);

    var Profile = new db.profiles(result);
    Profile.region = app.set('region');

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
        .exec(function(err, record) {
            if (err) return next(err);

            db.reports
                .find({ profile: record._id })
                .populate('average')
                .exec(function(err, reports) {
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
 * @url /profile/:hash/history.:format?
 */

controller.history = function(req, res, next) {
    var hash = req.param('hash');
    var format = req.param('format');
    var limit = req.param('limit') || 100;
    var offset = req.param('offset') || 0;

    db.profiles
        .findOne({ 'hash' : hash })
        .populate('reports')
        .populate('average')
        .exec(function(err, record) {
            if (err) return next(err);

            db.reports
                .find({ url: record.getUrl() })
                .populate('profile')
                .populate('average')
                .sort('field -timeCreated')
                .limit(limit).skip(offset)
                .exec(function(err, reports) {
                    if (err) return next(err);

                    var data = {};
                    _u.map(reports, function(item) {
                        if(data[item.type] === undefined) {
                            data[item.type] = {};
                            data[item.type].reports = [];
                        }

                        data[item.type].average = item.average;
                        data[item.type].reports.push(item);
                    });

                    var url = record.getUrl();

                    if(format === undefined) {
                        res.render('profile/history', {
                            title: 'Profile History - ' + url,
                            url: url,
                            data: data,
                        });
                    }
                    if(format === 'json')
                        res.send({ url : url, history : records, reports: reports });
                });
        });
};


/**
 * Recent Profiles
 *
 * @param {Request Object} req
 * @param {Response Object} res
 * @param {Callback} next
 *
 * @api public
 * @url /profile/recent.:format?
 * @url /profile/recent/:limit.:format?
 */

controller.recent = function(req, res, next) {
    var format = req.param('format');

    db.profiles.find({}, ['hash', 'reports'])
        .sort('field -_id')
        .populate('reports', 'hash type url data')
        .limit(req.param('limit') || 5)
        .exec(function(err, profiles) {
            if(err) next(err);

            if(format === undefined)
                res.render('profile/recent', { title: 'Recent profiles', profiles: profiles });
            if(format === 'html')
                res.render('profile/recent', { title: 'Recent profiles', profiles: profiles });
            if(format === 'json')
                res.send(profiles);
        });
};
