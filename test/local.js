var app = require('./server/app')
  , request = require('supertest')

describe('local', function() {

  it('should expose an EventSource', function(done) {
    request(app)
      .get('/eventstream')
      .set('accept', 'text/event-stream')
      .set('close-stream', 'true')
      .expect('content-type', 'text/event-stream')
      .expect(/:hello\n/, done)
  })

  it('should expose an forever iframe', function(done) {
    request(app)
      .get('/eventstream')
      .set('close-stream', 'true')
      .expect('content-type', 'text/html')
      .expect(/handleSentEvent/, done)
  })

  it('should expose nothing else', function(done) {
    request(app)
      .get('/foo')
      .expect(404, done)
  })

})