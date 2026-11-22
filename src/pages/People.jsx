import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loading, PageHead } from "../components/Layout";
import PeopleQuiz from "../components/PeopleQuiz";
import { initials, Spark } from "../components/Viz";
import { readLink, useAtlas } from "../lib/data";

const SIDES = [
  ["people", "People of the struggle", "Sangham leaders, guerrillas, women fighters and the chronicler", "var(--red)"],
  ["oppressor", "Landlords & Razakars", "The deshmukhs and the militia they fought against", "#5b4636"],
  ["state", "The state", "The Nizam, and the Union government that sent in the army", "var(--violet)"],
];

export default function People() {
  const { data: atlas } = useAtlas();
  const [q, setQ] = useState("");
  const { hash } = useLocation();
  useEffect(() => {
    if (!atlas || !hash) return;
    setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }, [atlas, hash]);
  if (!atlas) return <Loading />;
  const ql = q.toLowerCase();
  const sketches = atlas.sketches.filter((s) => !ql || `${s.name} ${s.area} ${s.text}`.toLowerCase().includes(ql));
  const areas = [...new Set(sketches.map((s) => s.area))];

  return (
    <>
      <PageHead eyebrow="Who's who" title="People of the Struggle">
        The key figures who appear in the book, with how often each is mentioned chapter by chapter, followed by the book's
        {" "}{atlas.sketches.length} biographical sketches of fallen squad and Party leaders.
      </PageHead>
      <div className="wrap">
        {SIDES.map(([side, title, sub, color]) => (
          <section key={side} style={{ marginBottom: 40 }}>
            <div className="section-title"><div><h2>{title}</h2><p>{sub}</p></div></div>
            <div className="grid g3">
              {atlas.people.filter((p) => p.side === side).sort((a, b) => b.total - a.total).map((p) => (
                <div key={p.id} id={p.id} className="card person" style={{ "--c": color, scrollMarginTop: 90 }}>
                  <span className="avatar">{initials(p.name)}</span>
                  <div>
                    <h3>{p.name}</h3>
                    <div className="tiny muted">{p.total} mentions across {Object.keys(p.chapters).length} chapters</div>
                    <p>{p.bio}</p>
                    <Spark counts={p.chapters} toc={atlas.toc} color={color} />
                    <div className="row" style={{ marginTop: 10, gap: 6 }}>
                      {p.anchor && <Link className="tag" to={readLink(p.anchor, p.aliases[0])}>First mention · p. {p.anchor.pg}</Link>}
                      <Link className="tag" to={`/search?q=${encodeURIComponent(p.aliases[0])}`}>All mentions</Link>
                      {p.place && <Link className="tag place" to={`/map?place=${p.place}`}>{atlas.placeById[p.place]?.name.replace(/ \(.*\)/, "")}</Link>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section id="sketches">
          <div className="section-title">
            <div><div className="eyebrow">Part I Ch. III · Part II Ch. X</div><h2>Sketches of fallen comrades</h2><p>The book's portraits of squad and Party leaders who laid down their lives.</p></div>
            <span className="spacer" />
            <input className="input" style={{ maxWidth: 300 }} placeholder="Filter sketches…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {areas.map((a) => (
            <div key={a} style={{ marginBottom: 28 }}>
              <h4 className="panel-title">{a || "Sketches"}</h4>
              <div className="grid g3">
                {sketches.filter((s) => s.area === a).map((s) => (
                  <Link key={s.ch + s.b} to={readLink({ ch: s.ch, b: s.b })} className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <h3 style={{ fontSize: 18 }}>{s.name.replace(/^Comrades? /, "")}</h3>
                    <p className="small" style={{ margin: 0, color: "var(--ink-2)", fontFamily: "var(--serif)", fontSize: 15, lineHeight: 1.55 }}>{s.text.slice(0, 220)}{s.text.length > 220 ? "…" : ""}</p>
                    <span className="tiny muted" style={{ marginTop: "auto" }}>p. {s.pg} · read the sketch →</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="section tight" id="quiz">
          <div className="section-title">
            <div><div className="eyebrow">Quiz</div><h2>Name the fighters</h2><p>Name the key people of the struggle. Each shows a figure from the book — you pick the name.</p></div>
          </div>
          <PeopleQuiz atlas={atlas} />
        </section>
      </div>
    </>
  );
}
