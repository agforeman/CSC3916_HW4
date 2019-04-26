'use strict';
/*
 'use strict' is not required but helpful for turning syntactical errors into true errors in the program flow
 http://www.w3schools.com/js/js_strict.asp
*/

/*
 Modules make it possible to import JavaScript files into your application.  Modules are imported
 using 'require' statements that give you a reference to the module.

  It is a good idea to list the modules that your application depends on in the package.json in the project root
 */
var util = require('util');

var Movie = require('./Movies');
var CastMember = require('./CastMembers');
var ObjectId = require('mongodb').ObjectId;
var jwt = require('jsonwebtoken');

/*
 Once you 'require' a module you can reference the things that it exports.  These are defined in module.exports.

 For a controller in a127 (which this is) you should export the functions referenced in your Swagger document by name.

 Either:
  - The HTTP Verb of the corresponding operation (get, put, post, delete, etc)
  - Or the operationId associated with the operation in your Swagger document

  In the starter/skeleton project the 'get' operation on the '/hello' path has an operationId named 'hello'.  Here,
  we specify that in the exports of this module that 'hello' maps to the function named 'hello'
 */
module.exports = {
    getmovies: getmovies,
    getmovie: getmovie,
    insertmovie: insertmovie,
    updatemovie: updatemovie,
    deletemovie: deletemovie,
    getmoviereviews: getmoviereviews
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function getmovie(req, res) {
    var id = req.swagger.params.id.value;
    if(req.swagger.params.reviews.value === true) {
        getmoviereviews(req, res);
    } else {
        Movie.findById(id, function(err, movie) {
            if(err) {
                if(err.kind === "ObjectId") {
                    res.status(404).json({
                        success: false,
                        message: `No movie with id: ${id} in the database!`
                    }).send();
                } else {
                    res.send(err);
                }
            } else {
                //var movieJson = JSON.stringify(movie);
                res.status(200).json({
                    success: true,
                    size: 1,
                    movies: movie
                });
            }
        });
    }
}

function getmovies(req, res) {
    if(req.swagger.params.reviews.value === true) {
        getmoviereviews(req,res);
    } else {
        Movie.find(function (err, movies) {
            if (err) res.send(err);
            // IF NOT QUERY REVIEWS = TRUE
            res.status(200).json({
                success: true,
                size: movies.length,
                movies: movies
            })
        });
    }
}

function insertmovie(req, res) {
    var movie = new Movie();
    movie.title = req.swagger.params.movie.value.title;
    movie.year = req.swagger.params.movie.value.year;
    movie.genre = req.swagger.params.movie.value.genre;
    let castSize = req.swagger.params.movie.value.cast.length;
    for (let i = 0; i < castSize; i++){
        movie.cast.push(JSON.parse(JSON.stringify(req.swagger.params.movie.value.cast[i])));
    }
    movie.save(function (err) {
        if(err) {
            if(err.code === 11000) {
                return res.status(409).json({success: false, message: 'A movie with that id already exists'}).send()
            } else {
                return res.send(err);
            }
        }

        res.status(200).json({
            success: true,
            message: `${movie.title} added!`
        });
    });
}

function updatemovie(req, res) {
    var id = req.swagger.params.id.value;
    Movie.findById(id, function(err, movie) {
        if (err) {
            if (err.kind === "ObjectId") {
                res.status(404).json({
                    success: false,
                    message: `No movie with id: ${id} in the database!`
                }).send();
            } else {
                res.send(err);
            }
        } else if(movie) {
            // update the movie info only if it is new
            if (req.swagger.params.movie.value.title) movie.title = req.swagger.params.movie.value.title;
            if (req.swagger.params.movie.value.year) movie.year = req.swagger.params.movie.value.year;
            if (req.swagger.params.movie.value.genre) movie.genre = req.swagger.params.movie.value.genre;
            if (req.swagger.params.movie.value.cast) movie.cast = req.swagger.params.movie.value.cast;

            movie.save(function (err) {
                if (err) res.send(err);

                res.status(200).json({
                    success: true,
                    message: 'Movie updated!'
                });
            });
        }
    })
}

function deletemovie(req, res) {
    var id = req.swagger.params.id.value;
    Movie.remove({_id: id}, function(err, movie) {
        if (err) {
            if (err.kind === "ObjectId") {
                res.status(404).json({
                    success: false,
                    message: `No movie with id: ${id} in the database!`
                }).send();
            } else {
                res.send(err);
            }
        } else {
            res.status(200).json({
                success: true,
                message: 'Successfully deleted'
            })
        }
    });
}

function getmoviereviews(req, res) {
    // Initialize id to null
    let id = null;
    // Check if id was passed
    if(req.swagger.params.id !== undefined){
        // if so set it
        id = req.swagger.params.id.value;
    }
    // Create an empty match pipeline. This will be used to match all movies if no id is specified
    let match = {};
    // If an id was passed create the match pipeline
    if(id !== null){
        match = {'_id': ObjectId(id)}
    }
    //  ------- Now do some Tom foolery ------
    // V                                      V
    Movie.aggregate([
        {
            '$match': match
        }, {
            '$lookup': {
                'from': 'reviews',
                'localField': 'title',
                'foreignField': 'movie',
                'as': 'reviews'
            }
        }, {
            '$project': {
                'title': 1,
                'year': 1,
                'genre': 1,
                'cast': {
                    'actor': 1,
                    'character': 1
                },
                'reviews': {
                    'rating': 1,
                    'reviewer': 1,
                    'review': 1
                }
            }
        }, {
            '$addFields': {
                'average_rating': {
                    '$avg': '$reviews.rating'
                }
            }
        }
    ], function(err, movies){
       if(err){
           res.send(err)
       } else {
           let movies_list = [];
           for (let item in movies) {

               let movie = {
                   'title': movies[item].title,
                   'year': movies[item].year,
                   'genre': movies[item].genre,
                   'average_rating': movies[item].average_rating,
                   'cast': movies[item].cast,
                   'reviews': movies[item].reviews
               };
               movies_list.push(movie)
           }
           let length = movies_list.length;
           res.status(200).json({
               'success': true,
               'size': length,
               'movies': movies_list
           });
       }
    });

}