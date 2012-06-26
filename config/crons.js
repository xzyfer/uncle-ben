
var cronJob = require('cron').CronJob
  , curl = require('curlrequest')
;

module.exports = function(app) {

    // TODO: make this environmental aware. Potentially load from DB in production?
    var jobs = [
        {
            'pattern'  : '* */10 * * * *'
          , 'function' : function() {
                curl.request({
                    url : 'http://localhost:3000/run'
                }, function (err, parts) {
                    console.log('viola!');
                });
            }
        }
    ];

    if(app.set('cron.enabled'))
    {
        for (i in jobs) {
            var job = jobs[i];

            try {
                new cronJob(job.pattern, job.function, null, true);
            } catch(ex) {
                throw new Error("cron pattern not valid");
            }
        }
    }

    app.set('jobs', jobs);

}
