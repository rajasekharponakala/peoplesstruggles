import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icons";
import { Loading } from "../components/Layout";
import MiniMap from "../components/MiniMap";
import { FigureCard, HBars, YearBars } from "../components/Viz";
import { asset, fmtNum, readLink, useAtlas, useMartyrs } from "../lib/data";

const TILES = [
  { to: "/read", icon: "book", title: "Read the book", text: "All 23 chapters and appendices, with section navigation, linked places, page references and reading settings." },
  { to: "/timeline", icon: "clock", title: "Walk the timeline", text: "49 dated events across six eras, from feudal roots to the 1951 withdrawal. Each one links to its passage and its place." },
  { to: "/map", icon: "map", title: "Explore the map", text: "The book's 1948 map, georeferenced. Shows movement zones, 87 places, martyrs by district, and a story mode that plays the events." },
  { to: "/martyrs", icon: "flame", title: "Remember the martyrs", text: "Appendix I as a searchable memorial: 1,000+ entries by district, taluka and year." },
  { to: "/people", icon: "users", title: "People of the struggle", text: "Leaders, fighters and oppressors, plus 66 biographical sketches of fallen comrades." },
  { to: "/insights", icon: "chart", title: "Insights from the text", text: "Themes across chapters, the years the book dwells on, and the key figures, each traced to its source." },
];

export default function Home() {
  const { data: atlas } = useAtlas();
  const { data: martyrs } = useMartyrs();
  const nav = useNavigate();
  if (!atlas) return <Loading />;
  const toc = atlas.tocById;
  const gains = atlas.figures.filter((f) => f.tone === "gain");
  const losses = atlas.figures.filter((f) => f.tone === "loss").slice(0, 4);
  const topPlaces = [...atlas.places].filter((p) => p.district !== "Gulbarga").sort((a, b) => b.total - a.total).slice(0, 10);
  const intro = atlas.figures.find((f) => f.id === "villages");

  return (
    <>
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${asset("maps/movement-map.jpg")})` }} />
        <div className="wrap">
          <div>
          <div className="telugu" lang="te">తెలంగాణ రైతాంగ సాయుధ పోరాటం</div>
          <h1>Telangana People's <em>Struggle</em> and Its Lessons</h1>
          <p className="lede">
            From 1946 to 1951 the peasants of Telangana rose against the Nizam's feudal autocracy. They drove out the landlords,
            set up people's committees in 3,000 villages and gave land to the tiller. Then they held that land against the
            Indian Army. This is P. Sundarayya's 1972 account of the struggle, rebuilt as an archive you can read, map and search.
          </p>
          <div className="cta">
            <Link to="/read/intro" className="btn"><Icon name="book" /> Start reading</Link>
            <Link to="/timeline" className="btn light"><Icon name="clock" /> Walk the timeline</Link>
            <Link to="/map" className="btn light"><Icon name="map" /> Explore the map</Link>
          </div>
          <div className="hero-meta">
            <div><b>{atlas.toc.length}</b>chapters & appendices</div>
            <div><b>414</b>pages, fully searchable</div>
            <div><b>{martyrs ? fmtNum(martyrs.summary.people) : "2,473"}</b>martyrs remembered</div>
          </div>
          </div>
          <Link to="/map" className="hero-map" aria-label="Open the interactive map">
            <MiniMap zones={atlas.movementMap.zones}
              points={["kadavendi", "nalgonda", "warangal", "khammam", "palvancha", "hyderabad", "aleru"].map((id) => atlas.placeById[id]).map((p) => ({ lat: p.lat, lon: p.lon, label: p.name.replace(/ \(.*\)/, "") }))} />
            <div className="cap">
              <span><i className="dot" style={{ background: "#b3261e", opacity: .6 }} /> Original strong base</span>
              <span><i className="dot" style={{ background: "#c07a12", opacity: .5 }} /> Expansion after 1948</span>
              <span style={{ marginLeft: "auto", fontWeight: 600, color: "#b3261e" }}>Explore the map →</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-title">
            <div><div className="eyebrow">What was won</div><h2>Land, dignity and self-rule</h2></div>
            <span className="spacer" />
            <Link to="/insights">All figures →</Link>
          </div>
          <div className="grid g4">{gains.map((f) => <FigureCard key={f.id} f={f} toc={toc} />)}</div>
          <div className="section-title" style={{ marginTop: 40 }}>
            <div><div className="eyebrow">What it cost</div><h2>The price paid by the people</h2></div>
          </div>
          <div className="grid g4">{losses.map((f) => <FigureCard key={f.id} f={f} toc={toc} />)}</div>
          <p className="tiny muted" style={{ marginTop: 12 }}>Every number is quoted from the book. Click one to read it in context.</p>
        </div>
      </section>

      <section className="section" style={{ background: "var(--paper-2)" }}>
        <div className="wrap">
          <div className="section-title">
            <div><div className="eyebrow">The story in six eras</div><h2>How the struggle unfolded</h2></div>
            <span className="spacer" />
            <Link to="/timeline">Open the full timeline →</Link>
          </div>
          <div className="era-strip">
            {atlas.eras.map((e, i) => {
              const n = atlas.events.filter((x) => x.era === e.id).length;
              return (
                <button key={e.id} className="era-cell" style={{ "--era": e.color }} onClick={() => nav(`/timeline?era=${e.id}`)}>
                  <span className="n">0{i + 1}</span>
                  <h3>{e.title}</h3>
                  <span className="r">{e.range} · {n} events</span>
                  <p>{e.summary}</p>
                </button>
              );
            })}
          </div>
          <div className="card" style={{ marginTop: 18 }}>
            <div className="row" style={{ marginBottom: 6 }}>
              <h3 style={{ fontSize: 18 }}>Which years does the book dwell on?</h3>
              <span className="spacer" />
              <Link to="/insights#years" className="small">Explore by year →</Link>
            </div>
            <p className="small muted" style={{ margin: "0 0 10px" }}>Number of passages mentioning each year. The shaded band is the armed struggle, 1946–1951.</p>
            <YearBars data={atlas.years} onSelect={(y) => nav(`/insights?year=${y}#years`)} height={140} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid g2" style={{ alignItems: "center", gap: 40 }}>
          <figure style={{ margin: 0 }}>
            <Link to="/map?layer=original" className="card flush" style={{ display: "block" }}>
              <img src={asset("maps/movement-map.jpg")} alt="The book's map of Telangana: the original strong base of the movement and its expansion after 1948" loading="lazy" />
            </Link>
            <figcaption className="tiny muted" style={{ marginTop: 8 }}>The map printed on page 2 of the book. Dark: original strong base. Light: guerrilla expansion after 1948.</figcaption>
          </figure>
          <div>
            <div className="eyebrow">Geography of a revolt</div>
            <h2 style={{ fontSize: 34, margin: "8px 0 14px" }}>From Nalgonda's villages to the Godavari forests</h2>
            <p className="lede" style={{ fontSize: 17 }}>
              The struggle was strongest in Nalgonda, Warangal and Khammam. After the army came in 1948, squads moved into the
              Godavari and Krishna (Nallamala) forests and pushed into Karimnagar and Adilabad. The interactive map overlays the book's
              own map on the real terrain and pins every place the book names.
            </p>
            <h4 className="panel-title" style={{ marginTop: 22 }}>Most-mentioned places</h4>
            <HBars items={topPlaces.map((p) => ({ label: p.name, value: p.total, to: `/map?place=${p.id}`, color: "var(--teal)" }))} />
            <Link to="/map" className="btn" style={{ marginTop: 18 }}><Icon name="map" /> Open the interactive map</Link>
          </div>
        </div>
      </section>

      {intro && (
        <section className="section tight">
          <div className="wrap narrow">
            <blockquote className="pull">
              "During the course of the struggle, the peasantry in about 3,000 villages, covering roughly a population of 3 million in an
              area of about 16,000 square miles … had succeeded in setting up gram raj, on the basis of fighting village panchayats."
              <cite>— Introduction · <Link to={readLink(intro.anchor)}>read in context, p. {intro.anchor.pg}</Link></cite>
            </blockquote>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="section-title"><div><div className="eyebrow">Explore</div><h2>Ways into the archive</h2></div></div>
          <div className="grid g3">
            {TILES.map((t) => (
              <Link key={t.to} to={t.to} className="card tile">
                <span className="ic"><Icon name={t.icon} size={20} /></span>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
                <span className="go">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
