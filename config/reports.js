
const Reporter = require('../lib/reporter');

module.exports = function (app) {
  var reporter = new Reporter(app);

  reporter.addDefinition('frontend', [
      { 'title' : 'DOM Ready',  'unit' : 'ms',    'key' : 'onContentLoad', 'value' : function(p) { return p.getPage().pageTimings.onContentLoad } }
    , { 'title' : 'Page Load',  'unit' : 'ms',    'key' : 'onLoad',        'value' : function(p) { return p.getPage().pageTimings.onLoad } }
    , { 'title' : 'First Byte', 'unit' : 'ms',    'key' : 'firstByte',     'value' : function(p) { return p.getEntry(0).timings.wait } }
    , { 'title' : 'Requests',   'unit' : 'ms',    'key' : 'requestCount',  'value' : function(p) { return p.getRequestCount() } }
    , { 'title' : 'Size',       'unit' : 'bytes', 'key' : 'weight',        'value' : function(p) { return p.getTotalSize() } }
  ]);

  // reporter.addDefinition('backend', [
  //     { 'title' : 'Query Count',        'unit' : null, 'key' : 'dbQueryCount',       'value' : function(p) { return p.getResponsePerformanceData().dbQueryCount } }
  //   , { 'title' : 'Reader Query Count', 'unit' : null, 'key' : 'dbReaderQueryCount', 'value' : function(p) { return p.getResponsePerformanceData().dbReaderQueryCount } }
  //   , { 'title' : 'Writer Query Count', 'unit' : null, 'key' : 'dbWriterQueryCount', 'value' : function(p) { return p.getResponsePerformanceData().dbWriterQueryCount } }
  // ]);

  app.set('reporter', reporter);
}
