import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadChapters, loadNames } from "../data";

export default function Home() {
  const [chapters, setChapters] = useState([]);
  const [names, setNames] = useState([]);
  useEffect(() => {
    loadChapters().then(setChapters);
    loadNames().then(setNames);
  }, []);

  const words = chapters.reduce((a, c) => a + c.wordCount, 0);
  const parts = [...new Set(chapters.map((c) => c.part))];

  return (
    <div className="container">
      <div className="hero">
        <h1>Telangana People's Struggle</h1>
        <p>
          An interactive archive of P. Sundarayya's 1972 classic — "Telangana People's Struggle and Its Lessons".
          Walk through the peasant uprising, the armed liberation struggle against the Nizam and Razakars,
          the terror regime, the martyrs, and the lessons that reshaped India's revolutionary movement.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          <Link to="/read" className="btn">Start Reading</Link>
          <Link to="/map" className="btn ghost">Explore Map</Link>
          <Link to="/martyrs" className="btn ghost">Martyrs</Link>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat"><div className="num">{chapters.length}</div><div className="lbl">Chapters & Appendices</div></div>
        <div className="card stat"><div className="num">{Math.round(words / 1000)}k</div><div className="lbl">Words</div></div>
        <div className="card stat"><div className="num">{names.length}</div><div className="lbl">Indexed Names & Places</div></div>
        <div className="card stat"><div className="num">4,000+</div><div className="lbl">Martyrs</div></div>
        <div className="card stat"><div className="num">3,000</div><div className="lbl">Villages with Gram Raj</div></div>
        <div className="card stat"><div className="num">1M</div><div className="lbl">Acres Redistributed</div></div>
      </div>

      <div className="card" style={{ marginBottom: 24, textAlign: "center" }}>
        <h2 style={{ marginTop: 0, color: "var(--gold)", fontFamily: "var(--font-serif)" }}>Original Movement Map (1948)</h2>
        <img src="/maps/movement-map.jpg" alt="Telangana movement map" style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid var(--border)" }} />
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 8 }}>
          Deep yellow/brown = original strong base of the movement. Light yellow = expansion of guerrilla movement after 1948.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, color: "var(--gold)", fontFamily: "var(--font-serif)" }}>The Pain Back Then</h2>
        <p>
          Between 1946 and 1951, the peasants of Telangana rose against the feudal autocracy of the Nizam.
          As many as 4,000 Communists and peasant militants were killed; more than 10,000 thrown into detention;
          no less than 50,000 dragged into camps to be beaten and tortured; thousands of women molested.
          An entire region was subjected to brutal police and military terror for five full years.
          Yet out of that suffering rose gram raj, land to the tiller, equal wages, and a redrawing of India's map.
        </p>
      </div>

      <h2 style={{ color: "var(--gold)", fontFamily: "var(--font-serif)" }}>Browse by Part</h2>
      <div className="grid grid-2">
        {parts.map((p) => (
          <div className="card" key={p}>
            <h3 style={{ margin: "0 0 8px", color: "var(--accent-2)" }}>{p}</h3>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-dim)" }}>
              {chapters.filter((c) => c.part === p).map((c) => (
                <li key={c.id}><Link to={`/read/${c.id}`}>{c.title}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
