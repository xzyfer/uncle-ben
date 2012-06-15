
const mongoose = require('mongoose');

module.exports = function() {

    mongoose.model('Profile', require('../models/profile'));
    mongoose.model('Report', require('../models/report'));
    mongoose.model('Average', require('../models/average'));

}
