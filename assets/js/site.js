/* Masterson Marketing & AI Solutions: site behavior and motion.
   Content is fully visible with JS off, if GSAP fails to load, or with
   prefers-reduced-motion on. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = root.classList.contains('reduced');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Where contact form submissions go (FormSubmit relays to this inbox).
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/ryan@mastersonmarketingai.com';

  /* ---------------- page curtain ---------------- */
  function reveal() { root.classList.remove('is-leaving', 'go'); root.classList.add('is-ready'); }
  function isInternal(a) {
    if (!a || a.target || a.hasAttribute('download')) return false;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|sms):/i.test(href)) return false;
    if (a.origin !== location.origin) return false;
    if (a.pathname === location.pathname && a.hash) return false;
    return true;
  }
  if (!reduced) {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a');
      if (!isInternal(a)) return;
      e.preventDefault();
      var href = a.href;
      root.classList.remove('is-ready', 'is-entering');
      root.classList.add('is-leaving');
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('go'); }); });
      setTimeout(function () { location.href = href; }, 560);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) reveal(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* ---------------- basics ---------------- */
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    // mobile menu
    var btn = $('.menu-btn'), nav = $('#nav');
    function setMenu(open) {
      nav.classList.toggle('open', open);
      root.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open);
      btn.querySelector('.sr').textContent = open ? 'Close menu' : 'Open menu';
      document.body.style.overflow = open ? 'hidden' : '';
    }
    if (btn && nav) {
      btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); btn.focus(); } });
      window.addEventListener('resize', function () { if (window.innerWidth > 920 && nav.classList.contains('open')) setMenu(false); });
    }

    // header: border once scrolled, tucks away when scrolling down
    var head = $('.site-head'), lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      head.classList.toggle('scrolled', y > 8);
      if (!root.classList.contains('menu-open')) head.classList.toggle('hide', y > 400 && y > lastY + 4);
      if (y < lastY - 4 || y < 400) head.classList.remove('hide');
      lastY = y;
    }, { passive: true });

    // Columbus local time in the hero panel
    var clock = $('[data-clock]');
    if (clock) {
      var fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
      var tickClock = function () { clock.textContent = fmt.format(new Date()); };
      tickClock(); setInterval(tickClock, 15000);
    }

    // viewfinder timecode
    $$('[data-timecode]').forEach(function (el) {
      if (reduced) return;
      var start = Date.now();
      setInterval(function () {
        var t = (Date.now() - start) / 1000, f = Math.floor((t % 1) * 24);
        var p = function (n) { return (n < 10 ? '0' : '') + n; };
        el.textContent = '00:' + p(Math.floor(t / 60) % 60) + ':' + p(Math.floor(t) % 60) + ':' + p(f);
      }, 1000 / 24);
    });

    // business card flip (tap support)
    $$('.flip').forEach(function (f) {
      f.addEventListener('click', function () { f.setAttribute('aria-pressed', f.getAttribute('aria-pressed') !== 'true'); });
    });

    // services page: highlight the service you are reading
    var idx = $$('.svc-index a');
    if (idx.length && 'IntersectionObserver' in window) {
      var map = {};
      idx.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && map[en.target.id]) {
            idx.forEach(function (a) { a.classList.remove('on'); });
            map[en.target.id].classList.add('on');
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      $$('.svc-item[id]').forEach(function (s) { io.observe(s); });
    }

    /* ---------------- contact form ---------------- */
    var form = $('#contact-form');
    if (form) {
      var status = $('#status'), send = form.querySelector('[type=submit]');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });
        if (data._honey) { form.reset(); return; }
        status.className = ''; status.textContent = 'Sending...';
        send.disabled = true;
        data._subject = 'New inquiry: ' + (data.project_type || 'Website') + ' from ' + (data.name || 'website visitor');
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (res.ok && String(res.j.success) === 'true') {
              form.reset();
              status.className = 'ok';
              status.textContent = 'Got it. Ryan will get back to you soon.';
            } else { throw new Error(res.j.message || 'send failed'); }
          })
          .catch(function () {
            status.className = 'err';
            status.innerHTML = 'That did not go through. Email <a href="mailto:ryan@mastersonmarketingai.com">ryan@mastersonmarketingai.com</a> or call <a href="tel:+16145800923">614-580-0923</a>.';
          })
          .then(function () { send.disabled = false; });
      });
    }

    /* ---------------- motion ---------------- */
    if (reduced) { reveal(); return; }
    if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('js'); reveal(); return; }

    try {
      gsap.registerPlugin(ScrollTrigger);
      var OUT = 'power3.out';

      // split headlines into masked words
      $$('[data-split]').forEach(function (el) {
        el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
        (function walk(node) {
          Array.prototype.slice.call(node.childNodes).forEach(function (n) {
            if (n.nodeType === 3) {
              var frag = document.createDocumentFragment();
              n.textContent.split(/(\s+)/).forEach(function (t) {
                if (!t) return;
                if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
                var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
                var i = document.createElement('span'); i.className = 'wi'; i.textContent = t;
                w.appendChild(i); frag.appendChild(w);
              });
              n.parentNode.replaceChild(frag, n);
            } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
          });
        })(el);
      });

      // statement: words fill in as you scroll
      $$('.statement').forEach(function (el) {
        el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) { return '<span class="wd">' + w + '</span>'; }).join(' ');
        gsap.to($$('.wd', el), { color: '#16202E', stagger: .1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
      });

      // curtain lifts, then the first screen plays in
      var first = $('main [data-split]');
      var intro = gsap.timeline({ delay: .25 });
      requestAnimationFrame(reveal);
      if (first) intro.to($$('.wi', first), { y: 0, duration: 1.1, stagger: .07, ease: 'expo.out' }, 0);
      intro.to($$('main section:first-of-type [data-reveal]'), { opacity: 1, y: 0, duration: .9, stagger: .1, ease: OUT }, .35);
      var hero = $('.hero .big-mark');
      if (hero) {
        // SVG shapes: anchor scaling to the bottom-center of each bar, not GSAP's top-left default
        gsap.set($$('rect', hero), { transformOrigin: '50% 100%', scaleY: 0, visibility: 'visible' });
        intro.to($$('rect', hero), { scaleY: 1, duration: 1.2, stagger: .14, ease: 'elastic.out(1,.6)' }, .4)
             .to('.panel .base', { scaleX: 1, duration: 1, ease: 'power2.inOut' }, .3);
        // bars keep a slow, live rhythm
        $$('rect', hero).forEach(function (r, i) {
          gsap.to(r, { scaleY: .86 + i * .03, duration: 2.4 + i * .5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2 + i * .3 });
        });
        gsap.to('.panel .big-mark', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      }
      $$('main section:first-of-type .hl').forEach(function (h) { intro.to(h, { backgroundSize: '100% .09em', duration: .9, ease: 'power2.inOut' }, 1); });

      // everything below the fold
      $$('[data-split]').forEach(function (el) {
        if (el === first) return;
        gsap.to($$('.wi', el), { y: 0, duration: 1, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });
      ScrollTrigger.batch($$('[data-reveal]').filter(function (el) { return !el.closest('main section:first-of-type'); }), {
        start: 'top 90%', once: true,
        onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .9, stagger: .1, ease: OUT }); }
      });
      $$('.hl').filter(function (h) { return !h.closest('main section:first-of-type'); }).forEach(function (h) {
        gsap.to(h, { backgroundSize: '100% .09em', duration: .9, ease: 'power2.inOut', scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
      });

      // process line fills as you read the steps
      $$('.steps').forEach(function (s) {
        var v = { ease: 'none', scrollTrigger: { trigger: s, start: 'top 75%', end: 'bottom 60%', scrub: .6 } };
        v[window.matchMedia('(max-width:860px)').matches ? 'scaleY' : 'scaleX'] = 1;
        gsap.to($('.track span', s), v);
      });

      // gentle parallax
      $$('[data-speed]').forEach(function (el) {
        var s = parseFloat(el.getAttribute('data-speed')) || .1;
        gsap.fromTo(el, { yPercent: s * 100 }, { yPercent: -s * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      var word = $('.foot-word');
      if (word) gsap.fromTo(word, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '.site-foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

      // card rows lift on enter (props cleared after, so CSS hover transforms keep working)
      var rows = $$('.svc-item, .np-row, .aud-card, .rules li, .ai-table .row');
      gsap.set(rows, { opacity: 0, y: 40 });
      ScrollTrigger.batch(rows, {
        start: 'top 92%', once: true,
        onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: .12, ease: OUT, clearProps: 'opacity,transform' }); }
      });

      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    } catch (err) {
      console.error('Motion failed; showing static page.', err);
      root.classList.remove('js'); root.classList.add('reduced'); reveal();
    }
  });
})();
