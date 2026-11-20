import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Read from "./pages/Read";
import Chapter from "./pages/Chapter";
import MapPage from "./pages/MapPage";
import Martyrs from "./pages/Martyrs";
import Names from "./pages/Names";
import SearchPage from "./pages/SearchPage";
import Timeline from "./pages/Timeline";
import Witness from "./pages/Witness";
import "./index.css";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/read", label: "Read" },
  { to: "/map", label: "Map" },
  { to: "/martyrs", label: "Martyrs" },
  { to: "/witness", label: "Witness" },
  { to: "/names", label: "Names & Places" },
  { to: "/timeline", label: "Timeline" },
  { to: "/search", label: "Search" },
];

function Navbar() {
  const loc = useLocation();
  return (
    <nav className="navbar">
      <div className="brand"><span className="flame">🔥</span> Telangana Struggle</div>
      <div className="nav-links">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>
            {n.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/read" element={<Read />} />
            <Route path="/read/:id" element={<Chapter />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/martyrs" element={<Martyrs />} />
            <Route path="/witness" element={<Witness />} />
            <Route path="/names" element={<Names />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </main>
        <footer className="footer">
          Based on "Telangana People's Struggle and Its Lessons" by P. Sundarayya (1972). Built as an interactive archive.
        </footer>
      </div>
    </BrowserRouter>
  );
}
