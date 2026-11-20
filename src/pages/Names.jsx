import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadNames } from "../data";

export default function Names() {
  const [names, setNames] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => { loadNames().then(setNames); }, []);

  const filtered = names.filter((n) => n.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container">
      <h1 className="page-title">Names & Places Index</h1>
      <p className="page-sub">
        {names.length} indexed names and places mentioned in the book. Click to search the full text.
      </p>
      <div className="search-box">
        <input placeholder="Filter index..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="name-grid">
        {filtered.map((n) => (
          <div className="name-item" key={n.name}>
            <Link to={`/search?q=${encodeURIComponent(n.name)}`}>{n.name}</Link>
            <span className="freq">{n.freq}×</span>
          </div>
        ))}
      </div>
    </div>
  );
}
