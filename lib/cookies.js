// Very basic helpers for working with cookies.
module.exports = {
  named: function (cookieName) {
    return document.cookie
    .split('; ')
    .filter(function(cookie) {
      return cookie.trim().startsWith(cookieName + '=')
    })
  },

  exists: function (cookieName) {
    return cookiesNamed(cookieName).length > 0
  },

  value: function (cookieName) {
    return cookieExists(cookieName) ? cookiesNamed(cookieName)[0].split('=')[1] : null
  },

  add: function (cookieName, cookieValue) {
    if (cookieValue === undefined) cookieValue = true
    document.cookie = cookieName + '=' + cookieValue
  },

  remove: function (cookieName) {
    document.cookie = (cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT')
  },
}
