import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "../components/Icons";
import { Loading, PageHead } from "../components/Layout";
import { readLink, useAtlas, useBook } from "../lib/data";
import { highlight, snippet } from "../lib/text";

const SUGGEST = ["Ailamma", "gram raj", "vetti", "Koya", "Razakar", "concentration camp", "women", "Nallamala", "land distribution", "Doddi Komarayya"];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const ch = params.get("ch") || "";
  const tab = params.get("tab") || "text";
  const [input, setInput] = useState(q);
  const [limit, setLimit] = useState(60);
  const { data: book } = useBook();
  const { data: atlas } = useAtlas();
  const [itype, setItype] = useState("all");
  useEffect(() => setInput(q), [q]);

  const results = useMemo(() => {
    if (!book || q.trim().length < 2) return [];
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const phrase = q.toLowerCase();
    const out = [];
    for (const c of book.chapters) {
      for (const b of c.blocks) {
        const t = b.x.toLowerCase();
        if (t.includes(phrase) || terms.every((w) => t.includes(w))) out.push({ c, b, exact: t.includes(phrase) });
      }
    }
    return out.sort((a, b) => (b.exact - a.exact));
  }, [book, q]);

  const byCh = useMemo(() => {
    const m = {};
    results.forEach((r) => (m[r.c.id] = (m[r.c.id] || 0) + 1));
    return m;
  }, [results]);

  const set = (patch) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    setParams(n);
    setLimit(60);
  };
  const shown = results.filter((r) => !ch || r.c.id === ch);
  const hiTerm = q.trim().split(/\s+/).length > 1 && !results.some((r) => r.exact) ? q.trim().split(/\s+/)[0] : q.trim();
  const relatedPlace = atlas?.places.find((p) => p.aliases.some((a) => a.toLowerCase() === q.trim().toLowerCase()));
  const relatedPerson = atlas?.people.find((p) => p.aliases.some((a) => a.toLowerCase() === q.trim().toLowerCase()));
  const relatedGloss = atlas?.glossary.find((g) => g.term.toLowerCase().startsWith(q.trim().toLowerCase()) && q.trim().length > 2);

  return (
    <>
      <PageHead eyebrow="Search" title="Search the book" />
      <div className="wrap">
        <form className="search-hero" onSubmit={(e) => { e.preventDefault(); set({ q: input.trim(), ch: null, tab: "text" }); }}>
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="A name, village, event, phrase…" autoFocus aria-label="Search query" />
          <button className="btn" type="submit" style={{ height: 52, borderRadius: 14 }}><Icon name="search" /> Search</button>
        </form>
        <div className="row" style={{ marginBottom: 18 }}>
          <div className="seg">
            <button className={tab === "text" ? "on" : ""} onClick={() => set({ tab: null })}>Full text</button>
            <button className={tab === "index" ? "on" : ""} onClick={() => set({ tab: "index" })}>Names index</button>
          </div>
          {!q && tab === "text" && <><span className="small muted">Try:</span>{SUGGEST.map((s) => <button key={s} className="chip" onClick={() => set({ q: s })}>{s}</button>)}</>}
        </div>

        {tab === "index" ? (
          atlas ? (
            <>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="seg">
                  {[["all", "All"], ["person", "People"], ["place", "Places"], ["other", "Other"]].map(([k, l]) => <button key={k} className={itype === k ? "on" : ""} onClick={() => setItype(k)}>{l}</button>)}
                </div>
                <span className="small muted">Names found in the text, by frequency. Linked ones open on the map or the people page.</span>
              </div>
              <div className="grid g4">
                {atlas.index.filter((n) => itype === "all" || n.type === itype).map((n) => (
                  <div key={n.name} className="card" style={{ padding: 14 }}>
                    <div className="row" style={{ gap: 6 }}>
                      <Link to={`/search?q=${encodeURIComponent(n.name)}`} style={{ fontWeight: 600 }}>{n.name}</Link>
                      <span className="spacer" />
                      <span className="tiny muted">{n.total}×</span>
                    </div>
                    <div className="row" style={{ gap: 6, marginTop: 6 }}>
                      <span className="tag">{n.type}</span>
                      {n.link && n.type === "place" && <Link className="tag place" to={`/map?place=${n.link}`}>map</Link>}
                      {n.link && n.type === "person" && <Link className="tag" to={`/people#${n.link}`}>profile</Link>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : <Loading />
        ) : !book ? <Loading label="Loading the full text…" /> : (
          <div className="facets">
            <aside>
              {q && (
                <div className="card" style={{ padding: 14 }}>
                  <h4 className="panel-title">{results.length} passages</h4>
                  <button className={`chip ${!ch ? "on" : ""}`} style={{ width: "100%", justifyContent: "space-between", marginBottom: 6 }} onClick={() => set({ ch: null })}>All chapters <span className="count">{results.length}</span></button>
                  {book.chapters.filter((c) => byCh[c.id]).map((c) => (
                    <button key={c.id} className={`chip ${ch === c.id ? "on" : ""}`} style={{ width: "100%", justifyContent: "space-between", marginBottom: 6, height: "auto", minHeight: 30, whiteSpace: "normal", textAlign: "left", padding: "4px 12px" }} onClick={() => set({ ch: c.id })}>
                      <span>{c.short}</span><span className="count">{byCh[c.id]}</span>
                    </button>
                  ))}
                </div>
              )}
              {(relatedPlace || relatedPerson || relatedGloss) && (
                <div className="card" style={{ padding: 14, marginTop: 12 }}>
                  <h4 className="panel-title">Related</h4>
                  {relatedPlace && <p className="small" style={{ margin: "0 0 8px" }}><Link to={`/map?place=${relatedPlace.id}`}><Icon name="pin" size={13} /> {relatedPlace.name} on the map</Link></p>}
                  {relatedPerson && <p className="small" style={{ margin: "0 0 8px" }}><Link to={`/people#${relatedPerson.id}`}><Icon name="users" size={13} /> {relatedPerson.name}</Link></p>}
                  {relatedGloss && <p className="small" style={{ margin: 0 }}><Link to={`/glossary#${relatedGloss.id}`}><Icon name="glossary" size={13} /> {relatedGloss.term}</Link>: {relatedGloss.def}</p>}
                </div>
              )}
            </aside>
            <div>
              {q && results.length === 0 && <p className="muted">No passages match “{q}”. Try another spelling. The book often varies, e.g. Illendu/Yellandu, Bhongir/Bhuvanagiri.</p>}
              {shown.slice(0, limit).map(({ c, b }) => (
                <div className="result" key={c.id + b.id}>
                  <div className="result-head">
                    <Link to={readLink({ ch: c.id, b: b.id }, hiTerm)} style={{ fontWeight: 600 }}>{c.short}</Link>
                    <span className="tag page">p. {b.pg}</span>
                    {c.num && <span className="tiny muted">{c.num}</span>}
                  </div>
                  <div className="ctx">{highlight(snippet(b.x, hiTerm, 340), hiTerm)}</div>
                </div>
              ))}
              {shown.length > limit && <div style={{ textAlign: "center", marginTop: 16 }}><button className="btn ghost" onClick={() => setLimit((l) => l + 60)}>Show more ({shown.length - limit} remaining)</button></div>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
