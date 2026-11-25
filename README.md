# Vereda · rutas con intención

Web app instalable (PWA) tipo mapa: calcula una ruta de A a B que se desvía para pasar por lo que quieres ver
(naturaleza, miradores y paisaje, patrimonio, bares y tapas, agua, arte y cultura) y genera un catálogo con fotos.

## Publicar en GitHub Pages
1. Crea un repositorio nuevo (p. ej. `vereda`) en github.com/javicortes9.
2. Sube todos los archivos de esta carpeta a la raíz (index.html, app.js, geo.js, style.css, sw.js, manifest.webmanifest, icons/).
3. Settings → Pages → Source: «Deploy from a branch», rama `main`, carpeta `/ (root)`.
4. Abre https://javicortes9.github.io/vereda/ en Safari del iPhone → Compartir → «Añadir a pantalla de inicio».

## Cómo funciona
- Ruta base: OSRM de FOSSGIS (routing.openstreetmap.de), perfiles a pie, bici y coche.
- Lugares: Overpass API (OpenStreetMap) en un pasillo alrededor de la ruta base; el ancho depende del desvío máximo.
- Optimización: agrupa lugares en celdas, puntúa (tipo + Wikidata/Wikipedia + patrimonio + tamaño),
  elige paradas dentro del presupuesto de desvío, las ordena (2-opt) y recalcula hasta cumplir el límite.
- Catálogo: lugares a menos de 60 m (a pie), 120 m (bici) o 300 m (coche) de la ruta final, más las paradas.
  Fotos y textos de: etiqueta image / wikimedia_commons de OSM → Wikidata (P18) → resumen de Wikipedia → Commons cerca del punto.
- Exporta a Google Maps (máx. 9 paradas) y a GPX.

Para cambiar o añadir temas, edita el objeto `THEMES` de app.js (selectores Overpass, peso y etiqueta).
