#!/usr/bin/env python3
"""Build the site's data files from the book.

Inputs
  scripts/source/chapters.json   paragraph text (original extraction)
  scripts/source/names.json      names index (original extraction)
  <pdf>                       Telangana.pdf (for page numbers + martyr tables)

Outputs (public/data/)
  book.json      chapters → typed blocks with ids + page numbers, sections
  martyrs.json   structured Appendix I
  atlas.json     places, events, eras, figures, people, glossary, themes, stats

Usage: python3 scripts/build_data.py path/to/Telangana.pdf
"""
import json
import re
import subprocess
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from curated import CATEGORIES, ERAS, EVENTS, FIGURES, GLOSSARY, PEOPLE, THEMES  # noqa: E402
from gazetteer import MODERN_TO_HISTORIC, PLACES  # noqa: E402

DATA = ROOT / "public" / "data"
SRC = ROOT / "scripts" / "source" / "chapters.json"
NAMES = ROOT / "scripts" / "source" / "names.json"
pdf = sys.argv[1] if len(sys.argv) > 1 else None


def norm(s):
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", s).strip().lower()


# --------------------------------------------------------------------------
# 1. load + re-segment chapters (the source has each chapter's tail leaking
#    into the start of the next chapter)
# --------------------------------------------------------------------------
src = json.loads(SRC.read_text())
MARK = re.compile(r"^(CHAPTER\s+[IVXL]+|APPENDIX\s+[IVX]+|EPILOGUE|PART\s+I+|Part\s+II+)\s*$")

chapters = [dict(c, paragraphs=list(c["paragraphs"])) for c in src]
for k in range(1, len(chapters)):
    ch = chapters[k]
    idx = next((i for i, p in enumerate(ch["paragraphs"][:10]) if MARK.match(p.strip())), None)
    if idx:
        # Part markers immediately preceding the CHAPTER marker belong here too
        j = idx
        while j > 0 and re.match(r"^(PART\s+I+|Part\s+II+)$", ch["paragraphs"][j - 1].strip()):
            j -= 1
        chapters[k - 1]["paragraphs"].extend(ch["paragraphs"][:j])
        ch["paragraphs"] = ch["paragraphs"][j:]

PART_META = {
    "Front": "Front matter",
    "Part I": "Part I · The Struggle Against the Nizam",
    "Part II": "Part II · Against the Indian Army",
    "Part III": "Part III · Appendices",
}
SHORT = {
    "afew": "A Few Words", "intro": "Introduction", "epilogue": "Epilogue",
}
for ch in chapters:
    if ch["id"] == "epilogue":
        ch["part"] = "Part II"
    t = ch["title"]
    m = re.match(r"^(Chapter|Appendix) ([IVXL]+) - (.*)$", t)
    ch["num"] = f"{m.group(1)} {m.group(2)}" if m else ""
    ch["short"] = SHORT.get(ch["id"], m.group(3) if m else t)
    # strip marker + title paragraphs at the head
    ps = ch["paragraphs"]
    while ps and (MARK.match(ps[0].strip()) or norm(ps[0]).rstrip(".") in norm(t) or norm(ps[0]) in ("part ii", "part iii")):
        ps.pop(0)
    def overlap(a, b):
        wa, wb = set(re.findall(r"[a-z]{3,}", norm(a))), set(re.findall(r"[a-z]{3,}", norm(b)))
        return len(wa & wb) / max(1, len(wa))
    if ps and len(ps[0]) < 160 and overlap(ps[0], t) > 0.6:
        ps.pop(0)
    if ps and ch["id"] == "p2c10" and ps[0].lower().startswith("brief sketches"):
        ps.pop(0)
    if ch["id"] == "afew":
        ps[0] = re.sub(r"^A FEW WORDS ABOUT THIS BOOK\s*", "", ps[0])
    if ch["id"] == "intro":
        ps[0] = re.sub(r"^INTRODUCTION\s*", "", ps[0])

# --------------------------------------------------------------------------
# 2. merge paragraphs broken across pages
# --------------------------------------------------------------------------
END = re.compile(r"[.!?:;”\"’')\]]\s*$")
for ch in chapters:
    out = []
    for p in ch["paragraphs"]:
        p = p.replace("", "").strip()
        if not p:
            continue
        if out and not END.search(out[-1]) and re.match(r"^[a-z(]", p) and len(out[-1]) > 60:
            out[-1] = out[-1].rstrip() + " " + p
        else:
            out.append(p)
    ch["paragraphs"] = out

# --------------------------------------------------------------------------
# 3. page numbers from the PDF
# --------------------------------------------------------------------------
pages_text = []
if pdf:
    raw = subprocess.run(["pdftotext", pdf, "-"], capture_output=True, text=True, check=True).stdout
    pages_text = raw.split("\f")
page_offsets, full = [], ""
for i, t in enumerate(pages_text):
    page_offsets.append(len(full))
    full += norm(t) + " "


def page_at(off):
    lo, hi = 0, len(page_offsets) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if page_offsets[mid] <= off:
            lo = mid
        else:
            hi = mid - 1
    return lo + 1


# --------------------------------------------------------------------------
# 4. typed blocks
# --------------------------------------------------------------------------
def is_upper_heading(p):
    letters = [c for c in p if c.isalpha()]
    if len(p) > 140 or len(letters) < 4:
        return False
    up = sum(1 for c in letters if c.isupper()) / len(letters)
    return up > 0.85 and not re.match(r"^\d+[.)]\s", p) and not p.startswith("Q.")


SMALL = {"of", "and", "the", "in", "to", "on", "at", "a", "an", "for", "by", "its", "after", "with", "from", "into"}


def is_title_heading(p):
    if len(p) > 75 or p.endswith((".", ",", ";")) or p.startswith(("–", "-", "“", '"', "(")):
        return False
    words = re.findall(r"[A-Za-z’']+", p)
    if len(words) < 2:
        return False
    caps = sum(1 for w in words if w[0].isupper() or w.lower() in SMALL)
    return caps / len(words) > 0.85 and sum(1 for w in words if w[0].isupper()) >= 2


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", norm(s)).strip("-")[:48]


def titlecase(s):
    out = []
    for i, w in enumerate(s.lower().split()):
        out.append(w if (w in SMALL and i) else (w[:1].upper() + w[1:]))
    t = " ".join(out)
    return re.sub(r"\b(Ii|Iii|Iv|Vi|Vii|Viii|Ix|Xi|Ams|Cpi|Cpsu|Pdf|Csp|Ngos?|Cc)\b", lambda m: m.group(0).upper(), t)


cursor = 0
book = []
for ch in chapters:
    blocks, sections = [], []
    seen = Counter()
    for i, p in enumerate(ch["paragraphs"]):
        key = norm(p)[:70]
        pg = None
        if full and key:
            f = full.find(key, max(0, cursor - 4000))
            if f < 0:
                f = full.find(norm(p)[:35], max(0, cursor - 4000))
            if f >= 0:
                cursor = f
                pg = page_at(f)
        typ = "p"
        text = p
        if re.fullmatch(r"[*\s]+", p):
            typ = "sep"
        elif p.strip() == "P. SUNDARAYYA":
            typ = "sig"
            text = "P. Sundarayya"
        elif ch["id"] == "p2c10" and re.match(r"^(Comrades? [^:]{3,60}):\s", p):
            typ = "h3"
        elif ch["id"] != "app1" and is_upper_heading(p):
            typ = "h"
            text = titlecase(p.rstrip(":"))
        elif ch["id"] != "app1" and is_title_heading(p):
            typ = "h"
        elif ch["id"] != "app1" and re.match(r"^\d\.\s", p) and is_upper_heading(p[3:]):
            typ = "h"
            text = titlecase(p[3:])
        elif re.match(r"^[“\"]", p):
            typ = "q"
        elif re.match(r"^(–|-|\d+\)|\([a-z]\)|[a-z]\))\s", p):
            typ = "li"
        bid = f"p{i}"
        if typ == "h3":
            nm = re.match(r"^(Comrades? [^:]{3,60}):", p).group(1)
            s = slug(nm)
            seen[s] += 1
            bid = s if seen[s] == 1 else f"{s}-{seen[s]}"
            sections.append({"id": bid, "title": nm, "sub": True})
            typ = "p"
        elif typ == "h":
            s = slug(text) or bid
            seen[s] += 1
            bid = s if seen[s] == 1 else f"{s}-{seen[s]}"
            sections.append({"id": bid, "title": text})
        blocks.append({"id": bid, "t": typ, "x": text, **({"pg": pg} if pg else {})})
    # fill missing pages forward
    last = ch["pages"][0]
    for b in blocks:
        if "pg" in b:
            last = b["pg"]
        else:
            b["pg"] = last
    words = sum(len(b["x"].split()) for b in blocks)
    book.append({
        "id": ch["id"], "part": ch["part"], "partTitle": PART_META.get(ch["part"], ch["part"]),
        "num": ch["num"], "title": ch["title"], "short": ch["short"],
        "pages": [blocks[0]["pg"] if blocks else ch["pages"][0], blocks[-1]["pg"] if blocks else ch["pages"][1]],
        "words": words, "mins": max(1, round(words / 230)),
        "sections": sections, "blocks": blocks,
    })

ORDER = ["afew", "intro", "p1c1", "p1c2", "p1c3", "p1c4", "p1c5", "p2c1", "p2c2", "p2c3", "p2c4", "p2c5",
         "p2c6", "p2c7", "p2c8", "p2c9", "p2c10", "p2c11", "epilogue", "app1", "app2", "app3", "app4"]
book.sort(key=lambda c: ORDER.index(c["id"]))
BYID = {c["id"]: c for c in book}

# --------------------------------------------------------------------------
# 5. anchors
# --------------------------------------------------------------------------
missing = []


def anchor(chid, phrase):
    n = norm(phrase)
    order = [BYID[chid]] + [c for c in book if c["id"] != chid]
    for c in order:
        for b in c["blocks"]:
            if n in norm(b["x"]):
                return {"ch": c["id"], "b": b["id"], "pg": b["pg"]}
    missing.append((chid, phrase))
    return None


# --------------------------------------------------------------------------
# 6. martyrs (Appendix I) from the PDF's layout text
# --------------------------------------------------------------------------
def parse_martyrs():
    if not pdf:
        return None
    a1, a2 = BYID["app1"]["pages"][0], BYID["app2"]["pages"][0]
    lay = subprocess.run(["pdftotext", "-layout", "-f", str(a1), "-l", str(a2), pdf, "-"],
                         capture_output=True, text=True, check=True).stdout
    pgs = lay.split("\f")
    DISTRICTS = {"NALGONDA DISTRICT": "Nalgonda", "MAHABOOBNAGAR DISTRICT": "Mahbubnagar", "EAST GODAVARI": "East Godavari",
                 "WEST GODAVARI": "West Godavari", "KRISHNA DISTRICT": "Krishna", "GUNTUR DISTRICT": "Guntur",
                 "ONGOLE DISTRICT": "Ongole", "CUDDAPAH DISTRICT": "Cuddapah", "TELANGANA (Continued)": "Telangana (other)"}
    TALUKA_DISTRICT = {"MADHIRA": "Khammam", "KHAMMAM": "Khammam", "KOTHAGUDEM": "Khammam", "MANUKOTA": "Warangal",
                       "ILLENDU": "Khammam", "NARSAMPETA": "Warangal", "JANGAON": "Warangal", "KARIMNAGAR": "Karimnagar"}
    ENTRY = re.compile(r"^\s{0,4}(\*{0,2})\s?(\d{1,3}(?:\s?[-,&]\s?\d{1,3})*(?:\s?(?:and|,)\s?\d{1,3})*)\s?(?:\.|\s[a-z]\.)\s+(\S.*)$")
    DASH = re.compile(r"^\s{0,6}–\s*(\d+)\s+(persons?|militants?|in .*)\s*(.*)$")
    entries = []
    district, taluka, period = "Nalgonda", "Suryapet", "After police action"
    cur = None

    def seg(line):
        return [(m.start(), m.group(0).strip()) for m in re.finditer(r"\S+(?: \S+)*", line)]

    for pi, page in enumerate(pgs):
        lines = page.split("\n")
        # estimate column positions on this page
        vs, rs = Counter(), Counter()
        for ln in lines:
            m = ENTRY.match(ln)
            if m:
                sg = seg(ln)
                if len(sg) >= 3:
                    vs[sg[1][0] // 4 * 4] += 1
                    rs[sg[2][0] // 4 * 4] += 1
        vcol = vs.most_common(1)[0][0] if vs else 33
        rcol = rs.most_common(1)[0][0] if rs else 55
        if rcol <= vcol + 6:
            rcol = vcol + 18

        def col(x):
            return "name" if x < vcol - 6 else ("village" if x < rcol - 4 else "remarks")

        for ln in lines:
            if not ln.strip() or re.fullmatch(r"\s*\d{3}\s*", ln) or "See biographical sketch" in ln:
                continue
            s = ln.strip()
            if re.fullmatch(r"Name\s+Village\s+Remarks", s):
                continue
            # headings
            letters = [c for c in re.sub(r"\(.*?\)", "", s) if c.isalpha()]
            if not ENTRY.match(ln) and not DASH.match(ln) and letters and sum(c.isupper() for c in letters) / len(letters) > 0.8 and len(s) < 110:
                up = s.upper()
                cur = None
                if "RAZAKAR DAYS" in up:
                    period = "Razakar days"
                    rest = re.sub(r"DURING RAZAKAR DAYS\s*(\(.*?\))?", "", s).strip()
                    if "(" in s:
                        taluka = re.search(r"\((.*?)\)", s).group(1).replace(" Taluka", "")
                    continue
                if "AFTER" in up and "POLICE ACTION" in up:
                    period = "After police action"
                    continue
                if any(k in up for k in ("ABOUT 300", "MORE THAN 300", "ABOUT 300 WERE")):
                    entries.append({"district": district, "taluka": taluka, "period": period, "num": "", "count": 300,
                                    "name": titlecase(s), "village": "", "remarks": "Collective entry", "star": "", "collective": True, "page": a1 + pi})
                    continue
                if up.startswith(("APPENDIX II", "THE CONDITIONS")):
                    return entries
                if "PARTY CADRE LOSSES" in up or up.startswith(("APPENDIX", "PART III", "MARTYRS OF THE")):
                    continue
                matched = next((v for k, v in DISTRICTS.items() if up.startswith(k.upper())), None)
                if matched:
                    district = matched
                    period = "After police action"
                    rest = s[len(next(k for k in DISTRICTS if up.startswith(k.upper()))):].strip()
                    rest = re.sub(r"\(.*?\)", "", rest).strip()
                    taluka = titlecase(re.sub(r"\s*TALUKA?S?.*$", "", rest, flags=re.I)) if rest else matched
                    continue
                t = re.sub(r"^\d+\.\s*", "", s)
                t = re.sub(r"\(.*?\)", "", t)
                t = re.sub(r"\s*(TALUKA?S?|TOWN AND TALUKA|TALUKA AND TOWN|TOWN)\b.*$", "", t, flags=re.I).strip(" –-")
                if t:
                    taluka = titlecase(t)
                    period = "After police action"
                    for k, v in TALUKA_DISTRICT.items():
                        if t.upper().startswith(k):
                            district = v
                    if district in ("Telangana (other)",):
                        pass
                continue
            m = ENTRY.match(ln)
            if m:
                star, num, _ = m.groups()
                nums = [int(x) for x in re.findall(r"\d+", num)]
                if "-" in num and len(nums) == 2:
                    count = nums[1] - nums[0] + 1
                else:
                    count = len(nums)
                body_start = ln.find(m.group(3))
                cur = {"district": district, "taluka": taluka, "period": period, "num": num.replace(" ", ""),
                       "count": max(1, min(count, 60)), "name": "", "village": "", "remarks": "", "star": star,
                       "page": a1 + pi}
                entries.append(cur)
                for x, t in seg(ln[body_start:]):
                    c = col(x + body_start) if x else "name"
                    cur[c] = (cur[c] + " " + t).strip()
                continue
            m = DASH.match(ln)
            if m:
                n, what, rest = m.groups()
                place = re.sub(r"^in\s+", "", what) if what.startswith("in ") else ""
                sg = seg(ln)
                rem = " ".join(t for x, t in sg if col(x) == "remarks")
                cur = {"district": district, "taluka": taluka, "period": period, "num": "–", "count": int(n),
                       "name": f"{n} persons" if not what.startswith("militant") else f"{n} militant(s)",
                       "village": place or "", "remarks": rem, "star": "", "collective": True, "page": a1 + pi}
                if not place:
                    inm = re.search(r"in\s+(\w+)", ln)
                    if inm:
                        cur["village"] = inm.group(1)
                entries.append(cur)
                continue
            if cur is not None:
                for x, t in seg(ln):
                    c = col(x)
                    cur[c] = (cur[c] + " " + t).strip()
    return entries


martyrs = parse_martyrs() or []
# ditto marks
prev = None
for e in martyrs:
    for f in ("village", "remarks"):
        v = re.sub(r"\s+", " ", e[f]).strip()
        if v in (",,", ",, ,,", "„") or v.startswith(",,") and len(v) < 6:
            v = prev[f] if prev else ""
        e[f] = v
    e["name"] = re.sub(r"\s+", " ", e["name"]).strip(" ,")
    e["sketch"] = "**" in e["star"] and "p1c3" or ("*" in e["star"] and "p2c10" or "")
    del e["star"]
    m = re.search(r"(\d{1,2})[.-](\d{1,2})[.-](19\d\d)", e["remarks"] + " " + e["village"])
    y = re.search(r"\b(194[5-9]|195[0-2])\b", e["remarks"])
    e["village"] = re.sub(r"\s*\d{1,2}[.-]\d{1,2}[.-]19\d\d\s*", " ", e["village"]).strip()
    e.setdefault("year", None)
    if m:
        e["date"] = f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
        e["year"] = int(m.group(3))
    elif y:
        e["year"] = int(y.group(1))
    elif e["period"] == "Razakar days":
        e["year"] = None
    prev = e
TALUKA_FIX = {"Bhuvangiri": "Bhuvanagiri", "Karimnagar-adilabad": "Karimnagar–Adilabad", "Paland": "Palnad",
              "Gudivanda": "Gudivada", "Mulugu": "Narsampeta–Mulugu", "Telangana (other)": "Other Telangana"}
for i, e in enumerate(martyrs):
    e["i"] = i
    e["taluka"] = TALUKA_FIX.get(e["taluka"], e["taluka"])
    if e["district"] == "Telangana (other)":
        e["district"] = "Other Telangana"

# --------------------------------------------------------------------------
# 7. places: mentions per chapter
# --------------------------------------------------------------------------
all_text = {c["id"]: " ".join(b["x"] for b in c["blocks"]) for c in book}
places = []
for pid, name, aliases, lat, lon, typ, hd in PLACES:
    rx = re.compile(r"\b(" + "|".join(re.escape(a) for a in aliases) + r")\b")
    per, refs = {}, []
    for c in book:
        n = 0
        for b in c["blocks"]:
            k = len(rx.findall(b["x"]))
            if k:
                n += k
                if len(refs) < 40 and b["t"] != "h":
                    refs.append([c["id"], b["id"]])
        if n:
            per[c["id"]] = n
    mart = sum(e["count"] for e in martyrs if rx.search(e["village"] + " " + e["taluka"] + " " + e["remarks"]))
    places.append({"id": pid, "name": name, "aliases": aliases, "lat": lat, "lon": lon, "type": typ, "district": hd,
                   "total": sum(per.values()), "chapters": per, "refs": refs, "martyrs": mart})

# --------------------------------------------------------------------------
# 8. events / figures / people / glossary with anchors
# --------------------------------------------------------------------------
events = []
for (eid, date, label, title, desc, cat, era, (chid, phrase), pl) in EVENTS:
    y = int(date[:4])
    mo = int(date[5:7]) if len(date) >= 7 else 6
    d = int(date[8:10]) if len(date) >= 10 else 15
    events.append({"id": eid, "date": date, "t": round(y + (mo - 1) / 12 + (d - 1) / 365, 3), "label": label,
                   "title": title, "desc": desc, "cat": cat, "era": era, "anchor": anchor(chid, phrase), "places": pl})
events.sort(key=lambda e: e["t"])

figures = [dict(f, anchor=anchor(*f["anchor"])) for f in FIGURES]

people = []
for pid, name, aliases, side, bio, place in PEOPLE:
    rx = re.compile(r"\b(" + "|".join(re.escape(a) for a in aliases) + r")\b")
    per = {c["id"]: len(rx.findall(all_text[c["id"]])) for c in book}
    per = {k: v for k, v in per.items() if v}
    first = None
    for c in book:
        for b in c["blocks"]:
            if rx.search(b["x"]):
                first = {"ch": c["id"], "b": b["id"], "pg": b["pg"]}
                break
        if first:
            break
    people.append({"id": pid, "name": name, "aliases": aliases, "side": side, "bio": bio, "place": place,
                   "total": sum(per.values()), "chapters": per, "anchor": first})

# biographical sketches: "Comrade X: ..." paragraphs in Part II ch. X and martyr headings in Part I ch. III
sketches = []
for c in book:
    if c["id"] == "p2c10":
        sec = ""
        for b in c["blocks"]:
            if b["t"] == "h":
                sec = b["x"]
            m = re.match(r"^(Comrades? [^:]{3,60}):\s", b["x"])
            if m:
                sketches.append({"name": m.group(1), "ch": c["id"], "b": b["id"], "pg": b["pg"], "area": sec,
                                 "text": b["x"][len(m.group(0)):][:360]})
    if c["id"] == "p1c3":
        on = False
        for i, b in enumerate(c["blocks"]):
            if b["t"] == "h" and "story of martyrs" in b["x"].lower():
                on = True
                continue
            if on and b["t"] == "h":
                nxt = next((x for x in c["blocks"][i + 1:] if x["t"] == "p"), None)
                sketches.append({"name": b["x"], "ch": c["id"], "b": b["id"], "pg": b["pg"], "area": "Against the Nizam",
                                 "text": (nxt["x"][:360] if nxt else "")})

glossary = []
for gid, term, defn in GLOSSARY:
    base = re.sub(r"\s*/.*$", "", term)
    rx = re.compile(r"\b" + re.escape(base.split()[0]) + r"\w*", re.I)
    n = sum(len(rx.findall(t)) for t in all_text.values())
    first = None
    for c in book:
        for b in c["blocks"]:
            if b["t"] != "h" and rx.search(b["x"]):
                first = {"ch": c["id"], "b": b["id"], "pg": b["pg"]}
                break
        if first:
            break
    glossary.append({"id": gid, "term": term, "def": defn, "count": n, "anchor": first})

# --------------------------------------------------------------------------
# 9. stats: themes per chapter, years mentioned
# --------------------------------------------------------------------------
themes = []
for tid, label, rx, color in THEMES:
    r = re.compile(rx, re.I if tid != "party" else 0)
    per = {}
    for c in book:
        n = len(r.findall(all_text[c["id"]]))
        per[c["id"]] = round(1000 * n / max(1, c["words"]), 2)
    themes.append({"id": tid, "label": label, "color": color, "per": per})

years = defaultdict(lambda: {"n": 0, "chapters": Counter(), "refs": []})
YR = re.compile(r"\b(19[0-7]\d)\b")
for c in book:
    for b in c["blocks"]:
        for y in set(YR.findall(b["x"])):
            yy = int(y)
            if 1900 <= yy <= 1972:
                years[yy]["n"] += 1
                years[yy]["chapters"][c["id"]] += 1
                if len(years[yy]["refs"]) < 30 and b["t"] != "h":
                    years[yy]["refs"].append([c["id"], b["id"]])
year_stats = [{"y": y, "n": v["n"], "chapters": dict(v["chapters"]), "refs": v["refs"]} for y, v in sorted(years.items())]

martyr_summary = {
    "entries": len(martyrs),
    "people": sum(e["count"] for e in martyrs),
    "byDistrict": dict(Counter({}) + Counter({k: 0 for k in []})),
}
bd = Counter()
for e in martyrs:
    bd[e["district"]] += e["count"]
martyr_summary["byDistrict"] = dict(bd.most_common())
by = Counter(e.get("year") or 0 for e in martyrs for _ in [0])
martyr_summary["byYear"] = {str(k): sum(e["count"] for e in martyrs if (e.get("year") or 0) == k) for k in sorted(by) if k}

# --------------------------------------------------------------------------
# 10. the book's 1948 movement map: georeference + traced zones
# --------------------------------------------------------------------------
from zones import ARROWS, CONTROL, ZONES  # noqa: E402
import numpy as np  # noqa: E402

A = np.array([[x, y, 1] for _, x, y, _, _ in CONTROL])
klat = np.linalg.lstsq(A, np.array([c[3] for c in CONTROL]), rcond=None)[0]
klon = np.linalg.lstsq(A, np.array([c[4] for c in CONTROL]), rcond=None)[0]


def geo(x, y):
    v = np.array([x, y, 1])
    return [round(float(v @ klat), 4), round(float(v @ klon), 4)]


W, H = 1298, 1063
corners = [geo(0, 0), geo(W, 0), geo(0, H), geo(W, H)]
movement_map = {
    "bounds": [[min(c[0] for c in corners), min(c[1] for c in corners)], [max(c[0] for c in corners), max(c[1] for c in corners)]],
    "zones": [{"id": z, "label": lbl, "kind": kind, "rings": [[geo(x, y) for x, y in ring] for ring in rings]}
              for z, lbl, kind, rings in ZONES],
    "arrows": [{"label": lbl, "path": [geo(x, y) for x, y in path]} for lbl, path in ARROWS],
}

# names index from the original extraction, classified + linked
place_alias = {a.lower(): p["id"] for p in places for a in p["aliases"]}
person_alias = {a.lower(): p["id"] for p in people for a in p["aliases"]}
PLACE_SUFFIX = re.compile(r"(pet|peta|palli|pally|gudem|puram|konda|abad|nagar|padu|peta|uru|ur|gutta|varam|pur|wada|pada|kota|du)$", re.I)
PERSON_HINT = re.compile(r"(Reddy|Reddi|Rao|ayya|ayyah|Sri |Comrade|Raju|Naidu|Narayan|ulu|amma)\b|\b(Sri|Smt|Com)\b", re.I)
index = []
STOP = {"People’s", "Secretariat", "Government", "Party", "Congress", "Comrade", "Committee", "Union", "Sri", "State"}
for n in json.loads(NAMES.read_text()):
    nm = n["name"]
    if nm in STOP or len(nm) < 4:
        continue
    low = nm.lower()
    if low in place_alias:
        typ, link = "place", place_alias[low]
    elif low in person_alias:
        typ, link = "person", person_alias[low]
    elif PERSON_HINT.search(nm):
        typ, link = "person", None
    elif PLACE_SUFFIX.search(nm.split()[-1]):
        typ, link = "place", None
    else:
        typ, link = "other", None
    rx = re.compile(r"\b" + re.escape(nm) + r"\b")
    per = {c["id"]: len(rx.findall(all_text[c["id"]])) for c in book}
    per = {k: v for k, v in per.items() if v}
    index.append({"name": nm, "type": typ, "link": link, "total": sum(per.values()), "chapters": per})
index.sort(key=lambda x: -x["total"])

if missing:
    print("UNRESOLVED ANCHORS:")
    for m in missing:
        print("  ", m)
    sys.exit(1)

# --------------------------------------------------------------------------
# write
# --------------------------------------------------------------------------
(DATA / "book.json").write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")))
(DATA / "martyrs.json").write_text(json.dumps({"summary": martyr_summary, "entries": martyrs}, ensure_ascii=False, separators=(",", ":")))
atlas = {
    "eras": ERAS, "categories": CATEGORIES, "events": events, "figures": figures, "places": places,
    "people": people, "sketches": sketches, "glossary": glossary, "themes": themes, "years": year_stats,
    "districtMap": MODERN_TO_HISTORIC, "movementMap": movement_map, "index": index,
    "toc": [{k: c[k] for k in ("id", "part", "partTitle", "num", "title", "short", "pages", "words", "mins")} |
            {"sections": c["sections"]} for c in book],
}
(DATA / "atlas.json").write_text(json.dumps(atlas, ensure_ascii=False, separators=(",", ":")))
print("chapters", len(book), "blocks", sum(len(c["blocks"]) for c in book),
      "headings", sum(len(c["sections"]) for c in book))
print("martyr entries", len(martyrs), "people", martyr_summary["people"], martyr_summary["byDistrict"])
print("events", len(events), "places", len(places), "people", len(people), "sketches", len(sketches))
