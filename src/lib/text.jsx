import { Link } from "react-router-dom";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Build a matcher that turns place names + glossary terms into links / tooltips. */
export function makeLinker(atlas) {
  if (!atlas) return null;
  const entries = [];
  for (const p of atlas.places) for (const a of p.aliases) entries.push([a, { kind: "place", id: p.id, name: p.name }]);
  for (const g of atlas.glossary) {
    const base = g.term.replace(/\s*\/.*$/, "");
    entries.push([base, { kind: "gloss", id: g.id, def: g.def, term: g.term }]);
  }
  entries.sort((a, b) => b[0].length - a[0].length);
  const map = new Map(entries.map(([k, v]) => [k.toLowerCase(), v]));
  const re = new RegExp(`\\b(${entries.map(([k]) => esc(k)).join("|")})(s|es)?\\b`, "gi");
  return { re, map };
}

/** Highlight query inside a plain string. */
export function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${esc(q)})`, "gi");
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

/**
 * Render a paragraph with linked places, glossary tooltips (first use per chapter)
 * and query highlighting.
 */
export function renderRich(text, linker, q, seenGloss) {
  if (!linker) return highlight(text, q);
  const out = [];
  let last = 0;
  let m;
  linker.re.lastIndex = 0;
  let k = 0;
  while ((m = linker.re.exec(text))) {
    const hit = linker.map.get(m[1].toLowerCase());
    // place names must be capitalised in the text to count (avoid "camp", "Party" etc.)
    if (!hit || (hit.kind === "place" && m[1][0] !== m[1][0].toUpperCase())) continue;
    if (hit.kind === "gloss" && seenGloss) {
      if (seenGloss.has(hit.id)) continue;
      seenGloss.add(hit.id);
    }
    if (m.index > last) out.push(<span key={k++}>{highlight(text.slice(last, m.index), q)}</span>);
    const word = m[0];
    if (hit.kind === "place") {
      out.push(<Link key={k++} className="pl" to={`/map?place=${hit.id}`} title={`${hit.name} — show on map`}>{highlight(word, q)}</Link>);
    } else {
      out.push(<abbr key={k++} className="gl" title={`${hit.term}: ${hit.def}`}>{highlight(word, q)}</abbr>);
    }
    last = m.index + word.length;
  }
  if (last < text.length) out.push(<span key={k++}>{highlight(text.slice(last), q)}</span>);
  return out;
}

export function snippet(text, q, len = 260) {
  if (!q) return text.length > len ? text.slice(0, len) + "…" : text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text.slice(0, len) + (text.length > len ? "…" : "");
  const start = Math.max(0, i - Math.floor(len / 3));
  return (start > 0 ? "…" : "") + text.slice(start, start + len) + (start + len < text.length ? "…" : "");
}
