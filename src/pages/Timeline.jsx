import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EventQuiz from "../components/EventQuiz";
import Icon from "../components/Icons";
import { Loading, PageHead } from "../components/Layout";
import MiniMap from "../components/MiniMap";
import { readLink, useAtlas, useBook } from "../lib/data";

/** Piecewise scale: each era gets width ∝ max(events, 3), events placed by time inside it. */
function useTrack(eras, events) {
  return useMemo(() => {
    const weights = eras.map((e) => Math.max(3, events.filter((x) => x.era === e.id).length));
    const total = weights.reduce((a, b) => a + b, 0);
    const cum = weights.map((_, i) => weights.slice(0, i).reduce((a, b) => a + b, 0));
    const bands = eras.map((e, i) => ({ ...e, x0: cum[i] / total, x1: (cum[i] + weights[i]) / total }));
    const pos = {};
    bands.forEach((b) => {
      const evs = events.filter((x) => x.era === b.id);
      const t0 = Math.min(b.start, ...evs.map((e) => e.t)), t1 = Math.max(b.end, ...evs.map((e) => e.t));
      evs.forEach((e, i) => {
        // blend time-position with rank to avoid overlaps
        const byTime = (e.t - t0) / Math.max(0.0001, t1 - t0);
        const byRank = (i + 0.5) / evs.length;
        const f = 0.35 * byTime + 0.65 * byRank;
        pos[e.id] = b.x0 + (b.x1 - b.x0) * (0.06 + 0.88 * f);
      });
    });
    return { bands, pos };
  }, [eras, events]);
}

export default function Timeline() {
  const { data: atlas } = useAtlas();
  const { data: book } = useBook();
  const [params, setParams] = useSearchParams();
  const sel = params.get("event");
  const cat = params.get("cat") || "";
  const era = params.get("era");
  const listRef = useRef(null);

  const events = atlas?.events || [];
  const { bands, pos } = useTrack(atlas?.eras || [], events);
  const visible = events.filter((e) => !cat || e.cat === cat);
  const selEvent = sel ? atlas?.eventById[sel] : null;
  const idx = selEvent ? visible.findIndex((e) => e.id === sel) : -1;

  const update = (patch) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    setParams(n, { replace: true });
  };
  const select = (id) => update({ event: id, era: null });

  useEffect(() => {
    if (!atlas) return;
    const id = sel ? `ev-${sel}` : era ? `era-${era}` : null;
    if (!id) return;
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: sel ? "center" : "start" }), 80);
    return () => clearTimeout(t);
  }, [sel, era, atlas]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest("input,textarea,select")) return;
      let n = null;
      if (e.key === "ArrowRight" || e.key === "j") n = visible[Math.min(visible.length - 1, idx + 1)];
      if (e.key === "ArrowLeft" || e.key === "k") n = visible[Math.max(0, idx - 1)];
      if (n) select(n.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!atlas) return <Loading />;
  const C = atlas.categories;
  const excerpt = selEvent?.anchor && book ? book.byId[selEvent.anchor.ch]?.blocks.find((b) => b.id === selEvent.anchor.b)?.x : null;
  const selPlaces = selEvent ? selEvent.places.map((p) => atlas.placeById[p]).filter(Boolean) : [];

  return (
    <>
      <PageHead eyebrow="Chronology" title="Timeline of the Struggle">
        {events.length} dated events from the book, grouped into six eras. Click a dot or a card to see the passage it comes from, then
        jump into the book or onto the map. Use ← → to step through the events.
      </PageHead>
      <div className="wrap wide">
        <div className="tl-track-wrap">
          <div className="tl-filters">
            <button className={`chip ${!cat ? "on" : ""}`} onClick={() => update({ cat: null })}>All <span className="count">{events.length}</span></button>
            {Object.entries(C).map(([k, c]) => (
              <button key={k} className={`chip ${cat === k ? "on" : ""}`} onClick={() => update({ cat: cat === k ? null : k })}>
                <span className="dot" style={{ background: c.color }} /> {c.label} <span className="count">{events.filter((e) => e.cat === k).length}</span>
              </button>
            ))}
          </div>
          <div className="tl-track" aria-label="Event track">
            {bands.map((b) => (
              <div key={b.id}>
                <button className="tl-band" title={`${b.title} (${b.range})`} aria-label={`Jump to era: ${b.title}`} style={{ left: `calc(${b.x0 * 100}% + 1px)`, width: `calc(${(b.x1 - b.x0) * 100}% - 2px)`, background: b.color }} onClick={() => update({ era: b.id, event: null })} />
                <div className="tl-band-label" style={{ left: `${b.x0 * 100}%`, width: `${(b.x1 - b.x0) * 100}%`, color: b.color }}>{b.title}</div>
                <div className="tl-band-range" style={{ left: `${b.x0 * 100}%`, width: `${(b.x1 - b.x0) * 100}%` }}>{b.range}</div>
              </div>
            ))}
            {visible.map((e) => (
              <button key={e.id} className={`tl-dot ${sel === e.id ? "on" : ""}`} style={{ left: `${pos[e.id] * 100}%`, "--c": C[e.cat].color }}
                title={`${e.label} — ${e.title}`} aria-label={`${e.label}: ${e.title}`} onClick={() => select(e.id)} />
            ))}
          </div>
        </div>

        <div className="tl-layout">
          <div ref={listRef}>
            {bands.map((b) => {
              const evs = visible.filter((e) => e.era === b.id);
              if (!evs.length) return null;
              const chapters = [...new Set(evs.map((e) => e.anchor?.ch).filter(Boolean))];
              return (
                <section key={b.id} style={{ "--era": b.color }}>
                  <div className="tl-era" id={`era-${b.id}`}>
                    <span className="bar" />
                    <div>
                      <div className="r">{b.range}</div>
                      <h2>{b.title}</h2>
                      <p>{b.summary}</p>
                      <div className="chips" style={{ marginTop: 10 }}>
                        <span className="tiny muted" style={{ alignSelf: "center" }}>Read:</span>
                        {chapters.map((c) => <Link key={c} className="tag" to={`/read/${c}`}>{atlas.tocById[c].short}</Link>)}
                      </div>
                    </div>
                  </div>
                  <div className="tl-list">
                    {evs.map((e) => (
                      <div key={e.id} id={`ev-${e.id}`} className={`tl-item ${sel === e.id ? "on" : ""}`} style={{ "--cat": C[e.cat].color }}>
                        <div className="tl-card" onClick={() => select(e.id)} role="button" tabIndex={0} onKeyDown={(k) => k.key === "Enter" && select(e.id)} aria-pressed={sel === e.id}>
                          <div className="row" style={{ gap: 8 }}>
                            <span className="date">{e.label}</span>
                            <span className="tag" style={{ color: C[e.cat].color }}>{C[e.cat].label}</span>
                          </div>
                          <h3>{e.title}</h3>
                          <p>{e.desc}</p>
                          <div className="acts" onClick={(x) => x.stopPropagation()}>
                            {e.anchor && <Link className="btn sm" to={readLink(e.anchor)}><Icon name="book" size={14} /> Read · p. {e.anchor.pg}</Link>}
                            {e.places.length > 0 && <Link className="btn ghost sm" to={`/map?event=${e.id}`}><Icon name="pin" size={14} /> On the map</Link>}
                            {e.places.map((p) => atlas.placeById[p] && <Link key={p} className="tag place" to={`/map?place=${p}`}>{atlas.placeById[p].name.replace(/ \(.*\)/, "")}</Link>)}
                          </div>
                          {sel === e.id && excerpt && (
                            <div className="excerpt tl-mobile-excerpt">“{excerpt.length > 700 ? excerpt.slice(0, 700) + "…" : excerpt}”</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="tl-aside">
            {selEvent ? (
              <div className="card">
                <div className="eyebrow" style={{ color: C[selEvent.cat].color }}>{selEvent.label} · {atlas.eraById[selEvent.era].title}</div>
                <h3 style={{ fontSize: 22, margin: "6px 0 10px" }}>{selEvent.title}</h3>
                {excerpt && <div className="excerpt">“{excerpt}”</div>}
                {selEvent.anchor && <p className="tiny muted" style={{ margin: "0 0 12px" }}>— {atlas.tocById[selEvent.anchor.ch].title}, p. {selEvent.anchor.pg}</p>}
                <div className="row" style={{ gap: 8 }}>
                  {selEvent.anchor && <Link className="btn sm" to={readLink(selEvent.anchor)}><Icon name="book" size={14} /> Read in the book</Link>}
                  {selPlaces.length > 0 && <Link className="btn ghost sm" to={`/map?event=${selEvent.id}`}><Icon name="map" size={14} /> Open map</Link>}
                </div>
                {selPlaces.length > 0 && (
                  <div className="mini-map" style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)" }}>
                    <MiniMap points={selPlaces.map((p, i) => ({ dy: i % 2 ? 14 : 0, lat: p.lat, lon: p.lon, label: p.name.replace(/ \(.*\)/, ""), color: C[selEvent.cat].color }))} linkTo={`/map?event=${selEvent.id}`} />
                  </div>
                )}
                <div className="tl-pager">
                  <button className="btn ghost sm" disabled={idx <= 0} onClick={() => select(visible[idx - 1].id)}><Icon name="back" size={14} /> Earlier</button>
                  <button className="btn ghost sm" disabled={idx >= visible.length - 1} onClick={() => select(visible[idx + 1].id)}>Later <Icon name="arrow" size={14} /></button>
                </div>
              </div>
            ) : (
              <div className="card">
                <h4 className="panel-title">How to use</h4>
                <p className="small" style={{ marginTop: 0 }}>Choose an event to read the original passage here, see where it happened, and jump into the book or the interactive map.</p>
                <MiniMap zones={atlas.movementMap.zones} points={[]} linkTo="/map" />
                <p className="tiny muted">Shaded: the movement's strong base (red) and its expansion after 1948 (ochre), traced from the book's map.</p>
                <button className="btn sm" onClick={() => select(events[0].id)}>Start from the beginning <Icon name="arrow" size={14} /></button>
              </div>
            )}
            <EventQuiz atlas={atlas} />
          </aside>
        </div>
      </div>
    </>
  );
}
