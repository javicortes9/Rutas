/* Vereda · rutas con intención */
'use strict';
{
const G = window.Geo;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const fmtKm = m => (m < 10000 ? nf1 : nf0).format(m / 1000) + ' km';
const pl = (n, a, b) => n === 1 ? a : b;
const fmtT = s => { const m = Math.round(s / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'); };

/* ---------- Iconos ---------- */
const ICONS = {
  naturaleza: '<path d="M5 20c0-9 5-15 15-15 0 9-6 15-15 15Z"/><path d="M5 20l8-8"/>',
  miradores: '<path d="M2 20l7-11 4 6 3-4 6 9Z"/><circle cx="17" cy="5" r="2"/>',
  patrimonio: '<path d="M3 9l9-5 9 5M5 9v9m4.7-9v9m4.6-9v9M19 9v9M3 20h18"/>',
  bares: '<path d="M6 3h12l-1.5 8a4.5 4.5 0 0 1-9 0Z"/><path d="M12 15.5V21m-3.5 0h7M7 7h10"/>',
  agua: '<path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  arte: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 15.5l5-5 4 4 2.5-2.5 5.5 5.5"/><circle cx="15.5" cy="9" r="1.5"/>',
  locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  swap: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4m4 12-4 4-4-4"/>',
};
const svgI = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- Temas: selectores Overpass [selector, peso, etiqueta] ---------- */
const THEMES = {
  naturaleza: { label: 'Naturaleza', color: '#2f8f4e', hint: 'La ruta más corta que atraviese parques, bosques y espacios protegidos.', sel: [
    ['nwr[boundary=national_park]', 6, 'Parque nacional'],
    ['nwr[leisure=nature_reserve][name]', 5, 'Reserva natural'],
    ['nwr[boundary=protected_area][name]', 5, 'Espacio protegido'],
    ['nwr[natural=wetland][name]', 3, 'Humedal'],
    ['nwr[leisure=park][name]', 3, 'Parque'],
    ['nwr[leisure=garden][name][access!=private]', 2, 'Jardín'],
    ['nwr[natural=wood][name]', 3, 'Bosque'],
    ['nwr[landuse=forest][name]', 2, 'Monte'],
    ['node[natural=tree][name]', 2, 'Árbol singular'],
    ['nwr[natural=cave_entrance][name]', 2, 'Cueva'],
  ] },
  miradores: { label: 'Miradores y paisaje', color: '#d9791a', hint: 'Encadena miradores, cimas, puertos y torres con vistas.', sel: [
    ['nwr[tourism=viewpoint]', 6, 'Mirador'],
    ['nwr[man_made=tower]["tower:type"=observation]', 5, 'Torre mirador'],
    ['nwr[mountain_pass=yes][name]', 4, 'Puerto de montaña'],
    ['nwr[natural=gorge][name]', 4, 'Garganta'],
    ['node[natural=peak][name]', 3, 'Cima'],
    ['nwr[natural=cliff][name]', 3, 'Acantilado'],
    ['nwr[natural=arch]', 3, 'Arco natural'],
    ['node[natural=saddle][name]', 2, 'Collado'],
  ] },
  patrimonio: { label: 'Patrimonio', color: '#9b4a2c', hint: 'Castillos, yacimientos, monasterios, murallas, puentes y monumentos.', sel: [
    ['nwr[historic=castle][name]', 6, 'Castillo'],
    ['nwr[historic=archaeological_site]', 5, 'Yacimiento'],
    ['nwr[historic=monastery]', 5, 'Monasterio'],
    ['nwr[historic=aqueduct]', 5, 'Acueducto'],
    ['nwr[building=cathedral][name]', 5, 'Catedral'],
    ['nwr[historic=city_gate]', 4, 'Puerta histórica'],
    ['nwr[historic=city_walls]', 4, 'Muralla'],
    ['nwr[historic=fort]', 4, 'Fortificación'],
    ['nwr[historic=bridge]', 4, 'Puente histórico'],
    ['nwr[historic=ruins][name]', 3, 'Ruinas'],
    ['nwr[historic=tower][name]', 3, 'Torre histórica'],
    ['nwr[historic=church][name]', 3, 'Iglesia histórica'],
    ['nwr[historic=manor][name]', 3, 'Casa señorial'],
    ['nwr[historic=monument][name]', 3, 'Monumento'],
    ['nwr[amenity=place_of_worship][name][wikidata]', 3, 'Templo'],
    ['nwr[heritage][name]', 3, 'Bien patrimonial'],
  ] },
  bares: { label: 'Bares y tapas', color: '#c2365a', rMul: 0.35, hint: 'Las calles con más bares, tabernas y terrazas. Mejor a pie.', sel: [
    ['nwr[amenity=bar][name]', 4, 'Bar'],
    ['nwr[amenity=pub][name]', 4, 'Taberna'],
    ['nwr[amenity=biergarten]', 4, 'Terraza'],
    ['nwr[amenity=restaurant][cuisine~"tapas"][name]', 4, 'Tapas'],
    ['nwr[amenity=restaurant][name]', 2, 'Restaurante'],
    ['nwr[amenity=cafe][name]', 2, 'Café'],
  ] },
  agua: { label: 'Agua', color: '#1d78bd', hint: 'Cascadas, playas, embalses, manantiales y fuentes.', sel: [
    ['nwr[waterway=waterfall]', 6, 'Cascada'],
    ['nwr[natural=beach][name]', 5, 'Playa'],
    ['nwr[natural=water][water~"^(lake|reservoir|lagoon)$"][name]', 4, 'Lago o embalse'],
    ['nwr[waterway=dam][name]', 3, 'Presa'],
    ['nwr[natural=spring][name]', 3, 'Manantial'],
    ['nwr[leisure=swimming_area]', 3, 'Zona de baño'],
    ['nwr[amenity=fountain][name]', 2, 'Fuente'],
    ['nwr[man_made=pier][name]', 2, 'Embarcadero'],
  ] },
  arte: { label: 'Arte y cultura', color: '#6a4bb0', hint: 'Museos, galerías, arte urbano, teatros y centros culturales.', sel: [
    ['nwr[tourism=museum][name]', 5, 'Museo'],
    ['nwr[tourism=gallery][name]', 4, 'Galería'],
    ['nwr[tourism=artwork][artwork_type=mural]', 3, 'Mural'],
    ['nwr[tourism=artwork][name]', 3, 'Obra de arte'],
    ['nwr[amenity=theatre][name]', 3, 'Teatro'],
    ['nwr[amenity=arts_centre][name]', 3, 'Centro cultural'],
    ['nwr[tourism=attraction][name]', 3, 'Atracción'],
  ] },
};
for (const [id, th] of Object.entries(THEMES)) th.rules = th.sel.map(([q, w, l]) => ({ ...G.parseSel(q), q, w, l, theme: id }));

const MODES = {
  foot: { label: 'A pie', osrm: 'routed-foot', catchD: 60, rMin: 300, rMax: 1500, maxWp: 14, gm: 'walking', tol: 8 },
  bike: { label: 'Bici', osrm: 'routed-bike', catchD: 120, rMin: 300, rMax: 5000, maxWp: 12, gm: 'bicycling', tol: 15 },
  car:  { label: 'Coche', osrm: 'routed-car', catchD: 300, rMin: 800, rMax: 12000, maxWp: 10, gm: 'driving', tol: 30 },
};

/* ---------- Estado y preferencias ---------- */
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('vereda.' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('vereda.' + k, JSON.stringify(v)); } catch {} } };
const state = {
  from: store.get('from', null), to: store.get('to', null),
  mode: store.get('mode', 'foot'), themes: new Set(store.get('themes', ['miradores'])),
  detour: store.get('detour', 30), result: null, busy: false,
};
const savePrefs = () => { store.set('mode', state.mode); store.set('themes', [...state.themes]); store.set('detour', state.detour); store.set('from', state.from); store.set('to', state.to); };

/* ---------- Red ---------- */
async function getJSON(url, ms = 25000, init) {
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { ...init, signal: ac.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch (e) { throw e.name === 'AbortError' ? new Error('tiempo de espera agotado') : e; }
  finally { clearTimeout(tm); }
}
async function osrm(M, pts) {
  const c = pts.map(p => p.lon.toFixed(6) + ',' + p.lat.toFixed(6)).join(';');
  const j = await getJSON(`https://routing.openstreetmap.de/${M.osrm}/route/v1/driving/${c}?overview=full&geometries=geojson&steps=false`, 30000);
  if (j.code !== 'Ok' || !j.routes?.length) throw new Error('no se encontró camino entre los puntos');
  const r = j.routes[0];
  return { distance: r.distance, duration: r.duration, coords: r.geometry.coordinates.map(([x, y]) => [y, x]) };
}
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Consulta todos los servidores a la vez (con un reintento cada uno) y se queda con el primero que conteste bien
async function overpass(q) {
  const ac = new AbortController();
  const one = async ep => {
    let last;
    for (let a = 0; a < 2; a++) {
      try {
        const r = await fetch(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ac.signal });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        if (!Array.isArray(j.elements)) throw new Error('respuesta vacía');
        if (!j.elements.length && j.remark && /error|timed out|out of memory/i.test(j.remark)) throw new Error(j.remark);
        return j;
      } catch (e) { if (e.name === 'AbortError') throw e; last = e; await sleep(3000); }
    }
    throw last;
  };
  const tm = setTimeout(() => ac.abort(), 120000);
  try { const j = await Promise.any(OVERPASS.map(one)); ac.abort(); return j; }
  catch { throw new Error('OpenStreetMap (Overpass) no responde ahora mismo'); }
  finally { clearTimeout(tm); }
}

/* Wikidata: segunda fuente, rápida y con fotos. [peso, etiqueta, esÁrea] por clase */
const WD = {
  naturaleza: { Q46169: [6, 'Parque nacional', 1], Q179049: [5, 'Reserva natural', 1], Q473972: [5, 'Espacio protegido', 1], Q22698: [3, 'Parque', 0], Q1107656: [2, 'Jardín', 0], Q4421: [3, 'Bosque', 1], Q170321: [3, 'Humedal', 1], Q35509: [3, 'Cueva', 0] },
  miradores: { Q6017969: [6, 'Mirador', 0], Q133056: [4, 'Puerto de montaña', 0], Q150784: [4, 'Cañón', 0], Q8502: [3, 'Montaña', 0], Q54050: [2, 'Cerro', 0] },
  patrimonio: { Q23413: [6, 'Castillo', 0], Q839954: [5, 'Yacimiento', 0], Q44613: [5, 'Monasterio', 0], Q474: [5, 'Acueducto', 0], Q2977: [5, 'Catedral', 0], Q16560: [4, 'Palacio', 0], Q57821: [4, 'Fortificación', 0], Q82117: [4, 'Puerta histórica', 0], Q16748868: [4, 'Muralla', 0], Q109607: [3, 'Ruinas', 0], Q16970: [3, 'Iglesia', 0], Q4989906: [3, 'Monumento', 0], Q12518: [3, 'Torre', 0], Q12280: [2, 'Puente', 0] },
  agua: { Q34038: [6, 'Cascada', 0], Q40080: [5, 'Playa', 0], Q131681: [4, 'Embalse', 1], Q23397: [4, 'Lago', 1], Q124714: [3, 'Manantial', 0], Q483453: [2, 'Fuente', 0], Q12323: [3, 'Presa', 0] },
  arte: { Q33506: [5, 'Museo', 0], Q1007870: [4, 'Galería de arte', 0], Q24354: [3, 'Teatro', 0], Q219423: [3, 'Mural', 0], Q179700: [2, 'Estatua', 0] },
};
async function wikidataPois(themeIds, bb) {
  const ids = themeIds.filter(t => WD[t]);
  if (!ids.length) return [];
  const map = {};
  for (const t of ids) for (const [q, v] of Object.entries(WD[t])) if (!map[q] || map[q][0] < v[0]) map[q] = [...v, t];
  const her = ids.includes('patrimonio') ? `UNION { ?item wdt:P1435 ?her . }` : '';
  const sp = `SELECT ?item ?itemLabel ?coord ?img ?cls ?article WHERE {
 SERVICE wikibase:box { ?item wdt:P625 ?coord . bd:serviceParam wikibase:cornerSouthWest "Point(${bb.w} ${bb.s})"^^geo:wktLiteral . bd:serviceParam wikibase:cornerNorthEast "Point(${bb.e} ${bb.n})"^^geo:wktLiteral . }
 { ?item wdt:P31 ?cls . VALUES ?cls { ${Object.keys(map).map(q => 'wd:' + q).join(' ')} } } ${her}
 OPTIONAL { ?item wdt:P18 ?img }
 OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://es.wikipedia.org/> . }
 SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
} LIMIT 4000`;
  const j = await getJSON('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(sp), 60000, { headers: { Accept: 'application/sparql-results+json' } });
  const out = new Map();
  for (const b of j.results?.bindings || []) {
    const q = b.item.value.split('/').pop(), name = b.itemLabel?.value || '';
    if (/^Q\d+$/.test(name)) continue;
    const m = (b.coord?.value || '').match(/Point\(([-\d.eE]+) ([-\d.eE]+)\)/); if (!m) continue;
    const cls = b.cls ? b.cls.value.split('/').pop() : null;
    const def = cls && map[cls] ? map[cls] : [3, 'Bien patrimonial', 0, 'patrimonio'];
    const prev = out.get(q);
    if (prev && prev.w >= def[0]) { if (!prev.img && b.img) prev.img = b.img.value; continue; }
    out.set(q, { q, name, lat: +m[2], lon: +m[1], w: def[0], kind: def[1], area: def[2], theme: def[3], img: b.img?.value || prev?.img || null,
      wiki: b.article ? decodeURIComponent(b.article.value.split('/wiki/')[1] || '').replace(/_/g, ' ') : null });
  }
  return [...out.values()];
}
const nomi = 'https://nominatim.openstreetmap.org';
const shortName = r => {
  const a = r.address || {};
  const main = r.name || a.road || r.display_name.split(',')[0];
  const place = a.city || a.town || a.village || a.municipality || a.county || '';
  return place && place !== main ? `${main}, ${place}` : main;
};

/* ---------- Mapa ---------- */
const map = L.map('map', { zoomControl: false, attributionControl: true }).setView([37.389, -5.993], 13);
// Capas base: satélite (por defecto, con nombres de calles y municipios encima), mapa de calles y relieve.
// maxNativeZoom evita los cuadros grises al acercar más de lo que da cada servicio: se amplía la última tesela.
const esri = s => `https://server.arcgisonline.com/ArcGIS/rest/services/${s}/MapServer/tile/{z}/{y}/{x}`;
const satelite = L.layerGroup([
  L.tileLayer(esri('World_Imagery'), { maxZoom: 20, maxNativeZoom: 19, attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics' }),
  L.tileLayer(esri('Reference/World_Transportation'), { maxZoom: 20, maxNativeZoom: 19, opacity: .6 }),
  L.tileLayer(esri('Reference/World_Boundaries_and_Places'), { maxZoom: 20, maxNativeZoom: 19 }),
]).addTo(map);
const calles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, maxNativeZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' });
const relieve = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { subdomains: 'abc', maxZoom: 20, maxNativeZoom: 17, attribution: '© OpenStreetMap · SRTM · © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)' });
const layersCtl = {
  'Satélite': satelite,
  'Mapa (calles y municipios)': calles,
  'Relieve': relieve,
};
L.control.layers(layersCtl, null, { position: 'topright' }).addTo(map);
L.control.zoom({ position: 'topright' }).addTo(map);
map.attributionControl.setPrefix('Vereda · J. Cortés López');
const routeLayer = L.layerGroup().addTo(map);
const poiLayer = L.layerGroup().addTo(map);
let baseLineLayer = null;
const endIcon = k => L.divIcon({ className: 'endpin ' + k, html: `<span>${k === 'from' ? 'A' : 'B'}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
const endMarkers = {};

function setPoint(k, p, reverse) {
  state[k] = p; $('#' + k).value = p ? p.label : '';
  if (endMarkers[k]) { endMarkers[k].remove(); delete endMarkers[k]; }
  if (p) {
    const m = L.marker([p.lat, p.lon], { icon: endIcon(k), draggable: true, zIndexOffset: 1000 }).addTo(map);
    m.on('dragend', () => { const ll = m.getLatLng(); setPoint(k, { lat: ll.lat, lon: ll.lng, label: 'Punto del mapa' }, true); });
    endMarkers[k] = m;
  }
  savePrefs();
  if (reverse && p) {
    getJSON(`${nomi}/reverse?format=jsonv2&zoom=17&addressdetails=1&accept-language=es&lat=${p.lat}&lon=${p.lon}`)
      .then(r => { if (state[k] === p && r?.display_name) { p.label = shortName(r); $('#' + k).value = p.label; savePrefs(); } }).catch(() => {});
  }
}

map.on('click', e => {
  const c = e.latlng, div = document.createElement('div');
  div.className = 'pick';
  div.innerHTML = '<button type="button" data-k="from">Salir de aquí</button><button type="button" data-k="to">Ir aquí</button>';
  div.addEventListener('click', ev => {
    const k = ev.target.closest('button')?.dataset.k; if (!k) return;
    setPoint(k, { lat: c.lat, lon: c.lng, label: 'Punto del mapa' }, true); map.closePopup();
  });
  L.popup({ closeButton: false, className: 'pickpop' }).setLatLng(c).setContent(div).openOn(map);
});

/* ---------- Buscador ---------- */
const sugg = $('#sugg');
let sTimer, sFor = null, sSeq = 0;
function hideSugg() { sugg.hidden = true; sugg.innerHTML = ''; }
async function search(q, k) {
  const b = map.getBounds(), seq = ++sSeq;
  try {
    const rs = await getJSON(`${nomi}/search?format=jsonv2&limit=6&addressdetails=1&accept-language=es&q=${encodeURIComponent(q)}&viewbox=${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}`);
    if (seq !== sSeq) return;
    sFor = k;
    if (!rs.length) { sugg.innerHTML = '<li class="empty">Sin resultados</li>'; sugg.hidden = false; return; }
    sugg.innerHTML = rs.map((r, i) => `<li data-i="${i}" tabindex="0"><b>${esc(shortName(r))}</b><small>${esc(r.display_name)}</small></li>`).join('');
    sugg._rs = rs; sugg.hidden = false;
  } catch { if (seq === sSeq) { sugg.innerHTML = '<li class="empty">El buscador no responde</li>'; sugg.hidden = false; } }
}
sugg.addEventListener('click', e => {
  const li = e.target.closest('li[data-i]'); if (!li) return;
  const r = sugg._rs[+li.dataset.i];
  setPoint(sFor, { lat: +r.lat, lon: +r.lon, label: shortName(r) });
  hideSugg();
  if (state.from && state.to) map.fitBounds([[state.from.lat, state.from.lon], [state.to.lat, state.to.lon]], fitPad());
  else map.setView([+r.lat, +r.lon], 15);
  if (sFor === 'from' && !state.to) $('#to').focus();
});
for (const k of ['from', 'to']) {
  const inp = $('#' + k);
  inp.addEventListener('input', () => {
    clearTimeout(sTimer); const q = inp.value.trim();
    if (q.length < 3) { hideSugg(); return; }
    sTimer = setTimeout(() => search(q, k), 450);
  });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sugg.querySelector('li[data-i]')?.click(); } if (e.key === 'Escape') hideSugg(); });
  inp.addEventListener('focus', () => inp.select());
}
document.addEventListener('click', e => { if (!e.target.closest('.search')) hideSugg(); });
$('#swap').addEventListener('click', () => { const a = state.from, b = state.to; setPoint('from', b); setPoint('to', a); });
$('#locate').addEventListener('click', () => {
  if (!navigator.geolocation) return toast('Tu navegador no da la ubicación');
  toast('Buscando tu ubicación…');
  navigator.geolocation.getCurrentPosition(
    pos => { const p = { lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'Mi ubicación' }; setPoint('from', p, true); map.setView([p.lat, p.lon], 15); },
    () => toast('No he podido obtener tu ubicación'), { enableHighAccuracy: true, timeout: 12000 });
});

/* ---------- Planificador (UI) ---------- */
$('#mode').innerHTML = Object.entries(MODES).map(([k, m]) => `<button type="button" data-m="${k}" aria-pressed="${k === state.mode}">${m.label}</button>`).join('');
$('#mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.mode = b.dataset.m; syncUI(); savePrefs(); });
$('#themes').innerHTML = Object.entries(THEMES).map(([k, t]) => `<button type="button" class="chip" data-t="${k}" style="--c:${t.color}">${svgI(k)}<span>${t.label}</span></button>`).join('');
$('#themes').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  const k = b.dataset.t;
  state.themes.has(k) ? state.themes.delete(k) : state.themes.add(k);
  syncUI(); savePrefs();
});
const det = $('#detour');
det.value = state.detour;
det.addEventListener('input', () => { state.detour = +det.value; syncUI(); savePrefs(); });
function syncUI() {
  for (const b of $('#mode').children) b.setAttribute('aria-pressed', b.dataset.m === state.mode);
  for (const b of $('#themes').children) b.setAttribute('aria-pressed', state.themes.has(b.dataset.t));
  $('#detourOut').textContent = '+' + state.detour + ' %';
  const ts = [...state.themes];
  $('#hint').textContent = ts.length === 0 ? 'Elige al menos un tema.' : ts.length === 1 ? THEMES[ts[0]].hint : 'Combina ' + ts.map(t => THEMES[t].label.toLowerCase()).join(', ') + '.';
}
syncUI();
if (state.from) setPoint('from', state.from);
if (state.to) setPoint('to', state.to);
if (state.from && state.to) map.fitBounds([[state.from.lat, state.from.lon], [state.to.lat, state.to.lon]], { padding: [60, 60] });

const sheet = $('#sheet');
const mobile = () => innerWidth < 900;
function setSheet(open) {
  sheet.classList.toggle('collapsed', !open);
  $('#handle').setAttribute('aria-expanded', open);
  if (!open) sheet.scrollTop = 0;
}
$('#handle').addEventListener('click', () => setSheet(sheet.classList.contains('collapsed')));
// Deslizar el panel arriba/abajo con el dedo (desde el asa o la barra de resumen)
{
  let y0 = null, st0 = 0;
  sheet.addEventListener('touchstart', e => { if (e.target.closest('#handle,.peek') || sheet.scrollTop <= 0) { y0 = e.touches[0].clientY; st0 = sheet.scrollTop; } else y0 = null; }, { passive: true });
  sheet.addEventListener('touchend', e => {
    if (y0 == null) return;
    const dy = e.changedTouches[0].clientY - y0; y0 = null;
    if (dy > 40 && st0 <= 0) setSheet(false);
    else if (dy < -40 && sheet.classList.contains('collapsed')) setSheet(true);
  }, { passive: true });
}
// Al mover el mapa en el móvil, el panel se baja
map.on('dragstart', () => { if (mobile() && state.result) setSheet(false); });
function fitPad() {
  const wide = innerWidth >= 900;
  const top = $('.search').getBoundingClientRect().bottom + 16;
  return wide ? { paddingTopLeft: [440, 40], paddingBottomRight: [40, 40] }
    : { paddingTopLeft: [24, top], paddingBottomRight: [24, Math.max(0, innerHeight - sheet.getBoundingClientRect().top) + 20] };
}
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3500); }
function status(msg, err) { const s = $('#status'); s.textContent = msg || ''; s.classList.toggle('err', !!err); }

/* ---------- Motor de rutas temáticas ---------- */
function buildPois(els, themeIds, L, M) {
  const rules = themeIds.flatMap(id => THEMES[id].rules);
  const out = [], seen = new Set();
  for (const el of els) {
    const key = el.type[0] + el.id;
    if (seen.has(key)) continue;
    let lat, lon, diag = 0;
    if (el.type === 'node') { lat = el.lat; lon = el.lon; }
    else if (el.bounds) {
      const b = el.bounds; lat = (b.minlat + b.maxlat) / 2; lon = (b.minlon + b.maxlon) / 2;
      diag = G.hv({ lat: b.minlat, lon: b.minlon }, { lat: b.maxlat, lon: b.maxlon });
    }
    if (lat == null || lon == null) continue;
    let best = null;
    for (const r of rules) if (G.matches(r, el) && (!best || r.w > best.w)) best = r;
    if (!best) continue;
    seen.add(key);
    const t = el.tags || {};
    const score = best.w + (t.wikidata || t.wikipedia ? 2 : 0) + (t.heritage ? 1 : 0) + (t.image || t.wikimedia_commons ? 1 : 0) + (diag > 0 ? G.clamp(Math.log10(diag / 100), 0, 2) : 0);
    const [x, y] = L.xy(lat, lon), pr = G.project(L, x, y);
    out.push({ id: key, osm: el.type + '/' + el.id, lat, lon, x, y, diag, tags: t, name: t['name:es'] || t.name || best.l, kind: best.l, theme: best.theme, score, off: pr.off, t: pr.t, wp: diag < M.rMax * 0.5 });
  }
  return out;
}

async function optimize(M, base, pois, detour, R) {
  const D0 = base.distance, Dmax = D0 * (1 + detour), budget0 = D0 * detour;
  const { cell, list } = G.candidates(pois, { R, catchD: M.catchD });
  let best = { route: base, picks: [], sc: 0 };
  if (!list.length) return best;
  let slack = 1.2, expanded = false;
  let P = G.pick(list, cell, budget0 * slack, M.maxWp);
  for (let it = 0; it < 6 && P.length; it++) {
    status(`Probando una ruta con ${P.length} parada${P.length > 1 ? 's' : ''}…`);
    const seq = G.order(state.from, state.to, P, c => c.poi);
    let r;
    try { r = await osrm(M, [state.from, ...seq.map(c => c.poi), state.to]); }
    catch { P = P.slice(0, -1); continue; }
    const extra = r.distance - D0, sc = seq.reduce((s, c) => s + c.score, 0);
    if (r.distance <= Dmax) {
      if (sc > best.sc) best = { route: r, picks: seq, sc };
      if (!expanded && extra < budget0 * 0.55 && P.length < M.maxWp) {
        expanded = true;
        slack = Math.min(slack * budget0 / Math.max(extra, budget0 * 0.15) * 0.85, 5);
        const P2 = G.pick(list, cell, budget0 * slack, M.maxWp);
        if (P2.length > P.length) { P = P2; continue; }
      }
      break;
    }
    if (expanded && best.picks.length) break;
    slack = slack * budget0 / Math.max(extra, 1) * 0.9;
    let P2 = G.pick(list, cell, budget0 * slack, M.maxWp);
    if (P2.length >= P.length) P2 = [...P].sort((a, b) => b.eff - a.eff).slice(0, P.length - 1);
    P = P2;
  }
  return best;
}

function collect(pois, coords, M, picks) {
  const L = G.mkLine(G.simplifyTo(G.mkLine(coords), 4000, M.tol / 2));
  const ids = new Set(picks.map(c => c.poi.id));
  let res = [];
  for (const p of pois) {
    const [x, y] = L.xy(p.lat, p.lon), pr = G.project(L, x, y);
    const stop = ids.has(p.id);
    if (stop || pr.off <= M.catchD || (p.diag > 0 && pr.off <= p.diag / 2)) res.push({ ...p, t1: pr.t, off1: pr.off, stop, env: !stop && pr.off > M.catchD });
  }
  if (res.length > 200) res = res.sort((a, b) => b.score - a.score).slice(0, 200);
  return res.sort((a, b) => a.t1 - b.t1);
}

async function run() {
  if (state.busy) return;
  if (!state.from || !state.to) return status('Elige un origen y un destino (o toca el mapa).', true);
  if (!state.themes.size) return status('Elige al menos un tema.', true);
  const M = MODES[state.mode], detour = state.detour / 100, themeIds = [...state.themes];
  state.busy = true; $('#go').disabled = true; $('#go').classList.add('busy'); hideSugg();
  try {
    status('Calculando la ruta normal…');
    const base = await osrm(M, [state.from, state.to]);
    const L0 = G.mkLine(base.coords);
    const R = Math.round(G.clamp(base.distance * detour * 0.35, M.rMin, M.rMax));
    const rOf = id => Math.round(Math.max(M.rMin * 0.6, R * (THEMES[id].rMul || 1)));
    const rMaxQ = Math.max(...themeIds.map(rOf));
    const lats = base.coords.map(c => c[0]), lons = base.coords.map(c => c[1]);
    const padLat = rMaxQ / 110540, padLon = rMaxQ / (111320 * Math.cos(lats[0] * Math.PI / 180));
    const bb = { s: Math.min(...lats) - padLat, n: Math.max(...lats) + padLat, w: Math.min(...lons) - padLon, e: Math.max(...lons) + padLon };
    const poly = G.simplifyTo(L0, 90).map(c => c[0].toFixed(5) + ',' + c[1].toFixed(5)).join(',');
    const groups = new Map();
    for (const id of themeIds) { const r = rOf(id); groups.set(r, [...(groups.get(r) || []), ...THEMES[id].rules.map(x => x.q + ';')]); }
    const gs = [...groups.entries()];
    const q = `[out:json][timeout:100][bbox:${bb.s.toFixed(5)},${bb.w.toFixed(5)},${bb.n.toFixed(5)},${bb.e.toFixed(5)}];` +
      gs.map(([r, qs], i) => `(${qs.join('')})->.c${i};nwr.c${i}(around:${r},${poly})->.a${i};`).join('') +
      `(${gs.map((_, i) => `.a${i};`).join('')})->.a;node.a;out body;(way.a;relation.a;);out tags bb;`;
    status('Buscando lugares en OpenStreetMap y Wikidata… (si el servidor está saturado puede tardar hasta un minuto)');
    const tq = Date.now(), tick = setInterval(() => status(`Buscando lugares en OpenStreetMap y Wikidata… ${Math.round((Date.now() - tq) / 1000)} s (el servidor de OpenStreetMap va lento hoy; puede tardar hasta un minuto)`), 1000);
    let osmR, wdR;
    try { [osmR, wdR] = await Promise.allSettled([overpass(q), wikidataPois(themeIds, bb)]); } finally { clearInterval(tick); }
    if (osmR.status === 'rejected' && (wdR.status === 'rejected' || !wdR.value.length))
      throw new Error((osmR.reason?.message || 'sin respuesta') + '. Vuelve a intentarlo en un rato.');
    const pois = osmR.status === 'fulfilled' ? buildPois(osmR.value.elements || [], themeIds, L0, M) : [];
    if (wdR.status === 'fulfilled') {
      const have = new Set(pois.map(p => p.tags.wikidata).filter(Boolean));
      for (const w of wdR.value) {
        if (have.has(w.q)) continue;
        const [x, y] = L0.xy(w.lat, w.lon), pr = G.project(L0, x, y);
        if (pr.off > rOf(w.theme) * (w.area ? 1.5 : 1)) continue;
        const fname = w.img ? decodeURIComponent(w.img.split('/').pop()) : null;
        pois.push({ id: 'w' + w.q, osm: null, wd: w.q, lat: w.lat, lon: w.lon, x, y, diag: w.area ? M.rMax : 0, tags: { name: w.name, wikidata: w.q, ...(w.wiki ? { wikipedia: 'es:' + w.wiki } : {}) },
          name: w.name, kind: w.kind, theme: w.theme, score: w.w + 2 + (w.img ? 1 : 0), off: pr.off, t: pr.t, wp: !w.area, photo: fname });
      }
    }
    if (osmR.status === 'rejected') toast('OpenStreetMap no ha respondido: uso solo lugares de Wikidata (sin bares ni sitios pequeños).');
    status(`${pois.length} lugares cerca del trayecto. Ajustando el desvío…`);
    const best = await optimize(M, base, pois, detour, R);
    const items = collect(pois, best.route.coords, M, best.picks);
    const baseCount = collect(pois, base.coords, M, []).length;
    state.result = { base, route: best.route, picks: best.picks, items, baseCount, M, themeIds, wd: null };
    status('');
    renderResult(); draw();
    if (!pois.length) toast('No he encontrado lugares de ese tipo cerca: te muestro la ruta normal.');
  } catch (e) {
    console.error(e); status('No he podido calcular la ruta: ' + e.message, true);
  } finally { state.busy = false; $('#go').disabled = false; $('#go').classList.remove('busy'); }
}
$('#go').addEventListener('click', run);

/* ---------- Dibujo y resumen ---------- */
const routeColor = () => { const t = state.result.themeIds; return t.length === 1 ? THEMES[t[0]].color : '#0f6e66'; };
function draw() {
  const r = state.result; routeLayer.clearLayers(); poiLayer.clearLayers();
  baseLineLayer = L.polyline(r.base.coords, { color: '#6f7d79', weight: 5, opacity: .85, dashArray: '1 10', lineCap: 'round' });
  if (store.get('showBase', true)) routeLayer.addLayer(baseLineLayer);
  routeLayer.addLayer(L.polyline(r.route.coords, { color: '#fff', weight: 11, opacity: .9 }));
  const line = L.polyline(r.route.coords, { color: routeColor(), weight: 6, opacity: 1 });
  routeLayer.addLayer(line);
  r.items.forEach((p, i) => {
    const m = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: 'pin' + (p.stop ? ' stop' : '') + (p.env ? ' env' : ''), html: `<span style="--c:${THEMES[p.theme].color}">${i + 1}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] }) });
    const div = document.createElement('div');
    div.className = 'pp';
    div.innerHTML = `<p class="k">${esc(p.kind)}${p.stop ? ' · parada' : ''}</p><b>${esc(p.name)}</b><button type="button">Ver en el catálogo</button>`;
    div.querySelector('button').addEventListener('click', () => openCatalog(p.id));
    m.bindPopup(div, { closeButton: false });
    p.marker = m; poiLayer.addLayer(m);
  });
  map.fitBounds(line.getBounds(), fitPad());
}
function renderResult() {
  const r = state.result, el = $('#result'), M = r.M;
  const dd = r.route.distance - r.base.distance, pct = Math.round(dd / r.base.distance * 100);
  const more = r.items.length - r.baseCount;
  el.innerHTML = `
    <div class="peek">
      <button type="button" class="peekinfo" id="peekInfo" aria-label="Desplegar detalles"><b style="color:${routeColor()}">${fmtKm(r.route.distance)}</b> · ${fmtT(r.route.duration)}<span>${r.items.length} ${pl(r.items.length, 'lugar', 'lugares')} por el camino</span></button>
      <button type="button" class="primary sm" id="peekCat"${r.items.length ? '' : ' disabled'}>Catálogo</button>
      <button type="button" class="ib fold" id="peekFold" aria-label="Bajar o subir el panel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
    </div>
    <div class="sum">
      <div class="col them" style="--c:${routeColor()}"><p class="lbl">Ruta temática</p><p class="big">${fmtKm(r.route.distance)}</p><p>${fmtT(r.route.duration)} · <b>${r.items.length}</b> ${pl(r.items.length, 'lugar', 'lugares')}</p></div>
      <div class="col norm"><p class="lbl">Ruta normal</p><p class="big">${fmtKm(r.base.distance)}</p><p>${fmtT(r.base.duration)} · ${r.baseCount} ${pl(r.baseCount, 'lugar', 'lugares')}</p></div>
    </div>
    <p class="delta">${r.picks.length ? `+${fmtKm(dd)} (+${pct} %) para ver ${more > 0 ? more + ' ' + pl(more, 'lugar', 'lugares') + ' más' : 'lo mismo con mejor orden'} · ${r.picks.length} parada${r.picks.length > 1 ? 's' : ''} intermedia${r.picks.length > 1 ? 's' : ''}` : 'No hay desvíos que merezcan la pena dentro del margen: la ruta normal ya es la mejor.'}</p>
    <div class="actions">
      <button type="button" id="openCat" class="primary"${r.items.length ? '' : ' disabled'}>Ver catálogo</button>
      <a id="gm" class="btn" target="_blank" rel="noopener" href="${esc(gmapsUrl())}">Google Maps</a>
      <button type="button" id="gpx" class="btn">GPX</button>
    </div>
    <label class="tgl"><input type="checkbox" id="showBase"${store.get('showBase', true) ? ' checked' : ''}> Mostrar la ruta normal (punteada)</label>`;
  el.hidden = false;
  sheet.classList.add('has-result');
  setSheet(!mobile());
  $('#peekCat').addEventListener('click', () => openCatalog());
  $('#peekFold').addEventListener('click', () => setSheet(sheet.classList.contains('collapsed')));
  $('#peekInfo').addEventListener('click', () => setSheet(sheet.classList.contains('collapsed')));
  $('#openCat').addEventListener('click', () => openCatalog());
  $('#gpx').addEventListener('click', downloadGpx);
  $('#showBase').addEventListener('change', e => { store.set('showBase', e.target.checked); e.target.checked ? routeLayer.addLayer(baseLineLayer) : routeLayer.removeLayer(baseLineLayer); });
}
function gmapsUrl() {
  const r = state.result, S = state.from, E = state.to;
  const wp = [...r.picks].sort((a, b) => b.score - a.score).slice(0, 9).map(c => c.poi).sort((a, b) => a.t - b.t);
  const order = G.order(S, E, wp);
  const p = new URLSearchParams({ api: '1', origin: `${S.lat.toFixed(6)},${S.lon.toFixed(6)}`, destination: `${E.lat.toFixed(6)},${E.lon.toFixed(6)}`, travelmode: r.M.gm });
  if (order.length) p.set('waypoints', order.map(x => `${x.lat.toFixed(6)},${x.lon.toFixed(6)}`).join('|'));
  return 'https://www.google.com/maps/dir/?' + p.toString();
}
function downloadGpx() {
  const r = state.result, name = `Vereda · ${state.from.label} → ${state.to.label}`;
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Vereda (Javier Cortés López)" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${esc(name)}</name><author><name>Javier Cortés López</name></author></metadata>` +
    r.items.map(p => `<wpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}"><name>${esc(p.name)}</name><type>${esc(p.kind)}</type></wpt>`).join('') +
    `<trk><name>${esc(name)}</name><trkseg>${r.route.coords.map(c => `<trkpt lat="${c[0].toFixed(6)}" lon="${c[1].toFixed(6)}"/>`).join('')}</trkseg></trk></gpx>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([gpx], { type: 'application/gpx+xml' }));
  a.download = 'vereda-ruta.gpx'; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

/* ---------- Catálogo con fotos ---------- */
const filePath = f => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f.replace(/^File:/i, '').replace(/ /g, '_'))}?width=800`;
const filePage = f => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/^File:/i, '').replace(/ /g, '_'))}`;
async function loadWikidata(ids) {
  const out = new Map(), u = [...new Set(ids)].filter(x => /^Q\d+$/.test(x));
  for (let i = 0; i < u.length; i += 50) {
    try {
      const j = await getJSON(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=claims|sitelinks&sitefilter=eswiki|enwiki&ids=${u.slice(i, i + 50).join('|')}`);
      for (const [q, e] of Object.entries(j.entities || {})) {
        const p18 = e.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        const sl = e.sitelinks?.eswiki ? { lang: 'es', title: e.sitelinks.eswiki.title } : e.sitelinks?.enwiki ? { lang: 'en', title: e.sitelinks.enwiki.title } : null;
        out.set(q, { p18, wiki: sl });
      }
    } catch {}
  }
  return out;
}
async function commonsNear(lat, lon, rad) {
  const j = await getJSON(`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=${Math.round(rad)}&ggslimit=8&ggsnamespace=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&iiextmetadatafilter=Artist|LicenseShortName`);
  const pages = Object.values(j.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  const pg = pages.find(p => /\.(jpe?g|png|webp)$/i.test(p.title) && p.imageinfo?.[0]?.thumburl);
  if (!pg) return null;
  const ii = pg.imageinfo[0], md = ii.extmetadata || {};
  const strip = s => (s || '').replace(/<[^>]*>/g, '').trim();
  return { url: ii.thumburl, page: ii.descriptionurl, by: strip(md.Artist?.value), lic: strip(md.LicenseShortName?.value) };
}
async function enrich(p) {
  if (p._info) return p._info;
  const t = p.tags, info = { img: null, credit: null, desc: t.description || null, wiki: null, near: false };
  if (t.image && /^https?:\/\//.test(t.image) && !/\.(svg|pdf|tiff?)$/i.test(t.image)) {
    const m = t.image.match(/commons\.wikimedia\.org\/wiki\/(File:.+)$/i);
    if (m) { info.img = filePath(decodeURIComponent(m[1])); info.credit = { page: filePage(decodeURIComponent(m[1])), txt: 'Wikimedia Commons' }; }
    else if (/\.(jpe?g|png|webp)(\?|$)/i.test(t.image)) { info.img = t.image; info.credit = { page: t.image, txt: 'Fuente original' }; }
  }
  if (!info.img && p.photo) { info.img = filePath(p.photo); info.credit = { page: filePage(p.photo), txt: 'Wikimedia Commons' }; }
  if (!info.img && /^File:/i.test(t.wikimedia_commons || '')) { info.img = filePath(t.wikimedia_commons); info.credit = { page: filePage(t.wikimedia_commons), txt: 'Wikimedia Commons' }; }
  if (t.wikidata) {
    const wd = (await state.result.wd)?.get(t.wikidata);
    if (wd?.p18 && !info.img) { info.img = filePath(wd.p18); info.credit = { page: filePage(wd.p18), txt: 'Wikimedia Commons' }; }
    if (wd?.wiki) info.wiki = wd.wiki;
  }
  if (!info.wiki && t.wikipedia) { const m = t.wikipedia.match(/^([a-z-]{2,12}):(.+)$/); if (m) info.wiki = { lang: m[1], title: m[2] }; }
  if (info.wiki) {
    try {
      const s = await getJSON(`https://${info.wiki.lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(info.wiki.title.replace(/ /g, '_'))}`, 12000);
      if (s.extract) info.desc = s.extract;
      if (!info.img && s.thumbnail?.source) { info.img = s.originalimage?.source && s.originalimage.width <= 1200 ? s.originalimage.source : s.thumbnail.source; info.credit = { page: s.content_urls?.desktop?.page, txt: 'Wikipedia' }; }
      info.wikiUrl = s.content_urls?.desktop?.page;
    } catch {}
  }
  if (!info.img) {
    try {
      const rad = p.diag ? G.clamp(p.diag / 3, 150, 800) : 120;
      const g = await commonsNear(p.lat, p.lon, rad);
      if (g) { info.img = g.url; info.near = true; info.credit = { page: g.page, txt: [g.by, g.lic].filter(Boolean).join(' · ') || 'Wikimedia Commons' }; }
    } catch {}
  }
  p._info = info; return info;
}
// Cola de enriquecimiento (máx. 4 a la vez) y carga perezosa
const queue = []; let active = 0;
function enqueue(fn) { queue.push(fn); pump(); }
function pump() { while (active < 4 && queue.length) { active++; queue.shift()().finally(() => { active--; pump(); }); } }
let io = null;

function placeholder(p) {
  return `<div class="noimg" style="--c:${THEMES[p.theme].color}">${svgI(p.theme)}</div>`;
}
function cardHtml(p, i) {
  const th = THEMES[p.theme];
  const gm = `https://www.google.com/maps/search/?api=1&query=${p.lat.toFixed(6)},${p.lon.toFixed(6)}`;
  return `<article class="poi" data-id="${esc(p.id)}" data-theme="${p.theme}" data-stop="${p.stop}" style="--c:${th.color}">
    <div class="ph">${placeholder(p)}<span class="num">${i + 1}</span></div>
    <div class="bd">
      <p class="meta"><span class="tag">${esc(p.kind)}</span> km ${nf1.format(p.t1 / 1000)}${p.stop ? ' · parada' : p.env ? ' · en el entorno' : ''}</p>
      <h3>${esc(p.name)}</h3>
      <p class="desc">${p.tags.description ? esc(p.tags.description) : ''}</p>
      <p class="links"><button type="button" class="lk" data-fly="${esc(p.id)}">Ver en el mapa</button><a href="${esc(gm)}" target="_blank" rel="noopener">Google Maps</a>${p.osm ? `<a href="https://www.openstreetmap.org/${esc(p.osm)}" target="_blank" rel="noopener">OSM</a>` : `<a href="https://www.wikidata.org/wiki/${esc(p.wd)}" target="_blank" rel="noopener">Wikidata</a>`}<span class="wl"></span></p>
      <p class="credit"></p>
    </div></article>`;
}
function fillCard(card, p, info) {
  if (info.img) {
    const ph = card.querySelector('.ph'), img = new Image();
    img.alt = p.name; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    img.onload = () => { ph.querySelector('.noimg')?.remove(); ph.prepend(img); if (info.near) ph.insertAdjacentHTML('beforeend', '<span class="near">Foto del entorno</span>'); };
    img.src = info.img;
  }
  if (info.desc) { const d = card.querySelector('.desc'); d.textContent = info.desc; }
  if (info.wikiUrl) card.querySelector('.wl').innerHTML = `<a href="${esc(info.wikiUrl)}" target="_blank" rel="noopener">Wikipedia</a>`;
  if (info.credit && info.img) card.querySelector('.credit').innerHTML = `Foto: <a href="${esc(info.credit.page || '#')}" target="_blank" rel="noopener">${esc(info.credit.txt)}</a>`;
}
let catFilter = 'all';
function openCatalog(focusId) {
  const r = state.result; if (!r) return;
  if (!r.wd) r.wd = loadWikidata(r.items.map(p => p.tags.wikidata).filter(Boolean));
  const cat = $('#catalog');
  const themesIn = [...new Set(r.items.map(p => p.theme))];
  $('#catTitle').textContent = `${state.from.label} → ${state.to.label}`;
  $('#catSub').textContent = `${r.items.length} ${pl(r.items.length, 'lugar', 'lugares')} · ${fmtKm(r.route.distance)} · ${fmtT(r.route.duration)} ${r.M.label.toLowerCase()} · ${r.themeIds.map(t => THEMES[t].label).join(' + ')}`;
  $('#catFilters').innerHTML = [`<button type="button" data-f="all">Todo (${r.items.length})</button>`,
    ...(r.picks.length ? [`<button type="button" data-f="stop">Paradas (${r.items.filter(p => p.stop).length})</button>`] : []),
    ...(themesIn.length > 1 ? themesIn.map(t => `<button type="button" data-f="${t}" style="--c:${THEMES[t].color}">${THEMES[t].label} (${r.items.filter(p => p.theme === t).length})</button>`) : [])].join('');
  catFilter = 'all'; syncFilter();
  $('#grid').innerHTML = r.items.map(cardHtml).join('');
  io?.disconnect();
  io = new IntersectionObserver(ents => {
    for (const e of ents) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const p = r.items.find(x => x.id === e.target.dataset.id);
      if (p) enqueue(() => enrich(p).then(info => fillCard(e.target, p, info)).catch(() => {}));
    }
  }, { root: cat, rootMargin: '600px 0px' });
  for (const c of $('#grid').children) io.observe(c);
  cat.hidden = false; document.body.classList.add('cat-open');
  cat.scrollTop = 0;
  if (focusId) { const c = $(`#grid [data-id="${CSS.escape(focusId)}"]`); c?.scrollIntoView({ block: 'center' }); c?.classList.add('flash'); }
  map.closePopup();
}
function syncFilter() {
  for (const b of $('#catFilters').children) b.setAttribute('aria-pressed', b.dataset.f === catFilter);
  for (const c of $('#grid').children) c.hidden = !(catFilter === 'all' || (catFilter === 'stop' ? c.dataset.stop === 'true' : c.dataset.theme === catFilter));
}
$('#catFilters').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; catFilter = b.dataset.f; syncFilter(); });
function closeCatalog() { $('#catalog').hidden = true; document.body.classList.remove('cat-open'); }
$('#catClose').addEventListener('click', closeCatalog);
$('#catPrint').addEventListener('click', async () => {
  // carga todas las fotos antes de imprimir
  const r = state.result; toast('Preparando el catálogo para imprimir…');
  await Promise.all(r.items.map(p => enrich(p).then(info => { const c = $(`#grid [data-id="${CSS.escape(p.id)}"]`); if (c && !c.querySelector('.ph img')) fillCard(c, p, info); }).catch(() => {})));
  setTimeout(() => window.print(), 800);
});
$('#grid').addEventListener('click', e => {
  const b = e.target.closest('[data-fly]'); if (!b) return;
  const p = state.result.items.find(x => x.id === b.dataset.fly); if (!p) return;
  closeCatalog(); if (mobile()) setSheet(false);
  map.flyTo([p.lat, p.lon], Math.max(map.getZoom(), 16), { duration: .8 });
  setTimeout(() => p.marker?.openPopup(), 900);
});
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#catalog').hidden) closeCatalog(); });

/* ---------- Introducción y nombre ---------- */
const intro = $('#intro'), slidesEl = $('#slides');
const nSlides = slidesEl.children.length;
$('#bubbles').innerHTML = Object.entries(THEMES).map(([k, t]) => `<div class="bub" style="--c:${t.color}"><i>${svgI(k)}</i>${esc(t.label)}</div>`).join('');
$('#introCards').innerHTML = [['naturaleza', 'Parque natural', 'Naturaleza'], ['patrimonio', 'Castillo', 'Patrimonio'], ['miradores', 'Mirador del valle', 'Mirador']]
  .map(([k, n, l]) => `<div class="icard" style="--c:${THEMES[k].color}"><div class="ph">${svgI(k)}</div><div class="bd"><small>${l}</small><b>${n}</b></div></div>`).join('');
$('#dots').innerHTML = [...Array(nSlides)].map((_, i) => `<button type="button" role="tab" aria-label="Pantalla ${i + 1}" data-i="${i}"></button>`).join('');
let slideIdx = 0;
function goSlide(i) { slidesEl.children[i]?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }); }
function markSlide() {
  const i = Math.round(slidesEl.scrollLeft / Math.max(1, slidesEl.clientWidth));
  if (i === slideIdx && slidesEl.children[i].classList.contains('on')) return;
  slideIdx = i;
  [...slidesEl.children].forEach((s, k) => s.classList.toggle('on', k === i));
  [...$('#dots').children].forEach((d, k) => d.setAttribute('aria-selected', k === i));
  $('#introNext').hidden = i === nSlides - 1;
  $('#introSkip').style.visibility = i === nSlides - 1 ? 'hidden' : 'visible';
}
let scrollT;
slidesEl.addEventListener('scroll', () => { clearTimeout(scrollT); scrollT = setTimeout(markSlide, 60); }, { passive: true });
$('#dots').addEventListener('click', e => { const b = e.target.closest('button'); if (b) goSlide(+b.dataset.i); });
$('#introNext').addEventListener('click', () => goSlide(Math.min(slideIdx + 1, nSlides - 1)));
$('#introSkip').addEventListener('click', () => goSlide(nSlides - 1));
intro.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight') goSlide(Math.min(slideIdx + 1, nSlides - 1));
  if (e.key === 'ArrowLeft') goSlide(Math.max(slideIdx - 1, 0));
});
function openIntro(at = 0) {
  intro.hidden = false; document.body.classList.add('intro-open');
  $('#nameIn').value = store.get('name', '') || '';
  requestAnimationFrame(() => { slidesEl.scrollTo({ left: at * slidesEl.clientWidth, behavior: 'auto' }); slideIdx = -1; markSlide(); (at === nSlides - 1 ? $('#nameIn') : $('#introNext')).focus({ preventScroll: true }); });
}
function closeIntro() { intro.hidden = true; document.body.classList.remove('intro-open'); store.set('introSeen', true); greet(); }
function greet() {
  const n = (store.get('name', '') || '').trim();
  $('#ask').textContent = n ? `Hola, ${n}. ¿Qué quieres ver por el camino?` : '¿Qué quieres ver por el camino?';
  $('#catEyebrow').textContent = (n ? `Lo que vas a ver, ${n}` : 'Lo que vas a ver') + ' · Vereda, de Javier Cortés López';
}
$('#nameForm').addEventListener('submit', e => { e.preventDefault(); store.set('name', $('#nameIn').value.trim().slice(0, 30)); closeIntro(); if (store.get('name', '')) toast(`¡Encantados, ${store.get('name', '')}!`); });
$('#noName').addEventListener('click', () => { store.set('name', ''); closeIntro(); });
$('#logoBtn').addEventListener('click', () => openIntro(0));
$('#reIntro').addEventListener('click', () => openIntro(0));
$('#reName').addEventListener('click', () => openIntro(nSlides - 1));
greet();
if (!store.get('introSeen', false)) openIntro(0);

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
