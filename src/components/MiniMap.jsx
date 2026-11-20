import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { asset } from "../lib/data";

let geoPromise = null;
const loadGeo = () => (geoPromise ||= fetch(asset("maps/districts.geojson")).then((r) => r.json()));

// equirectangular projection over the region of interest
const BBOX = { w: 77.1, e: 82.0, s: 15.7, n: 19.95 };
const W = 400;
const K = Math.cos((17.8 * Math.PI) / 180);
const H = Math.round((W * (BBOX.n - BBOX.s)) / ((BBOX.e - BBOX.w) * K));
const px = (lon) => ((lon - BBOX.w) / (BBOX.e - BBOX.w)) * W;
const py = (lat) => ((BBOX.n - lat) / (BBOX.n - BBOX.s)) * H;

function ringPath(ring) {
  return ring.map(([lon, lat], i) => `${i ? "L" : "M"}${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join("") + "Z";
}
function featPath(g) {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return polys.map((p) => p.map(ringPath).join("")).join("");
}

/** Lightweight SVG locator map (no tiles). points=[{lat,lon,label,color}] */
export default function MiniMap({ points = [], zones, highlightDistricts = [], linkTo, height }) {
  const [geo, setGeo] = useState(null);
  useEffect(() => { loadGeo().then(setGeo, () => {}); }, []);
  const hd = new Set(highlightDistricts);
  const svg = (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: height || "auto", display: "block", background: "var(--paper-2)" }} role="img" aria-label="Locator map">
      {geo?.features.map((f) => (
        <path key={f.properties.hd} d={featPath(f.geometry)}
          fill={hd.has(f.properties.hd) ? "color-mix(in srgb, var(--red) 22%, var(--card))" : f.properties.region === "telangana" ? "var(--card)" : "var(--card-2)"}
          stroke="var(--line-2)" strokeWidth="0.8" />
      ))}
      {zones?.map((z) => z.rings.map((r, i) => (
        <path key={z.id + i} d={ringPath(r.map(([la, lo]) => [lo, la]))} fill={z.kind === "strong" ? "var(--red)" : "var(--ochre)"} opacity={z.kind === "strong" ? 0.28 : 0.14} />
      )))}
      {geo?.features.filter((f) => f.properties.region === "telangana").map((f) => {
        const lbl = LABELS[f.properties.hd];
        return lbl ? <text key={f.properties.hd} x={px(lbl[1])} y={py(lbl[0])} textAnchor="middle" style={{ font: "600 9px var(--sans)", fill: "var(--muted)", letterSpacing: ".08em", textTransform: "uppercase" }}>{f.properties.hd}</text> : null;
      })}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={px(p.lon)} cy={py(p.lat)} r="11" fill={p.color || "var(--red)"} opacity="0.18" />
          <circle cx={px(p.lon)} cy={py(p.lat)} r="5" fill={p.color || "var(--red)"} stroke="var(--card)" strokeWidth="2" />
          {p.label && <text x={px(p.lon) + 9} y={py(p.lat) + 4 + (p.dy || 0)} style={{ font: "700 11px var(--sans)", fill: "var(--ink)", paintOrder: "stroke", stroke: "var(--card)", strokeWidth: 3 }}>{p.label}</text>}
        </g>
      ))}
    </svg>
  );
  return linkTo ? <Link to={linkTo} title="Open in the interactive map">{svg}</Link> : svg;
}

const LABELS = {
  Adilabad: [19.35, 78.6], Karimnagar: [18.55, 79.0], Nizamabad: [18.45, 78.1], Medak: [17.95, 78.3], Hyderabad: [17.15, 77.95],
  Warangal: [18.05, 79.75], Khammam: [17.55, 80.55], Nalgonda: [17.05, 79.3], Mahbubnagar: [16.45, 78.1],
};
