
// Set all global variables

var _u = require('underscore')
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
 * Trends
 *
 * @param {Request Object} req
 * @param {Response Object} res
 * @param {Callback} next
 *
 * @api public
 * @url /trends
 */
controller.index = function(req, res, next) {

    var reports = {};

    db.reports
        .find({})
        .where('timeCreated').lt(new Date().getTime() - (3600 * 1))
        .populate('average')
        .run(function(err, records) {
            if (err) return next(err);

            var record = {};

            for ( i in records ) {
                record = records[i];
                if(!record.data) continue;

                if(reports[record.url] === undefined) {
                    reports[record.url] = {};
                }
                if(reports[record.url][record.type] === undefined) {
                    reports[record.url][record.type] = [];
                }

                reports[record.url][record.type].push(
                    _u.extend({}, record.data, { 'time' : record.timeCreated, 'average' : record.average.value })
                );
            }

            if(req.param('format', 'html') === 'html') {
                res.render('trend/index', {
                    title : 'Trends',
                    reports : reports
                });
            } else if(req.param('format', 'html') === 'json') {
                res.send({ reports : reports })
            }
        });
}
