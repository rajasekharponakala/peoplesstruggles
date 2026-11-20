import { useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Loading, PageHead } from "../components/Layout";
import { FigureCard, HBars, ThemeHeatmap, YearBars } from "../components/Viz";
import { PDF_URL, readLink, useAtlas, useBook } from "../lib/data";
import { snippet } from "../lib/text";

export default function Insights() {
  const { data: atlas } = useAtlas();
  const { data: book } = useBook();
  const [params, setParams] = useSearchParams();
  const year = +params.get("year") || null;
  const { hash } = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    if (atlas && hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [atlas, hash]);
  if (!atlas) return <Loading />;
  const yr = year ? atlas.years.find((y) => y.y === year) : null;
  const toc = atlas.tocById;

  return (
    <>
      <PageHead eyebrow="Data from the text" title="Insights">
        The book read as data: the numbers it reports, the themes each chapter dwells on, the years it keeps returning to,
        and the places and people it names most. Click any element to go to the passages behind it.
      </PageHead>
      <div className="wrap">
        <section className="section tight">
          <div className="section-title"><div><h2>Figures quoted in the book</h2><p>Gains in green, losses in red, context in ochre. Each links to its passage.</p></div></div>
          <div className="grid g4">{atlas.figures.map((f) => <FigureCard key={f.id} f={f} toc={toc} />)}</div>
        </section>

        <section className="section tight" id="years">
          <div className="section-title"><div><h2>Which years does the book talk about?</h2><p>Passages mentioning each year. Click a bar to list them.</p></div></div>
          <div className="card">
            <YearBars data={atlas.years} selected={year} onSelect={(y) => setParams({ year: y }, { replace: true })} />
            {yr && (
              <div style={{ marginTop: 18 }}>
                <div className="row">
                  <h3 style={{ fontSize: 22 }}>{yr.y}</h3>
                  <span className="muted small">{yr.n} passages · most in {Object.entries(yr.chapters).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => toc[c].short).join(", ")}</span>
                  <span className="spacer" />
                  {atlas.events.some((e) => Math.floor(e.t) === yr.y) && <Link className="btn ghost sm" to={`/timeline?event=${atlas.events.find((e) => Math.floor(e.t) === yr.y).id}`}>Events of {yr.y} on the timeline</Link>}
                  <button className="chip" onClick={() => setParams({}, { replace: true })}>Clear</button>
                </div>
                <div className="grid g2" style={{ marginTop: 10 }}>
                  {book && yr.refs.slice(0, 12).map(([c, b]) => {
                    const t = book.byId[c]?.blocks.find((x) => x.id === b)?.x || "";
                    return <Link key={c + b} className="snip" to={readLink({ ch: c, b }, String(yr.y))}><small>{toc[c].short}</small>{snippet(t, String(yr.y), 240)}</Link>;
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="section tight" id="themes">
          <div className="section-title"><div><h2>Themes across the chapters</h2><p>Keyword density per 1,000 words, scaled within each theme. Darker cells mean that chapter dwells on that theme more.</p></div></div>
          <div className="card"><ThemeHeatmap themes={atlas.themes} toc={atlas.toc} /></div>
        </section>

        <section className="section tight">
          <div className="grid g2">
            <div className="card">
              <h3 style={{ fontSize: 20, marginBottom: 12 }}>Most-named places</h3>
              <HBars items={[...atlas.places].sort((a, b) => b.total - a.total).slice(0, 15).map((p) => ({ label: p.name, value: p.total, to: `/map?place=${p.id}`, color: "var(--teal)" }))} />
            </div>
            <div className="card">
              <h3 style={{ fontSize: 20, marginBottom: 12 }}>Most-named people</h3>
              <HBars items={[...atlas.people].sort((a, b) => b.total - a.total).slice(0, 15).map((p) => ({ label: p.name, value: p.total, to: `/people#${p.id}`, color: p.side === "people" ? "var(--red)" : p.side === "state" ? "var(--violet)" : "#5b4636" }))} />
            </div>
          </div>
        </section>

        <section className="section tight">
          <div className="section-title"><div><h2>Timeline events by era and kind</h2></div></div>
          <div className="card">
            {atlas.eras.map((e) => {
              const evs = atlas.events.filter((x) => x.era === e.id);
              return (
                <div key={e.id} className="row" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)", flexWrap: "nowrap" }}>
                  <button className="chip" style={{ minWidth: 220, justifyContent: "flex-start" }} onClick={() => nav(`/timeline?era=${e.id}`)}><span className="dot" style={{ background: e.color }} /> {e.title}</button>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {evs.map((x) => <Link key={x.id} to={`/timeline?event=${x.id}`} title={`${x.label}: ${x.title}`} style={{ width: 18, height: 18, borderRadius: 5, background: atlas.categories[x.cat].color, display: "inline-block" }} />)}
                  </div>
                </div>
              );
            })}
            <div className="row tiny muted" style={{ marginTop: 10 }}>
              {Object.values(atlas.categories).map((c) => <span key={c.label}><i className="dot" style={{ background: c.color }} /> {c.label}</span>)}
            </div>
          </div>
        </section>

        <section className="section tight" id="method">
          <div className="card pad-lg">
            <h3 style={{ fontSize: 22 }}>How this archive was built</h3>
            <ul style={{ lineHeight: 1.7, color: "var(--ink-2)" }}>
              <li>The text comes from the <a href={PDF_URL} target="_blank" rel="noreferrer">414-page PDF</a> of the 1972 edition. Chapter boundaries, headings and paragraphs broken across pages were repaired, and each paragraph is matched to its PDF page.</li>
              <li>Appendix I (Martyrs) was parsed from the PDF's column layout into {`>`}1,000 structured rows. Ditto marks were expanded and dates were pulled from the remarks.</li>
              <li>The 49 timeline events, 14 figures, 19 key people and the glossary were curated by hand. Each is anchored to an exact sentence in the book, and the build fails if the sentence cannot be found.</li>
              <li>The 1948 movement map from p. 2 was georeferenced with an affine fit on nine towns (residual about 0.05°). Its zones and arrows were traced by hand, so they are approximate.</li>
              <li>Theme scores count keyword families per 1,000 words. They are a reading aid, not a measurement.</li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
