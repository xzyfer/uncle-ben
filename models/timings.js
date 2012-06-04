
var Profile = require('../models/profiles')
;

var Timing = function() {
    var mongoose = require('mongoose')
      , Schema = mongoose.Schema
      , timingSchema = new mongoose.Schema({
          hash            : { type: String, required: true, index: true }
        , onContentLoaded : { type: Schema.Types.Mixed, required: true }
        , onLoad          : { type: Schema.Types.Mixed, required: true }
        , profile         : { type: Schema.ObjectId, required: true }
    })
    , _model = mongoose.model('Timing', timingSchema)
    ;

    return {
        schema: timingSchema,
        model: _model
    };

}();

module.exports = Timing;
