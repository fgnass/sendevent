var on = require('../../client')
var events = []

console.log('ready')
on(function(ev) {
  console.log('event!', ev)
  events.push(ev)
  window.result = ev
  document.getElementById('out').innerText += ((ev && ev.time) || '*') + '\n'

})
