var Profile = function() {
  var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , profileSchema = new mongoose.Schema({
        log : { type: Schema.Types.Mixed }
    })
    , _model = mongoose.model('Profile', profileSchema)
  ;

  return {
    schema: profileSchema,
    model: _model
  };

}();

module.exports = Profile;
