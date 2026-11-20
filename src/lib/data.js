import { useEffect, useState } from "react";

export const BASE = import.meta.env.BASE_URL;
export const PDF_URL = "https://www.revolutionarydemocracy.org/archive/Telangana.pdf";
export const pdfPage = (n) => `${PDF_URL}#page=${n}`;
export const asset = (p) => `${BASE}${p.replace(/^\//, "")}`;

const cache = new Map();

function load(name) {
  if (!cache.has(name)) {
    const p = fetch(asset(`data/${name}.json`))
      .then((r) => {
        if (!r.ok) throw new Error(`${name}: ${r.status}`);
        return r.json();
      })
      .then((json) => (name === "atlas" ? indexAtlas(json) : name === "book" ? indexBook(json) : json));
    p.catch(() => cache.delete(name));
    cache.set(name, p);
  }
  return cache.get(name);
}

function indexBook(chapters) {
  const byId = Object.fromEntries(chapters.map((c, i) => [c.id, { ...c, index: i }]));
  return { chapters: chapters.map((c) => byId[c.id]), byId };
}

function indexAtlas(a) {
  const placeById = Object.fromEntries(a.places.map((p) => [p.id, p]));
  const eventById = Object.fromEntries(a.events.map((e) => [e.id, e]));
  const eraById = Object.fromEntries(a.eras.map((e) => [e.id, e]));
  const tocById = Object.fromEntries(a.toc.map((c, i) => [c.id, { ...c, index: i }]));
  // passage key "ch#block" -> events/figures anchored there (for reader margin notes)
  const anchors = {};
  const add = (an, item) => {
    if (!an) return;
    const k = `${an.ch}#${an.b}`;
    (anchors[k] ||= []).push(item);
  };
  a.events.forEach((e) => add(e.anchor, { kind: "event", item: e }));
  a.figures.forEach((f) => add(f.anchor, { kind: "figure", item: f }));
  return { ...a, placeById, eventById, eraById, tocById, anchors };
}

function useLoad(name) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let live = true;
    load(name).then(
      (data) => live && setState({ data, error: null }),
      (error) => live && setState({ data: null, error })
    );
    return () => {
      live = false;
    };
  }, [name]);
  return state;
}

export const useBook = () => useLoad("book");
export const useAtlas = () => useLoad("atlas");
export const useMartyrs = () => useLoad("martyrs");
export const preload = (name) => load(name);

export const readLink = (anchor, q) =>
  anchor ? `/read/${anchor.ch}?b=${encodeURIComponent(anchor.b)}${q ? `&q=${encodeURIComponent(q)}` : ""}` : "/read";

export function fmtNum(n) {
  return n.toLocaleString("en-IN");
}
