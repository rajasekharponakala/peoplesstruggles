let chaptersCache = null;
let namesCache = null;

export async function loadChapters() {
  if (chaptersCache) return chaptersCache;
  const r = await fetch("/data/chapters.json");
  chaptersCache = await r.json();
  return chaptersCache;
}

export async function loadNames() {
  if (namesCache) return namesCache;
  const r = await fetch("/data/names.json");
  namesCache = await r.json();
  return namesCache;
}

export function chapterById(chapters, id) {
  return chapters.find((c) => c.id === id);
}
EOF
