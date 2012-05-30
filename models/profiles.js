var Profile = function() {
  var mongoose = require('mongoose')
    , profileSchema = new mongoose.Schema({})
    , _model = mongoose.model('Profile', profileSchema)
  ;

  return {
    schema: profileSchema,
    model: _model
  };

}();

module.exports = Profile;
