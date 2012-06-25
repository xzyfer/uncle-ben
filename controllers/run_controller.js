
// Set all global variables

var curl = require('curlrequest')
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
 * @url /run
 * @url /run/:name
 */
controller.new = function(req, res, next) {
    var run = app.set('runs')[req.name || 'default'];

    for (i in run) {
        curl.request({
            url : 'http://localhost:3000/profile',
            method : 'POST',
            data : { url : run[i].url }
        }, function (err, parts) {
        });
    }

    res.send({ result : 'ok' });
}
