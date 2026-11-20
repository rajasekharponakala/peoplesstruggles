import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadChapters } from "../data";

const KEYWORDS = [
  "rape", "raped", "molested", "torture", "tortured", "butchered", "shot dead",
  "concentration camp", "burning of villages", "vandalism", "looted", "killed",
  "massacre", "terror", "beaten", "humiliation", "indignities"
];

export default function Witness() {
  const [chapters, setChapters] = useState([]);
  const [filter, setFilter] = useState("all");
  useEffect(() => { loadChapters().then(setChapters); }, []);

  const items = [];
  for (const c of chapters) {
    for (const p of c.paragraphs) {
      const low = p.toLowerCase();
      if (KEYWORDS.some((k) => low.includes(k))) {
        items.push({ chapter: c, para: p });
      }
    }
  }

  const filtered = filter === "all" ? items : items.filter((it) => it.para.toLowerCase().includes(filter));

  return (
    <div className="container">
      <h1 className="page-title">Witness: The Pain Back Then</h1>
      <p className="page-sub">
        Curated excerpts from the book documenting the terror, atrocities, and suffering inflicted on the people of Telangana.
      </p>
      <div className="card" style={{ marginBottom: 20, borderLeft: "4px solid var(--accent)" }}>
        <p style={{ margin: 0, color: "var(--text-dim)" }}>
          These passages are drawn verbatim from P. Sundarayya's account. They record what the peasants, women, and militants endured
          under the Nizam, the Razakars, and the post-1948 military regime.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button className={`btn ${filter === "all" ? "" : "ghost"}`} onClick={() => setFilter("all")}>All ({items.length})</button>
        {["rape", "torture", "concentration camp", "killed", "looted"].map((k) => (
          <button key={k} className={`btn ${filter === k ? "" : "ghost"}`} onClick={() => setFilter(k)}>
            {k} ({items.filter((it) => it.para.toLowerCase().includes(k)).length})
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0 }}>
        {filtered.slice(0, 120).map((r, i) => (
          <div className="search-result" key={i}>
            <Link to={`/read/${r.chapter.id}`} style={{ fontWeight: 600, fontSize: 13 }}>{r.chapter.title}</Link>
            <div className="ctx" style={{ color: "var(--text)" }}>{r.para}</div>
          </div>
        ))}
      </div>
      {filtered.length > 120 && (
        <p style={{ color: "var(--text-mute)", marginTop: 12 }}>Showing 120 of {filtered.length}. Use Search for more.</p>
      )}
    </div>
  );
}
