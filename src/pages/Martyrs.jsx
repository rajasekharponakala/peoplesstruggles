import { useEffect, useState } from "react";
import { loadChapters } from "../data";

export default function Martyrs() {
  const [chapter, setChapter] = useState(null);
  useEffect(() => { loadChapters().then((cs) => setChapter(cs.find((c) => c.id === "app1"))); }, []);

  if (!chapter) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1 className="page-title">Martyrs of the Struggle</h1>
      <p className="page-sub">
        Appendix I — names of those who laid down their lives, district by district, taluka by taluka.
      </p>
      <div className="card" style={{ marginBottom: 20, borderLeft: "4px solid var(--accent)" }}>
        <p style={{ margin: 0, color: "var(--text-dim)" }}>
          "As many as 4,000 Communists and peasant militants were killed; more than 10,000 thrown into detention camps and jails."
          The list below is partial — the book itself notes thousands more whose names were never recorded.
        </p>
      </div>
      <article className="chapter-content">
        {chapter.paragraphs.map((p, i) => (
          <p key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{p}</p>
        ))}
      </article>
    </div>
  );
}
