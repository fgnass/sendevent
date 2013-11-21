var tunnel = require('sauce-connect-launcher')
  , remote = require('./remote')

var opts = {
  username: 'fgnass',
  accessKey: '48b2d971-ad8e-4f64-b042-c494844fe319',
  verbose: false,
  logger: console.log
}

module.exports = function(done) {
  //tunnel(opts, function(err, proc) {
  //  console.log('tunnel', err)
    //if (err) return done(err)
    remote('http://localhost:3000', function(err, res) {
      console.log('remote', err, res)
  //   proc.close()
      done(err, res)
    })
  //})
}
