var cookies = require('./lib/cookies')

module.exports = function(url, handle) {

  if (typeof url == 'function') {
    handle = url
    url = '/eventstream'
  }

  /**
   * Iframe-fallback for browsers that don't support EventSource.
   */
  function createIframe() {
    var doc = document

    // On IE use an ActiveXObject to prevent the "throbber of doom"
    // see: http://stackoverflow.com/a/1066729
    if (window.ActiveXObject) {
      doc = new ActiveXObject("htmlfile")
      doc.write('<html><body></body></html>')

      // set a global variable to prevent the document from being garbage
      // collected which would close the connection:
      window.eventStreamDocument = doc

      // Expose a global function that can be invoked from within the iframe:
      doc.parentWindow.handleSentEvent = handle

      appendIframe(doc, url)
    }
    else {
      // Most likely an old Android device. The trick here is not to send
      // the 4KB padding, but to immediately reload the iframe after a message
      // was received.
      window.handleSentEvent = handle
      setTimeout(function() { appendIframe(document, url+'?close') }, 1000)
    }
  }

  function appendIframe(doc, url) {
    var i = doc.createElement('iframe')
    i.style.display = 'none'
    i.src = url
    doc.body.appendChild(i)
  }

  var init = function() {
    var source = null

    function connect () {
      if (source !== null) { disconnect() }

      source = new EventSource(url)
      source.onmessage = function(ev) {
       handle(JSON.parse(ev.data))
      }

      // Define a catch-all check for connection status that retries
      // if it notices that the connection is down. There are certain
      // instances when EventSource does not automatically retry and
      // this should ensure that they are all handled. On Firefox, for
      // example, if the server is restarted, it will not attempt to
      // reconnect but this will.
      var checkForConnectionInterval = setInterval(function () {
        if (source.readyState === 2 /* closed */) {
          clearInterval(checkForConnectionInterval)
          connect()
        }
      }, 3000)
    }

    function disconnect () {
      source.close()
      source = null
    }

    connect()

    // Ensure that we close the source before the page is unloaded.
    // Chrom(ium) works even if we don’t but Firefox throws a “The connection
    // to <url> was interrupted while the page was loading.” error on
    // reload and results in the connection being terminated after 30 seconds.
    window.addEventListener('beforeunload', function (event) {
      // Ensure that we close the source before the page is unloaded.
      // Chrom(ium) works even if we don’t but Firefox throws a “The connection
      // to <url> was interrupted while the page was loading.” error on reload.
      // When the host is localhost, this then results in the connection being
      // terminated after 30 seconds.
      disconnect()

      // Fix for 30-second timeout/disconnection issue on loads from memory cache
      // when Firefox is running on host localhost.
      if (navigator.userAgent.includes('Firefox') && document.location.host === 'localhost') {
        // Are we about to carry out a force reload? If so, flag it and also save the
        // scroll location in a cookie so that we can restore it when the page reloads.
        if (window.locationToRestoreAfterForcedReload !== undefined) {
          cookies.add('pageWasForceReloaded')
          cookies.add('scrollX', locationToRestoreAfterForcedReload.x)
          cookies.add('scrollY', locationToRestoreAfterForcedReload.y)
        }
      }
    })

    // Fix for 30-second timeout/disconnection issue on loads from memory cache
    // when Firefox is running on host localhost.
    if (navigator.userAgent.includes('Firefox') && document.location.host === 'localhost') {
      // If a location was specified to restore after a forced reload, scroll to it.
      if (cookies.exists('pageWasForceReloaded')) {
        window.scroll(parseInt(cookies.value('scrollX')), parseInt(cookies.value('scrollY')))

        // Delete the cookies.
        cookies.remove('pageWasForceReloaded')
        cookies.remove('scrollX')
        cookies.remove('scrollY')
      } else {
        // If the page wasn’t force reloaded by us, it was manually reloaded by someone and
        // they might have done a regular reload (e.g., hit the refresh button), in which case
        // we must do a forced reload to be sure that we avoid the timeout/disconnection issue.
        // Worst case scenario, this means that on Firefox running on host localhost, we do one
        // unnecessary reload if the person did, in fact, do a manual force reload.
        // I can live with that :)

        // Save the current scroll position as Firefox will lose this after a forced reload
        // but we can reset it manually.
        window.locationToRestoreAfterForcedReload = {
          x: window.scrollX,
          y: window.scrollY
        }

        // Do a forced reload, skipping Firefox’s memory cache (and thus the timeout/disconnection issue).
        location.reload(true)
      }
    }
  }

  if (!window.EventSource) init = createIframe
  if (window.attachEvent) attachEvent('onload', init)
  else addEventListener('load', init)
}
