import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { loadChapters } from "../data";

function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
  );
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [input, setInput] = useState(q);
  const [chapters, setChapters] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => { loadChapters().then(setChapters); }, []);
  useEffect(() => {
    if (!q || !chapters.length) { setResults([]); return; }
    const ql = q.toLowerCase();
    const res = [];
    for (const c of chapters) {
      for (const p of c.paragraphs) {
        if (p.toLowerCase().includes(ql)) {
          res.push({ chapter: c, para: p });
          if (res.length > 200) break;
        }
      }
      if (res.length > 200) break;
    }
    setResults(res);
  }, [q, chapters]);

  const submit = (e) => {
    e.preventDefault();
    setParams({ q: input });
  };

  return (
    <div className="container">
      <h1 className="page-title">Search the Book</h1>
      <p className="page-sub">Full-text search across all {chapters.length} chapters and appendices.</p>
      <form className="search-box" onSubmit={submit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search names, places, events..." />
        <button className="btn" type="submit">Search</button>
      </form>
      {q && <p style={{ color: "var(--text-dim)" }}>{results.length} result{results.length !== 1 ? "s" : ""} for "{q}"</p>}
      <div className="card" style={{ padding: 0 }}>
        {results.map((r, i) => (
          <div className="search-result" key={i}>
            <Link to={`/read/${r.chapter.id}`} style={{ fontWeight: 600 }}>{r.chapter.title}</Link>
            <div className="ctx">{highlight(r.para.slice(0, 320) + (r.para.length > 320 ? "…" : ""), q)}</div>
          </div>
        ))}
        {q && results.length === 0 && <div style={{ padding: 20, color: "var(--text-dim)" }}>No results.</div>}
      </div>
    </div>
  );
}
