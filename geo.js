/* Vereda · funciones geométricas y de selección (sin DOM, testeables en node) */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rad = d => d * Math.PI / 180;

  // Distancia haversine en metros entre {lat,lon}
  function hv(a, b) {
    const R = 6371008.8, dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  // Selector estilo Overpass -> regla evaluable en cliente
  function parseSel(sel) {
    const types = sel.match(/^\w+/)[0];
    const fl = [...sel.matchAll(/\[([^\]]+)\]/g)].map(m => {
      const s = m[1];
      const mm = s.match(/^"?([^"!=~]+)"?\s*(!=|=|~)\s*"?(.*?)"?$/);
      if (!mm) return { k: s.replace(/"/g, ''), op: 'has' };
      return { k: mm[1], op: mm[2], v: mm[3], re: mm[2] === '~' ? new RegExp(mm[3]) : null };
    });
    return { types, fl };
  }
  function matches(rule, el) {
    if (rule.types === 'node' && el.type !== 'node') return false;
    if (rule.types === 'way' && el.type !== 'way') return false;
    const t = el.tags || {};
    return rule.fl.every(f =>
      f.op === 'has' ? t[f.k] != null :
      f.op === '=' ? t[f.k] === f.v :
      f.op === '!=' ? t[f.k] !== f.v :
      t[f.k] != null && f.re.test(t[f.k]));
  }

  // Polilínea en coordenadas métricas locales (equirectangular)
  function mkLine(coords) { // coords: [[lat,lon],...]
    const o = coords[0];
    const kx = 111320 * Math.cos(rad(o[0])), ky = 110540;
    const xy = (lat, lon) => [(lon - o[1]) * kx, (lat - o[0]) * ky];
    const P = coords.map(c => xy(c[0], c[1]));
    const cum = [0];
    for (let i = 1; i < P.length; i++) cum[i] = cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    return { coords, P, cum, xy, length: cum[cum.length - 1] };
  }

  // Proyección de un punto sobre la línea: distancia perpendicular (off) y avance (t)
  function project(L, x, y) {
    const P = L.P;
    let best = Infinity, t = 0;
    if (P.length === 1) return { off: Math.hypot(x - P[0][0], y - P[0][1]), t: 0 };
    for (let i = 0; i < P.length - 1; i++) {
      const ax = P[i][0], ay = P[i][1], dx = P[i + 1][0] - ax, dy = P[i + 1][1] - ay;
      const l2 = dx * dx + dy * dy;
      let u = l2 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0;
      u = u < 0 ? 0 : u > 1 ? 1 : u;
      const ex = ax + u * dx - x, ey = ay + u * dy - y, d = ex * ex + ey * ey;
      if (d < best) { best = d; t = L.cum[i] + u * Math.sqrt(l2); }
    }
    return { off: Math.sqrt(best), t };
  }

  // Douglas-Peucker (índices conservados)
  function dp(P, tol) {
    const n = P.length;
    if (n < 3) return [...Array(n).keys()];
    const keep = new Uint8Array(n); keep[0] = keep[n - 1] = 1;
    const st = [[0, n - 1]];
    while (st.length) {
      const [a, b] = st.pop();
      const ax = P[a][0], ay = P[a][1], dx = P[b][0] - ax, dy = P[b][1] - ay, l2 = dx * dx + dy * dy || 1e-9;
      let md = 0, mi = -1;
      for (let i = a + 1; i < b; i++) {
        let u = ((P[i][0] - ax) * dx + (P[i][1] - ay) * dy) / l2; u = clamp(u, 0, 1);
        const ex = ax + u * dx - P[i][0], ey = ay + u * dy - P[i][1], d = ex * ex + ey * ey;
        if (d > md) { md = d; mi = i; }
      }
      if (mi > 0 && md > tol * tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
    }
    const out = [];
    for (let i = 0; i < n; i++) if (keep[i]) out.push(i);
    return out;
  }
  function simplifyTo(L, maxN, tol0) {
    let tol = tol0 || 10, idx = dp(L.P, tol);
    while (idx.length > maxN) { tol *= 1.6; idx = dp(L.P, tol); }
    return idx.map(i => L.coords[i]);
  }

  // Orden de paradas: por avance sobre la ruta y luego 2-opt con extremos fijos
  function order(S, E, items, g) {
    g = g || (x => x);
    const r = [...items].sort((a, b) => g(a).t - g(b).t);
    for (let guard = 0; guard < 80; guard++) {
      const p = [S, ...r.map(g), E];
      let improved = false;
      outer:
      for (let i = 1; i < p.length - 2; i++) {
        for (let k = i + 1; k < p.length - 1; k++) {
          const d = hv(p[i - 1], p[i]) + hv(p[k], p[k + 1]) - hv(p[i - 1], p[k]) - hv(p[i], p[k + 1]);
          if (d > 1) {
            const seg = r.slice(i - 1, k).reverse();
            r.splice(i - 1, k - i + 1, ...seg);
            improved = true; break outer;
          }
        }
      }
      if (!improved) break;
    }
    return r;
  }

  // Agrupa candidatos en celdas y elige paradas dentro del presupuesto de desvío
  function candidates(pois, opts) {
    const { R, catchD } = opts;
    const cell = clamp(R / 4, 60, 3000);
    const cells = new Map();
    for (const p of pois) {
      if (!p.wp || p.off < catchD) continue;
      const k = Math.floor(p.x / cell) + ',' + Math.floor(p.y / cell);
      let c = cells.get(k);
      if (!c) { c = { sum: 0, n: 0, best: null }; cells.set(k, c); }
      c.sum += p.score; c.n++;
      if (!c.best || p.score > c.best.score) c.best = p;
    }
    return {
      cell,
      list: [...cells.values()].map(c => {
        const score = c.sum ** 0.8, cost = 2.4 * c.best.off;
        return { poi: c.best, n: c.n, score, cost, eff: score / (1 + cost / R) };
      }).sort((a, b) => b.eff - a.eff)
    };
  }
  function pick(cands, cell, budget, maxWp) {
    const P = []; let used = 0;
    for (const c of cands) {
      if (P.length >= maxWp) break;
      if (used + c.cost > budget) continue;
      if (P.some(q => (q.poi.x - c.poi.x) ** 2 + (q.poi.y - c.poi.y) ** 2 < (cell * 1.5) ** 2)) continue;
      P.push(c); used += c.cost;
    }
    return P;
  }

  const api = { clamp, hv, parseSel, matches, mkLine, project, dp, simplifyTo, order, candidates, pick };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Geo = api;
})(typeof self !== 'undefined' ? self : this);
