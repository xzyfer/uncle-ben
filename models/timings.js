
var Profile = require('../models/profiles')
  , sha1 = require('sha1')
  , microtime = require('microtime')
;

var Timing = function() {
    var mongoose = require('mongoose')
      , Schema = mongoose.Schema
      , timingSchema = new mongoose.Schema({
            hash            : { type: String, index: true }
          , urlHash         : { type: String, index: true }
          , url             : { type: String, required: true }
          , timeCreated     : { type: Date, required: true }
          , time            : { type: Number, required: true }
          , requestCount    : { type: Number, required: true }
          , weight          : { type: Number, required: true }
          , onContentLoad   : { type: Schema.Types.Mixed, required: true }
          , onLoad          : { type: Schema.Types.Mixed, required: true }
          , profile         : { type: Schema.ObjectId, ref: 'Profile' }
        })
        .pre('save', function(next) {
            if(this.hash === undefined) {
                this.hash = sha1(microtime.nowDouble().toString());
            }
            if(this.urlHash === undefined) {
                this.urlHash = sha1(encodeURIComponent(this.url));
            }
            next();
        })
      , _model = mongoose.model('Timing', timingSchema)
    ;

    return {
        schema: timingSchema,
        model: _model
    };

}();

module.exports = Timing;
