
const express   = require('express')
    , mongoose  = require('mongoose')
;

module.exports = function(app){

    //  Setup DB Connection

    var dblink = process.env.MONGOHQ_URL || 'mongodb://localhost/test';
    var region = process.env.REGION || 'US';

    const db = mongoose.createConnection(dblink);

    //  Configure expressjs

    app.configure(function (){
        this
            .use(express.logger('\033[90m:method\033[0m \033[36m:url\033[0m \033[90m:response-time ms\033[0m'))
            .use(express.bodyParser())
            .use(express.methodOverride());
    });

    //  Add template engine

    app.configure(function() {
        this
            .set('helpers', __dirname + '/../helpers')
            .set('views', __dirname + '/../views')
            .set('view engine', 'jade')
            .set('view options', {
                layout: false
            })
            .use(express.static(__dirname + '/../public'));
    });

    //  Save reference to database connection

    app.configure(function () {
        this
            .set('db', {
                'main': db
              , 'profiles': db.model('Profile')
              , 'reports': db.model('Report')
              , 'averages': db.model('Average')
            })
            .set('version', '0.0.1');
    });

    //  Save reference to current region

    app.configure(function () {
        this.set('region', region);
    });

    //  Set environment aware error handlers

    app.configure('development', function() {
        this.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('production', function() {
        this.use(express.errorHandler());
    });

    return app;
};
