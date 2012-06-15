
var ev = require('../hooks/event')

module.exports = function (app) {
    app.on('event:create_profile', ev.create_profile);
}
