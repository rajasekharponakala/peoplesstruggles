# Telangana People's Struggle — an interactive archive

An interactive edition of P. Sundarayya's *Telangana People's Struggle and Its Lessons*
(CPI(M), Calcutta, December 1972), 414 pages.

**What's inside**

| Page | What it does |
| --- | --- |
| **Read** (`/read`, `/read/:id`) | Full text of all 23 chapters and appendices. Section TOC with scrollspy, PDF page numbers, place names linked to the map, glossary tooltips, margin notes linking to the timeline, deep links to any paragraph (`?b=`), search highlighting (`?q=`), and text size and typeface settings. |
| **Timeline** (`/timeline`) | 49 dated events in 6 eras, each anchored to its exact passage. Shows the excerpt and a locator map; links to the reader and the map; ← → keys step through events. |
| **Map** (`/map`) | Leaflet map. The book's 1948 map is georeferenced and its zones and expansion arrows traced as vector layers, with 87 places sized by mentions, a district choropleth (martyrs and mentions), and a story mode that plays the timeline on the map. Accepts `?place=`, `?event=`, `?chapter=`. |
| **Martyrs** (`/martyrs`) | Appendix I parsed into 1,002 structured rows (2,473 people), with filters, charts by district, taluka and year, a wall of names, and source page links. |
| **People** (`/people`) | Key figures with per-chapter mention sparklines, plus 66 biographical sketches. |
| **Witness** (`/witness`) | Testimony passages grouped by theme, with a content note. |
| **Insights** (`/insights`) | Figures quoted in the book, years mentioned, a themes × chapters heatmap, and top places and people. |
| **Glossary**, **Search** | Terms of Nizam-era Hyderabad; full-text search with chapter facets and a names index. |

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/peoplesstruggles/
npm run build      # outputs dist/ (+ 404.html SPA fallback)
BASE_PATH=/ npm run build   # build for a site served at the domain root
```

## Rebuilding the data

The JSON in `public/data/` is generated, not hand-edited:

```bash
# Telangana.pdf = the 414-page source PDF of the 1972 edition
python3 scripts/build_data.py Telangana.pdf      # needs poppler-utils (pdftotext) + numpy
scripts/build_maps.sh telangana-full.geojson ap-full.geojson   # optional: district polygons
```

- `scripts/source/` holds the original paragraph extraction and names index.
- `scripts/curated.py` holds the timeline events, eras, figures, people, glossary and themes. Each item is anchored to an exact phrase in the book, and the build **fails** if a phrase can't be found.
- `scripts/gazetteer.py` holds the places with approximate coordinates and the book's spellings.
- `scripts/zones.py` holds the georeferencing control points and traced zones of the 1948 map.

The site's link to the source PDF is set by `PDF_URL` in `src/lib/data.js` (currently empty, so no PDF links are shown).

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`, or when run manually.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site is then served at `https://<user>.github.io/peoplesstruggles/`.
