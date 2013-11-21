var app = require('./server/app')
  , sauce = require('./server/sauce')


describe('saucelabs', function() {

  it('should work', function(done) {
    this.timeout(600000)
    app.listen(3000, function() {
      console.log('listening')
      sauce(function (err, res) {
        console.log('done', err, res)
        done()
      })
    })

  })

})