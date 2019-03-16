var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

// cast member schema
var CastMemberSchema = new Schema({
    actor: {type: String, required: true},
    character: {type: String, required: true}
});

module.exports = mongoose.model('CastMember', CastMemberSchema);