import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loading, PageHead } from "../components/Layout";
import { readLink, useAtlas, useBook } from "../lib/data";

const THEMES = [
  { id: "torture", label: "Torture", color: "#4a4a4a", re: /tortur|beaten|beat him|beat them|flogg|chilli powder|lathi blows|hung (him|them) upside/i },
  { id: "women", label: "Violence against women", color: "#b0306a", re: /\brap(e|ed|ing)\b|molest|stripped|dishonour/i },
  { id: "killing", label: "Killings", color: "#b3261e", re: /shot dead|butcher|burnt alive|buried alive|hacked|speared|massacre|killed them/i },
  { id: "burning", label: "Burning & looting", color: "#c07a12", re: /burnt (the |down )?(village|house|hut)|set fire|loot|burning of villages|houses (were )?burnt/i },
  { id: "camps", label: "Camps & jails", color: "#1f6f8b", re: /concentration camp|detention camp|cholera|in (the )?jail|prisoners/i },
  { id: "resist", label: "Resistance & courage", color: "#2e7d32", re: /refused to (betray|reveal|give)|did not yield|fought back|drove (them|the goondas) away|would not (betray|reveal)|heroic(ally)? (fight|resist)/i },
];

export default function Witness() {
  const { data: book } = useBook();
  const { data: atlas } = useAtlas();
  const [params, setParams] = useSearchParams();
  const theme = params.get("t") || "torture";
  const [limit, setLimit] = useState(40);

  const all = useMemo(() => {
    if (!book) return [];
    const out = [];
    for (const c of book.chapters) {
      if (c.id === "app1") continue;
      for (const b of c.blocks) {
        if (b.t === "h" || b.x.length < 120) continue;
        const tags = THEMES.filter((t) => t.re.test(b.x)).map((t) => t.id);
        if (tags.length) out.push({ c, b, tags });
      }
    }
    return out;
  }, [book]);

  if (!book || !atlas) return <Loading />;
  const T = THEMES.find((t) => t.id === theme) || THEMES[0];
  const items = all.filter((x) => x.tags.includes(T.id));

  return (
    <>
      <PageHead eyebrow="Testimony" title="Witness: what the people endured">
        Passages from Sundarayya's account that record the terror under the Nizam, the Razakars and the military regime after 1948, and the courage with which it was met.
      </PageHead>
      <div className="wrap">
        <div className="callout" style={{ marginBottom: 20 }}>
          <b>Content note:</b> these passages describe torture, sexual violence and killings in plain words. They are quoted
          verbatim from the book, and each one links back to its full context.
        </div>
        <div className="chips" style={{ marginBottom: 20 }}>
          {THEMES.map((t) => (
            <button key={t.id} className={`chip ${theme === t.id ? "on" : ""}`} onClick={() => { setParams({ t: t.id }, { replace: true }); setLimit(40); }}>
              <span className="dot" style={{ background: t.color }} /> {t.label} <span className="count">{all.filter((x) => x.tags.includes(t.id)).length}</span>
            </button>
          ))}
        </div>
        <div className="masonry">
          {items.slice(0, limit).map(({ c, b, tags }) => (
            <article key={c.id + b.id} className="card testimony" style={{ borderLeft: `3px solid ${T.color}` }}>
              <blockquote>{b.x.length > 900 ? b.x.slice(0, 900) + "…" : b.x}</blockquote>
              <footer>
                <Link to={readLink({ ch: c.id, b: b.id })}>{c.short} · p. {b.pg} →</Link>
                <span className="spacer" />
                {tags.filter((t) => t !== T.id).map((t) => {
                  const o = THEMES.find((x) => x.id === t);
                  return <button key={t} className="tag" style={{ border: 0, cursor: "pointer", color: o.color }} onClick={() => setParams({ t }, { replace: true })}>{o.label}</button>;
                })}
              </footer>
            </article>
          ))}
        </div>
        {items.length > limit && <div style={{ textAlign: "center", marginTop: 12 }}><button className="btn ghost" onClick={() => setLimit((l) => l + 40)}>Show more ({items.length - limit} remaining)</button></div>}
      </div>
    </>
  );
}
