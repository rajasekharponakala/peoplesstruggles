import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Icon from "./Icons";
import { PDF_URL } from "../lib/data";

export const NAV = [
  { to: "/read", label: "Read" },
  { to: "/timeline", label: "Timeline" },
  { to: "/map", label: "Map" },
  { to: "/martyrs", label: "Martyrs" },
  { to: "/people", label: "People" },
  { to: "/witness", label: "Witness" },
  { to: "/insights", label: "Insights" },
  { to: "/glossary", label: "Glossary" },
];

function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute("data-theme") || "");
  const effective = theme || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const toggle = () => {
    const next = effective === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch { /* storage unavailable */ }
    setTheme(next);
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  };
  return [effective, toggle];
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [theme, toggle] = useTheme();
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <header className="header">
      <div className="wrap">
        <Link to="/" className="brand" aria-label="Home">
          <span className="brand-mark">తె</span>
          <span className="brand-text"><b>Telangana Struggle</b><small>1946 – 1951 · An archive</small></span>
        </Link>
        <nav className={`nav ${open ? "open" : ""}`} aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>{n.label}</NavLink>
          ))}
          <NavLink to="/search" className={({ isActive }) => (isActive ? "active" : "")}>Search</NavLink>
        </nav>
        <div className="header-tools">
          <form className="header-search" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`); }}>
            <Icon name="search" size={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the book…" aria-label="Search the book" />
          </form>
          <button className="icon-btn" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title="Toggle theme">
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            <Icon name={open ? "x" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap cols">
        <div>
          <h4>About this archive</h4>
          <p style={{ margin: 0, maxWidth: "52ch" }}>
            Built from the full text of <i>Telangana People's Struggle and Its Lessons</i> by P. Sundarayya
            (Communist Party of India (Marxist), Calcutta, December 1972). Every figure, event and place here links back
            to the passage and page of the book it comes from. Map zones are traced from the book's own 1948 map; locations are approximate.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          {NAV.slice(0, 5).map((n) => <Link key={n.to} to={n.to}>{n.label}</Link>)}
        </div>
        <div>
          <h4>Source</h4>
          {PDF_URL && <a href={PDF_URL} target="_blank" rel="noreferrer">Original PDF (414 pages) ↗</a>}
          <Link to="/insights">Data & method</Link>
          <Link to="/glossary">Glossary of terms</Link>
          <Link to="/search">Full-text search</Link>
        </div>
      </div>
    </footer>
  );
}

export function Loading({ label = "Loading the archive…" }) {
  return <div className="loading">{label}</div>;
}

export function PageHead({ eyebrow, title, children }) {
  return (
    <div className="page-head wrap">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {children && <div className="lede">{children}</div>}
    </div>
  );
}
