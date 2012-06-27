module.exports = function(app) {

    var profile = require('../controllers/profile_controller')(app);
    var run     = require('../controllers/run_controller')(app);
    var trend   = require('../controllers/trend_controller')(app);

    //  Load database and pass it down to the controllers

    var db = app.set('db');

    //  Load Root

    app.get('/', profile.new); // *Root

    //  LoadRoutes

    app.get('/profile', profile.new);
    app.post('/profile.:format?', profile.create);
    app.get('/profile/recent/:limit.:format?', profile.recent);
    app.get('/profile/recent.:format?', profile.recent);

    app.get('/profile/:hash.:format?', profile.show);
    app.get('/profile/:hash/history.:format?', profile.history);

    app.get('/run/:name?', run.new);

    app.get('/trends.:format?', trend.index);

}
