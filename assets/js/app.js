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
const $stylePanel = document.querySelector('.style-panel');
const $mainThemed = document.querySelector('main.container.themed');

const params = new URLSearchParams(location.search);
const realtorKey = (params.get('realtor') || '').trim().toLowerCase();
const overrideFeed = params.get('feed')?.trim();

let RAW = [];
let FILTERED = [];
let CURRENT_MEDIA_RATIO = null;

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
    const current = normalizeCssColor(computed.getPropertyValue(props[0]).trim()) || fallback;
    if (current) input.value = current;

    if (input.dataset.colorInit !== '1') {
      input.dataset.colorInit = '1';
      input.addEventListener('input', () => {
        const val = input.value;
        props.forEach(prop => {
          main.style.setProperty(prop, val);
          document.documentElement.style.setProperty(prop, val);
        });
        if (props.includes('--accent')) {
          document.documentElement.style.setProperty('--accent', val);
        }
        if (props.includes('--border')) {
          document.documentElement.style.setProperty('--border', val);
        }
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
    const current = computed.getPropertyValue(prop).trim();
    if (current) {
      const numeric = parseFloat(current);
      if (!Number.isNaN(numeric)) {
        input.value = String(numeric);
      }
    }

    const ratioValue = current || (input.value ? input.value + unit : '');
    if (prop === '--media-ratio' && ratioValue) {
      applyMediaRatioToCards(ratioValue);
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

  const computed = getComputedStyle(main).getPropertyValue('--card-shadow').trim();
  if (computed && computed !== 'none') {
    const match = computed.match(/0\s+(\d+(?:\.\d+)?)px/i);
    if (match) {
      slider.value = String(Math.round(Number(match[1])));
    }
  }

  const applyElevation = (level) => {
    const amount = Math.max(0, Number(level) || 0);
    if (amount === 0) {
      main.style.setProperty('--card-shadow', 'none');
      return;
    }
    const blur = Math.round(amount * 3);
    const spread = Math.round(amount * 0.5);
    const shadow = `0 ${amount}px ${blur}px ${spread ? spread + 'px' : '0'} rgba(15,23,42,0.15)`;
    main.style.setProperty('--card-shadow', shadow);
  };

  applyElevation(slider.value);
  if (slider.dataset.elevationInit !== '1') {
    slider.dataset.elevationInit = '1';
    slider.addEventListener('input', () => applyElevation(slider.value));
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
    const target = select.dataset.fontTarget;
    const cssVar = target === 'heading' ? '--font-heading' : '--font-body';
    const current = (computed.getPropertyValue(cssVar) || '').trim().toLowerCase();
    const match = Object.entries(FONT_MAP).find(([, stack]) => stack.toLowerCase() === current);
    if (match) {
      select.value = match[0];
    }

    if (select.dataset.fontInit !== '1') {
      select.dataset.fontInit = '1';
      select.addEventListener('change', () => {
        const key = select.value;
        const stack = FONT_MAP[key];
        if (!stack) return;
        rootStyle.setProperty(cssVar, stack);
        if (target === 'body') {
          document.body.style.fontFamily = stack;
        }
        main.style.setProperty(cssVar, stack);
      });
    }
  });
}

function initStylePanel() {
  if (!$mainThemed) return;
  const form = document.querySelector('.style-panel__form');
  if (!form) return;

  ensureStylePanelVisible();

  initColorInputs($mainThemed, form);
  initRangeInputs($mainThemed, form);
  initElevation($mainThemed, form);
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

async function applyThemeStylesheet(meta) {
  if (!meta) return;

  const tried = new Set();
  const candidates = [];
  if (meta.stylesheet_local) candidates.push(meta.stylesheet_local);
  if (meta.stylesheet_src) candidates.push(meta.stylesheet_src);

  for (const href of candidates) {
    if (!href) continue;
    const absolute = new URL(href, location.href).href;
    if (tried.has(absolute)) continue;
    tried.add(absolute);

    const success = await swapThemeStylesheet(href);
    if (success) {
      console.log('[Vendr Embed] Thema stylesheet geladen:', href);
      return;
    }

    console.warn('[Vendr Embed] Kon stylesheet niet laden:', href);
  }

  console.warn('[Vendr Embed] Geen specifieke stylesheet gevonden voor deze makelaar, gebruik standaard.');
}
