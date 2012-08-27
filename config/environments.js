
module.exports = function(app) {

    var port = process.env.PORT || 4000
    ;

    app.configure('local', function () {

      this
        .set('port', port)
        .set('ENV','local')
        .set('cron.enabled', true)
        .set('phantomjs.path', 'phantomjs')
    });

    app.configure('production', function (){

      this
        .set('port', port)
        .set('ENV','production')
        .set('cron.enabled', false)
        .set('phantomjs.path', '/usr/local/bin/phantomjs')
    });

    return app

}
