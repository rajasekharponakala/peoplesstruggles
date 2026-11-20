import { useState } from "react";
import { Link } from "react-router-dom";
import { Loading, PageHead } from "../components/Layout";
import { readLink, useAtlas } from "../lib/data";

export default function Glossary() {
  const { data: atlas } = useAtlas();
  const [q, setQ] = useState("");
  if (!atlas) return <Loading />;
  const items = [...atlas.glossary].sort((a, b) => a.term.localeCompare(b.term)).filter((g) => !q || `${g.term} ${g.def}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead eyebrow="Words of the struggle" title="Glossary">
        The book uses many Telugu, Urdu and administrative terms of Nizam-era Hyderabad. In the reader, each is underlined with dots the first time it appears in a chapter. Hover over it for the meaning.
      </PageHead>
      <div className="wrap narrow">
        <input className="input" placeholder="Filter terms…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 10 }} />
        <dl className="gloss">
          {items.map((g) => (
            <div key={g.id} id={g.id}>
              <dt>{g.term}<div className="tiny muted" style={{ fontFamily: "var(--sans)", fontWeight: 500, marginTop: 4 }}>{g.count} uses in the book</div></dt>
              <dd>
                {g.def}
                <div className="row" style={{ marginTop: 8, gap: 6 }}>
                  {g.anchor && <Link className="tag" to={readLink(g.anchor, g.term.split(/[ /]/)[0])}>First use · p. {g.anchor.pg}</Link>}
                  <Link className="tag" to={`/search?q=${encodeURIComponent(g.term.split(/[ /]/)[0])}`}>All uses</Link>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
