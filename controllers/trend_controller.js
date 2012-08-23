
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
    var hours = parseInt(req.param('hours') || 1, 10);
    var offset = parseInt(req.param('offset') || 0, 10);
    var metrics = (req.param('metrics') || 'domready').split(',');

    db.reports
        .find({})
        .where('timeCreated')
            .gt(new Date(Date.now() - (3600 * 1000 * (hours + offset))))
            .lt(new Date(Date.now() - (3600 * 1000 * offset)))
        .sort('timeCreated', 'ascending')
        .populate('average')
        .run(function(err, records) {
            if (err) return next(err);

            var record = {};

            for ( var i in records ) {
                record = records[i];
                if(!record.data) continue;

                if(reports[record.url] === undefined) {
                    reports[record.url] = {};
                }
                if(reports[record.url][record.type] === undefined) {
                    reports[record.url][record.type] = [];
                }

                if(record.average !== undefined) {
                    reports[record.url][record.type].push(
                        _u.extend({}, record.data, { 'time' : record.timeCreated, 'average' : record.average.value })
                    );
                }
            }

            if(req.param('format', 'html') === 'html') {
                res.render('trend/index', {
                    title : 'Trends',
                    reports : reports,
                    metrics : metrics
                });
            } else if(req.param('format', 'html') === 'json') {
                res.send({ reports : reports })
            }
        });
}
