
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

Timing.pre('save', function(next) {
    if(this.hash === undefined) {
        this.hash = sha1(microtime.nowDouble().toString());
    }
    if(this.urlHash === undefined) {
        this.urlHash = sha1(encodeURIComponent(this.url));
    }
    next();
});
