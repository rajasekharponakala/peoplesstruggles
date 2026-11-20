import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { loadChapters } from "../data";

export default function Chapter() {
  const { id } = useParams();
  const [chapters, setChapters] = useState([]);
  const [chapter, setChapter] = useState(null);
  useEffect(() => { loadChapters().then((cs) => { setChapters(cs); setChapter(cs.find((c) => c.id === id)); }); }, [id]);

  const parts = [...new Set(chapters.map((c) => c.part))];
  const idx = chapters.findIndex((c) => c.id === id);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx < chapters.length - 1 ? chapters[idx + 1] : null;

  if (!chapter) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="reader-layout">
        <aside className="sidebar">
          {parts.map((p) => (
            <div className="group" key={p}>
              <div className="group-title">{p}</div>
              {chapters.filter((c) => c.part === p).map((c) => (
                <Link key={c.id} to={`/read/${c.id}`} className={c.id === id ? "active" : ""}>
                  {c.title}
                </Link>
              ))}
            </div>
          ))}
        </aside>
        <article className="chapter-content">
          <h2>{chapter.title}</h2>
          <div className="meta">
            {chapter.part} · PDF pages {chapter.pages[0]}–{chapter.pages[1]} · {chapter.wordCount.toLocaleString()} words
          </div>
          {chapter.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, gap: 12 }}>
            {prev ? <Link to={`/read/${prev.id}`} className="btn ghost">← {prev.title}</Link> : <span />}
            {next ? <Link to={`/read/${next.id}`} className="btn"> {next.title} →</Link> : <span />}
          </div>
        </article>
      </div>
    </div>
  );
}
