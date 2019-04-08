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
var crypto = require('crypto');
var got = require('got');
var Review = require('./Reviews');
var Movie = require('./Movies');
var jwt = require('jsonwebtoken');

const GA_TRACKING_ID = process.env.GA_KEY;
/*
function trackDimension(category, action, label, value, dimension, metric) {
    var options= {
        method: 'GET',
        url: 'https://www.google-analytics.com/collect',
        qs:
            {
                v:1,
                tid: GA_TRACKING_ID,
                cid: crypto.randomBytes(16).toString("hex"),
                t: 'event',
                ed: category,
                ea: action,
                el: label,
                ev: value,
                cd1: dimension,
                cm1: metric
            },
        headers:
            { 'Cache-Control': 'no-cache'}
    };
    return rp(options);
}
*/
function trackDimension(category, action, label, value, dimension, metric) {
    const data = {
        v:1,
        tid: GA_TRACKING_ID,
        cid: crypto.randomBytes(16).toString("hex"),
        t: 'event',
        ec: category,
        ea: action,
        el: label,
        ev: value,
        cd1: dimension,
        cm1: metric
    };
    return got.post('http://www.google-analytics.com/collect', {form: data});
}

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
    review.movie = req.swagger.params.review.value.movie;
    review.review = req.swagger.params.review.value.review;
    let token = parseJwt(req.swagger.params.Authorization.value);
    let decoded = jwt.verify(token, process.env.SECRET_KEY);
    review.reviewer = decoded.username;

    Movie.find({'title': review.movie}, function(err, movie){
        if(movie.length === 0){
          res.status(404).json({
              success: false,
              message: `No movie with title: ${review.movie} in the database!`
          }).send();
        } else if(err) {
            res.status(400).send(err);
        } else {
            review.save(function (err){
                if(err) {
                    if(err) {
                        return res.status(400).send(err);
                    }
                }
                trackDimension(movie[0].genre,"POST /review","API Request for Movie Review",1,"Movie Name","Rating");
                res.status(200).json({
                    success: true,
                    message: `${review.review} added for movie: ${review.movie}!`
                });

            });
        }
    });
}