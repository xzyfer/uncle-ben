
const Schema = require('mongoose').Schema
    , ObjectId = Schema.ObjectId;

var Timing = require('../models/timing')
  , sha1 = require('sha1')
  , microtime = require('microtime')
;

/**
 * Schema
 */

var Profile = module.exports = new Schema({
    _creator    : { type: Schema.ObjectId, ref: 'Timing' }
  , hash        : { type: String, index: true }
  , log         : { type: Schema.Types.Mixed }
});

Profile.methods.getPage = function getPage () {
    return this.log.pages[0];
}

Profile.methods.getEntries = function getEntries () {
    return this.log.entries;
}

Profile.methods.getEntry = function getEntry (index) {
    return this.log.entries[index];
}

Profile.methods.getRequestCount = function getRequestCount () {
    return this.getEntries().length;
}

Profile.methods.getTotalSize = function getTotalSize () {
    var total = 0;

    this.getEntries().forEach(function(element, index, array) {
        for(k in element.timings) {
            total += Math.max(0, element.timings[k]);
        }
    });

    return total;
}

Profile.methods.getTotalTime = function getTotalTime () {
    var total = 0;

    this.getEntries().forEach(function(element, index, array) {
        total += Math.max(0, element.response.bodySize);
    });

    return total;
}

Profile.pre('save', function(next) {
    if(this.hash === undefined) {
        this.hash = sha1(microtime.nowDouble().toString());
    }
    if(this.log.entries !== undefined)
    {
        (this.log.entries).sort(function(a, b) {
            var aT = new Date(a.startedDateTime).getTime();
            var bT = new Date(b.startedDateTime).getTime();

            if(aT === bT) return 0;
            return aT > bT ? 1 : -1;
        });
    }
    next();
});