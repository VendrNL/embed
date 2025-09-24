// assets/js/app.js (ES module)

const $grid = document.getElementById('grid');
const $stats = document.getElementById('stats');
const $alert = document.getElementById('alert');

const $prov = document.getElementById('filterProvincie');
const $type = document.getElementById('filterType');
const $status = document.getElementById('filterStatus');

const $logo = document.getElementById('realtorLogo');
const $link = document.getElementById('realtorLink');
const $themeLink = document.getElementById('themeStylesheet');

const $viewToggle = document.getElementById('viewToggle');
const $map = document.getElementById('map');

const params = new URLSearchParams(location.search);
const realtorKey = (params.get('realtor')||'').trim().toLowerCase();

// Default Google Maps API key (override via ?gkey=...)
const DEFAULT_GMAPS_KEY = 'AIzaSyDZuJdoNTD9no3FfrqJ7HPrWmlEnzL969M';
const GMAPS_KEY = params.get('gkey') || DEFAULT_GMAPS_KEY;

const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="#111827">Geen afbeelding</text></svg>');

let RAW=[], FILTERED=[];
let map, markers = [];
let idToElement = new Map();

// -------------- helpers --------------
function showError(msg){ $alert.textContent = msg; $alert.classList.remove('hidden'); }
function clearError(){ $alert.classList.add('hidden'); $alert.textContent=''; }

function statusBadge(av, sold, soldStc){
  const s = normalizeStatus({availability: av, is_sold: sold, sold_stc: soldStc});
  if (s === 'sold')     return { text:'Verkocht', cls:'sold' };
  if (s === 'under_bid')return { text:'Onder bod', cls:'warn' };
  if (s === 'sold_stc') return { text:'Verkocht o.v.', cls:'warn' };
  return { text:'Beschikbaar', cls:'' };
}
function normalizeStatus(it){
  const av = (it.availability||'').toString().toLowerCase().trim();
  const sold = !!it.is_sold;
  const st  = (it.status||'').toLowerCase();
  if (sold || av==='sold' || /verkocht(?!.*voorbehoud)/.test(st)) return 'sold';
  if (av==='sold_stc' || /verkocht.*voorbehoud/.test(st)) return 'sold_stc';
  if (av==='under_bid' || /onder.*bod/.test(st)) return 'under_bid';
  return 'available';
}

const PROV = ['Groningen','Friesland','Drenthe','Overijssel','Flevoland','Gelderland','Utrecht','Noord-Holland','Zuid-Holland','Zeeland','Noord-Brabant','Limburg'];
function inferProvince(item){
  const s = [item.province,item.full_address,item.city,item.location].filter(Boolean).join(' ');
  for(const p of PROV){ if (s.includes(p)) return p; }
  return 'Onbekend';
}
function inferType(item){
  const s = [item.asset_type,item.type,item.specifications,item.description,item.selling_procedure].filter(Boolean).join(' ').toLowerCase();
  if (s.includes('kantoor')) return 'Kantoor';
  if (s.includes('winkel')) return 'Winkel';
  if (s.includes('logistiek') || s.includes('bedrijfshal') || s.includes('magazijn')) return 'Bedrijfsruimte';
  if (s.includes('bouwgrond') || s.includes('grond')) return 'Grond';
  if (s.includes('horeca')) return 'Horeca';
  return 'Overig';
}
function coordsOf(it){
  if (typeof it.lat === 'number' && typeof it.lng === 'number') return {lat: it.lat, lng: it.lng};
  if (it.location && typeof it.location.lat === 'number' && typeof it.location.lng === 'number') return {lat: it.location.lat, lng: it.location.lng};
  if (Array.isArray(it.coordinates) && it.coordinates.length >= 2) {
    const [lng, lat] = it.coordinates;
    if (typeof lat === 'number' && typeof lng === 'number') return {lat, lng};
  }
  return null;
}

// -------------- render: cards --------------
function renderCards(items){
  $grid.innerHTML='';
  idToElement.clear();
  const tpl = document.getElementById('card-tpl');
  items.forEach((it, idx)=>{
    const domId = it.id || it.uuid || ('card-' + idx);
    const node = tpl.content.cloneNode(true);
    const article = node.querySelector('article.card');
    article.id = domId;

    const img = node.querySelector('.img');
    img.src = it.image || PLACEHOLDER; img.alt = it.name || '';
    img.onerror = ()=>{ img.src = PLACEHOLDER; };

    const b = statusBadge(it.availability, it.is_sold, it.sold_stc);
    const badge = node.querySelector('.badge');
    badge.textContent = b.text; if (b.cls) badge.classList.add(b.cls);

    node.querySelector('.name').textContent = it.name || '—';
    node.querySelector('.addr').textContent = it.full_address || '';
    node.querySelector('.meta').textContent = '';

    const a = node.querySelector('.btn');
    a.href = it.url || '#';

    $grid.appendChild(node);
    idToElement.set(domId, document.getElementById(domId));
  });
  $stats.textContent = `${items.length} resultaten`;
}

function highlightAndScrollTo(domId){
  const el = idToElement.get(domId) || document.getElementById(domId);
  if (!el) return;
  el.classList.add('highlight');
  el.scrollIntoView({behavior:'smooth', block:'start'});
  setTimeout(()=> el.classList.remove('highlight'), 2000);
}

// -------------- render: map --------------
function clearMarkers(){ markers.forEach(m=>m.setMap(null)); markers=[]; }
function ensureMap(){
  return new Promise((resolve,reject)=>{
    if (map) return resolve(map);
    if (!GMAPS_KEY){
      $map.innerHTML = '<div style="padding:16px">Geen Google Maps API key gevonden.</div>';
      return reject(new Error('Geen API key'));
    }
    const existing = document.querySelector('script[data-gm-loaded]');
    if (existing){ init(); return; }

    const s = document.createElement('script');
    s.setAttribute('data-gm-loaded','1');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GMAPS_KEY)}&v=weekly`;
    s.async = true; s.defer = true;
    s.onerror = ()=>reject(new Error('Kon Google Maps niet laden'));
    s.onload = init;
    document.head.appendChild(s);

    function init(){
      const mapId = $map.dataset.mapId || undefined;
      map = new google.maps.Map($map, {
        center: {lat:52.0907, lng:5.1214}, zoom: 8, mapId
      });
      resolve(map);
    }
  });
}
async function renderMap(items){
  await ensureMap();
  clearMarkers();
  const bounds = new google.maps.LatLngBounds();
  let haveAny = false;

  items.forEach((it, idx)=>{
    const c = coordsOf(it);
    if (!c) return;
    haveAny = true;
    const domId = it.id || it.uuid || ('card-' + idx);
    const m = new google.maps.Marker({ position: c, map, title: it.name || '' });
    const html = `
      <div style="font-family:Inter,system-ui,Arial">
        <div style="font-weight:700;margin-bottom:4px">${(it.name||'—').replace(/</g,'&lt;')}</div>
        <div style="color:#475569;font-size:13px;margin-bottom:6px">${(it.full_address||'').replace(/</g,'&lt;')}</div>
        <a href="${it.url||'#'}" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:none">Bekijk op Vendr ↗</a>
      </div>`;
    const infow = new google.maps.InfoWindow({ content: html });
    m.addListener('click', ()=> {
      infow.open({anchor: m, map});
      // wissel terug naar lijst en open card
      $viewToggle.setAttribute('aria-pressed','false');
      $viewToggle.textContent = 'Kaartweergave';
      // render lijst opnieuw en highlight
      $map.classList.add('hidden');
      $grid.classList.remove('hidden');
      renderCards(FILTERED);
      setTimeout(()=> highlightAndScrollTo(domId), 50);
    });
    markers.push(m);
    bounds.extend(c);
  });

  if (haveAny) {
    map.fitBounds(bounds, 48);
  } else {
    map.setCenter({lat:52.0907, lng:5.1214}); map.setZoom(8);
    $map.innerHTML = '<div style="padding:12px;font:1em Inter,system-ui">Geen geolocaties in deze selectie.</div>';
  }
}

// -------------- filtering --------------
function populateFilterOptions(items){
  const provinces = Array.from(new Set(items.map(x=>x._province))).filter(Boolean).sort();
  const types = Array.from(new Set(items.map(x=>x._type))).filter(Boolean).sort();
  $prov.innerHTML = '<option value="">Alle</option>' + provinces.map(p=>`<option>${p}</option>`).join('');
  $type.innerHTML = '<option value="">Alle</option>' + types.map(t=>`<option>${t}</option>`).join('');
}
function applyFilters(){
  const p = $prov.value || '';
  const t = $type.value || '';
  const s = $status.value || '';

  FILTERED = RAW.filter(x => {
    const okP = !p || x._province === p;
    const okT = !t || x._type === t;
    const st = normalizeStatus(x);
    const okS = !s || st === s;
    return okP && okT && okS;
  });

  const mapMode = $viewToggle.getAttribute('aria-pressed') === 'true';
  if (mapMode) {
    $grid.classList.add('hidden');
    $map.classList.remove('hidden');
    renderMap(FILTERED).catch(()=>{});
    $stats.textContent = `${FILTERED.length} resultaten`;
  } else {
    $map.classList.add('hidden');
    $grid.classList.remove('hidden');
    renderCards(FILTERED);
  }
}

// -------------- data bootstrap --------------
async function j(url){ const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }

(async function(){
  // realtor mapping
  const mapMeta = await j('data/realtors.json').catch(()=>null);
  if (!mapMeta || !mapMeta.realtors) {
    showError('Ontbrekende data/realtors.json');
    return;
  }
  const meta = mapMeta.realtors[realtorKey];
  if (!meta){ showError('Onbekende realtor in querystring. Gebruik ?realtor=<slug>.'); return; }

  // merk-setup
  $themeLink.href = meta.stylesheet_local || 'assets/css/themes/default.css';
  if (meta.logo) $logo.src = meta.logo;
  $logo.alt = meta.name || 'Realtor';
  $link.href = (meta.website && /^https?:\/\//i.test(meta.website)) ? meta.website : ('https://' + (meta.website||''));

  // data
  const local = `data/realtor-${meta.uuid}.json`;
  let data = [];
  try { data = await j(local); } catch(e){ data = await j(meta.feed); }

  RAW = data.map(x => ({
    ...x,
    _province: x.province || inferProvince(x),
    _type: x.asset_type || x.type || inferType(x),
  }));

  populateFilterOptions(RAW);
  $prov.addEventListener('change', applyFilters);
  $type.addEventListener('change', applyFilters);
  $status.addEventListener('change', applyFilters);

  // view toggle
  $viewToggle.addEventListener('click', ()=>{
    const pressed = $viewToggle.getAttribute('aria-pressed') === 'true';
    const next = !pressed;
    $viewToggle.setAttribute('aria-pressed', String(next));
    $viewToggle.textContent = next ? 'Lijstweergave' : 'Kaartweergave';
    applyFilters();
  });

  // initial
  $viewToggle.setAttribute('aria-pressed','false');
  renderCards(RAW);
  $stats.textContent = `${RAW.length} resultaten`;
  clearError();
})().catch(e=> showError(e.message||String(e)));
