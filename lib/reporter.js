
function Reporter (app) {
    this.db = app.set('db');
    this.region = app.set('region');
    this.definitions = {};
};


/**
 *
 * Definition syntax:
 *
 * var definition = [{
 *     'title' : 'DOM Ready'
 *   , 'unit'  : 'ms',
 *   , 'key'   : 'onContentLoad',
 *   , 'value' : function(profile) { return profile.getPage().pageTimings.onContentLoad },
 * }]
 *
 */
Reporter.prototype.addDefinition = function(type, definition) {
    this.definitions[type] = definition;
    return this;
}

Reporter.prototype.getDefinition = function(type) {
    return this.definitions[type];
}

Reporter.prototype.getDefinitions = function() {
    return this.definitions;
}

Reporter.prototype.create = function(type, profile) {
    var definition = this.definitions[type];
    var schema = {
        url             : profile.getPage().id
      , region          : this.region
      , type            : type
      , data            : {}
      , profile         : profile
    };

    for ( i in definition ) {
        schema.data[definition[i].key] = definition[i].value(profile);
    }

    new this.db.reports(schema)
        .save(function(err) {
            if (err) throw new Error(err);
        });
}

module.exports = Reporter;
