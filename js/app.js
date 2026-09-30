(function () {
  var root = document.documentElement;
  window.__artkullReady = true;

  /* Тема */
  var toggle = document.querySelector('.theme-toggle');
  var themeColors = { light: '#f0f4f8', dark: '#0a0e27' };
  var themeMetas = document.querySelectorAll('meta[name="theme-color"]');
  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function syncToggle() {
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(currentTheme() === 'dark'));
    }
    var color = themeColors[currentTheme()];
    Array.prototype.forEach.call(themeMetas, function (meta) {
      meta.setAttribute('content', color);
    });
  }
  if (toggle) {
    syncToggle();
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('artkull-theme', next); } catch (e) {}
      syncToggle();
    });
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* Появление секций */
  function revealDelay(el) {
    var parent = el.parentElement;
    if (!parent) { return '0ms'; }
    var sibs = Array.prototype.filter.call(parent.children, function (c) {
      return c.classList.contains('reveal');
    });
    var idx = sibs.indexOf(el);
    return (idx > 0 ? idx * 60 : 0) + 'ms';
  }
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduce || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) {
      el.style.setProperty('--reveal-delay', revealDelay(el));
      io.observe(el);
    });
  }

  /* Прогресс-бары */
  var bars = Array.prototype.slice.call(document.querySelectorAll('.progress__bar'));
  function runBar(el) {
    var value = parseFloat(el.getAttribute('data-value') || '0');
    if (isNaN(value)) { return; }
    el.style.transform = 'scaleX(' + Math.min(Math.max(value, 0), 100) / 100 + ')';
  }
  if (bars.length) {
    if (reduce || !hasIO) {
      bars.forEach(runBar);
    } else {
      var bio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runBar(entry.target);
            bio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      bars.forEach(function (el) { bio.observe(el); });
    }
  }

  /* Шапка */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Мобильное меню */
  var menuToggle = document.querySelector('.menu-toggle');
  var siteNav = document.getElementById('site-nav');
  if (menuToggle && siteNav) {
    var setNavState = function (open) {
      siteNav.classList.toggle('is-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    };
    var closeNav = function () { setNavState(false); };
    menuToggle.addEventListener('click', function () {
      setNavState(!siteNav.classList.contains('is-open'));
    });
    siteNav.addEventListener('click', function (e) {
      if (e.target.closest('.site-nav__link')) { closeNav(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteNav.classList.contains('is-open')) { closeNav(); }
    });
    if (window.matchMedia) {
      var mql = window.matchMedia('(min-width: 768px)');
      var onMql = function (e) { if (e.matches) { closeNav(); } };
      if (mql.addEventListener) { mql.addEventListener('change', onMql); }
      else if (mql.addListener) { mql.addListener(onMql); }
    }
  }

  /* Активная ссылка навигации */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav__link'));
  var navSections = navLinks
    .map(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) !== '#') { return null; }
      return document.getElementById(href.slice(1));
    })
    .filter(Boolean);
  if (navSections.length && hasIO) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        navLinks.forEach(function (a) {
          a.setAttribute('aria-current', a.getAttribute('href') === '#' + entry.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navSections.forEach(function (s) { navIo.observe(s); });
  }

  /* Cloudflare Turnstile */
  var turnstileWidgetId = null;
  var turnstileBox = document.getElementById('cta-turnstile');
  if (turnstileBox && window.turnstile && typeof window.turnstile.render === 'function') {
    turnstileWidgetId = window.turnstile.render(turnstileBox, {
      sitekey: turnstileBox.getAttribute('data-sitekey'),
      action: turnstileBox.getAttribute('data-action') || 'contact',
      theme: 'auto',
      appearance: 'interaction-only'
    });
  }
  function getTurnstileToken() {
    if (window.turnstile && turnstileWidgetId !== null) {
      return window.turnstile.getResponse(turnstileWidgetId) || '';
    }
    return '';
  }
  function resetTurnstile() {
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
  }

  /* Форма заявки */
  function trim(v) { return v.replace(/^\s+|\s+$/g, ''); }
  var form = document.querySelector('.cta__form');
  if (form) {
    form.setAttribute('novalidate', '');
    var msg = document.querySelector('.cta__message');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.querySelector('.cta__submit-label') : null;
    var nameField = form.querySelector('#cta-name');
    var contactField = form.querySelector('#cta-contact');
    var consentField = form.querySelector('#cta-consent');
    var liveName = form.querySelector('#cta-name-live');
    var liveContact = form.querySelector('#cta-contact-live');
    var meterFill = document.querySelector('.cta__meter-fill');
    var meterLabel = document.querySelector('.cta__meter-label');
    var idleLabel = submitLabel ? submitLabel.textContent : 'Отправить заявку →';
    var busy = false;

    function setMessage(text, kind) {
      if (!msg) { return; }
      msg.textContent = text;
      msg.classList.remove('is-error', 'is-success');
      if (kind) { msg.classList.add('is-' + kind); }
    }
    function fieldErrorEl(field) {
      return form.querySelector('#' + field.id + '-error');
    }
    function showFieldError(field, text) {
      if (!field) { return; }
      field.setAttribute('aria-invalid', 'true');
      var wrap = field.closest('.cta__field');
      if (wrap) { wrap.classList.add('is-invalid'); }
      var error = fieldErrorEl(field);
      if (error) { error.textContent = text; }
    }
    function clearFieldError(field) {
      if (!field) { return; }
      field.removeAttribute('aria-invalid');
      var wrap = field.closest('.cta__field');
      if (wrap) { wrap.classList.remove('is-invalid'); }
      var error = fieldErrorEl(field);
      if (error) { error.textContent = ''; }
    }
    function clearAllFieldErrors() {
      clearFieldError(nameField);
      clearFieldError(contactField);
      clearFieldError(consentField);
    }
    function validName(v) {
      var t = trim(v);
      return t.length >= 2 && t.length <= 80;
    }
    function classifyContact(v) {
      var t = trim(v);
      if (!t) { return 'empty'; }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) { return 'email'; }
      var digits = t.replace(/\D/g, '');
      if (/^[+]?[0-9\s\-()]{5,}$/.test(t) && digits.length >= 5 && digits.length <= 15) {
        return 'phone';
      }
      return 'unknown';
    }
    function validContact(v) {
      var kind = classifyContact(v);
      return kind === 'email' || kind === 'phone';
    }
    function setLive(el, valid, text) {
      if (!el) { return; }
      var typeEl = el.querySelector('.field-live__type');
      if (typeEl) { typeEl.textContent = valid ? (text || '') : ''; }
      el.classList.toggle('is-valid', valid);
    }
    function refreshName() {
      var value = nameField ? nameField.value : '';
      setLive(liveName, !!trim(value) && validName(value), '');
    }
    function refreshContact() {
      var kind = classifyContact(contactField ? contactField.value : '');
      var text = kind === 'phone' ? 'телефон' : (kind === 'email' ? 'email' : '');
      setLive(liveContact, !!text, text);
    }
    function refreshMeter() {
      var filled = (validName(nameField ? nameField.value : '') ? 1 : 0) +
                   (validContact(contactField ? contactField.value : '') ? 1 : 0) +
                   (consentField && consentField.checked ? 1 : 0);
      if (meterFill) { meterFill.style.transform = 'scaleX(' + (filled / 3) + ')'; }
      if (meterLabel) { meterLabel.textContent = 'заполнено ' + filled + ' / 3'; }
    }
    function refreshLive() { refreshName(); refreshContact(); refreshMeter(); }

    function setButtonState(state) {
      if (!submitBtn) { return; }
      submitBtn.classList.remove('is-busy', 'is-done');
      if (state === 'busy') {
        submitBtn.classList.add('is-busy');
        if (submitLabel) { submitLabel.textContent = 'Отправляем…'; }
      } else if (state === 'done') {
        submitBtn.classList.add('is-done');
        if (submitLabel) { submitLabel.textContent = 'Отправлено'; }
      } else if (submitLabel) {
        submitLabel.textContent = idleLabel;
      }
    }
    function morph(update) {
      if (reduce || !document.startViewTransition) { update(); return; }
      document.startViewTransition(update);
    }
    function focusMessage() {
      if (msg && msg.focus) {
        msg.setAttribute('tabindex', '-1');
        msg.focus();
      }
    }

    if (nameField) {
      nameField.addEventListener('input', function () {
        clearFieldError(nameField);
        refreshName();
        refreshMeter();
      });
      nameField.addEventListener('blur', function () {
        if (trim(nameField.value) && !validName(nameField.value)) {
          showFieldError(nameField, 'Имя — от 2 до 80 символов.');
        }
      });
    }
    if (contactField) {
      contactField.addEventListener('input', function () {
        clearFieldError(contactField);
        refreshContact();
        refreshMeter();
      });
      contactField.addEventListener('blur', function () {
        if (trim(contactField.value) && !validContact(contactField.value)) {
          showFieldError(contactField, 'Похоже на опечатку — проверьте телефон или email.');
        }
      });
    }
    if (consentField) {
      consentField.addEventListener('change', function () {
        clearFieldError(consentField);
        refreshMeter();
      });
    }

    refreshLive();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) { return; }
      clearAllFieldErrors();
      setMessage('', null);

      var name = nameField ? trim(nameField.value) : '';
      var contact = contactField ? trim(contactField.value) : '';
      var firstInvalid = null;

      if (!validName(name)) {
        showFieldError(nameField, name ? 'Имя — от 2 до 80 символов.' : 'Укажите имя — как к вам обращаться.');
        firstInvalid = firstInvalid || nameField;
      }
      if (!validContact(contact)) {
        showFieldError(contactField, contact ? 'Похоже на опечатку — проверьте телефон или email.' : 'Оставьте телефон или email — куда ответить.');
        firstInvalid = firstInvalid || contactField;
      }
      if (!consentField || !consentField.checked) {
        if (consentField) {
          showFieldError(consentField, 'Отметьте согласие на обработку персональных данных.');
          firstInvalid = firstInvalid || consentField;
        } else {
          setMessage('Отметьте согласие на обработку персональных данных.', 'error');
          focusMessage();
          return;
        }
      }
      if (firstInvalid) {
        if (firstInvalid.focus) { firstInvalid.focus(); }
        return;
      }

      var turnstileToken = getTurnstileToken();
      if (!turnstileToken) {
        setMessage('Идёт проверка безопасности. Подождите пару секунд и нажмите «Отправить» ещё раз.', 'error');
        focusMessage();
        return;
      }

      busy = true;
      if (submitBtn) {
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.setAttribute('aria-disabled', 'true');
      }
      morph(function () { setButtonState('busy'); });
      setMessage('Отправляем…', null);

      var controller = ('AbortController' in window) ? new AbortController() : null;
      var timer = controller ? setTimeout(function () { controller.abort(); }, 10000) : null;
      var focusTarget = null;
      var succeeded = false;

      var payload = new URLSearchParams();
      payload.set('name', name);
      payload.set('contact', contact);
      payload.set('consent', 'yes');
      payload.set('cf-turnstile-response', turnstileToken);
      var honeypot = form.querySelector('#cta-website');
      if (honeypot) { payload.set('website', honeypot.value); }

      fetch(form.getAttribute('action') || 'https://api.artkull.ru/', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: payload,
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return { ok: false, error: 'bad_response' }; });
      }).then(function (data) {
        if (data && data.ok) {
          succeeded = true;
          form.reset();
          refreshLive();
          morph(function () { setButtonState('done'); });
          setMessage('Спасибо! Заявка отправлена — отвечу в течение дня.', 'success');
          focusTarget = msg;
          return;
        }
        var error = (data && data.error) ? data.error : 'failed';
        if (error === 'invalid_name_length' || error === 'invalid_name') {
          showFieldError(nameField, 'Имя — от 2 до 80 символов.');
          focusTarget = nameField;
          return;
        }
        if (error === 'invalid_contact_length' || error === 'invalid_contact') {
          showFieldError(contactField, 'Телефон или email — от 5 до 120 символов.');
          focusTarget = contactField;
          return;
        }
        if (error === 'invalid_contact_format') {
          showFieldError(contactField, 'Похоже на опечатку — проверьте телефон или email.');
          focusTarget = contactField;
          return;
        }
        if (error === 'invalid_consent') {
          showFieldError(consentField, 'Отметьте согласие на обработку персональных данных.');
          focusTarget = consentField || msg;
          return;
        }
        if (error === 'turnstile_failed') {
          setMessage('Не удалось пройти проверку безопасности. Попробуйте ещё раз.', 'error');
          focusTarget = msg;
          return;
        }
        if (error === 'rate_limited') {
          setMessage('Слишком много заявок подряд. Подожди пару минут или напиши в MAX по ссылке ниже.', 'error');
        } else {
          setMessage('Не удалось отправить — напиши в MAX по ссылке ниже.', 'error');
        }
        focusTarget = msg;
      }).catch(function () {
        setMessage('Не удалось отправить — проверь связь или напиши в MAX по ссылке ниже.', 'error');
        focusTarget = msg;
      }).then(function () {
        if (timer) { clearTimeout(timer); }
        busy = false;
        if (submitBtn) {
          submitBtn.removeAttribute('aria-busy');
          submitBtn.removeAttribute('aria-disabled');
        }
        resetTurnstile();
        if (succeeded) {
          setTimeout(function () { morph(function () { setButtonState('idle'); }); }, 2600);
        } else {
          morph(function () { setButtonState('idle'); });
        }
        if (focusTarget === msg) {
          focusMessage();
        } else if (focusTarget && focusTarget.focus) {
          focusTarget.focus();
        }
      });
    });
  }
})();
