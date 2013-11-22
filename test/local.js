var app = require('./server/app')
  , request = require('supertest')

describe('local', function() {
  it('should expose an EventSource', function(done) {
    request(app)
      .get('/eventstream')
      .set('Accept', 'text/event-stream')
      .buffer(false)
      .expect('Content-Type', 'text/event-stream')
      .end(expect(/:hello/, done))
  })

  it('should expose an forever iframe', function(done) {
    request(app)
      .get('/eventstream')
      .expect('Content-Type', 'text/html')
      .buffer(false)
      .end(expect(/handleSentEvent/, done))
  })

  it('should expose nothing else', function(done) {
    request(app)
      .get('/foo')
      .expect(404, done)
  })
})

function expect(re, done) {
  return function(err, res) {
    if (err) return done(err)
    res.on('data', function(data) {
      if (re.exec(data)) done()
    })
  }
}
