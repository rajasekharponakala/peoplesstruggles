import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Icon from "../components/Icons";
import { Loading } from "../components/Layout";
import { fmtNum, pdfPage, useAtlas, useBook } from "../lib/data";
import { makeLinker, renderRich } from "../lib/text";
import { MartyrsInline } from "./Martyrs";

function readPrefs() {
  try { return JSON.parse(localStorage.getItem("reader") || "{}"); } catch { return {}; }
}

function useReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(100, (100 * h.scrollTop) / max) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return p;
}

export default function Reader() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const target = params.get("b");
  const q = params.get("q") || "";
  const nav = useNavigate();
  const { data: book, error } = useBook();
  const { data: atlas } = useAtlas();
  const [prefs, setPrefs] = useState(() => ({ size: 19, font: "serif", ...readPrefs() }));
  const [showSettings, setShowSettings] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [copied, setCopied] = useState(null);
  const progress = useReadingProgress();
  const articleRef = useRef(null);
  const linker = useMemo(() => makeLinker(atlas), [atlas]);

  useEffect(() => {
    try { localStorage.setItem("reader", JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs]);

  const ch = book?.byId[id];

  // scroll to target paragraph
  useEffect(() => {
    if (!ch) return;
    if (!target) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`b-${target}`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        el.classList.add("target");
        setTimeout(() => el.classList.remove("target"), 3200);
      }
    }, 60);
    return () => clearTimeout(t);
  }, [ch, target, atlas]);

  // scrollspy over headings
  useEffect(() => {
    if (!ch || !articleRef.current) return;
    const hs = [...articleRef.current.querySelectorAll("[data-sec]")];
    if (!hs.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.dataset.sec);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    hs.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [ch, atlas]);

  if (error) return <div className="wrap loading">Could not load the book.</div>;
  if (!book) return <Loading label="Opening the book…" />;
  if (!ch) return <div className="wrap section"><h1>Chapter not found</h1><Link to="/read">Back to contents</Link></div>;

  const prev = book.chapters[ch.index - 1];
  const next = book.chapters[ch.index + 1];
  const seenGloss = new Set();
  const firstP = ch.blocks.findIndex((b) => b.t === "p");
  const sketchSet = new Set(ch.sections.filter((s) => s.sub).map((s) => s.id));

  const events = atlas ? atlas.events.filter((e) => e.anchor?.ch === id) : [];
  const figures = atlas ? atlas.figures.filter((f) => f.anchor?.ch === id) : [];
  const places = atlas ? atlas.places.filter((p) => p.chapters[id]).sort((a, b) => b.chapters[id] - a.chapters[id]).slice(0, 10) : [];
  const people = atlas ? atlas.people.filter((p) => p.chapters[id]).sort((a, b) => b.chapters[id] - a.chapters[id]).slice(0, 8) : [];

  const copyLink = (bid) => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/read/${id}?b=${bid}`;
    navigator.clipboard?.writeText(url).then(() => { setCopied(bid); setTimeout(() => setCopied(null), 1500); }, () => {});
  };
  const goSection = (e, sid) => {
    e.preventDefault();
    setTocOpen(false);
    document.getElementById(`b-${sid}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `?b=${sid}`);
  };

  const rail = (
    <>
      {events.length > 0 && (
        <div className="rail-box">
          <h4 className="panel-title">On the timeline</h4>
          <ul className="rail-list">
            {events.map((e) => (
              <li key={e.id}><Link to={`/timeline?event=${e.id}`}><span className="d">{e.label}</span><span>{e.title}</span></Link></li>
            ))}
          </ul>
        </div>
      )}
      {places.length > 0 && (
        <div className="rail-box">
          <h4 className="panel-title">Places in this chapter</h4>
          <div className="chips">
            {places.map((p) => <Link key={p.id} className="tag place" to={`/map?place=${p.id}`}>{p.name.replace(/ \(.*\)/, "")} <span style={{ opacity: .6 }}>{p.chapters[id]}</span></Link>)}
          </div>
          <Link to={`/map?chapter=${id}`} className="btn ghost sm" style={{ marginTop: 12 }}><Icon name="map" size={15} /> Map this chapter</Link>
        </div>
      )}
      {people.length > 0 && (
        <div className="rail-box">
          <h4 className="panel-title">People mentioned</h4>
          <ul className="rail-list">
            {people.map((p) => <li key={p.id}><Link to={`/people#${p.id}`}><span className="d">{p.chapters[id]}×</span><span>{p.name}</span></Link></li>)}
          </ul>
        </div>
      )}
      {figures.length > 0 && (
        <div className="rail-box">
          <h4 className="panel-title">Key figures quoted here</h4>
          <ul className="rail-list">
            {figures.map((f) => <li key={f.id}><a href={`#b-${f.anchor.b}`} onClick={(e) => goSection(e, f.anchor.b)}><span className="d" style={{ color: "var(--red)" }}>{f.display}</span><span>{f.unit}: {f.label}</span></a></li>)}
          </ul>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="reader">
        <aside className={`reader-toc ${tocOpen ? "open" : ""}`} aria-label="Contents">
          <div className="toc-chapters">
            <label className="panel-title" htmlFor="chsel">Chapter</label>
            <select id="chsel" className="input" value={id} onChange={(e) => nav(`/read/${e.target.value}`)}>
              {[...new Set(book.chapters.map((c) => c.partTitle))].map((pt) => (
                <optgroup key={pt} label={pt}>
                  {book.chapters.filter((c) => c.partTitle === pt).map((c) => <option key={c.id} value={c.id}>{c.num ? `${c.num} · ` : ""}{c.short}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {ch.sections.length > 0 && (
            <>
              <h4 className="panel-title">In this chapter</h4>
              <ul className="toc-list">
                {ch.sections.map((s) => (
                  <li key={s.id}><a href={`#b-${s.id}`} onClick={(e) => goSection(e, s.id)} className={`${active === s.id ? "on" : ""} ${s.sub ? "sub" : ""}`}>{s.title}</a></li>
                ))}
              </ul>
            </>
          )}
          {tocOpen && <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => setTocOpen(false)}>Close</button>}
        </aside>

        <article className="article" ref={articleRef}>
          <header className="article-head">
            <span className="eyebrow">{ch.partTitle}{ch.num ? ` · ${ch.num}` : ""}</span>
            <h1>{ch.short}</h1>
            <div className="chap-meta">
              <span>pp. {ch.pages[0]}–{ch.pages[1]}</span><span>{fmtNum(ch.words)} words</span><span>{ch.mins} min read</span>
              {ch.sections.length > 0 && <span>{ch.sections.length} sections</span>}
            </div>
            <div className="article-tools">
              <button className="btn ghost sm mobile-toc-btn" onClick={() => setTocOpen(true)}><Icon name="list" size={15} /> Sections</button>
              <div style={{ position: "relative" }}>
                <button className="btn ghost sm" onClick={() => setShowSettings((s) => !s)} aria-expanded={showSettings}><Icon name="type" size={15} /> Text</button>
                {showSettings && (
                  <div className="settings-pop" role="dialog" aria-label="Reading settings">
                    <div>
                      <label>Text size</label>
                      <div className="seg">
                        {[16, 18, 19, 21, 23].map((s) => <button key={s} className={prefs.size === s ? "on" : ""} onClick={() => setPrefs({ ...prefs, size: s })} style={{ fontSize: s - 4 }}>A</button>)}
                      </div>
                    </div>
                    <div>
                      <label>Typeface</label>
                      <div className="seg">
                        <button className={prefs.font === "serif" ? "on" : ""} onClick={() => setPrefs({ ...prefs, font: "serif" })} style={{ fontFamily: "var(--serif)" }}>Serif</button>
                        <button className={prefs.font === "sans" ? "on" : ""} onClick={() => setPrefs({ ...prefs, font: "sans" })}>Sans</button>
                      </div>
                    </div>
                    <p className="tiny muted" style={{ margin: 0 }}>Underlined place names open the map. Dotted terms explain themselves on hover.</p>
                  </div>
                )}
              </div>
              {pdfPage(ch.pages[0]) && <a className="btn ghost sm" href={pdfPage(ch.pages[0])} target="_blank" rel="noreferrer"><Icon name="ext" size={15} /> Original PDF</a>}
              {q && <span className="tag" style={{ background: "var(--mark)" }}>Highlighting “{q}” <Link to={`/read/${id}`} aria-label="Clear highlight">✕</Link></span>}
            </div>
          </header>

          {id === "app1" ? (
            <MartyrsInline />
          ) : (
            <div className={`prose ${prefs.font === "sans" ? "sans" : ""}`} style={{ "--reader-size": `${prefs.size}px` }}>
              {ch.blocks.map((b, i) => {
                const notes = atlas?.anchors[`${id}#${b.id}`];
                const pg = (b.pg && (i === 0 || ch.blocks[i - 1].pg !== b.pg)) ? b.pg : null;
                if (b.t === "h") {
                  return <h2 key={b.id} id={`b-${b.id}`} data-sec={b.id} className="blk">{b.x}</h2>;
                }
                const sketch = sketchSet.has(b.id);
                let body = b.x;
                let lead = null;
                if (sketch) {
                  const m = b.x.match(/^(Comrades? [^:]{3,60}):\s/);
                  lead = <span className="sketch-name">{m[1]}: </span>;
                  body = b.x.slice(m[0].length);
                }
                return (
                  <div key={b.id} id={`b-${b.id}`} data-sec={sketch ? b.id : undefined} className={`blk ${b.t} ${i === firstP ? "lead" : ""}`}>
                    {pg && <span className="pg">{pdfPage(pg) ? <a href={pdfPage(pg)} target="_blank" rel="noreferrer" title="Open this page of the original PDF">p. {pg}</a> : `p. ${pg}`}</span>}
                    {notes && (
                      <div className="margin-notes">
                        {notes.map((n) => n.kind === "event" ? (
                          <Link key={n.item.id} className="mnote" to={`/timeline?event=${n.item.id}`}><Icon name="clock" size={13} /> {n.item.label} · on the timeline</Link>
                        ) : (
                          <Link key={n.item.id} className="mnote fig" to="/insights"><Icon name="chart" size={13} /> {n.item.display} {n.item.unit}</Link>
                        ))}
                        {notes.filter((n) => n.kind === "event" && n.item.places.length).slice(0, 1).map((n) => (
                          <Link key="map" className="mnote" to={`/map?event=${n.item.id}`}><Icon name="pin" size={13} /> on the map</Link>
                        ))}
                      </div>
                    )}
                    {lead}{renderRich(body, linker, q, seenGloss)}
                    <span className="blk-tools"><button onClick={() => copyLink(b.id)} title="Copy link to this paragraph" aria-label="Copy link to this paragraph"><Icon name={copied === b.id ? "info" : "link"} size={15} /></button></span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="reader-rail inline" style={{ marginTop: 40 }}>{atlas ? rail : null}</div>

          <nav className="chapter-nav" aria-label="Chapter navigation">
            {prev ? <Link to={`/read/${prev.id}`}><small>← Previous</small><b>{prev.short}</b></Link> : <span />}
            {next ? <Link to={`/read/${next.id}`} className="next"><small>Next →</small><b>{next.short}</b></Link> : <span />}
          </nav>
        </article>

        <aside className="reader-rail" aria-label="Chapter context">{atlas ? rail : null}</aside>
      </div>
    </>
  );
}
