import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "../components/Icons";
import { Loading, PageHead } from "../components/Layout";
import { HBars } from "../components/Viz";
import { fmtNum, pdfPage, useAtlas, useMartyrs } from "../lib/data";
import { highlight } from "../lib/text";

const TELANGANA = new Set(["Nalgonda", "Warangal", "Khammam", "Karimnagar", "Mahbubnagar", "Other Telangana"]);

function useFiltered(entries, { q, district, period }) {
  return useMemo(() => {
    const ql = q.trim().toLowerCase();
    return entries.filter((e) =>
      (!district || e.district === district) &&
      (!period || e.period === period) &&
      (!ql || `${e.name} ${e.village} ${e.remarks} ${e.taluka}`.toLowerCase().includes(ql)));
  }, [entries, q, district, period]);
}

function placeIndex(atlas) {
  const m = new Map();
  atlas?.places.forEach((p) => p.aliases.forEach((a) => m.set(a.toLowerCase(), p.id)));
  return m;
}

export function MartyrTable({ rows, q, atlas, limit = 2000 }) {
  const pidx = useMemo(() => placeIndex(atlas), [atlas]);
  let lastGroup = "";
  const out = [];
  rows.slice(0, limit).forEach((e) => {
    const g = `${e.district} · ${e.taluka} · ${e.period}`;
    if (g !== lastGroup) {
      lastGroup = g;
      out.push(
        <tr className="group" key={`g${e.i}`}>
          <td colSpan={5}>{e.taluka === e.district ? e.district : `${e.taluka}`} <span className="small muted" style={{ fontFamily: "var(--sans)", fontWeight: 500 }}>· {e.district} district · {e.period === "Razakar days" ? "during Razakar days" : "after the police action"}</span></td>
        </tr>
      );
    }
    const vp = pidx.get(e.village.split(/[ ,(]/)[0].toLowerCase());
    out.push(
      <tr key={e.i}>
        <td className="num">{e.num}{e.count > 1 ? <div className="tiny">{e.count} people</div> : null}</td>
        <td className="name">
          {highlight(e.name, q)}
          {e.sketch && <Link to={`/read/${e.sketch}?q=${encodeURIComponent(e.name.split(" ").slice(-1)[0])}`} className="tag" style={{ marginLeft: 8 }} title="This comrade has a biographical sketch in the book">sketch →</Link>}
        </td>
        <td>{vp ? <Link to={`/map?place=${vp}`}>{highlight(e.village, q)}</Link> : highlight(e.village, q)}</td>
        <td>{highlight(e.remarks, q)}</td>
        <td className="num"><a href={pdfPage(e.page)} target="_blank" rel="noreferrer" title="Open source page">p. {e.page}</a>{e.date ? <div className="tiny">{e.date.split("-").reverse().join(".")}</div> : null}</td>
      </tr>
    );
  });
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>No.</th><th>Name</th><th>Village / place</th><th>Remarks in the book</th><th>Source</th></tr></thead>
        <tbody>{out}</tbody>
      </table>
    </div>
  );
}

export function MartyrsInline() {
  const { data } = useMartyrs();
  const { data: atlas } = useAtlas();
  if (!data) return <Loading />;
  return (
    <div>
      <div className="callout" style={{ marginBottom: 18 }}>
        Appendix I lists those who laid down their lives, district by district and taluka by taluka. Here it is shown as a structured table
        of {fmtNum(data.summary.entries)} entries naming or counting {fmtNum(data.summary.people)} people. <Link to="/martyrs"><b>Open the full memorial with charts and filters →</b></Link>
      </div>
      <MartyrTable rows={data.entries} q="" atlas={atlas} />
    </div>
  );
}

export default function Martyrs() {
  const { data } = useMartyrs();
  const { data: atlas } = useAtlas();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState("table");
  const q = params.get("q") || "";
  const district = params.get("district") || "";
  const period = params.get("period") || "";
  const set = (k, v) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n, { replace: true }); };
  const rows = useFiltered(data?.entries || [], { q, district, period });

  if (!data) return <Loading />;
  const S = data.summary;
  const total = rows.reduce((a, e) => a + e.count, 0);
  const tg = Object.entries(S.byDistrict).filter(([d]) => TELANGANA.has(d)).reduce((a, [, v]) => a + v, 0);
  const razakar = data.entries.filter((e) => e.period === "Razakar days").reduce((a, e) => a + e.count, 0);
  const talukas = {};
  data.entries.forEach((e) => { talukas[`${e.taluka}`] = (talukas[e.taluka] || 0) + e.count; });
  const topT = Object.entries(talukas).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const years = Object.entries(S.byYear);
  const ymax = Math.max(...years.map(([, v]) => v));
  const rowSet = new Set(rows);
  const named = data.entries.filter((e) => e.count === 1 && !/^(one|a|an|another|his|names?)\b/i.test(e.name) && e.name.length > 2);

  return (
    <>
      <PageHead eyebrow="Appendix I · A memorial" title="Martyrs of the Struggle">
        "As many as 4,000 Communists and peasant militants were killed." The book names or counts {fmtNum(S.people)} of them in{" "}
        {fmtNum(S.entries)} entries, district by district. The book itself says thousands more were never recorded.
      </PageHead>
      <div className="wrap">
        <div className="grid g4" style={{ marginBottom: 22 }}>
          <div className="figure-card tone-loss"><span className="v">{fmtNum(S.people)}</span><span className="u">people</span><span className="l">named or counted in Appendix I</span></div>
          <div className="figure-card tone-loss"><span className="v">{fmtNum(tg)}</span><span className="u">in Telangana</span><span className="l">Nalgonda, Warangal, Khammam, Karimnagar…</span></div>
          <div className="figure-card tone-context"><span className="v">{fmtNum(S.people - tg)}</span><span className="u">in Andhra</span><span className="l">Krishna, Guntur, the Godavaris, the 'rear'</span></div>
          <div className="figure-card tone-context"><span className="v">{fmtNum(razakar)}</span><span className="u">Razakar days</span><span className="l">killed before the Indian Army entered</span></div>
        </div>

        <div className="grid g3" style={{ marginBottom: 28 }}>
          <div className="card">
            <h4 className="panel-title">By district</h4>
            <HBars items={Object.entries(S.byDistrict).map(([d, v]) => ({ label: d, value: v, color: TELANGANA.has(d) ? "var(--red)" : "var(--ochre)", to: `/martyrs?district=${encodeURIComponent(d)}` }))} />
          </div>
          <div className="card">
            <h4 className="panel-title">Hardest-hit talukas</h4>
            <HBars items={topT.map(([t, v]) => ({ label: t, value: v, color: "var(--red)" }))} />
            <p className="tiny muted" style={{ margin: "8px 0 0" }}>Includes collective entries such as "about 300 shot dead in Gadipadu and Gundala camps".</p>
          </div>
          <div className="card">
            <h4 className="panel-title">Dated deaths by year</h4>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 150, padding: "0 4px" }}>
              {years.map(([y, v]) => (
                <div key={y} style={{ flex: 1, textAlign: "center" }}>
                  <div className="tiny" style={{ fontWeight: 700 }}>{v}</div>
                  <div style={{ height: `${(110 * v) / ymax}px`, background: "var(--red)", borderRadius: "4px 4px 0 0", marginTop: 4 }} />
                  <div className="tiny muted" style={{ marginTop: 4 }}>{y}</div>
                </div>
              ))}
            </div>
            <p className="tiny muted" style={{ margin: "10px 0 0" }}>Only entries whose remarks carry a date. 1950, the height of the military terror, stands out.</p>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 14 }}>
          <input className="input" style={{ maxWidth: 340 }} placeholder="Search a name, village or remark…" value={q} onChange={(e) => set("q", e.target.value)} />
          <select className="input" style={{ maxWidth: 220 }} value={district} onChange={(e) => set("district", e.target.value)} aria-label="District">
            <option value="">All districts</option>
            {Object.keys(S.byDistrict).map((d) => <option key={d}>{d}</option>)}
          </select>
          <div className="seg" role="group" aria-label="Period">
            {[["", "All"], ["Razakar days", "Razakar days"], ["After police action", "After police action"]].map(([v, l]) => (
              <button key={l} className={period === v ? "on" : ""} onClick={() => set("period", v)}>{l}</button>
            ))}
          </div>
          <span className="spacer" />
          <div className="seg">
            <button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>Table</button>
            <button className={view === "wall" ? "on" : ""} onClick={() => setView("wall")}>Wall of names</button>
          </div>
        </div>
        <p className="small muted">{fmtNum(rows.length)} entries · {fmtNum(total)} people{(q || district || period) && <> · <button className="chip" onClick={() => setParams({})}>Clear filters</button></>}</p>

        {view === "table" ? (
          <MartyrTable rows={rows} q={q} atlas={atlas} />
        ) : (
          <div className="card pad-lg">
            <div className="wall">
              {named.filter((e) => rowSet.has(e)).map((e) => <span key={e.i} title={`${e.village}${e.village ? ", " : ""}${e.taluka} — ${e.remarks}`}>{e.name}</span>)}
            </div>
            <p className="tiny muted" style={{ marginTop: 16 }}><Icon name="flame" size={13} className="flame" /> Individual names only. Collective entries ("five persons", "about 300…") appear in the table.</p>
          </div>
        )}
        <p className="tiny muted" style={{ marginTop: 14 }}>
          Parsed from the multi-column tables on pp. 315–348 of the PDF. Ditto marks (",,") are filled in from the row above. Some long remarks
          may be split imperfectly, so each row links to its source page.
        </p>
      </div>
    </>
  );
}
