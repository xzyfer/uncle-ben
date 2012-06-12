
const Schema = require('mongoose').Schema
  , ObjectId = Schema.ObjectId;

var Timing = require('../models/timing')
  , sha1 = require('sha1')
  , microtime = require('microtime')
;

/**
 * Schema
 */

var Average = module.exports = new Schema({
    // _creator        : { type: Schema.ObjectId, ref: 'Timing' }
    _id             : { type: String }
  , value           : {
        firstByte       : { type: Schema.Types.Mixed, required: true }
      , requestCount    : { type: Schema.Types.Mixed, required: true }
      , weight          : { type: Schema.Types.Mixed, required: true }
      , onContentLoad   : { type: Schema.Types.Mixed, required: true }
      , onLoad          : { type: Schema.Types.Mixed, required: true }

      // TODO: move this into it's own model
      , dbDomainObjectCount : { type: Number, required: false }
      , dbQueryCount        : { type: Number, required: false }
      , dbReaderQueryCount  : { type: Number, required: false }
      , dbWriterQueryCount  : { type: Number, required: false }
      , dbRecordCount       : { type: Number, required: false }
    }
});
