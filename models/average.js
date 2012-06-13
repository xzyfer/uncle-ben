
const Schema = require('mongoose').Schema
  , ObjectId = Schema.ObjectId
;

/**
 * Schema
 */

var Average = module.exports = new Schema({
    _id   : { type: String }
  , data  : { type: Schema.Types.Mixed, required: true }
});
