
const mongoose = require('mongoose');

module.exports = function() {

    mongoose.model('Profile', require('../models/profile'));
    mongoose.model('Timing', require('../models/timing'));
    mongoose.model('Average', require('../models/average'));

}
