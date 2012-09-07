
const Schema = require('mongoose').Schema
  , ObjectId = Schema.ObjectId;

var sha1 = require('sha1')
  , microtime = require('microtime')
;

/**
 * Schema
 */

var Report = module.exports = new Schema({
    hash        : { type: String, index: true }
  , url         : { type: String, index: true }
  , urlHash     : { type: String, index: true }
  , region      : { type: String, index: true }
  , type        : { type: String, index: true, required: true }
  , data        : { type: Schema.Types.Mixed, required: true }
  , profile     : { type: Schema.ObjectId, ref: 'Profile', required: true }
  , average     : { type: Schema.Types.Mixed, ref: 'Average' }
  , timeCreated : { type: Date }
});

Report.methods.getAverage = function getAverage (callback) {
    this.db.model('Average').findById(this.average, callback);
};

mapFunction = function() {
    var obj = { count: 1, region: this.region };

    for( var i in this.data ) {
        if(this.data.hasOwnProperty(i)) {
            var value = parseInt(this.data[i], 10);
            obj[i] = {
                sum: value,
                min: value,
                max: value,
                count: 1,
                diff: 0
            };
        }
    }

    emit(this.urlHash + "-" + this.type, obj);
};

reduceFunction = function(key, values) {
    for(var i = 0; i < values.length; i++) {
        for(var j in values[i]) {
            if(values[i].hasOwnProperty(j) && j !== 'count' && j !== 'region') {

                var a = values[0][j];
                var b = values[i][j];

                // temp helpers
                var delta = a.sum/a.count - b.sum/b.count; // a.mean - b.mean
                var weight = (a.count * b.count)/(a.count + b.count);

                // do the reducing
                a.diff += b.diff + delta*delta*weight;
                a.sum += b.sum;
                a.count += b.count;
                a.min = Math.min(a.min, b.min);
                a.max = Math.max(a.max, b.max);
            }
        }
    }

    var result = values[0];
    values.region = values.region;
    return result;
};

finalizeFunction = function(key, value) {
    for(var i in value) {
        if(value.hasOwnProperty(i) && i !== 'count' && i !== 'region') {
            value[i].avg = value[i].sum / value[i].count;
            value[i].variance = value[i].diff / value[i].count;
            value[i].stddev = Math.sqrt(value[i].variance);
        }
    }

    return value;
};

Report.post('save', function(report) {

    // stop here on update
    if(!this._wasNew) return;

    this.db.db.executeDbCommand({
        mapreduce   : "reports"
      , query       : { 'urlHash' : this.urlHash, 'type' : this.type, 'region' : this.region }
      , sort        : { '_id' : -1 }
      , limit       : 10
      , map         : mapFunction.toString()
      , reduce      : reduceFunction.toString()
      , finalize    : finalizeFunction.toString()
      , out         : { merge : 'averages' }
    }, function(err, db) {
        if(err) return next(err);

        report.average = report.urlHash + "-" + report.type;
        report.save();
    });

});

// TODO: move this into an event hook
Report.pre('save', function(next) {

    var that = this;
    that._wasNew = this.isNew;

    // stop here on update
    if(!that._wasNew) return next();

    this.timeCreated = new Date();

    if(that.hash === undefined) {
        that.hash = sha1(microtime.nowDouble().toString());
    }

    if(that.urlHash === undefined) {
        that.urlHash = sha1(encodeURIComponent(that.url));
    }

    that.db.model('Profile').findById(that.profile, function(err, profile) {

        profile.reports.push(that);
        profile.save(function(err) {
            return next();
        });
    });
});
