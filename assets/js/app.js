// assets/js/app.js — robuuste loader met ?feed= noodklep en betere errors

const $grid  = document.getElementById('grid');
const $stats = document.getElementById('stats');
const $alert = document.getElementById('alert');

const $prov   = document.getElementById('filterProvincie');
const $type   = document.getElementById('filterType');
const $status = document.getElementById('filterStatus');

const $logo       = document.getElementById('realtorLogo');
const $link       = document.getElementById('realtorLink');
let $themeLink    = document.getElementById('themeStylesheet');
let $defaultThemeLink = document.getElementById('defaultThemeStylesheet');
const $stylePanel = document.querySelector('.style-panel');
const $mainThemed = document.querySelector('main.container.themed');
const $header     = document.querySelector('.header--neutral');
const $hamburger  = document.querySelector('.hamburger');
const $menu       = document.getElementById('primaryNavigation');

function initHamburgerMenu() {
  if (!$header || !$hamburger || !$menu) return;

  const focusableSelector = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

  let $backdrop = $header.querySelector('.header-menu__backdrop');
  if (!$backdrop) {
    $backdrop = document.createElement('div');
    $backdrop.className = 'header-menu__backdrop';
    $backdrop.setAttribute('aria-hidden', 'true');
    $header.insertBefore($backdrop, $menu);
  }

  const $closeButton = $menu.querySelector('.header-menu__close');

  const applyScrollLock = (isOpen) => {
    if (!document.body) return;
    document.body.classList.toggle('has-menu-open', isOpen);
  };

  const setMenuState = (open, options = {}) => {
    const { silent = false } = options;
    const isOpen = Boolean(open);
    const wasOpen = $menu.classList.contains('open');

    $header.classList.toggle('menu-open', isOpen);
    $menu.classList.toggle('open', isOpen);
    $menu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    $hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if ($backdrop) {
      $backdrop.classList.toggle('visible', isOpen);
      $backdrop.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
    applyScrollLock(isOpen);

    const stateChanged = wasOpen !== isOpen;
    if (!stateChanged || silent) {
      return isOpen;
    }

    if (isOpen) {
      requestAnimationFrame(() => {
        const focusTarget =
          $menu.querySelector('.header-menu__close') ||
          $menu.querySelector(focusableSelector);
        if (focusTarget instanceof HTMLElement) {
          try {
            focusTarget.focus({ preventScroll: true });
          } catch (e) {
            focusTarget.focus();
          }
        }
      });
    } else {
      const active = document.activeElement;
      if (active && $menu.contains(active)) {
        requestAnimationFrame(() => {
          if ($hamburger instanceof HTMLElement) {
            try {
              $hamburger.focus({ preventScroll: true });
            } catch (e) {
              $hamburger.focus();
            }
          }
        });
      }
    }

    return isOpen;
  };

  const closeMenu = () => setMenuState(false);

  setMenuState(false, { silent: true });

  $hamburger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const willOpen = !$menu.classList.contains('open');
    setMenuState(willOpen);
  });

  if ($closeButton) {
    $closeButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    });
  }

  if ($backdrop) {
    $backdrop.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    });
  }

  $menu.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('a')) {
      closeMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (!$menu.classList.contains('open')) return;
    const target = event.target;
    if ($menu.contains(target) || $hamburger.contains(target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && $menu.classList.contains('open')) {
      closeMenu();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHamburgerMenu, { once: true });
} else {
  initHamburgerMenu();
}

const DEFAULT_THEME_STYLESHEET = 'assets/css/themes/default.css';
const OVERRIDE_STYLES = `
main.container.themed .card {
  box-shadow: var(--card-shadow, none);
  aspect-ratio: var(--card-aspect, 7 / 8);
}
main.container.themed .card .media {
  padding-top: var(--media-ratio, 58%);
}
main.container.themed .card .media .badge {
  left: var(--badge-offset, 12px);
  top: var(--badge-offset, 12px);
  padding: calc(var(--badge-padding, 10px) * 0.6) var(--badge-padding, 10px);
  border-radius: var(--badge-radius, 4px);
  background: var(--badge-color, #22c55e);
  color: var(--badge-text, #052e16) !important;
  font-family: var(--font-label, var(--font-body, 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial));
}
main.container.themed .card .body {
  font-family: var(--font-body, 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial);
}
main.container.themed .card .body .name {
  color: var(--title-color, #0f172a) !important;
  font-family: var(--font-heading, 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial);
}
main.container.themed .card .body .addr,
main.container.themed .card .body .meta {
  color: var(--general-text, var(--muted, #475569)) !important;
}
main.container.themed .card .actions {
  padding: calc(var(--button-offset, 16px) * 0.75) var(--button-offset, 16px);
}
main.container.themed .card .actions .btn {
  padding: calc(var(--button-padding, 14px) * 0.7) var(--button-padding, 14px);
  border-radius: var(--button-radius, 40px);
  box-shadow: var(--button-shadow, none);
  color: var(--button-text, #ffffff) !important;
  font-family: var(--font-button, var(--font-body, 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial));
  background: var(--accent, #2563eb);
}
`;
let overrideStyleEl = null;

const params = new URLSearchParams(location.search);
const realtorKey = (params.get('realtor') || '').trim().toLowerCase();
const overrideFeed = params.get('feed')?.trim();

let RAW = [];
let FILTERED = [];
let CURRENT_MEDIA_RATIO = null;

function ensureOverrideStyles() {
  if (!$mainThemed) return null;
  if (!overrideStyleEl) {
    overrideStyleEl = document.getElementById('themeStyleOverrides') || document.createElement('style');
    overrideStyleEl.id = 'themeStyleOverrides';
  }
  overrideStyleEl.textContent = OVERRIDE_STYLES;
  if (overrideStyleEl.parentNode) {
    overrideStyleEl.parentNode.removeChild(overrideStyleEl);
  }
  const parent = $themeLink && $themeLink.parentNode ? $themeLink.parentNode : document.head;
  if ($themeLink && $themeLink.nextSibling) {
    parent.insertBefore(overrideStyleEl, $themeLink.nextSibling);
  } else {
    parent.appendChild(overrideStyleEl);
  }
  return overrideStyleEl;
}

async function ensureDefaultThemeStylesheet() {
  if (!$defaultThemeLink) {
    $defaultThemeLink = document.createElement('link');
    $defaultThemeLink.rel = 'stylesheet';
    $defaultThemeLink.id = 'defaultThemeStylesheet';
    if ($themeLink && $themeLink.parentNode) {
      $themeLink.parentNode.insertBefore($defaultThemeLink, $themeLink);
    } else {
      document.head.appendChild($defaultThemeLink);
    }
  }

  const currentHref = $defaultThemeLink.getAttribute('href');
  const absoluteCurrent = currentHref ? new URL(currentHref, location.href).href : null;
  const absoluteTarget = new URL(DEFAULT_THEME_STYLESHEET, location.href).href;

  if (absoluteCurrent !== absoluteTarget) {
    $defaultThemeLink.setAttribute('href', DEFAULT_THEME_STYLESHEET);
  }

  await waitForStylesheet($defaultThemeLink);
  return $defaultThemeLink;
}

function showError(msg) {
  if (!$alert) return;
  $alert.textContent = msg;
  $alert.classList.remove('hidden');
  console.error('[Vendr Embed] ' + msg);
}
function clearError() {
  if (!$alert) return;
  $alert.classList.add('hidden');
  $alert.textContent = '';
}

const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
  '<rect width="400" height="300" fill="#e5e7eb"/>' +
  '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="#111827">Geen afbeelding</text>' +
  '</svg>'
);

function normalizeStatus(it) {
  const av   = (it.availability || '').toLowerCase().trim();
  const sold = !!it.is_sold;
  const st   = (it.status || '').toLowerCase();
  if (sold || av === 'sold' || /verkocht(?!.*voorbehoud)/.test(st)) return 'sold';
  if (av === 'sold_stc' || /verkocht.*voorbehoud/.test(st)) return 'sold_stc';
  if (av === 'under_bid' || /onder.*bod/.test(st)) return 'under_bid';
  return 'available';
}
function statusBadgeText(it) {
  const s = normalizeStatus(it);
  if (s === 'sold')      return 'Verkocht';
  if (s === 'under_bid') return 'Onder bod';
  if (s === 'sold_stc')  return 'Verkocht o.v.';
  return 'Beschikbaar';
}

const PROV = [
  'Groningen','Friesland','Drenthe','Overijssel','Flevoland',
  'Gelderland','Utrecht','Noord-Holland','Zuid-Holland','Zeeland',
  'Noord-Brabant','Limburg'
];
function inferProvince(item) {
  const s = [item.province, item.full_address, item.city, item.location]
    .filter(Boolean).join(' ');
  for (const p of PROV) if (s.includes(p)) return p;
  return 'Onbekend';
}
function inferType(item) {
  const s = [
    item.asset_type, item.type, item.specifications,
    item.description, item.selling_procedure
  ].filter(Boolean).join(' ').toLowerCase();
  if (s.includes('kantoor')) return 'Kantoor';
  if (s.includes('winkel')) return 'Winkel';
  if (s.includes('logistiek') || s.includes('bedrijfshal') || s.includes('magazijn')) return 'Bedrijfsruimte';
  if (s.includes('bouwgrond') || s.includes('grond')) return 'Grond';
  if (s.includes('horeca')) return 'Horeca';
  return 'Overig';
}

function renderCards(items) {
  if (!$grid) return;
  $grid.innerHTML = '';
  const tpl = document.getElementById('card-tpl');
  if (!tpl) { showError('Template card-tpl ontbreekt in index.html'); return; }

  items.forEach(it => {
    const node = tpl.content.cloneNode(true);

    const img = node.querySelector('.img');
    if (img) {
      img.src = it.image || PLACEHOLDER;
      img.alt = it.name || '';
      img.onerror = () => { img.src = PLACEHOLDER; };
    }

    const badge = node.querySelector('.badge');
    if (badge) badge.textContent = statusBadgeText(it);

    const name = node.querySelector('.name');
    if (name) name.textContent = it.name || '—';

    const addr = node.querySelector('.addr');
    if (addr) addr.textContent = it.full_address || '';

    const a = node.querySelector('.btn');
    if (a)   a.href = it.url || '#';

    $grid.appendChild(node);
  });

  if ($stats) $stats.textContent = `${items.length} resultaten`;

  applyMediaRatioToCards(CURRENT_MEDIA_RATIO || readMediaRatio());
}

function populateFilterOptions(items) {
  if ($prov) {
    const provinces = Array.from(new Set(items.map(x => x._province))).filter(Boolean).sort();
    $prov.innerHTML = '<option value="">Alle</option>' + provinces.map(p => `<option>${p}</option>`).join('');
  }
  if ($type) {
    const types     = Array.from(new Set(items.map(x => x._type))).filter(Boolean).sort();
    $type.innerHTML = '<option value="">Alle</option>' + types.map(t => `<option>${t}</option>`).join('');
  }
}

function applyFilters() {
  const p = $prov?.value || '';
  const t = $type?.value || '';
  const s = $status?.value || '';

  FILTERED = RAW.filter(x => {
    const okP = !p || x._province === p;
    const okT = !t || x._type === t;
    const st  = normalizeStatus(x);
    const okS = !s || st === s;
    return okP && okT && okS;
  });

  renderCards(FILTERED);
}

async function getJSON(url, label='') {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${label||'GET'} ${url} → HTTP ${r.status}`);
  return r.json();
}

async function loadDataFromMeta(meta) {
  // 1) Probeer lokale file
  if (meta?.uuid) {
    const local = `data/realtor-${meta.uuid}.json`;
    try {
      console.log('[Vendr Embed] Fetch local:', local);
      return await getJSON(local, 'local');
    } catch (e) {
      console.warn('[Vendr Embed] Local failed:', e.message);
    }
  }
  // 2) Fallback naar externe feed
  if (meta?.feed) {
    try {
      console.log('[Vendr Embed] Fetch external:', meta.feed);
      return await getJSON(meta.feed, 'feed');
    } catch (e) {
      console.warn('[Vendr Embed] External failed:', e.message);
    }
  }
  throw new Error('Geen bruikbare feed (lokaal of extern) gevonden.');
}

(async function bootstrap() {
  try {
    clearError();

    // Noodklep: ?feed=... (negeert mapping)
    if (overrideFeed) {
      console.log('[Vendr Embed] Using override feed:', overrideFeed);
      const data = await getJSON(overrideFeed, 'override');
      RAW = data.map(x => ({ ...x, _province: x.province || inferProvince(x), _type: x.asset_type || x.type || inferType(x) }));
      populateFilterOptions(RAW);
      $prov?.addEventListener('change', applyFilters);
      $type?.addEventListener('change', applyFilters);
      $status?.addEventListener('change', applyFilters);
      renderCards(RAW);
      initStylePanel();
      return;
    }

    // Mapping ophalen
    const mapMeta = await getJSON('data/realtors.json', 'map');
    if (!mapMeta?.realtors) throw new Error('Ontbrekende sleutel "realtors" in data/realtors.json');

    const meta = mapMeta.realtors[realtorKey];
    if (!meta) throw new Error(`Onbekende realtor "${realtorKey}". Controleer data/realtors.json`);

    // Merk & thema
    await applyThemeStylesheet(meta);
    initStylePanel();
    if ($logo && meta.logo) { $logo.src = meta.logo; $logo.alt = meta.name || 'Realtor'; }
    if ($link && meta.website) {
      $link.href = /^https?:\/\//i.test(meta.website) ? meta.website : ('https://' + meta.website);
    }

    // Data
    const data = await loadDataFromMeta(meta);
    RAW = data.map(x => ({ ...x, _province: x.province || inferProvince(x), _type: x.asset_type || x.type || inferType(x) }));

    // Filters & render
    populateFilterOptions(RAW);
    $prov?.addEventListener('change', applyFilters);
    $type?.addEventListener('change', applyFilters);
    $status?.addEventListener('change', applyFilters);

    renderCards(RAW);
    initStylePanel();
  } catch (e) {
    showError(e.message || String(e));
  }
})();

const FONT_MAP = {
  inter: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  roboto: "'Roboto', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  'roboto-slab': "'Roboto Slab', 'Times New Roman', serif"
};

let COLOR_CANVAS = null;

function normalizeCssColor(value) {
  if (!value) return null;
  const canvas = COLOR_CANVAS || (COLOR_CANVAS = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  if (!ctx) return value.trim();
  try {
    ctx.fillStyle = '#000';
    ctx.fillStyle = value.trim();
    const normalized = ctx.fillStyle || value.trim();
    if (/^rgba?/i.test(normalized)) {
      const parts = normalized.replace(/rgba?\(|\)|\s+/gi, '').split(',');
      const [r, g, b] = parts.map(Number);
      if ([r, g, b].every(n => Number.isFinite(n))) {
        return '#' + [r, g, b].map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
      }
    }
    return normalized;
  } catch (e) {
    return value.trim();
  }
}

function initColorInputs(main, form) {
  const computed = getComputedStyle(main);
  form.querySelectorAll('input[type="color"][data-css-prop]').forEach(input => {
    const props = input.dataset.cssProp?.split(/\s+/).filter(Boolean) || [];
    if (!props.length) return;

    if (!input.dataset.defaultColor) {
      input.dataset.defaultColor = input.getAttribute('value') || input.value;
    }

    const fallback = input.dataset.defaultColor;
    let current = null;

    for (const prop of props) {
      const raw = (computed.getPropertyValue(prop) || '').trim();
      if (!raw) continue;
      const normalized = normalizeCssColor(raw);
      if (normalized) {
        current = normalized;
        break;
      }
    }

    if (!current) {
      const selector = input.dataset.sampleSelector;
      const sampleProp = input.dataset.sampleProp || 'color';
      if (selector) {
        const sampleNode = document.querySelector(selector);
        if (sampleNode) {
          try {
            const sampleStyle = getComputedStyle(sampleNode);
            const raw = (sampleStyle.getPropertyValue(sampleProp) || '').trim();
            const normalized = normalizeCssColor(raw);
            if (normalized) {
              current = normalized;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }

    if (!current) current = fallback;
    if (current) {
      input.value = current;
      input.dataset.currentColor = current;
      props.forEach(prop => {
        if (prop.startsWith('--')) {
          main.style.setProperty(prop, current);
        }
        document.documentElement.style.setProperty(prop, current);
      });
    }

    if (input.dataset.colorInit !== '1') {
      input.dataset.colorInit = '1';
      input.addEventListener('input', () => {
        const value = input.value;
        input.dataset.currentColor = value;
        props.forEach(prop => {
          if (prop.startsWith('--')) {
            main.style.setProperty(prop, value);
          }
          document.documentElement.style.setProperty(prop, value);
        });
      });
    }
  });
}

function initRangeInputs(main, form) {
  const computed = getComputedStyle(main);
  form.querySelectorAll('input[type="range"][data-css-prop]').forEach(input => {
    const prop = input.dataset.cssProp;
    if (!prop) return;
    const unit = input.dataset.unit || '';
    let current = (computed.getPropertyValue(prop) || '').trim();

    if (!current) {
      const selector = input.dataset.sampleSelector;
      const sampleProp = input.dataset.sampleProp;
      if (selector && sampleProp) {
        const sampleNode = document.querySelector(selector);
        if (sampleNode) {
          try {
            const sampleStyle = getComputedStyle(sampleNode);
            const raw = (sampleStyle.getPropertyValue(sampleProp) || '').trim();
            if (raw) {
              current = raw;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }

    if (current) {
      const numeric = parseFloat(current);
      if (!Number.isNaN(numeric)) {
        input.value = String(numeric);
      }
      main.style.setProperty(prop, current);
      document.documentElement.style.setProperty(prop, current);
    } else if (input.value) {
      const valueWithUnit = unit ? input.value + unit : input.value;
      main.style.setProperty(prop, valueWithUnit);
      document.documentElement.style.setProperty(prop, valueWithUnit);
      current = valueWithUnit;
    }

    if (prop === '--media-ratio' && current) {
      applyMediaRatioToCards(current);
    }

    if (input.dataset.rangeInit !== '1') {
      input.dataset.rangeInit = '1';
      input.addEventListener('input', () => {
        const value = input.value + unit;
        main.style.setProperty(prop, value);
        document.documentElement.style.setProperty(prop, value);
        if (prop === '--media-ratio') {
          applyMediaRatioToCards(value);
        }
      });
    }
  });
}

function initElevation(main, form) {
  const slider = form.querySelector('input[type="range"][data-elevation]');
  if (!slider) return;

  let computed = getComputedStyle(main).getPropertyValue('--card-shadow').trim();
  if (!computed || computed === 'none') {
    const card = document.querySelector('.grid .card');
    if (card) {
      try {
        const cardShadow = (getComputedStyle(card).boxShadow || '').trim();
        if (cardShadow && cardShadow !== 'none') {
          computed = cardShadow;
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (computed && computed !== 'none') {
    const match = computed.match(/0\s+(\d+(?:\.\d+)?)px/i);
    if (match) {
      const y = Number(match[1]);
      const derived = Math.max(0, Math.round((y - 2) / 1.5));
      slider.value = String(derived);
    }
  }
  if (!computed || computed === 'none') {
    slider.value = '0';
  }

  const applyElevation = (level) => {
    const amount = Math.max(0, Number(level) || 0);
    if (amount === 0) {
      main.style.setProperty('--card-shadow', 'none');
      document.documentElement.style.setProperty('--card-shadow', 'none');
      return;
    }
    const offset = Math.round(amount * 1.5 + 2);
    const blur = Math.round(amount * 4 + 6);
    const spread = Math.round(amount * 0.6);
    const opacity = Math.min(0.18 + amount * 0.02, 0.45).toFixed(2);
    const shadow = `0 ${offset}px ${blur}px ${spread ? spread + 'px' : '0'} rgba(15,23,42,${opacity})`;
    main.style.setProperty('--card-shadow', shadow);
    document.documentElement.style.setProperty('--card-shadow', shadow);
  };

  applyElevation(slider.value);
  if (slider.dataset.elevationInit !== '1') {
    slider.dataset.elevationInit = '1';
    slider.addEventListener('input', () => applyElevation(slider.value));
  }
}

function initButtonShadow(main, form) {
  const slider = form.querySelector('input[type="range"][data-button-shadow]');
  if (!slider) return;

  let computed = getComputedStyle(main).getPropertyValue('--button-shadow').trim();
  if (!computed || computed === 'none') {
    const button = document.querySelector('.grid .card .actions .btn');
    if (button) {
      try {
        const shadow = (getComputedStyle(button).boxShadow || '').trim();
        if (shadow && shadow !== 'none') {
          computed = shadow;
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (computed && computed !== 'none') {
    const match = computed.match(/0\s+(\d+(?:\.\d+)?)px/i);
    if (match) {
      const y = Number(match[1]);
      const derived = Math.max(0, Math.round((y - 1) / 1.2));
      slider.value = String(derived);
    }
  }
  if (!computed || computed === 'none') {
    slider.value = '0';
  }

  const applyShadow = (level) => {
    const amount = Math.max(0, Number(level) || 0);
    if (amount === 0) {
      main.style.setProperty('--button-shadow', 'none');
      document.documentElement.style.setProperty('--button-shadow', 'none');
      return;
    }
    const offset = Math.round(amount * 1.2 + 1);
    const blur = Math.round(amount * 3 + 6);
    const spread = Math.round(amount * 0.4);
    const opacity = Math.min(0.15 + amount * 0.02, 0.4).toFixed(2);
    const shadow = `0 ${offset}px ${blur}px ${spread ? spread + 'px' : '0'} rgba(15,23,42,${opacity})`;
    main.style.setProperty('--button-shadow', shadow);
    document.documentElement.style.setProperty('--button-shadow', shadow);
  };

  applyShadow(slider.value);
  if (slider.dataset.buttonShadowInit !== '1') {
    slider.dataset.buttonShadowInit = '1';
    slider.addEventListener('input', () => applyShadow(slider.value));
  }
}

function initAspectSelect(main, form) {
  const select = form.querySelector('select[data-aspect-select]');
  if (!select) return;

  const applyAspect = (value) => {
    if (!value) return;
    main.style.setProperty('--card-aspect', value);
    document.documentElement.style.setProperty('--card-aspect', value);
  };

  const normalizeAspect = (value) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (/^\d+\s*\/\s*\d+$/.test(trimmed)) {
      const parts = trimmed.split('/').map(part => part.trim());
      return `${parts[0]} / ${parts[1]}`;
    }
    const numeric = Number.parseFloat(trimmed);
    if (!Number.isFinite(numeric) || numeric <= 0) return '';
    const ratios = ['2 / 3', '3 / 4', '5 / 7', '7 / 8'];
    let best = ratios[ratios.length - 1];
    let diff = Number.POSITIVE_INFINITY;
    ratios.forEach(ratio => {
      const [a, b] = ratio.split('/').map(part => Number(part.trim()));
      if (!a || !b) return;
      const valueRatio = a / b;
      const delta = Math.abs(valueRatio - numeric);
      if (delta < diff) {
        diff = delta;
        best = ratio;
      }
    });
    return best;
  };

  let current = (getComputedStyle(main).getPropertyValue('--card-aspect') || '').trim();
  if (!current) {
    const card = document.querySelector('.grid .card');
    if (card) {
      try {
        const inline = card.style.aspectRatio;
        const computedAspect = inline || (getComputedStyle(card).aspectRatio || '').trim();
        if (computedAspect) {
          current = computedAspect;
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (current) {
    const normalized = normalizeAspect(current);
    if (normalized) {
      select.value = normalized;
      applyAspect(normalized);
    }
  } else if (select.value) {
    applyAspect(select.value);
  }

  if (select.dataset.aspectInit !== '1') {
    select.dataset.aspectInit = '1';
    select.addEventListener('change', () => applyAspect(select.value));
  }
}

function initOutline(main, form) {
  const toggle = form.querySelector('#styleOutline');
  if (!toggle) return;

  const apply = (checked) => {
    main.dataset.cardOutline = checked ? '1' : '0';
  };

  const isOutlined = main.dataset.cardOutline !== '0';
  toggle.checked = isOutlined;
  apply(toggle.checked);
  if (toggle.dataset.outlineInit !== '1') {
    toggle.dataset.outlineInit = '1';
    toggle.addEventListener('change', () => apply(toggle.checked));
  }
}

function initFontSelects(main, form) {
  const rootStyle = document.documentElement.style;
  const computed = getComputedStyle(document.documentElement);

  form.querySelectorAll('select[data-font-target]').forEach(select => {
    const target = select.dataset.fontTarget || 'body';
    const cssVar = target === 'heading'
      ? '--font-heading'
      : target === 'label'
        ? '--font-label'
        : target === 'button'
          ? '--font-button'
          : '--font-body';

    let currentValue = (computed.getPropertyValue(cssVar) || '').trim();
    if (!currentValue && select.dataset.fontSelector) {
      const node = document.querySelector(select.dataset.fontSelector);
      if (node) {
        try {
          currentValue = (getComputedStyle(node).fontFamily || '').trim();
        } catch (e) {
          // ignore
        }
      }
    }

    if (currentValue) {
      const normalized = currentValue.toLowerCase();
      const match = Object.entries(FONT_MAP).find(([, stack]) => stack.toLowerCase() === normalized);
      if (match) {
        select.value = match[0];
        currentValue = FONT_MAP[match[0]];
      }
      rootStyle.setProperty(cssVar, currentValue);
      main.style.setProperty(cssVar, currentValue);
      if (target === 'body') {
        document.body.style.fontFamily = currentValue;
      }
    }

    if (select.dataset.fontInit !== '1') {
      select.dataset.fontInit = '1';
      select.addEventListener('change', () => {
        const key = select.value;
        const stack = FONT_MAP[key];
        if (!stack) return;
        rootStyle.setProperty(cssVar, stack);
        main.style.setProperty(cssVar, stack);
        if (target === 'body') {
          document.body.style.fontFamily = stack;
        }
      });
    }
  });
}

function initStylePanel() {
  if (!$mainThemed) return;
  const form = document.querySelector('.style-panel__form');
  if (!form) return;

  ensureOverrideStyles();
  ensureStylePanelVisible();

  initColorInputs($mainThemed, form);
  initRangeInputs($mainThemed, form);
  initAspectSelect($mainThemed, form);
  initElevation($mainThemed, form);
  initButtonShadow($mainThemed, form);
  initOutline($mainThemed, form);
  initFontSelects($mainThemed, form);

  applyMediaRatioToCards(CURRENT_MEDIA_RATIO || readMediaRatio());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStylePanel, { once: true });
} else {
  initStylePanel();
}

function ensureStylePanelVisible() {
  if (!$stylePanel) return;
  $stylePanel.hidden = false;
  const enforce = () => {
    $stylePanel.style.setProperty('display', 'flex', 'important');
  };
  try {
    const display = getComputedStyle($stylePanel).display;
    if (display === 'none') {
      enforce();
    }
  } catch (e) {
    enforce();
  }
  enforce();
}

function readMediaRatio() {
  if (!$mainThemed) return '58%';
  const inline = $mainThemed.style.getPropertyValue('--media-ratio');
  if (inline && inline.trim()) return inline.trim();
  try {
    const computed = getComputedStyle($mainThemed).getPropertyValue('--media-ratio');
    if (computed && computed.trim()) return computed.trim();
  } catch (e) {
    // ignore errors (e.g. detached node)
  }
  return '58%';
}

function applyMediaRatioToCards(ratio) {
  if (!ratio) return;
  CURRENT_MEDIA_RATIO = ratio;
  document.querySelectorAll('.grid .media').forEach(node => {
    node.style.paddingTop = ratio;
  });
}

function waitForStylesheet(link) {
  return new Promise(resolve => {
    if (!link) {
      resolve();
      return;
    }

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      link.removeEventListener('load', onLoad);
      link.removeEventListener('error', onError);
      resolve();
    };

    const onLoad = () => done();
    const onError = () => done();

    try {
      if (link.sheet && link.sheet.cssRules) {
        resolve();
        return;
      }
    } catch (e) {
      // Accessing cssRules on cross-origin stylesheets throws; fall back to events/timeouts
    }

    link.addEventListener('load', onLoad, { once: true });
    link.addEventListener('error', onError, { once: true });
    setTimeout(done, 1500);
  });
}

async function swapThemeStylesheet(href) {
  if (!href) return false;

  if (!$themeLink) {
    $themeLink = document.createElement('link');
    $themeLink.rel = 'stylesheet';
    $themeLink.id = 'themeStylesheet';
    document.head.appendChild($themeLink);
  }

  const previous = $themeLink.getAttribute('href');
  const absolutePrev = previous ? new URL(previous, location.href).href : null;
  const absoluteNew = new URL(href, location.href).href;

  if (absolutePrev === absoluteNew) {
    await waitForStylesheet($themeLink);
    return true;
  }

  return new Promise(resolve => {
    let settled = false;
    const cleanup = (success) => {
      if (settled) return;
      settled = true;
      $themeLink.removeEventListener('load', onLoad);
      $themeLink.removeEventListener('error', onError);
      clearTimeout(timer);
      if (!success && previous) {
        $themeLink.setAttribute('href', previous);
      }
      resolve(success);
    };

    const onLoad = () => cleanup(true);
    const onError = () => cleanup(false);

    $themeLink.addEventListener('load', onLoad, { once: true });
    $themeLink.addEventListener('error', onError, { once: true });

    const timer = setTimeout(() => cleanup(true), 1500);

    $themeLink.setAttribute('href', href);
  });
}

function isStylesheetEmpty(text) {
  if (!text) return true;
  const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const normalized = withoutComments.trim();
  return normalized.length === 0;
}

async function applyThemeStylesheet(meta) {
  const useDefault = async () => {
    await ensureDefaultThemeStylesheet();
    const success = await swapThemeStylesheet(DEFAULT_THEME_STYLESHEET);
    if (success) {
      await waitForStylesheet($themeLink);
      ensureOverrideStyles();
    }
  };

  if (!meta) {
    await useDefault();
    return;
  }

  const tried = new Set();
  const candidates = [];
  if (meta.stylesheet_local) {
    candidates.push({ href: meta.stylesheet_local, checkContent: true });
  }
  if (meta.stylesheet_src) {
    candidates.push({ href: meta.stylesheet_src, checkContent: false });
  }

  for (const candidate of candidates) {
    const href = candidate.href;
    if (!href) continue;

    const absolute = new URL(href, location.href).href;
    if (tried.has(absolute)) continue;
    tried.add(absolute);

    if (candidate.checkContent) {
      try {
        const response = await fetch(href, { cache: 'no-store' });
        if (!response.ok) {
          console.warn('[Vendr Embed] Kon stylesheet niet ophalen:', href, '→ HTTP', response.status);
          continue;
        }
        const text = await response.text();
        if (isStylesheetEmpty(text)) {
          console.warn('[Vendr Embed] Stylesheet is leeg, gebruik fallback:', href);
          continue;
        }
      } catch (e) {
        console.warn('[Vendr Embed] Fout bij lezen stylesheet:', href, e?.message || e);
        continue;
      }
    }

    const success = await swapThemeStylesheet(href);
    if (success) {
      if ($defaultThemeLink && $defaultThemeLink.parentNode) {
        $defaultThemeLink.parentNode.removeChild($defaultThemeLink);
        $defaultThemeLink = null;
      }
      await waitForStylesheet($themeLink);
      ensureOverrideStyles();
      console.log('[Vendr Embed] Thema stylesheet geladen:', href);
      return;
    }

    console.warn('[Vendr Embed] Kon stylesheet niet laden:', href);
  }

  console.warn('[Vendr Embed] Geen specifieke stylesheet gevonden, gebruik standaard.');
  await useDefault();
}
