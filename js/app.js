(function () {
  var root = document.documentElement;
  window.__artkullReady = true;

  /* Тема */
  var toggle = document.querySelector('.theme-toggle');
  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function syncToggle() {
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(currentTheme() === 'dark'));
    }
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
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* Счётчики */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) { return; }
    if (reduce) { el.textContent = String(target); return; }
    var start = null;
    var duration = 900;
    function frame(ts) {
      if (start === null) { start = ts; }
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = String(Math.round(target * p));
      if (p < 1) { requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);
  }
  if (counters.length) {
    if (!hasIO) {
      counters.forEach(runCounter);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* Прогресс-бары */
  var bars = Array.prototype.slice.call(document.querySelectorAll('.progress__bar'));
  function runBar(el) {
    el.style.width = (el.getAttribute('data-value') || '0') + '%';
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

  /* Форма заявки */
  var form = document.querySelector('.cta__form');
  if (form) {
    var msg = document.querySelector('.cta__message');
    var submitBtn = form.querySelector('button[type="submit"]');
    var nameField = form.querySelector('#cta-name');
    var contactField = form.querySelector('#cta-contact');

    function setMessage(text, kind) {
      if (!msg) { return; }
      msg.textContent = text;
      msg.classList.remove('is-error', 'is-success');
      if (kind) { msg.classList.add('is-' + kind); }
    }
    function validName(v) { return v.length >= 2 && v.length <= 80; }
    function validContact(v) {
      if (v.length < 5 || v.length > 120) { return false; }
      var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      var isPhone = /^[+]?[0-9\s\-()]{5,}$/.test(v) && v.replace(/\D/g, '').length >= 5;
      return isEmail || isPhone;
    }
    function finish() {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
      }
      if (msg && msg.focus) {
        msg.setAttribute('tabindex', '-1');
        msg.focus();
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameField ? nameField.value.trim() : '';
      var contact = contactField ? contactField.value.trim() : '';

      if (!validName(name)) {
        setMessage('Укажите имя (2–80 символов).', 'error');
        if (nameField) { nameField.focus(); }
        return;
      }
      if (!validContact(contact)) {
        setMessage('Укажите телефон или email.', 'error');
        if (contactField) { contactField.focus(); }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
      }
      setMessage('Отправляем…', null);

      var controller = ('AbortController' in window) ? new AbortController() : null;
      var timer = controller ? setTimeout(function () { controller.abort(); }, 10000) : null;

      fetch(form.getAttribute('action') || 'send.php', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return { ok: false }; });
      }).then(function (data) {
        if (data && data.ok) {
          form.reset();
          setMessage('✓ Спасибо! Заявка отправлена — отвечу в течение дня.', 'success');
          return;
        }
        throw new Error('failed');
      }).catch(function () {
        setMessage('⚠ Не удалось отправить — напишите в Telegram или MAX из строки ниже.', 'error');
      }).then(function () {
        if (timer) { clearTimeout(timer); }
        finish();
      });
    });
  }
})();
