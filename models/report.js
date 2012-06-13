
const Schema = require('mongoose').Schema
  , ObjectId = Schema.ObjectId;

var sha1 = require('sha1')
  , microtime = require('microtime')
;

/**
 * Schema
 */

var Report = module.exports = new Schema({
    hash    : { type: String, index: true }
  , url     : { type: String, index: true }
  , urlHash : { type: String, index: true }
  , type    : { type: String, index: true, required: true }
  , data    : { type: Schema.Types.Mixed, required: true }
  , profile : { type: Schema.ObjectId, ref: 'Profile', required: true }
  , average : { type: Schema.Types.Mixed, ref: 'Average' }
});

Report.methods.getAverage = function getAverage (callback) {
    this.db.model('Average').findById(this.average, callback);
}

mapFunction = function() {
    var obj = { count: 1 };

    for( i in this.data ) {
        if(this.data.hasOwnProperty(i)) {
            obj[i] = parseInt(this.data[i], 10);
        }
    }

    emit(this.urlHash + "-" + this.type, obj);
};

reduceFunction = function(key, value) {
    var result = { count: 0 };

    value.forEach(function(row) {
        result.count += row.count;

        for(i in row) {
            if(row.hasOwnProperty(i)) {
                if(i !== 'count') {
                    result[i] = (result[i] || 0) + row[i];
                }
            }
        }
    });

    return result;
};

finalizeFunction = function(key, value) {
    for(i in value) {
        if(value.hasOwnProperty(i)) {
            if(i !== 'count' && value[i] > 0) {
                value[i] = value[i] / value.count;
            }
        }
    }

    return value;
};

Report.post('save', function(report) {

    // stop here on update
    if(!this._wasNew) return;

    this.db.db.executeDbCommand({
        mapreduce   : "reports"
      , query       : { 'urlHash' : this.urlHash, 'type' : this.type }
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

    this._wasNew = this.isNew;

    if(this.hash === undefined) {
        this.hash = sha1(microtime.nowDouble().toString());
    }
    if(this.urlHash === undefined) {
        this.urlHash = sha1(encodeURIComponent(this.url));
    }
    next();
});
