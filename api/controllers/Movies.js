var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var CastMember = require("./CastMembers");

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, {useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

var MovieSchema = new Schema({
   title: {type: String, required: true},
   year: {type: String, required: true},
   genre: {
       type: String,
       enum: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western'],
       required: true
   },
   cast: [{
       actor: {type: String, required: true},
       character: {type: String, required: true}
   }]
});

MovieSchema.pre('save', function(next) {
   var movie = this;

   if(movie.cast.length < 3) {
       console.log("NOT ENOUGH CAST MEMBERS");
       var error = new ValidationError(this);
       error.errors.movie = new ValidatorError('Movies must have at least three cast members to be added to the database');
       next(error);
   } else {
       next();
   }
});

module.exports = mongoose.model('Movie', MovieSchema);