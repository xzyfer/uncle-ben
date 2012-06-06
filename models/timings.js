
var Profile = require('../models/profiles')
;

var Timing = function() {
    var mongoose = require('mongoose')
      , Schema = mongoose.Schema
      , timingSchema = new mongoose.Schema({
          hash            : { type: String, required: true, index: true }
        , url             : { type: String, required: true }
        , time            : { type: Number, required: true }
        , numRequests     : { type: Number, required: true }
        , weight          : { type: Number, required: true }
        , onContentLoad   : { type: Schema.Types.Mixed, required: true }
        , onLoad          : { type: Schema.Types.Mixed, required: true }
        , profile         : { type: Schema.ObjectId, ref: 'Profile' }
    })
    , _model = mongoose.model('Timing', timingSchema)
    ;

    return {
        schema: timingSchema,
        model: _model
    };

}();

module.exports = Timing;
