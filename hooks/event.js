
// Events

exports.create_profile = function (data, req) {
    req.app.set('reports').forEach(function(report, i) {
        report(data.profile);
    });
}
