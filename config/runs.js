
module.exports = function(app) {

    // TODO: make this environmental aware. Potentially load from DB in production?
    var runs = { 'us' : {
        'default' : [
            {
                'url' : 'http://99designs.com/'
            }
          , {
                'url' : 'http://99designs.com/?nocache'
            }
          , {
                'url' : 'http://99designs.com/contests'
            }
          , {
                'url' : 'http://99designs.com/contests?nocache'
            }
          , {
                'url' : 'http://99designs.com/launch'
            }
          , {
                'url' : 'http://99designs.com/launch?nocache'
            }
        ]
    }};

    app.set('runs', runs);
};
