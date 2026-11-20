import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadChapters } from "../data";

export default function Read() {
  const [chapters, setChapters] = useState([]);
  useEffect(() => { loadChapters().then(setChapters); }, []);

  const parts = [...new Set(chapters.map((c) => c.part))];
  return (
    <div className="container">
      <h1 className="page-title">Read the Book</h1>
      <p className="page-sub">23 chapters & appendices. Select a chapter from the sidebar.</p>
      <div className="reader-layout">
        <aside className="sidebar">
          {parts.map((p) => (
            <div className="group" key={p}>
              <div className="group-title">{p}</div>
              {chapters.filter((c) => c.part === p).map((c) => (
                <Link key={c.id} to={`/read/${c.id}`}>{c.title.replace(/^(Part [IVX]+ - |Chapter [IVX]+ - )/, "")}</Link>
              ))}
            </div>
          ))}
        </aside>
        <div className="card">
          <p>Choose a chapter from the left to begin reading. The full text of the 1972 edition is included.</p>
          <p style={{ color: "var(--text-dim)" }}>
            Tip: use the Search page to find any name, place, or event across the entire book.
          </p>
        </div>
      </div>
    </div>
  );
}
