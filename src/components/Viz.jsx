import { useState } from "react";
import { Link } from "react-router-dom";
import { fmtNum, readLink } from "../lib/data";

/** Horizontal bars: items = [{label, value, to?, color?, sub?}] */
export function HBars({ items, max, color, unit = "" }) {
  const m = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div>
      {items.map((it) => {
        const inner = (
          <>
            <span className="name" title={it.label}>{it.label}</span>
            <span className="track"><span className="fill" style={{ width: `${(100 * it.value) / m}%`, "--c": it.color || color }} /></span>
            <span className="n">{fmtNum(it.value)}{unit}</span>
          </>
        );
        return it.to ? <Link key={it.label} to={it.to} className="hbar">{inner}</Link> : <div key={it.label} className="hbar">{inner}</div>;
      })}
    </div>
  );
}

/** Vertical bar chart over years. data=[{y,n}] */
export function YearBars({ data, from = 1920, to = 1972, selected, onSelect, height = 180, highlight = [1946, 1951], color = "var(--red)" }) {
  const [hover, setHover] = useState(null);
  const ys = [];
  for (let y = from; y <= to; y++) ys.push(y);
  const by = Object.fromEntries(data.map((d) => [d.y, d.n]));
  const max = Math.max(1, ...ys.map((y) => by[y] || 0));
  const W = 1000, H = height, pad = 26, bw = W / ys.length;
  return (
    <div style={{ position: "relative" }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H + pad}`} role="img" aria-label="How often each year is mentioned in the book">
        <rect x={(highlight[0] - from) * bw} y={0} width={(highlight[1] - highlight[0] + 1) * bw} height={H} fill="var(--red)" opacity="0.06" rx="6" />
        <g className="grid">{[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={0} x2={W} y1={H - f * H} y2={H - f * H} />)}</g>
        {ys.map((y, i) => {
          const v = by[y] || 0;
          const h = (v / max) * (H - 8);
          const on = selected === y || hover === y;
          return (
            <g key={y} onMouseEnter={() => setHover(y)} onMouseLeave={() => setHover(null)} onClick={() => v && onSelect?.(y)} style={{ cursor: v ? "pointer" : "default" }}>
              <rect x={i * bw} y={0} width={bw} height={H} fill="transparent" />
              <rect className="bar" x={i * bw + 1.5} y={H - h} width={bw - 3} height={h} rx="2" fill={on ? "var(--ochre)" : color} opacity={selected && selected !== y ? 0.45 : 1} />
              {(y % 5 === 0 || on) && <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" style={on ? { fill: "var(--ink)", fontWeight: 700 } : null}>{y}</text>}
            </g>
          );
        })}
      </svg>
      {hover && (
        <div className="tiny muted" style={{ position: "absolute", top: 0, right: 0, background: "var(--card)", padding: "4px 10px", borderRadius: 8, border: "1px solid var(--line)" }}>
          <b style={{ color: "var(--ink)" }}>{hover}</b> · mentioned in {by[hover] || 0} passages
        </div>
      )}
    </div>
  );
}

/** Tiny per-chapter sparkline. counts={chId:n}; toc = ordered chapters */
export function Spark({ counts, toc, color }) {
  const max = Math.max(1, ...toc.map((c) => counts[c.id] || 0));
  return (
    <div className="spark" style={{ "--c": color }} aria-hidden="true">
      {toc.map((c) => <i key={c.id} title={`${c.short}: ${counts[c.id] || 0}`} style={{ height: `${(100 * (counts[c.id] || 0)) / max}%` }} />)}
    </div>
  );
}

/** Chapters × themes heatmap */
export function ThemeHeatmap({ themes, toc }) {
  const max = Object.fromEntries(themes.map((t) => [t.id, Math.max(...Object.values(t.per))]));
  return (
    <div className="scroll-x">
      <table className="heat">
        <thead>
          <tr>
            <th />
            {themes.map((t) => <th key={t.id} className="col"><span className="dot" style={{ background: t.color, marginBottom: 6 }} /> {t.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {toc.map((c) => (
            <tr key={c.id}>
              <td className="rowh"><Link to={`/read/${c.id}`} title={c.title}>{c.num ? c.num.replace("Chapter", "Ch.").replace("Appendix", "App.") + " · " : ""}{c.short}</Link></td>
              {themes.map((t) => {
                const v = t.per[c.id] || 0;
                const a = v / (max[t.id] || 1);
                return (
                  <td key={t.id} className="cell" title={`${c.short} — ${t.label}: ${v} per 1,000 words`}
                    style={{ background: `color-mix(in srgb, ${t.color} ${Math.round(8 + a * 88)}%, var(--card))` }} />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FigureCard({ f, toc }) {
  const ch = f.anchor && toc?.[f.anchor.ch];
  return (
    <Link to={readLink(f.anchor)} className={`figure-card tone-${f.tone}`}>
      <span className="v">{f.display}</span>
      <span className="u">{f.unit}</span>
      <span className="l">{f.label}</span>
      {f.anchor && <span className="src">Read the passage · {ch ? ch.short : ""} · p. {f.anchor.pg} →</span>}
    </Link>
  );
}

export function initials(name) {
  return name.replace(/^(The|Comrades?|Maj-Gen\.|M\. K\.|P\.|B\.)\s+/g, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
