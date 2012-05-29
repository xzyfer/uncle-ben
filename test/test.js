var request = require('./support/http')
  , app = require('../app')
  , should = require('should')
;

describe('get', function() {
	describe('GET /get?url=http://example.com', function() {
		it('should return 200 code', function(done) {
			request(app)
				.request('GET', '/get?url=http://google.com')
				.expect(200, done);
		})
	})
})
;
