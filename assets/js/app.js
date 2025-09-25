// assets/js/app.js — robuuste loader met ?feed= noodklep en betere errors

const $grid  = document.getElementById('grid');
const $stats = document.getElementById('stats');
const $alert = document.getElementById('alert');

const $prov   = document.getElementById('filterProvincie');
const $type   = document.getElementById('filterType');
const $status = document.getElementById('filterStatus');

const $logo      = document.getElementById('realtorLogo');
const $link      = document.getElementById('realtorLink');
const $themeLink = document.getElementById('themeStylesheet');

const params = new URLSearchParams(location.search);
const realtorKey = (params.get('realtor') || '').trim().toLowerCase();
const overrideFeed = params.get('feed')?.trim();

let RAW = [];
let FILTERED = [];

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
      return;
    }

    // Mapping ophalen
    const mapMeta = await getJSON('data/realtors.json', 'map');
    if (!mapMeta?.realtors) throw new Error('Ontbrekende sleutel "realtors" in data/realtors.json');

    const meta = mapMeta.realtors[realtorKey];
    if (!meta) throw new Error(`Onbekende realtor "${realtorKey}". Controleer data/realtors.json`);

    // Merk & thema
    if ($themeLink && meta.stylesheet_local) $themeLink.href = meta.stylesheet_local;
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
  } catch (e) {
    showError(e.message || String(e));
  }
})();
