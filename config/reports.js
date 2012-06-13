
// TODO: load these individually from the filesystem
module.exports = function(app) {
    var db = app.set('db');

    var frontend = (function () {
        var create = function(profile) {
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

        var definition = function() {
            return [
                { 'title' : 'DOM Ready',  'unit' : 'ms',    'value' : this.onContentLoad, 'key' : 'onContentLoad' }
              , { 'title' : 'Page Load',  'unit' : 'ms',    'value' : this.onLoad,        'key' : 'onLoad' }
              , { 'title' : 'First Byte', 'unit' : 'ms',    'value' : this.firstByte,     'key' : 'firstByte' }
              , { 'title' : 'Requests',   'unit' : 'ms',    'value' : this.requestCount,  'key' : 'requestCount' }
              , { 'title' : 'Size',       'unit' : 'bytes', 'value' : this.weight,        'key' : 'weight' }
            ];
        }

        return {
            create: create
          , definition: definition
        }
    })();

    var backend = (function () {
        var create = function(profile) {
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

        var definition = function() {
            return [
                { 'title' : 'Query Count',        'unit' : null,  'value' : this.dbQueryCount,        'key' : 'dbQueryCount' }
              , { 'title' : 'Reader Query Count', 'unit' : null,  'value' : this.dbReaderQueryCount,  'key' : 'dbReaderQueryCount' }
              , { 'title' : 'Writer Query Count', 'unit' : null,  'value' : this.dbWriterQueryCount,  'key' : 'dbWriterQueryCount' }
            ];
        }

        return {
            create: create
          , definition: definition
        }
    })();

    var reports = {
        'frontend' : frontend
      , 'backend'  : backend
    };

    app.set('reports', reports);

    return app;
}
