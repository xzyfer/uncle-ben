
/**
 *  Load external modules / see readme for bundle instructions
 */


require('./lib/exceptions')

if(!process.env.NODE_ENV) process.env.NODE_ENV="local"

//  Load boot file and fire away!

var cluster = require('cluster')
  , numCPUs = require('os').cpus().length;

if ( cluster.isMaster ) {
  for ( var i=0; i<numCPUs; ++i )
    cluster.fork();
} else {
    var app = require('./config/app')();
    var port = process.env.PORT || 3000;

    app.listen(port);

    console.log('\x1b[36mUncle Ben\x1b[90m v%s\x1b[0m running as \x1b[1m%s\x1b[0m on http://%s:%d in %s region',
        app.set('version'),
        app.set('env'),
        app.set('host'),
        port,
        process.env.REGION || 'us'
    );
}
