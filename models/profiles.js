var Profile = function() {
  var mongoose = require('mongoose')
    , schema = new mongoose.Schema({})
    , _model = mongoose.model('Profile', schema)
  ;

  return {
    schema: schema,
    model: _model
  };

}();

module.exports = Profile;
