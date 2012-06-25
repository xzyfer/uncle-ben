
var Reporter = require('../lib/reporter')
;

exports.create_profile = function (data, req) {
    var reporter = req.app.set('reporter')
      , definitions = reporter.getDefinitions()
    ;

    for (i in definitions) {
        reporter.create(i, data.profile);
    }
}
