// assets/js/app.js (ES module) — lijstweergave met filters (geen kaart)

// ---- DOM refs ----
const $grid  = document.getElementById('grid');
const $stats = document.getElementById('stats');
const $alert = document.getElementById('alert');

const $prov   = document.getElementById('filterProvincie');
const $type   = document.getElementById('filterType');
const $status = document.getElementById('filterStatus');

const $logo      = document.getElementById('realtorLogo');
const $link      = document.getElementById('realtorLink');
const $themeLink = document.getElementById('themeStylesheet');

// ---- Querystring ----
const params = new URLSearchParams(location.search);
const realtorKey = (params.get('realtor') || '').trim().toLowerCase();

// ---- State ----
let RAW = [];
let FILTERED = [];

// ---- Helpers UI ----
function showError(msg) {
  $alert.textContent = msg;
  $alert.classList.remove('hidden');
}
function clearError() {
  $alert.classList.add('hidden');
  $alert.textContent = '';
}

const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
  '<rect width="400" height="300" fill="#e5e7eb"/>' +
  '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="#111827">Geen afbeelding</text>' +
  '</svg>'
);

// ---- Status-normalisatie & badge ----
function normalizeStatus(it) {
  const av   = (it.availability || '').toString().toLowerCase().trim();
  const sold = !!it.is_sold;
  const st   = (it.status || '').toLowerCase();
  // Heuristieken voor veelvoorkomende varianten in brondata
  if (sold || av === 'sold' || /verkocht(?!.*voorbehoud)/.test(st)) return 'sold';
  if (av === 'sold_stc' || /verkocht.*voorbehoud/.test(st)) return 'sold_stc';
  if (av === 'under_bid' || /onder.*bod/.test(st)) return 'under_bid';
  return 'available';
}
function statusBadge(av, sold, soldStc) {
  const s = normalizeStatus({ availability: av, is_sold: sold, sold_stc: soldStc });
  if (s === 'sold')      return { text: 'Verkocht',              cls: 'sold' };
  if (s === 'under_bid') return { text: 'Onder bod',             cls: 'warn' };
  if (s === 'sold_stc')  return { text: 'Verkocht o.v.',         cls: 'warn' };
  return { text: 'Beschikbaar', cls: '' };
}

// ---- Afleidingen voor filters ----
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

// ---- Rendering cards ----
function renderCards(items) {
  $grid.innerHTML = '';
  const tpl = document.getElementById('card-tpl');

  items.forEach(it => {
    const node = tpl.content.cloneNode(true);

    // media
    const img = node.querySelector('.img');
    img.src = it.image || PLACEHOLDER;
    img.alt = it.name || '';
    img.onerror = () => { img.src = PLACEHOLDER; };

    // badge
    const b = statusBadge(it.availability, it.is_sold, it.sold_stc);
    const badge = node.querySelector('.badge');
    badge.textContent = b.text;
    if (b.cls) badge.classList.add(b.cls);

    // body
    node.querySelector('.name').textContent = it.name || '—';
    node.querySelector('.addr').textContent = it.full_address || '';
    node.querySelector('.meta').textContent = ''; // gereserveerd voor additionele info

    // actions
    const a = node.querySelector('.btn');
    a.href = it.url || '#';

    $grid.appendChild(node);
  });

  $stats.textContent = `${items.length} resultaten`;
}

// ---- Filters opbouwen & toepassen ----
function populateFilterOptions(items) {
  const provinces = Array.from(new Set(items.map(x => x._province))).filter(Boolean).sort();
  const types     = Array.from(new Set(items.map(x => x._type))).filter(Boolean).sort();

  $prov.innerHTML = '<option value="">Alle</option>' + provinces.map(p => `<option>${p}</option>`).join('');
  $type.innerHTML = '<option value="">Alle</option>' + types.map(t => `<option>${t}</option>`).join('');
}

function applyFilters() {
  const p = $prov.value || '';
  const t = $type.value || '';
  const s = $status.value || '';

  FILTERED = RAW.filter(x => {
    const okP = !p || x._province === p;
    const okT = !t || x._type === t;
    const st  = normalizeStatus(x);
    const okS = !s || st === s;
    return okP && okT && okS;
  });

  renderCards(FILTERED);
}

// ---- Data laden ----
async function j(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

(async function bootstrap() {
  // 1) Mapping laden
  const mapMeta = await j('data/realtors.json').catch(() => null);
  if (!mapMeta || !mapMeta.realtors) {
    showError('Ontbrekende data/realtors.json');
    return;
  }
  const meta = mapMeta.realtors[realtorKey];
  if (!meta) {
    showError('Onbekende realtor in querystring. Gebruik ?realtor=<slug>.');
    return;
  }

  // 2) Merk & thema
  $themeLink.href = meta.stylesheet_local || 'assets/css/themes/default.css';
  if (meta.logo) $logo.src = meta.logo;
  $logo.alt = meta.name || 'Realtor';
  $link.href = (meta.website && /^https?:\/\//i.test(meta.website))
    ? meta.website
    : ('https://' + (meta.website || ''));

  // 3) Data
  const local = `data/realtor-${meta.uuid}.json`;
  let data = [];
  try {
    data = await j(local);
  } catch (e) {
    // Fallback naar externe feed (vereist CORS/JSON)
    if (meta.feed) {
      try { data = await j(meta.feed); }
      catch (e2) {
        showError('Kon feed niet laden (lokaal of extern).');
        return;
      }
    } else {
      showError('Geen lokale feed en geen externe feed gedefinieerd.');
      return;
    }
  }

  RAW = data.map(x => ({
    ...x,
    _province: x.province || inferProvince(x),
    _type: x.asset_type || x.type || inferType(x),
  }));

  // 4) Filters & render
  populateFilterOptions(RAW);
  $prov.addEventListener('change', applyFilters);
  $type.addEventListener('change', applyFilters);
  $status.addEventListener('change', applyFilters);

  renderCards(RAW);
  clearError();
})().catch(e => showError(e.message || String(e)));
