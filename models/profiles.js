

var Timing = require('../models/timings')
  , sha1 = require('sha1')
  , microtime = require('microtime')
;

var Profile = function() {
    var mongoose = require('mongoose')
      , Schema = mongoose.Schema
      , profileSchema = new mongoose.Schema({
            _creator    : { type: Schema.ObjectId, ref: 'Timing' }
          , hash        : { type: String, index: true }
          , log         : { type: Schema.Types.Mixed }
        })
        .pre('save', function(next) {
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
        })
    ;

    profileSchema.methods.getPage = function getPage () {
        return this.log.pages[0];
    }

    profileSchema.methods.getEntries = function getEntries () {
        return this.log.entries;
    }

    profileSchema.methods.getEntry = function getEntry (index) {
        return this.log.entries[index];
    }

    profileSchema.methods.getRequestCount = function getRequestCount () {
        return this.getEntries().length;
    }

    profileSchema.methods.getTotalSize = function getTotalSize () {
        var total = 0;

        this.getEntries().forEach(function(element, index, array) {
            for(k in element.timings) {
                total += Math.max(0, element.timings[k]);
            }
        });

        return total;
    }

    profileSchema.methods.getTotalTime = function getTotalTime () {
        var total = 0;

        this.getEntries().forEach(function(element, index, array) {
            total += Math.max(0, element.response.bodySize);
        });

        return total;
    }

    var _model = mongoose.model('Profile', profileSchema);

    return {
        schema: profileSchema
      , model: _model
    };
}();

module.exports = Profile;
