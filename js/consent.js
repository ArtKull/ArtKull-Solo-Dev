;(function () {
  var CONSENT_STORAGE_KEY = 'artkull-consent'
  var CONSENT_VERSION = 1
  var METRIKA_ID = 113122431
  var METRIKA_SRC = 'https://mc.yandex.ru/metrika/tag.js?id=' + METRIKA_ID
  var METRIKA_COOKIE_EXACT = ['ymex', 'yandexuid', 'yuidss', 'i']

  function parseConsent(raw) {
    if (typeof raw !== 'string' || raw === '') {
      return null
    }
    var data
    try {
      data = JSON.parse(raw)
    } catch (e) {
      return null
    }
    if (!data || typeof data !== 'object') {
      return null
    }
    if (data.v !== CONSENT_VERSION) {
      return null
    }
    if (data.value !== 'granted' && data.value !== 'denied') {
      return null
    }
    return { value: data.value, ts: typeof data.ts === 'string' ? data.ts : '' }
  }

  function serializeConsent(value, date) {
    var when = date instanceof Date ? date : new Date()
    return JSON.stringify({ v: CONSENT_VERSION, value: value, ts: when.toISOString() })
  }

  function readConsent(storage) {
    if (!storage) {
      return null
    }
    var raw
    try {
      raw = storage.getItem(CONSENT_STORAGE_KEY)
    } catch (e) {
      return null
    }
    return parseConsent(raw)
  }

  function writeConsent(storage, value, date) {
    if (!storage) {
      return false
    }
    try {
      storage.setItem(CONSENT_STORAGE_KEY, serializeConsent(value, date))
      return true
    } catch (e) {
      return false
    }
  }

  function initialAction(record) {
    if (!record) {
      return 'show'
    }
    return record.value === 'granted' ? 'load' : 'ignore'
  }

  function isMetrikaCookie(name) {
    var n = String(name == null ? '' : name).replace(/^\s+|\s+$/g, '').toLowerCase()
    if (n === '') {
      return false
    }
    if (n.indexOf('_ym') === 0) {
      return true
    }
    return METRIKA_COOKIE_EXACT.indexOf(n) !== -1
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CONSENT_STORAGE_KEY: CONSENT_STORAGE_KEY,
      CONSENT_VERSION: CONSENT_VERSION,
      METRIKA_ID: METRIKA_ID,
      METRIKA_SRC: METRIKA_SRC,
      parseConsent: parseConsent,
      serializeConsent: serializeConsent,
      readConsent: readConsent,
      writeConsent: writeConsent,
      initialAction: initialAction,
      isMetrikaCookie: isMetrikaCookie
    }
  }

  if (typeof document === 'undefined') {
    return
  }

  function safeStorage() {
    try {
      return window.localStorage
    } catch (e) {
      return null
    }
  }

  function loadMetrika() {
    if (window.__artkullMetrikaLoaded) {
      return
    }
    window.__artkullMetrikaLoaded = true
    ;(function (m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function () {
          ;(m[i].a = m[i].a || []).push(arguments)
        }
      m[i].l = 1 * new Date()
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) {
          return
        }
      }
      ;((k = e.createElement(t)),
        (a = e.getElementsByTagName(t)[0]),
        (k.async = 1),
        (k.src = r),
        a.parentNode.insertBefore(k, a))
    })(window, document, 'script', METRIKA_SRC, 'ym')

    window.ym(METRIKA_ID, 'init', {
      ssr: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    })
  }

  function deleteMetrikaCookies() {
    var hostname = window.location.hostname
    var cookies = String(document.cookie || '').split(';')
    for (var i = 0; i < cookies.length; i += 1) {
      var name = cookies[i].split('=')[0].replace(/^\s+|\s+$/g, '')
      if (!isMetrikaCookie(name)) {
        continue
      }
      document.cookie = name + '=; Max-Age=0; path=/'
      if (hostname) {
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + hostname
      }
    }
  }

  function showBanner(banner) {
    if (banner) {
      banner.hidden = false
    }
  }

  function hideBanner(banner) {
    if (banner) {
      banner.hidden = true
    }
  }

  function initConsent() {
    var storage = safeStorage()
    var banner = document.getElementById('cookie-banner')
    var record = readConsent(storage)
    var action = initialAction(record)

    function apply(value) {
      if (value === 'granted') {
        writeConsent(storage, 'granted', new Date())
        hideBanner(banner)
        loadMetrika()
        return
      }
      var previous = readConsent(storage)
      var wasGranted =
        (previous && previous.value === 'granted') || window.__artkullMetrikaLoaded
      writeConsent(storage, 'denied', new Date())
      hideBanner(banner)
      if (wasGranted) {
        deleteMetrikaCookies()
        window.location.reload()
      }
    }

    if (banner) {
      var buttons = banner.querySelectorAll('[data-consent]')
      for (var i = 0; i < buttons.length; i += 1) {
        buttons[i].addEventListener('click', function (e) {
          apply(e.currentTarget.getAttribute('data-consent'))
        })
      }
    }

    var settings = document.querySelector('[data-consent-settings]')
    if (settings) {
      settings.addEventListener('click', function () {
        showBanner(banner)
      })
    }

    if (action === 'load') {
      loadMetrika()
      return
    }
    if (action === 'show') {
      showBanner(banner)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConsent)
  } else {
    initConsent()
  }
})()
