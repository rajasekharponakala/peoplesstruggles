import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, ImageOverlay, LayersControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TELANGANA_BBOX = [[15.5, 76.5], [20.0, 81.5]];

const STRONG_BASE = new Set(["Nalgonda", "Warangal", "Khammam", "Karimnagar", "Mahbubnagar", "Medak", "Adilabad"]);
const EXPANSION = new Set(["Nizamabad", "Rangareddy", "Hyderabad", "Medchal", "Siddipet", "Yadadri Bhuvanagiri", "Suryapet", "Jangaon", "Mahabubabad", "Khammam"]);

const KEY_PLACES = [
  { name: "Hyderabad", lat: 17.385, lon: 78.486, note: "Capital of Hyderabad State; centre of repression, jails, student movements" },
  { name: "Nalgonda", lat: 17.057, lon: 79.267, note: "Heart of the struggle; gram raj in 3,000 villages" },
  { name: "Warangal", lat: 17.978, lon: 79.600, note: "Strong base; Godavari forest region" },
  { name: "Khammam", lat: 17.247, lon: 80.144, note: "Godavari forest region; Koya people" },
  { name: "Karimnagar", lat: 18.438, lon: 79.129, note: "People's upsurge; new areas" },
  { name: "Mahbubnagar", lat: 16.748, lon: 77.998, note: "Krishna (Nallamala) forest region" },
  { name: "Medak", lat: 18.046, lon: 78.262, note: "Expansion area" },
  { name: "Adilabad", lat: 19.666, lon: 78.532, note: "Koya people; Chennur-Siripur extension" },
  { name: "Nizamabad", lat: 18.672, lon: 78.094, note: "Expansion" },
  { name: "Kurnool", lat: 15.828, lon: 78.037, note: "Andhra rear; Krishna forest" },
  { name: "Vijayawada", lat: 16.506, lon: 80.648, note: "Andhra rear; working class" },
  { name: "Guntur", lat: 16.306, lon: 80.436, note: "Andhra rear" },
  { name: "Suryapet", lat: 17.140, lon: 79.624, note: "Key taluka; martyrs" },
  { name: "Miryalagudem", lat: 17.080, lon: 79.560, note: "Struggle centre" },
  { name: "Devarkonda", lat: 16.700, lon: 78.900, note: "Amarabad area; Krishna border" },
  { name: "Amarabad", lat: 16.350, lon: 78.850, note: "Krishna forest region" },
  { name: "Bhuvanagiri", lat: 17.500, lon: 78.870, note: "Bhuvanagiri taluka" },
  { name: "Jangaon", lat: 17.720, lon: 79.170, note: "Jangaon taluka" },
  { name: "Huzurnagar", lat: 16.900, lon: 79.850, note: "Huzurnagar taluka" },
  { name: "Manukota", lat: 17.800, lon: 80.100, note: "Manukota-Mulugu-Warangal area" },
  { name: "Mulugu", lat: 18.190, lon: 80.080, note: "Mulugu area" },
  { name: "Palvancha", lat: 17.590, lon: 80.680, note: "Kothagudem (Palvancha) area" },
  { name: "Kothagudem", lat: 17.550, lon: 80.620, note: "Khammam-Kothagudem area" },
  { name: "Illendu", lat: 17.600, lon: 80.300, note: "Illendu area" },
  { name: "Narsampeta", lat: 17.920, lon: 79.930, note: "Narsampeta area" },
  { name: "Vikarabad", lat: 17.330, lon: 77.900, note: "Vikarabad area" },
  { name: "Nallamala Forest", lat: 16.100, lon: 78.800, note: "Krishna forest (Nallamala) region" },
  { name: "Godavari Forest", lat: 17.900, lon: 80.500, note: "Godavari forest region" },
];

export default function MapPage() {
  const [telangana, setTelangana] = useState(null);
  const [ap, setAp] = useState(null);
  const [layers, setLayers] = useState({
    tiles: true,
    tg: true,
    ap: true,
    movement: true,
    places: true,
    image: false,
  });

  useEffect(() => {
    fetch("/maps/telangana.geojson").then((r) => r.json()).then(setTelangana);
    fetch("/maps/ap.geojson").then((r) => r.json()).then(setAp);
  }, []);

  const toggle = (k) => setLayers((s) => ({ ...s, [k]: !s[k] }));

  const styleTg = (feat) => {
    const d = feat.properties.district;
    let fill = "#1f6f8b";
    let opacity = 0.35;
    if (STRONG_BASE.has(d)) { fill = "#c0392b"; opacity = 0.55; }
    else if (EXPANSION.has(d)) { fill = "#e67e22"; opacity = 0.4; }
    if (!layers.movement) { fill = "#1f6f8b"; opacity = 0.25; }
    return { color: "#d4a017", weight: 1, fillColor: fill, fillOpacity: opacity };
  };

  return (
    <div className="container">
      <h1 className="page-title">Interactive Map</h1>
      <p className="page-sub">Telangana & surrounding regions. Toggle layers to explore the movement's geography.</p>
      <div className="map-wrap">
        <MapContainer center={[17.5, 79.5]} zoom={7} style={{ height: "100%", width: "100%" }}>
          {layers.tiles && (
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}
          {layers.ap && ap && (
            <GeoJSON data={ap} style={() => ({ color: "#556", weight: 0.8, fillColor: "#222", fillOpacity: 0.15 })} />
          )}
          {layers.tg && telangana && (
            <GeoJSON
              data={telangana}
              style={styleTg}
              onEachFeature={(feat, layer) => {
                layer.bindPopup(`<b>${feat.properties.district}</b><br/>Telangana district`);
              }}
            />
          )}
          {layers.image && (
            <ImageOverlay url="/maps/movement-map.jpg" bounds={TELANGANA_BBOX} opacity={0.5} />
          )}
          {layers.places && KEY_PLACES.map((p) => (
            <Marker key={p.name} position={[p.lat, p.lon]}>
              <Popup>
                <b>{p.name}</b><br />{p.note}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="map-controls">
          <h4>Map Layers</h4>
          {[
            ["tiles", "Base map (OSM)"],
            ["tg", "Telangana districts"],
            ["ap", "Surrounding (AP) districts"],
            ["movement", "Movement zones (color)"],
            ["places", "Key places & areas"],
            ["image", "Original 1948 map overlay"],
          ].map(([k, label]) => (
            <label key={k}>
              <input type="checkbox" checked={layers[k]} onChange={() => toggle(k)} />
              {label}
            </label>
          ))}
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-mute)" }}>
            Red = original strong base · Orange = expansion after 1948 · Blue = other
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0, color: "var(--gold)" }}>Legend & Notes</h3>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          District boundaries are modern (post-2014 Telangana reorganisation) and approximate the historical
          Hyderabad State districts referenced in the book (Nalgonda, Warangal, Khammam, Karimnagar, Mahbubnagar,
          Medak, Nizamabad, Adilabad, Hyderabad). Surrounding districts (Kurnool, East/West Godavari, Krishna, Guntur)
          hosted the Andhra rear of the movement.
        </p>
      </div>
    </div>
  );
}
