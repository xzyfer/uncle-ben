
const Schema = require('mongoose').Schema
  , ObjectId = Schema.ObjectId
;

/**
 * Schema
 */

var Average = module.exports = new Schema({
    _id     : { type: String }
  , region  : { type: String, index: true }
  , value   : { type: Schema.Types.Mixed, required: true }
});
