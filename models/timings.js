var Timing = function() {
  var mongoose = require('mongoose')
    , schema = new mongoose.Schema({})
    , _model = mongoose.model('Timing', schema)
  ;

  return {
    schema: schema,
    model: _model
  };

}();

module.exports = Timing;
