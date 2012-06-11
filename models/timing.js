
const Schema = require('mongoose').Schema
  , ObjectId = Schema.ObjectId;

var Profile = require('../models/profile')
  , sha1 = require('sha1')
  , microtime = require('microtime')
;

/**
 * Schema
 */

var Timing = module.exports = new Schema({
    hash            : { type: String, index: true }
  , urlHash         : { type: String, index: true }
  , url             : { type: String, required: true }
  , firstByte       : { type: Number, required: true }
  , timeCreated     : { type: Date, required: true }
  , time            : { type: Number, required: true }
  , requestCount    : { type: Number, required: true }
  , weight          : { type: Number, required: true }
  , onContentLoad   : { type: Schema.Types.Mixed, required: true }
  , onLoad          : { type: Schema.Types.Mixed, required: true }
  , profile         : { type: Schema.ObjectId, ref: 'Profile' }
});

urlMap = function() {
    emit(this.urlHash, {
        count         : 1
      , firstByte     : this.firstByte
      , onContentLoad : this.onContentLoad
      , onLoad        : this.onLoad
      , requestCount  : this.requestCount
      , weight        : this.weight
    });
}

urlReduce = function(key, values) {
    var result = { count: 0, firstByte: 0, onContentLoad: 0, onLoad: 0, requestCount: 0, weight: 0 };

    values.forEach(function(value) {
        result.count += value.count;

        for(i in value) {
            if(i !== 'count')
                result[i] = (result[i] + value[i]) / result.count;
        }
    });

    return result;
}

Timing.post('save', function() {
    this.db.db.executeDbCommand({
        mapreduce: "timings"
      , query: { 'urlHash' : this.urlHash }
      , map: urlMap.toString()
      , reduce: urlReduce.toString()
      , out: 'averages'
    }, function(err, db) { });
});

Timing.pre('save', function(next) {
    if(this.hash === undefined) {
        this.hash = sha1(microtime.nowDouble().toString());
    }
    if(this.urlHash === undefined) {
        this.urlHash = sha1(encodeURIComponent(this.url));
    }
    next();
});
