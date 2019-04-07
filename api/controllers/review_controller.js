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

var Review = require('./Reviews');

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
    postreview: postreview,
    getreview: getreview,
    getreviews: getreviews
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function getreview(req, res) {
    var id = req.swagger.params.id.value;
    Review.findById(id, function(err, review) {
        if(err) {
            if(err.kind === "ObjectId") {
                res.status(404).json({
                    success: false,
                    message: `No review with id: ${id} in the database!`
                }).send();
            } else {
                res.send(err);
            }
        } else {
            //var reviewJson = JSON.stringify(review);
            res.status(200).json({
                success: true,
                size: 1,
                reviews: review
            });
        }
    });
}

function getreviews(req, res) {
    Review.find(function (err, reviews) {
        if (err) res.send(err);

        res.status(200).json({
            success: true,
            size: reviews.length,
            reviews: reviews
        })
    });
}

function parseJwt(token) {
    let payload = token.split(' ')[1];
    return payload;
}

function postreview(req, res) {
    var review = new Review();
    //review.reviewer = req.swagger.params.review.value.reviewer;
    review.rating = req.swagger.params.review.value.rating;
    review.movieid = req.swagger.params.review.value.movieid;
    review.review = req.swagger.params.review.value.review;
    let token = parseJwt(req.swagger.params.Authorization.value);
    let decoded = jwt.verify(token, process.env.SECRET_KEY);
    review.reviewer = decoded.username;

    review.save(function (err) {
        if(err) {
            if(err.code === 11000) {
                return res.status(409).json({success: false, message: 'A review with that id already exists'}).send()
            } else {
                return res.send(err);
            }
        }
        res.status(200).json({
            success: true,
            message: `${review.review} added for movie: ${review.movieid}!`
        });
    });
}