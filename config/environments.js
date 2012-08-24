
module.exports = function(app) {

    var port = process.env.PORT || 4000
    ;

    app.configure('local', function () {

      this
        .set('host', 'localhost')
        .set('port', port)
        .set('ENV','local')
        .set('cron.enabled', false)
        .set('phantomjs.path', 'phantomjs')
    });

    app.configure('production', function (){

      this
        .set('host', 'uncleben02.testing.99cluster.com')
        .set('port', port)
        .set('ENV','production')
        .set('cron.enabled', true)
        .set('phantomjs.path', '/usr/local/bin/phantomjs')
    });

    return app

}
