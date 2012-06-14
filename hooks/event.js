
// Events

exports.create_profile = function (data, req) {
    var reports = req.app.set('reports');

    for (i in reports) {
        if(reports[i].enabled) {
            reports[i].create(data.profile);
        }
    }
}
