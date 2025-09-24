
const $grid = document.getElementById('grid');
const $stats = document.getElementById('stats');
const $alert = document.getElementById('alert');
const $prov = document.getElementById('filterProvincie');
const $type = document.getElementById('filterType');
const $logo = document.getElementById('realtorLogo');
const $link = document.getElementById('realtorLink');
const $themeLink = document.getElementById('themeStylesheet');

const params = new URLSearchParams(location.search);
const realtorKey = (params.get('realtor')||'').trim().toLowerCase();

const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="#111827">Geen afbeelding</text></svg>');

let RAW=[], FILTERED=[];

function showError(msg){ $alert.textContent = msg; }
function statusBadge(av, sold){
  if (sold || av==='sold') return {text:'Verkocht', cls:'sold'};
  if (av==='under_bid') return {text:'Onder bod', cls:'warn'};
  return {text:'Beschikbaar'};
}
const PROV = ['Groningen','Friesland','Drenthe','Overijssel','Flevoland','Gelderland','Utrecht','Noord-Holland','Zuid-Holland','Zeeland','Noord-Brabant','Limburg'];
function inferProvince(item){
  const s = [item.full_address,item.city,item.province,item.location].filter(Boolean).join(' ');
  for(const p of PROV){ if (s.includes(p)) return p; }
  return 'Onbekend';
}
function inferType(item){
  const s = [item.specifications,item.description,item.category,item.type,item.selling_procedure].filter(Boolean).join(' ').toLowerCase();
  if (s.includes('kantoor')) return 'Kantoor';
  if (s.includes('winkel')) return 'Winkel';
  if (s.includes('logistiek') || s.includes('bedrijfshal') || s.includes('magazijn')) return 'Bedrijfsruimte';
  if (s.includes('bouwgrond') || s.includes('grond')) return 'Grond';
  if (s.includes('horeca')) return 'Horeca';
  return 'Overig';
}
function render(items){
  $grid.innerHTML='';
  const tpl = document.getElementById('card-tpl');
  items.forEach(it=>{
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector('.img');
    img.src = it.image || PLACEHOLDER; img.alt = it.name || '';
    img.onerror = ()=>{ img.src = PLACEHOLDER; };
    const b = statusBadge(it.availability, it.is_sold);
    const badge = node.querySelector('.badge');
    badge.textContent = b.text; if (b.cls) badge.classList.add(b.cls);
    node.querySelector('.name').textContent = it.name || '—';
    node.querySelector('.addr').textContent = it.full_address || '';
    node.querySelector('.meta').textContent = [it._province, it._type].filter(Boolean).join(' • ');
    const a = node.querySelector('.btn'); a.href = it.url || '#';
    $grid.appendChild(node);
  });
  $stats.textContent = `${items.length} resultaten`;
}
function populateFilterOptions(items){
  const provinces = Array.from(new Set(items.map(x=>x._province))).filter(Boolean).sort();
  const types = Array.from(new Set(items.map(x=>x._type))).filter(Boolean).sort();
  $prov.innerHTML = '<option value=\"\">Alle</option>' + provinces.map(p=>`<option>${p}</option>`).join('');
  $type.innerHTML = '<option value=\"\">Alle</option>' + types.map(t=>`<option>${t}</option>`).join('');
}
function applyFilters(){
  const p = $prov.value || '';
  const t = $type.value || '';
  FILTERED = RAW.filter(x => (!p || x._province===p) && (!t || x._type===t));
  render(FILTERED);
}
async function j(url){ const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error(r.status); return r.json(); }

(async function(){
  const map = await j('data/realtors.json');
  const meta = map.realtors[realtorKey];
  if (!meta){ showError('Onbekende realtor: voeg ?realtor=<slug> toe.'); return; }

  // Theme + logo + link
  $themeLink.href = meta.stylesheet_local || 'assets/css/themes/default.css';
  if (meta.logo) $logo.src = meta.logo;
  $logo.alt = meta.name || 'Realtor';
  $link.href = (meta.website && meta.website.startsWith('http')) ? meta.website : ('https://' + (meta.website||''));

  // Data: prefer mirrored local, fallback external
  const local = `data/realtor-${meta.uuid}.json`;
  let data = [];
  try { data = await j(local); } catch(e){ data = await j(meta.feed); }

  RAW = data.map(x=> ({...x, _province: x.province || inferProvince(x), _type: x.asset_type || x.type || inferType(x)}));
  populateFilterOptions(RAW);
  $prov.addEventListener('change', applyFilters);
  $type.addEventListener('change', applyFilters);
  applyFilters();
})().catch(e=> showError(String(e)));
