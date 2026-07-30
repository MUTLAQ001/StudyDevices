(function () {
  'use strict';

  var state = { type: 'all', tier: 'all', q: '' };

  var elResults = document.getElementById('results');
  var elEmpty   = document.getElementById('empty');
  var elQ       = document.getElementById('q');
  var elModal   = document.getElementById('modal');
  var elModalBody = document.getElementById('modalBody');
  var elTheme   = document.getElementById('themeBtn');
  var elMeta    = document.getElementById('resultMeta');
  var elTop     = document.getElementById('toTop');
  var elControls = document.getElementById('controls');

  var TYPE_LABEL = { tablet: 'أجهزة التابلت', laptop: 'أجهزة اللابتوب' };
  var TYPE_ORDER = ['tablet', 'laptop'];
  var TIER_ORDER = ['eco', 'mid', 'high'];

  function countLabel(n) {
    if (n === 1) return 'جهاز واحد';
    if (n === 2) return 'جهازان';
    if (n <= 10) return n + ' أجهزة';
    return n + ' جهازاً';
  }

  function priceValue(s) {
    var m = String(s)
      .replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; })
      .replace(/[٬،,]/g, '')
      .match(/\d+/);
    return m ? +m[0] : Infinity;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function imgSrc(d) {
    return 'assets/img/' + (d.img || (d.slug + '.png'));
  }

  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[آأإٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىي]/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/[^\w؀-ۿ]+/g, ' ')
      .trim();
  }

  function haystack(d) {
    return norm([d.name, d.nameAr, d.brand, d.store,
      (d.highlights || []).join(' '),
      Object.keys(d.specs || {}).map(function (k) { return d.specs[k]; }).join(' ')
    ].join(' '));
  }

  function cardHTML(d) {
    var badges = '<span class="badge b-' + d.tier + '">' + esc(TIERS[d.tier].short) + '</span>';
    if (d.discontinued) badges += '<span class="badge b-warn">موديل متوقّف</span>';
    if (d.gaming)       badges += '<span class="badge b-game">مناسب للألعاب</span>';

    var tags = (d.highlights || []).map(function (h) {
      return '<span class="tag">' + esc(h) + '</span>';
    }).join('');

    var priceCls = d.discontinued ? 'price is-off' : 'price';
    var priceHTML = d.discontinued
      ? '<div class="' + priceCls + '">' + esc(d.price) + '</div>'
      : '<div class="' + priceCls + '"><span class="plabel">السعر</span>' + esc(d.price) + '</div>';

    return '' +
      '<article class="card" data-slug="' + esc(d.slug) + '">' +
        '<div class="card-media" data-open>' +
          '<span class="brand-tag">' + esc(d.brand) + '</span>' +
          '<img class="' + (d.solidBg ? 'solid' : '') + '" src="' + esc(imgSrc(d)) +
            '" alt="' + esc(d.name) + '" loading="lazy" decoding="async">' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="badges">' + badges + '</div>' +
          '<h3 data-open>' + esc(d.name) + '</h3>' +
          '<p class="sub">' + esc(d.nameAr) + '</p>' +
          '<div class="tags">' + tags + '</div>' +
          priceHTML +
          '<a class="buy" href="' + esc(d.url) + '" target="_blank" rel="noopener">' +
            'شراء من ' + esc(d.store) +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/>' +
            '<path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>' +
          '</a>' +
        '</div>' +
      '</article>';
  }

  var BL_ICON = {
    cpu: '<rect x="4" y="4" width="16" height="16" rx="3"/><rect x="8.5" y="8.5" width="7" height="7" rx="1.5"/>' +
         '<path d="M9 1.8v2.2M15 1.8v2.2M9 20v2.2M15 20v2.2M1.8 9H4M1.8 15H4M20 9h2.2M20 15h2.2"/>',
    ram: '<rect x="2" y="7" width="20" height="10" rx="2.5"/><path d="M6.5 11v2.5M10 11v2.5M13.5 11v2.5M17 11v2.5"/>',
    hdd: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/>' +
         '<path d="M7 7.5h.01M7 16.5h.01"/>'
  };

  function blItem(icon, label, value) {
    return '<div class="bl-item">' +
      '<svg class="bl-ico" viewBox="0 0 24 24" aria-hidden="true">' + BL_ICON[icon] + '</svg>' +
      '<div><span class="bl-k">' + esc(label) + '</span>' +
      '<span class="bl-v">' + esc(value) + '</span></div>' +
    '</div>';
  }

  function baselineHTML(tier) {
    var b = LAPTOP_BASELINE[tier];
    return '<div class="baseline">' +
      '<div class="bl-head">' +
        '<span class="bl-title">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>' +
          'الحد الأدنى من المواصفات' +
        '</span>' +
        '<span class="bl-range">' + esc(TIERS[tier].range) + '</span>' +
      '</div>' +
      '<div class="bl-grid">' +
        blItem('cpu', 'المعالج',  b.cpu) +
        blItem('ram', 'الرام',    b.ram) +
        blItem('hdd', 'التخزين',  b.storage) +
      '</div>' +
      '<p class="bl-for"><span>مناسبة لـ</span>' + esc(b.for) + '</p>' +
    '</div>';
  }

  function render() {
    var q = norm(state.q);
    var list = DEVICES.filter(function (d) {
      if (state.type !== 'all' && d.type !== state.type) return false;
      if (state.tier !== 'all' && d.tier !== state.tier) return false;
      if (q && haystack(d).indexOf(q) === -1) return false;
      return true;
    });

    var html = '';
    TYPE_ORDER.forEach(function (type) {
      TIER_ORDER.forEach(function (tier) {
        var group = list.filter(function (d) { return d.type === type && d.tier === tier; });
        if (!group.length) return;

        group.sort(function (a, b) { return priceValue(a.price) - priceValue(b.price); });

        html += '<section class="section t-' + tier + '">' +
          '<div class="sec-head">' +
            '<span class="tier-dot"></span>' +
            '<h2>' + esc(TYPE_LABEL[type]) + ' · ' + esc(TIERS[tier].label) + '</h2>' +
            (type === 'laptop' ? '<span class="sec-range">' + esc(TIERS[tier].range) + '</span>' : '') +
            '<span class="count">' + countLabel(group.length) + '</span>' +
          '</div>' +
          (type === 'laptop' ? baselineHTML(tier) : '') +
          '<div class="grid">' + group.map(cardHTML).join('') + '</div>' +
        '</section>';
      });
    });

    elResults.innerHTML = html;
    elEmpty.hidden = list.length > 0;

    var isFiltered = state.type !== 'all' || state.tier !== 'all' || !!state.q.trim();
    elMeta.innerHTML = !list.length
      ? ''
      : (isFiltered
          ? 'عرض <b>' + list.length + '</b> من أصل <b>' + DEVICES.length + '</b> جهاز'
          : 'كل الأجهزة — <b>' + DEVICES.length + '</b> جهاز');
  }

  function openModal(slug) {
    var d = DEVICES.filter(function (x) { return x.slug === slug; })[0];
    if (!d) return;

    var rows = Object.keys(d.specs || {}).map(function (k) {
      return '<li><span class="k">' + esc(k) + '</span><span class="v">' + esc(d.specs[k]) + '</span></li>';
    }).join('');

    elModalBody.innerHTML = '' +
      '<div class="m-media"><img class="' + (d.solidBg ? 'solid' : '') + '" src="' +
        esc(imgSrc(d)) + '" alt="' + esc(d.name) + '"></div>' +
      '<h2 id="mTitle">' + esc(d.name) + '</h2>' +
      '<p class="m-sub">' + esc(d.nameAr) + ' · ' + esc(d.brand) + ' · ' + esc(TIERS[d.tier].label) + '</p>' +
      '<ul class="spec-list">' + rows +
        '<li><span class="k">السعر</span><span class="v">' + esc(d.price) + '</span></li>' +
      '</ul>' +
      (d.note ? '<p class="note">' + esc(d.note) + '</p>' : '') +
      '<a class="buy" href="' + esc(d.url) + '" target="_blank" rel="noopener" style="margin-top:1rem">' +
        'شراء من ' + esc(d.store) +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/>' +
        '<path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>' +
      '</a>';

    elModal.hidden = false;
    elModal.scrollTop = 0;
    var gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingInlineEnd = gap + 'px';
  }

  function closeModal() {
    elModal.hidden = true;
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
  }

  var THEME_KEY = 'qu-devices-theme';

  function applyTheme(theme, save) {
    document.documentElement.setAttribute('data-theme', theme);
    var isMorning = theme === 'light';
    elTheme.querySelector('.theme-label').textContent = isMorning ? 'وضع ليلي' : 'وضع صباحي';
    elTheme.setAttribute('aria-pressed', isMorning ? 'true' : 'false');
    elTheme.setAttribute('title', isMorning ? 'التحويل للوضع الليلي' : 'التحويل للوضع الصباحي');
    if (save) { try { localStorage.setItem(THEME_KEY, theme); } catch (e) {} }
  }

  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

  elTheme.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
  });

  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function (e) {
      var saved = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch (err) {}
      if (saved !== 'light' && saved !== 'dark') applyTheme(e.matches ? 'dark' : 'light', false);
    };
    if (mq.addEventListener) mq.addEventListener('change', onScheme);
    else if (mq.addListener) mq.addListener(onScheme);
  }

  document.querySelectorAll('.seg-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.seg-btn').forEach(function (b) {
        b.classList.remove('is-on');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-on');
      btn.setAttribute('aria-selected', 'true');
      state.type = btn.dataset.type;
      render();
    });
  });

  document.querySelectorAll('.chip').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.chip').forEach(function (b) { b.classList.remove('is-on'); });
      btn.classList.add('is-on');
      state.tier = btn.dataset.tier;
      render();
    });
  });

  elQ.addEventListener('input', function () {
    state.q = elQ.value;
    render();
  });

  elResults.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-open]');
    if (!trigger) return;
    var card = trigger.closest('.card');
    if (card) openModal(card.dataset.slug);
  });

  elModal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !elModal.hidden) closeModal();
  });

  if (window.IntersectionObserver) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'height:1px;margin-block-end:-1px;';
    elControls.parentNode.insertBefore(sentinel, elControls);
    new IntersectionObserver(function (entries) {
      elControls.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    var apply = function () {
      var y = window.scrollY || document.documentElement.scrollTop;
      elTop.classList.toggle('is-on', y > 700);
      ticking = false;
    };
    if (window.requestAnimationFrame) window.requestAnimationFrame(apply);
    else apply();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  elTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('updated').textContent = PRICES_UPDATED;
  document.getElementById('statAll').textContent = DEVICES.length;
  document.getElementById('statTablet').textContent =
    DEVICES.filter(function (d) { return d.type === 'tablet'; }).length;
  document.getElementById('statLaptop').textContent =
    DEVICES.filter(function (d) { return d.type === 'laptop'; }).length;
  render();
})();
