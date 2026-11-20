import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="wrap narrow section" style={{ textAlign: "center" }}>
      <div className="eyebrow">404</div>
      <h1 style={{ fontSize: 44, margin: "10px 0" }}>This page is not in the archive</h1>
      <p className="muted">The link may be outdated. Try the contents or search the full text.</p>
      <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
        <Link className="btn" to="/read">Contents</Link>
        <Link className="btn ghost" to="/search">Search</Link>
      </div>
    </div>
  );
}
