(function () {
  'use strict';

  var WA_NUMBER = '233264601488';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phoneMq = window.matchMedia('(max-width: 760px)');

  // Run a layout change without the tapped element jumping on screen
  // (e.g. when a section above it collapses).
  function keepInPlace(el, change) {
    var before = el.getBoundingClientRect().top;
    change();
    var shift = el.getBoundingClientRect().top - before;
    if (shift) window.scrollBy({ top: shift, behavior: 'instant' });
  }

  function openWa(text) {
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }
  function val(id) {
    var el = document.getElementById(id);
    return el && el.value ? String(el.value).trim() : '';
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var menuLabel = document.getElementById('menu-label');
  var mobileNav = document.getElementById('mobile-nav');
  function setMenu(open) {
    mobileNav.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? 'Close' : 'Menu';
  }
  menuBtn.addEventListener('click', function () { setMenu(mobileNav.hidden); });
  mobileNav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });

  /* ---------- Sticky header: compact once the blue bar scrolls away ---------- */
  var header = document.querySelector('.site-header');
  var utilBar = document.querySelector('.util');
  var stuck = false;
  // The header shrinks when stuck; a bottom margin of the same amount keeps the
  // page below from jumping up.
  function setStuck(on) {
    header.classList.remove('is-stuck');
    header.style.marginBottom = '';
    if (on) {
      var full = header.offsetHeight;
      header.classList.add('is-stuck');
      header.style.marginBottom = (full - header.offsetHeight) + 'px';
    }
    stuck = on;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      setStuck(!entries[0].isIntersecting);
    }).observe(utilBar);
    window.addEventListener('resize', function () { if (stuck) setStuck(true); });
  }

  /* ---------- Hero slideshow ---------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll('#hero-frame img'));
  var dotsWrap = document.getElementById('slide-dots');
  var slideTitle = document.getElementById('slide-title');
  var slidePlace = document.getElementById('slide-place');
  var current = 0;
  var timer = null;

  var dots = slides.map(function (img, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show photo ' + (i + 1) + ': ' + img.dataset.title);
    b.appendChild(document.createElement('span'));
    b.addEventListener('click', function () { showSlide(i); restartSlides(); });
    dotsWrap.appendChild(b);
    return b;
  });

  function showSlide(i) {
    current = i;
    slides.forEach(function (img, j) {
      var on = j === i;
      img.classList.toggle('is-active', on);
      img.setAttribute('aria-hidden', on ? 'false' : 'true');
      dots[j].setAttribute('aria-current', on ? 'true' : 'false');
    });
    slideTitle.textContent = slides[i].dataset.title;
    slidePlace.textContent = slides[i].dataset.place;
  }
  function restartSlides() {
    if (timer) clearInterval(timer);
    if (reduceMotion) return;
    timer = setInterval(function () { showSlide((current + 1) % slides.length); }, 6000);
  }
  showSlide(0);
  restartSlides();

  // Swipe the photo on touch screens; vertical drags still scroll the page
  // (the frame has touch-action: pan-y, so those arrive as pointercancel).
  var frame = document.getElementById('hero-frame');
  var swipe = null;
  frame.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    swipe = { x: e.clientX, y: e.clientY };
  });
  frame.addEventListener('pointerup', function (e) {
    if (!swipe) return;
    var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    var n = slides.length;
    showSlide((current + (dx < 0 ? 1 : n - 1)) % n);
    restartSlides();
  });
  frame.addEventListener('pointercancel', function () { swipe = null; });

  /* ---------- Services tabs ---------- */
  var SERVICES = [
    { label: 'Customs clearance', img: 'assets/1ae029847d93356f6add5eede62d3cc3.jpg', alt: 'Officers inspecting imported vehicles at Tema', title: 'Cleared at Tema, without the runaround', desc: 'Vehicles, containers and commercial cargo cleared properly at Tema harbour. We handle the paperwork and the port, and explain every cost.', points: ['Customs documentation and declarations', 'Duty and tax assessment explained up front', 'Examination and release coordination'] },
    { label: 'Freight forwarding', img: 'assets/b0a9fdc1d874625a7900d7daed21da74.jpg', alt: 'A white SUV loaded inside a shipping container', title: 'Your cargo, booked and moving', desc: 'We coordinate your shipment into Ghana so the cargo and the documents arrive together, ready for clearance.', points: ['Sea freight into Tema', 'Coordination with shipping lines and agents', 'Documents lined up before arrival'] },
    { label: 'Inland haulage', img: 'assets/a57d9422d24ea228e934fcc2213d1ae9.jpg', alt: 'Cartons unloaded from a container truck at a customer premises', title: 'From the port to your door or site', desc: 'Once released, we truck your cargo wherever it needs to go: a home in Accra, a warehouse in Kumasi or a project site up north.', points: ['Trucks matched to your load', 'Home, warehouse or project site', 'Delivery anywhere in Ghana'] },
    { label: 'Integrated logistics', img: 'assets/94b98d4a9abb09eb609278b7c37b8749.jpg', alt: 'A container packed with wrapped cartons and goods', title: 'One team, start to finish', desc: 'For traders and companies that import regularly: one contact who handles forwarding, clearance and delivery for every shipment.', points: ['A single point of contact', 'Regular imports handled on schedule', 'Clear updates at every stage'] }
  ];
  // Warm the cache so tab switches don't flash
  SERVICES.forEach(function (s) { new Image().src = s.img; });

  // Wider screens: tabs with one panel below. Phones: an accordion where the
  // panel opens directly under the tapped service.
  var tabList = document.getElementById('svc-tabs');
  var tabs = Array.prototype.slice.call(tabList.querySelectorAll('.svc-tab'));
  var panel = document.getElementById('svc-panel');
  var cur = 0;
  var svcOpen = true; // phones only: whether the current service is expanded
  var svcImg = document.getElementById('svc-img');
  var svcLabel = document.getElementById('svc-label');
  var svcTitle = document.getElementById('svc-title');
  var svcDesc = document.getElementById('svc-desc');
  var svcPoints = document.getElementById('svc-points');

  function layoutServices() {
    var phone = phoneMq.matches;
    if (phone) tabList.removeAttribute('role');
    else tabList.setAttribute('role', 'tablist');
    tabs.forEach(function (t, j) {
      var on = j === cur;
      if (phone) {
        t.setAttribute('role', 'button');
        t.removeAttribute('aria-selected');
        t.setAttribute('aria-expanded', String(on && svcOpen));
        t.tabIndex = 0;
      } else {
        t.setAttribute('role', 'tab');
        t.removeAttribute('aria-expanded');
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      }
    });
    panel.setAttribute('role', phone ? 'region' : 'tabpanel');
    panel.setAttribute('aria-labelledby', tabs[cur].id);
    panel.hidden = phone && !svcOpen;
    if (phone) tabs[cur].after(panel);
    else tabList.after(panel);
  }

  function selectService(i, focus) {
    var s = SERVICES[i];
    cur = i;
    layoutServices();
    svcImg.src = s.img;
    svcImg.alt = s.alt;
    svcLabel.textContent = s.label;
    svcTitle.textContent = s.title;
    svcDesc.textContent = s.desc;
    svcPoints.innerHTML = '';
    s.points.forEach(function (p) {
      var li = document.createElement('li');
      li.textContent = p;
      svcPoints.appendChild(li);
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      if (!phoneMq.matches) { selectService(i); return; }
      keepInPlace(t, function () {
        svcOpen = !(svcOpen && cur === i); // tapping the open service closes it
        selectService(i);
      });
    });
    t.addEventListener('keydown', function (e) {
      if (phoneMq.matches) return;
      var n = tabs.length, next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = n - 1;
      if (next !== null) { e.preventDefault(); selectService(next, true); }
    });
  });
  phoneMq.addEventListener('change', function () { svcOpen = true; layoutServices(); });
  layoutServices();

  /* ---------- FAQ deep links open the answer ---------- */
  function openFaqFromHash() {
    var id = location.hash.slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  window.addEventListener('hashchange', openFaqFromHash);
  openFaqFromHash();

  /* ---------- Hero question chips: show the answer in place ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-open-faq]'));
  var answerBox = document.getElementById('hero-answer');
  var answerText = document.getElementById('hero-answer-text');
  var chipList = document.querySelector('.chips');
  // Phones: answer sits under the tapped question. Wider screens: under the chip row.
  function placeAnswer() {
    var open = chips.filter(function (c) { return c.getAttribute('aria-expanded') === 'true'; })[0];
    if (phoneMq.matches && open) open.after(answerBox);
    else chipList.after(answerBox);
  }
  phoneMq.addEventListener('change', placeAnswer);
  chips.forEach(function (chip) {
    chip.setAttribute('role', 'button');
    chip.setAttribute('aria-expanded', 'false');
    chip.setAttribute('aria-controls', 'hero-answer');
    chip.addEventListener('click', function (e) {
      var faq = document.querySelector(chip.getAttribute('href'));
      var answer = faq && faq.querySelector('p');
      if (!answer) return; // fall back to jumping to the FAQ
      e.preventDefault();
      var opening = chip.getAttribute('aria-expanded') !== 'true';
      keepInPlace(chip, function () {
        chips.forEach(function (c) { c.setAttribute('aria-expanded', 'false'); });
        if (opening) {
          chip.setAttribute('aria-expanded', 'true');
          answerText.textContent = answer.textContent;
        }
        answerBox.hidden = !opening;
        placeAnswer();
      });
    });
    chip.addEventListener('keydown', function (e) {
      if (e.key === ' ') { e.preventDefault(); chip.click(); }
    });
  });

  /* ---------- WhatsApp forms ---------- */
  document.getElementById('track-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var ref = val('trk');
    openWa('Hello Tannor, could I please get an update on my shipment' + (ref ? ' (reference: ' + ref + ')' : '') + '?');
  });

  document.getElementById('quote-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var lines = ['Hello Tannor, I would like a quote.', 'Service: ' + val('q-service'), 'Cargo: ' + val('q-cargo')];
    if (val('q-from')) lines.push('Coming from: ' + val('q-from'));
    if (val('q-eta')) lines.push('Expected arrival: ' + val('q-eta'));
    if (val('q-items')) lines.push('Details: ' + val('q-items'));
    lines.push('Name: ' + (val('q-name') || '-'), 'Phone: ' + (val('q-phone') || '-'));
    openWa(lines.join('\n'));
  });

  /* ---------- Floating WhatsApp button: hidden while hero, track or quote is on screen ---------- */
  var waBtn = document.getElementById('wa-btn');
  var watchIds = ['top', 'track', 'quote'];
  if (!('IntersectionObserver' in window)) {
    waBtn.classList.remove('is-hidden');
  } else {
    var visible = {};
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var show = !watchIds.some(function (id) { return visible[id]; });
      waBtn.classList.toggle('is-hidden', !show);
      waBtn.tabIndex = show ? 0 : -1;
    });
    watchIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  /* ---------- Pause clips for reduced motion ---------- */
  if (reduceMotion) {
    document.querySelectorAll('.clip video').forEach(function (v) {
      v.removeAttribute('autoplay');
      v.pause();
      v.controls = true;
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
