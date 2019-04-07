var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, {useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

var ReviewSchema = new Schema({
    reviewer: {type: String, required: true},
    rating: {type: Number, min: 0, max: 5, required: true},
    movieid: {type: String, required: true},
    review: {type: String, required: true}
});

/*
ReviewSchema.pre('save', function(next) {
    var review = this;
});
*/

module.exports = mongoose.model('Review', ReviewSchema);