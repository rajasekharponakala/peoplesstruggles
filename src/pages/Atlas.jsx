import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleMarker, GeoJSON, ImageOverlay, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../components/Icons";
import { Loading } from "../components/Layout";
import { HBars } from "../components/Viz";
import { asset, fmtNum, readLink, useAtlas, useBook, useMartyrs } from "../lib/data";
import { snippet } from "../lib/text";

const TYPE_COLOR = { city: "#6b2c91", town: "#b3261e", village: "#c07a12", forest: "#2e7d32", jail: "#4a4a4a" };
const LABELS = {
  Adilabad: [19.35, 78.6], Karimnagar: [18.55, 79.0], Nizamabad: [18.45, 78.1], Medak: [17.95, 78.3], Hyderabad: [17.12, 77.9],
  Warangal: [18.1, 79.75], Khammam: [17.55, 80.55], Nalgonda: [16.95, 79.25], Mahbubnagar: [16.4, 78.1],
  Krishna: [16.35, 80.95], Guntur: [16.05, 80.2], "West Godavari": [16.95, 81.3], "East Godavari": [17.35, 81.95], Kurnool: [15.75, 78.4],
};

function usePrefersDark() {
  const get = () => {
    const t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  };
  const [dark, setDark] = useState(get);
  useEffect(() => {
    const on = () => setDark(get());
    window.addEventListener("themechange", on);
    return () => window.removeEventListener("themechange", on);
  }, []);
  return dark;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    if (target.length === 1) map.flyTo(target[0], Math.max(map.getZoom(), 9), { duration: 0.9 });
    else if (target.length > 1) map.flyToBounds(L.latLngBounds(target).pad(0.5), { duration: 0.9, maxZoom: 9 });
  }, [target, map]);
  return null;
}

function arrowIcon(path) {
  const [a, b] = path.slice(-2);
  const ang = (Math.atan2(b[0] - a[0], (b[1] - a[1]) * Math.cos((b[0] * Math.PI) / 180)) * 180) / Math.PI;
  return L.divIcon({ className: "", iconSize: [18, 18], iconAnchor: [9, 9], html: `<div style="transform:rotate(${-ang}deg);color:#8c1c16;font-size:18px;line-height:18px;text-align:center">➤</div>` });
}

const evIcon = (n, color, on) => L.divIcon({ className: "", iconSize: on ? [34, 34] : [26, 26], iconAnchor: on ? [17, 34] : [13, 26], html: `<div class="ev-marker ${on ? "on" : ""}" style="--c:${color}"><span>${n}</span></div>` });

export default function Atlas() {
  const { data: atlas } = useAtlas();
  const { data: martyrs } = useMartyrs();
  const { data: book } = useBook();
  const [geo, setGeo] = useState(null);
  const [params, setParams] = useSearchParams();
  const dark = usePrefersDark();
  const placeId = params.get("place");
  const eventId = params.get("event");
  const chapter = params.get("chapter");
  const [tab, setTab] = useState(eventId ? "story" : placeId ? "place" : "layers");
  const [layers, setLayers] = useState(() => ({
    zones: true, arrows: true, places: true, events: !!eventId, original: params.get("layer") === "original", labels: true,
  }));
  const [fill, setFill] = useState("none");
  const [base, setBase] = useState("streets");
  const [imgOpacity, setImgOpacity] = useState(0.75);
  const [playing, setPlaying] = useState(false);

  useEffect(() => { fetch(asset("maps/districts.geojson")).then((r) => r.json()).then(setGeo, () => {}); }, []);

  const storyEvents = useMemo(() => (atlas ? atlas.events.filter((e) => e.places.length) : []), [atlas]);
  const storyIdx = Math.max(0, storyEvents.findIndex((e) => e.id === eventId));
  const curEvent = eventId ? atlas?.eventById[eventId] : null;
  const place = placeId ? atlas?.placeById[placeId] : null;

  const setParam = (patch) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    setParams(n, { replace: true });
  };

  useEffect(() => { if (eventId) { setTab("story"); setLayers((l) => ({ ...l, events: true })); } }, [eventId]);
  useEffect(() => { if (placeId) setTab("place"); }, [placeId]);

  useEffect(() => {
    if (!playing || !storyEvents.length) return;
    const t = setTimeout(() => {
      const n = storyEvents[(storyIdx + 1) % storyEvents.length];
      setParam({ event: n.id, place: null });
      if (storyIdx + 1 >= storyEvents.length) setPlaying(false);
    }, 3800);
    return () => clearTimeout(t);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const flyTarget = useMemo(() => {
    if (!atlas) return null;
    if (place) return [[place.lat, place.lon]];
    if (curEvent) return curEvent.places.map((p) => atlas.placeById[p]).filter(Boolean).map((p) => [p.lat, p.lon]);
    return null;
  }, [atlas, place, curEvent]);

  const districtValues = useMemo(() => {
    if (!atlas) return {};
    if (fill === "martyrs") return martyrs?.summary.byDistrict || {};
    if (fill === "mentions") {
      const v = {};
      atlas.places.forEach((p) => (v[p.district] = (v[p.district] || 0) + p.total));
      return v;
    }
    return {};
  }, [atlas, martyrs, fill]);
  const dmax = Math.max(1, ...Object.values(districtValues));

  if (!atlas) return <Loading />;
  const toggle = (k) => setLayers((s) => ({ ...s, [k]: !s[k] }));
  const visiblePlaces = atlas.places.filter((p) => p.type !== "jail" && (!chapter || p.chapters[chapter]));
  const C = atlas.categories;
  const mm = atlas.movementMap;
  const BASES = {
    streets: { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', max: 19 },
    terrain: { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attr: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)', max: 17 },
  };
  const tiles = BASES[base];
  const fillColor = fill === "martyrs" ? "#b3261e" : "#1f6f8b";

  const districtStyle = (f) => {
    const v = districtValues[f.properties.hd] || 0;
    const a = fill === "none" ? 0 : Math.sqrt(v / dmax);
    return {
      color: dark ? "#6d5e4c" : "#a8977c", weight: f.properties.region === "telangana" ? 1.4 : 0.8,
      dashArray: f.properties.region === "telangana" ? null : "3 3",
      fillColor, fillOpacity: fill === "none" ? (f.properties.region === "telangana" ? 0.05 : 0) : 0.04 + a * 0.5,
    };
  };

  return (
    <div className="atlas">
      <div className="atlas-map">
        <MapContainer className={dark ? "tiles-dark" : "tiles-muted"} center={[17.55, 79.6]} zoom={7.5} minZoom={6} maxZoom={12} zoomSnap={0.5} scrollWheelZoom
          maxBounds={[[13.5, 74.5], [21.5, 84.5]]} style={{ height: "100%" }}>
          {tiles && <TileLayer key={base} url={tiles.url} subdomains="abc" maxNativeZoom={tiles.max} attribution={tiles.attr} />}
          {layers.original && <ImageOverlay url={asset("maps/movement-map.jpg")} bounds={mm.bounds} opacity={imgOpacity} zIndex={5} />}
          {geo && (
            <GeoJSON key={`${fill}-${dark}-${!!martyrs}`} data={geo} style={districtStyle}
              onEachFeature={(f, layer) => {
                const v = districtValues[f.properties.hd];
                layer.bindTooltip(`<b>${f.properties.hd}</b>${v ? `<br/>${fmtNum(v)} ${fill === "martyrs" ? "martyrs listed" : "place mentions"}` : ""}`, { className: "tt", sticky: true });
              }} />
          )}
          {layers.zones && mm.zones.map((z) => (
            <Polygon key={z.id} positions={z.rings} pathOptions={{ color: z.kind === "strong" ? "#8c1c16" : "#c07a12", weight: 1.5, dashArray: z.kind === "strong" ? null : "6 4", fillColor: z.kind === "strong" ? "#b3261e" : "#e5a43c", fillOpacity: z.kind === "strong" ? 0.32 : 0.18 }}>
              <Tooltip className="tt" sticky>{z.label}<br /><span style={{ opacity: .7 }}>Traced from the book's 1948 map</span></Tooltip>
            </Polygon>
          ))}
          {layers.arrows && mm.arrows.map((a) => (
            <span key={a.label}>
              <Polyline positions={a.path} pathOptions={{ color: "#8c1c16", weight: 2.5, dashArray: "2 6", lineCap: "round" }}>
                <Tooltip className="tt" sticky>Direction of guerrilla expansion: {a.label}</Tooltip>
              </Polyline>
              <Marker position={a.path[a.path.length - 1]} icon={arrowIcon(a.path)} interactive={false} />
            </span>
          ))}
          {layers.labels && Object.entries(LABELS).map(([n, p]) => (
            <Marker key={n} position={p} interactive={false} icon={L.divIcon({ className: "map-label", html: n, iconSize: [120, 16], iconAnchor: [60, 8] })} />
          ))}
          {layers.places && visiblePlaces.map((p) => (
            <CircleMarker key={p.id} center={[p.lat, p.lon]} radius={Math.max(4, Math.min(18, 2.5 + Math.sqrt(chapter ? p.chapters[chapter] * 6 : p.total) * 1.3))}
              pathOptions={{ color: dark ? "#15110d" : "#fff", weight: placeId === p.id ? 3 : 1.5, fillColor: TYPE_COLOR[p.type], fillOpacity: placeId === p.id ? 1 : 0.82 }}
              eventHandlers={{ click: () => setParam({ place: p.id, event: null }) }}>
              <Tooltip className="tt" direction="top" offset={[0, -6]}><b>{p.name}</b><br />{p.total} mentions{p.martyrs ? ` · ${p.martyrs} martyrs` : ""}</Tooltip>
            </CircleMarker>
          ))}
          {layers.events && (() => {
            const seen = {};
            return storyEvents.map((e, i) => {
            const pl = atlas.placeById[e.places[0]];
            if (!pl) return null;
            const on = e.id === eventId;
            const k = (seen[pl.id] = (seen[pl.id] ?? -1) + 1);
            const ang = k * 1.1, rad = k ? 0.045 + 0.012 * k : 0;
            return (
              <Marker key={e.id} position={[pl.lat + rad * Math.sin(ang), pl.lon + rad * Math.cos(ang)]} icon={evIcon(i + 1, C[e.cat].color, on)} zIndexOffset={on ? 1000 : 0}
                eventHandlers={{ click: () => setParam({ event: e.id, place: null }) }}>
                <Tooltip className="tt" direction="top" offset={[0, -26]}><b>{e.label}</b><br />{e.title}</Tooltip>
              </Marker>
            );
          });
          })()}
          <FlyTo target={flyTarget} />
        </MapContainer>

        <div className="map-float">
          <button className="icon-btn" onClick={() => { setLayers((l) => ({ ...l, events: true })); if (!eventId) setParam({ event: storyEvents[0].id, place: null }); setPlaying((p) => !p); setTab("story"); }} aria-label={playing ? "Pause story" : "Play story"} title={playing ? "Pause" : "Play the story"}>
            <Icon name={playing ? "pause" : "play"} />
          </button>
          <span className="when">{curEvent ? curEvent.label : "Story mode"}</span>
          <input type="range" min={0} max={storyEvents.length - 1} value={storyIdx} aria-label="Step through events"
            onChange={(e) => { setLayers((l) => ({ ...l, events: true })); setParam({ event: storyEvents[+e.target.value].id, place: null }); }} />
          <span className="tiny muted mono">{eventId ? storyIdx + 1 : 0}/{storyEvents.length}</span>
        </div>
      </div>

      <aside className="atlas-side">
        <div className="tabs" role="tablist">
          {[["layers", "Layers"], ["place", "Place"], ["story", "Story"]].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="body">
          {chapter && atlas.tocById[chapter] && (
            <div className="callout ochre" style={{ marginBottom: 14 }}>
              Showing the {visiblePlaces.length} places named in <b>{atlas.tocById[chapter].short}</b>. <button className="chip" onClick={() => setParam({ chapter: null })}>Show all</button>{" "}
              <Link to={`/read/${chapter}`}>Back to chapter</Link>
            </div>
          )}

          {tab === "layers" && (
            <>
              <h1 style={{ fontSize: 26, marginBottom: 6 }}>Map of the Struggle</h1>
              <p className="small muted" style={{ marginTop: 0 }}>The book's 1948 map is georeferenced onto real terrain. Its zones are traced as vector layers, and every place the book names is pinned. Click any marker.</p>
              {[
                ["zones", "Movement zones (1948 map)", "Red: original strong base. Ochre: guerrilla expansion after 1948."],
                ["arrows", "Directions of expansion", "Arrows from the original map: into forests and new districts."],
                ["original", "Original printed map", "Overlay the scanned map from p. 2 of the book."],
                ["places", "Places named in the book", "Size = number of mentions. Colour = type."],
                ["events", "Timeline events", "Numbered pins: events from the timeline."],
                ["labels", "District names", "Historical (1948) districts."],
              ].map(([k, t, d]) => (
                <label className="layer-row" key={k}>
                  <input type="checkbox" checked={layers[k]} onChange={() => toggle(k)} />
                  <div><b>{t}</b><span>{d}</span></div>
                </label>
              ))}
              {layers.original && (
                <div style={{ padding: "10px 0" }}>
                  <label className="tiny muted">Original map opacity</label>
                  <input type="range" min={0.2} max={1} step={0.05} value={imgOpacity} onChange={(e) => setImgOpacity(+e.target.value)} style={{ width: "100%", accentColor: "var(--red)" }} />
                </div>
              )}
              <div style={{ padding: "14px 0 0" }}>
                <h4 className="panel-title">Base map</h4>
                <div className="seg">
                  {[["streets", "Streets"], ["terrain", "Terrain & forests"], ["none", "Plain"]].map(([k, l]) => <button key={k} className={base === k ? "on" : ""} onClick={() => setBase(k)}>{l}</button>)}
                </div>
              </div>
              <div style={{ padding: "14px 0" }}>
                <h4 className="panel-title">Shade districts by</h4>
                <div className="seg">
                  {[["martyrs", "Martyrs"], ["mentions", "Mentions"], ["none", "None"]].map(([k, l]) => <button key={k} className={fill === k ? "on" : ""} onClick={() => setFill(k)}>{l}</button>)}
                </div>
                {fill !== "none" && (
                  <>
                    <div className="ramp" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${fillColor} 6%, transparent), ${fillColor})` }} />
                    <div className="row tiny muted"><span>0</span><span className="spacer" /><span>{fmtNum(dmax)} {fill === "martyrs" ? "martyrs (Appendix I)" : "mentions"}</span></div>
                  </>
                )}
              </div>
              <h4 className="panel-title">Legend</h4>
              <div className="legend">
                {Object.entries(TYPE_COLOR).filter(([k]) => k !== "jail").map(([k, c]) => <div key={k}><span className="sw" style={{ background: c, borderRadius: 99, width: 12 }} />{k[0].toUpperCase() + k.slice(1)}</div>)}
                <div><span className="sw" style={{ background: "#b3261e", opacity: .5 }} />Original strong base</div>
                <div><span className="sw" style={{ background: "#e5a43c", opacity: .5 }} />Expansion after 1948</div>
              </div>
              <hr className="divider" />
              <h4 className="panel-title">Most-mentioned places</h4>
              <HBars items={[...visiblePlaces].sort((a, b) => b.total - a.total).slice(0, 12).map((p) => ({ label: p.name, value: p.total, color: TYPE_COLOR[p.type] }))} />
              <p className="tiny muted" style={{ marginTop: 16 }}>Place coordinates are modern and approximate, matched to the book's spellings (Illendu = Yellandu, Manukota = Mahabubabad, Bezwada = Vijayawada). Zones are hand-traced from the scanned map.</p>
            </>
          )}

          {tab === "place" && (place ? (
            <PlacePanel place={place} atlas={atlas} book={book} onClose={() => setParam({ place: null })} />
          ) : (
            <>
              <p className="muted">Pick a place on the map, or choose one here:</p>
              <select className="input" onChange={(e) => setParam({ place: e.target.value, event: null })} value="">
                <option value="" disabled>Choose a place…</option>
                {[...atlas.places].sort((a, b) => a.name.localeCompare(b.name)).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.total})</option>)}
              </select>
            </>
          ))}

          {tab === "story" && (
            curEvent ? (
              <StoryPanel ev={curEvent} atlas={atlas} book={book} idx={storyIdx} total={storyEvents.length}
                go={(d) => { const n = storyEvents[storyIdx + d]; n && setParam({ event: n.id, place: null }); }} />
            ) : (
              <>
                <h2 style={{ fontSize: 24 }}>Story mode</h2>
                <p className="muted">Press play to fly through {storyEvents.length} events in order: where each happened, what the book says, and a link to the passage.</p>
                <button className="btn" onClick={() => { setLayers((l) => ({ ...l, events: true })); setParam({ event: storyEvents[0].id, place: null }); }}><Icon name="play" size={15} /> Begin with {storyEvents[0]?.label}</button>
              </>
            )
          )}
        </div>
      </aside>
    </div>
  );
}

function PlacePanel({ place, atlas, book, onClose }) {
  const events = atlas.events.filter((e) => e.places.includes(place.id));
  const chapters = Object.entries(place.chapters).sort((a, b) => b[1] - a[1]);
  const alias = place.aliases[0];
  const refs = book ? place.refs.slice(0, 10).map(([ch, b]) => ({ ch, b, text: book.byId[ch]?.blocks.find((x) => x.id === b)?.x || "" })) : [];
  const findAlias = (t) => place.aliases.find((a) => t.includes(a)) || alias;
  return (
    <div className="place-card">
      <div className="row"><span className="eyebrow" style={{ color: TYPE_COLOR[place.type] }}>{place.type} · {place.district}</span><span className="spacer" /><button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button></div>
      <h2>{place.name}</h2>
      {place.aliases.length > 1 && <p className="tiny muted" style={{ margin: 0 }}>Also spelled: {place.aliases.slice(1).join(", ")}</p>}
      <div className="kv">
        <div><b>{place.total}</b><span>mentions</span></div>
        <div><b>{chapters.length}</b><span>chapters</span></div>
        <div><b>{place.martyrs || "–"}</b><span>martyrs*</span></div>
      </div>
      {events.length > 0 && (
        <>
          <h4 className="panel-title">On the timeline</h4>
          <ul className="rail-list" style={{ marginBottom: 16 }}>
            {events.map((e) => <li key={e.id}><Link to={`/timeline?event=${e.id}`}><span className="d">{e.label}</span><span>{e.title}</span></Link></li>)}
          </ul>
        </>
      )}
      <h4 className="panel-title">Where the book talks about it</h4>
      <HBars items={chapters.slice(0, 8).map(([c, n]) => ({ label: atlas.tocById[c].short, value: n, to: `/read/${c}?q=${encodeURIComponent(alias)}`, color: "var(--teal)" }))} />
      <h4 className="panel-title" style={{ marginTop: 18 }}>Passages</h4>
      {refs.map((r) => {
        const a = findAlias(r.text);
        return (
          <Link key={r.ch + r.b} to={readLink({ ch: r.ch, b: r.b }, a)} className="snip">
            <small>{atlas.tocById[r.ch].short}</small>{snippet(r.text, a, 220)}
          </Link>
        );
      })}
      <div className="row" style={{ marginTop: 14 }}>
        <Link className="btn sm" to={`/search?q=${encodeURIComponent(alias)}`}><Icon name="search" size={14} /> All mentions</Link>
        {place.martyrs > 0 && <Link className="btn ghost sm" to={`/martyrs?q=${encodeURIComponent(alias)}`}><Icon name="flame" size={14} /> Martyrs</Link>}
      </div>
      <p className="tiny muted">* Martyr entries in Appendix I whose village, taluka or remarks name this place.</p>
    </div>
  );
}

function StoryPanel({ ev, atlas, book, idx, total, go }) {
  const C = atlas.categories;
  const excerpt = ev.anchor && book ? book.byId[ev.anchor.ch]?.blocks.find((b) => b.id === ev.anchor.b)?.x : null;
  return (
    <div>
      <div className="row"><span className="eyebrow" style={{ color: C[ev.cat].color }}>{atlas.eraById[ev.era].title}</span><span className="spacer" /><span className="tiny muted">{idx + 1} / {total}</span></div>
      <div className="date" style={{ fontFamily: "var(--display)", fontWeight: 700, color: C[ev.cat].color, marginTop: 8 }}>{ev.label}</div>
      <h2 style={{ fontSize: 24, margin: "4px 0 8px" }}>{ev.title}</h2>
      <p style={{ marginTop: 0 }}>{ev.desc}</p>
      {excerpt && <div className="excerpt">“{excerpt}”</div>}
      <div className="chips" style={{ marginBottom: 14 }}>
        {ev.places.map((p) => atlas.placeById[p] && <span key={p} className="tag place">{atlas.placeById[p].name}</span>)}
      </div>
      <div className="row">
        {ev.anchor && <Link className="btn sm" to={readLink(ev.anchor)}><Icon name="book" size={14} /> Read · p. {ev.anchor.pg}</Link>}
        <Link className="btn ghost sm" to={`/timeline?event=${ev.id}`}><Icon name="clock" size={14} /> Timeline</Link>
      </div>
      <div className="tl-pager">
        <button className="btn ghost sm" disabled={idx <= 0} onClick={() => go(-1)}><Icon name="back" size={14} /> Previous</button>
        <button className="btn ghost sm" disabled={idx >= total - 1} onClick={() => go(1)}>Next <Icon name="arrow" size={14} /></button>
      </div>
    </div>
  );
}
