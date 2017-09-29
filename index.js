var EventEmitter = require('events').EventEmitter

/**
 * Returns a middleware that keeps track of all open connections and exposes a
 * `broadcast` method that can be called to send data to all connected clients.
 */
module.exports = function(mount) {

  if (!mount) mount = '/eventstream'

  var emitter = new EventEmitter()
  var clients = []
  var id = 1

  function Client(req, res) {
    this.id = id++
    this.headers = req.headers
    this.res = res

    this.send = req.headers.accept == 'text/event-stream'
      ? sse(this)
      : iframe(this, req.url.match(/close/))

    clients.push(this)
    res.on('close', this.close.bind(this))
  }

  Client.prototype.close = function() {
    emitter.emit('disconnect', this)
    this.res.end()
    remove(this, clients)
    this.closed = true
  }

  function middleware(req, res, next) {
    if (req.url.indexOf(mount) !== 0) return next && next()
    var client = new Client(req, res)
    var re = req.url.match(/reconnect/)
    emitter.emit(re? 'reconnect' : 'connect', client)
  }

  middleware.on = emitter.on.bind(emitter)

  /**
   * Broadcast a message to all connected clients.
   */
  middleware.broadcast = function(message) {
    clients.forEach(function(client) {
      client.send(message)
    })
  }

  return middleware
}


/**
 * Remove an item from an array.
 */
function remove(item, array) {
  var i = array.indexOf(item)
  if (~i) array.splice(i, 1)
}

/**
 * Initialize the event stream and return a function that sends
 * text/event-stream formatted data.
 */
function sse(client) {
  client.res.setTimeout(0)
  client.res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  client.res.write(':hello\n')

  return function(data) {
    if (data) client.res.write('data: ' + JSON.stringify(data) + '\n')
    client.res.write('\n\n') // Add extra line-breaks for Opera Mobile
  }
}

/**
 * Initializes the iframe and returns a function that emits script tags.
 */
function iframe(client, autoClose) {

  var timeout

  client.res.writeHead(200, {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache'
  })

  function script(code, cb) {
    if (client.closed) return
    client.res.write('<script>')
    client.res.write(code)
    client.res.write('</script>\n', cb)
  }

  function close() {
    clearTimeout(timeout)
    script('setTimeout(function() { location.search = "close&reconnect="+new Date() }, 0)', function () {
      client.close()
    })
  }

  client.res.write('<html><body>')

  // Emit the p() function that passes the messages to the parent window
  script('function p(msg) { parent.handleSentEvent(msg) }')

  if (autoClose) {
    // If requested with `?close` close the response after the first event
    // has been sent or the timeout of 60s is reached.
    timeout = setTimeout(close, 60000)
  }
  else {
    // After a certain timeout the "htmlfile" ActiveXObject closes the
    // connection and fires an onload event ...
    script(
      'window.onload = function() {' +
      'location.search = "v="+new Date()' +
      '}', function() {
        // Add 4K padding so that the browser starts to parse the document
        client.res.write(new Array(4096).join('.'))
      })
  }

  // Return a function that emits inline scripts which call p()
  return function(message) {
    script('p(' + JSON.stringify(message) + ')', function() {
      if (autoClose) close()
    })
  }
}
