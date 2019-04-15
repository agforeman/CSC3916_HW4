'use strict';

const GA_TRACKING_ID = process.env.GA_KEY;
function trackDimension(category, action, label, value, dimension, metric) {
    var options= {method: 'GET',
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

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
var cors = require('cors');
app.use(cors());
//var passport = require('passport');
module.exports = app; // for testing

var config = {
    appRoot: __dirname // required config
};

//app.use(passport.initialize());

SwaggerExpress.create(config, function(err, swaggerExpress) {
    if (err) { throw err; }

    // install middleware
    swaggerExpress.register(app);

    var port = process.env.PORT || 8080;
    app.listen(port);

    if (swaggerExpress.runner.swagger.paths['/hello']) {
        console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
    }
});
