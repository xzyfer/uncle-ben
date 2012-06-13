
module.exports = function(app) {
    var db = app.set('db');

    var frontend = function (profile) {
        new db.reports({
            url             : profile.getPage().id
          , type            : 'frontend'
          , data            : {
                firstByte       : profile.getEntry(0).timings.wait
              , requestCount    : profile.getRequestCount()
              , weight          : profile.getTotalSize()
              , onContentLoad   : profile.getPage().pageTimings.onContentLoad
              , onLoad          : profile.getPage().pageTimings.onLoad
            }
          , profile         : profile
        })
        .save(function(err) {
            if (err) throw new Error(err);
        });
    }

    var backend = function (profile) {
        new db.reports({
            url             : profile.getPage().id
          , type            : 'backend'
          , data            : profile.getResponsePerformanceData()
          , profile         : profile
        })
        .save(function(err) {
            if (err) throw new Error(err);
        });
    }

    var reports = [frontend, backend];

    app.set('reports', reports);

    return app;
}
