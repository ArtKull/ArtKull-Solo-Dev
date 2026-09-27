(function () {
  var root = document.documentElement;
  root.classList.add('js');

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

  /* Форма-заглушка */
  var form = document.querySelector('.cta__form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.querySelector('.cta__message');
      if (msg) {
        msg.textContent = 'Заявка не отправляется — это демо. Напиши в мессенджер из блока контактов.';
      }
    });
  }
})();
