import { Link } from "react-router-dom";
import { Loading, PageHead } from "../components/Layout";
import { fmtNum, useAtlas } from "../lib/data";

export default function Library() {
  const { data: atlas } = useAtlas();
  if (!atlas) return <Loading />;
  const toc = atlas.toc;
  const parts = [...new Set(toc.map((c) => c.part))];
  const totalWords = toc.reduce((a, c) => a + c.words, 0);
  const maxWords = Math.max(...toc.map((c) => c.words));
  const eventsBy = {};
  atlas.events.forEach((e) => e.anchor && (eventsBy[e.anchor.ch] = (eventsBy[e.anchor.ch] || 0) + 1));

  return (
    <>
      <PageHead eyebrow="The book" title="Read Telangana People's Struggle and Its Lessons">
        The full text: {fmtNum(totalWords)} words in {toc.length} chapters and appendices, about {Math.round(totalWords / 230 / 60)} hours of reading.
        The coloured bar under each chapter shows what it is mostly about.
      </PageHead>
      <div className="wrap">
        <div className="card" style={{ marginBottom: 32 }}>
          <h4 className="panel-title">Chapter lengths, and the themes each one dwells on</h4>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90 }}>
            {toc.map((c) => (
              <Link key={c.id} to={`/read/${c.id}`} title={`${c.title} — ${fmtNum(c.words)} words`}
                style={{ flex: 1, height: `${(100 * c.words) / maxWords}%`, background: c.part === "Part I" ? "var(--red)" : c.part === "Part II" ? "var(--teal)" : c.part === "Part III" ? "var(--ochre)" : "var(--line-2)", borderRadius: "3px 3px 0 0", minWidth: 6 }} />
            ))}
          </div>
          <div className="row tiny muted" style={{ marginTop: 10, gap: 16 }}>
            <span><i className="dot" style={{ background: "var(--line-2)" }} /> Front matter</span>
            <span><i className="dot" style={{ background: "var(--red)" }} /> Part I · against the Nizam</span>
            <span><i className="dot" style={{ background: "var(--teal)" }} /> Part II · against the Indian Army</span>
            <span><i className="dot" style={{ background: "var(--ochre)" }} /> Part III · appendices</span>
            <span className="spacer" />
            {atlas.themes.map((t) => <span key={t.id}><i className="dot" style={{ background: t.color }} /> {t.label}</span>)}
          </div>
        </div>

        {parts.map((p) => {
          const chs = toc.filter((c) => c.part === p);
          return (
            <section className="part-block" key={p}>
              <div className="part-head">
                <h2>{chs[0].partTitle}</h2>
                <span className="muted small">{chs.length} chapters · {fmtNum(chs.reduce((a, c) => a + c.words, 0))} words</span>
              </div>
              <div className="grid g2">
                {chs.map((c) => {
                  const shares = atlas.themes.map((t) => ({ t, v: t.per[c.id] || 0 }));
                  const sum = shares.reduce((a, s) => a + s.v, 0) || 1;
                  const n = c.num ? c.num.split(" ")[1] : "·";
                  return (
                    <Link key={c.id} to={`/read/${c.id}`} className="card chap-card">
                      <span className="chap-num">{n}</span>
                      <div>
                        <div className="eyebrow" style={{ fontSize: 11 }}>{c.num || "Front matter"}</div>
                        <h3>{c.short}</h3>
                        <div className="chap-meta">
                          <span>pp. {c.pages[0]}–{c.pages[1]}</span><span>{fmtNum(c.words)} words</span><span>{c.mins} min read</span>
                          {eventsBy[c.id] ? <span>· {eventsBy[c.id]} timeline events</span> : null}
                        </div>
                        {c.sections.length > 0 && <p className="chap-sections">{c.sections.filter((s) => !s.sub).map((s) => s.title).join(" · ") || c.sections.slice(0, 8).map((s) => s.title).join(" · ")}</p>}
                        <div className="theme-bar" title="Theme mix">
                          {shares.map(({ t, v }) => <span key={t.id} title={`${t.label}: ${Math.round((100 * v) / sum)}%`} style={{ width: `${(100 * v) / sum}%`, background: t.color }} />)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
