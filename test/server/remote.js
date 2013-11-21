var webdriver = require('wd')

module.exports = function(url, done) {
  var browser = webdriver.remote(
    "ondemand.saucelabs.com"
    , 80
    , "fgnass"
    , "48b2d971-ad8e-4f64-b042-c494844fe319"
  );

  var desired = {
    browserName: 'chrome',
    version: '30',
    platform: 'Linux',
    //browserName: 'internet explorer',
    //version: '6',
    //platform: 'Windows XP',
    tags: [],
    name: "This is an example test"
  }

  browser.init(desired, function() {
    browser.setAsyncScriptTimeout(10000)
    browser.setImplicitWaitTimeout(10000)
    browser.get(url, function() {
      console.log('waiting for result')
      browser.waitForConditionInBrowser("!!window.result", 10000, 1000, function(err) {
        console.log('eval', err)
        browser.eval("window.result", function(err, res) {
          console.log('evald', err, res)
          browser.quit()
          done(err, res)
        })
      })
    })
  })
}
