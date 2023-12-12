const mongoose = require('mongoose');

const model1Schema = new mongoose.Schema({
    //......
})

module.exports = mongoose.model('Model1', model1Schema);