var profiles = require('../controllers/profile')
  // , sinon = require('sinon')
  , sandbox = require('sandboxed-module')
  , should = require('should')
;

describe('GET /profiles?url=http://example.com', function() {
	it('should return 200 code', function(done) {

		var json = {output: '{"foo":"bar","bar":"baz"}'};

		var request = {
			param: function(k) {
				switch (k) {
					case 'url':
						return 'http://example.com';
						break;
				}
				return;
			},
			connectToDb: function() {}
		};

		var response = {
			viewName: ""
			, data : {}
			, foo: JSON.parse('{"foo":"bar","bar":"baz"}')
			, render: function(view, viewData) {
				this.viewName = view;
				this.data = viewData;
			}
		};

		var profiles = sandbox.require('../controllers/profile', {
			requires: {
				'shelljs': {
					exec: function(cmd) {
						console.log('--------------');
						return json;
					}
				},
				'../models/profiles': {
					model: function() {
						return {
							save: function() {}
						}
					}
				}
			}
		});

		profiles.create(request, response)

		response.viewName.should.equal('profile/create');
		response.should.be.a('object');
		response.should.have.property('data');

		// response.data.should.be.a('object');
		// response.data.should.have.property('result');
		// response.data.result.should.equal(JSON.parse(json.output));
		done();

	})
})
;
