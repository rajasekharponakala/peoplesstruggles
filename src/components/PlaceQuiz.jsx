import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import Icon from "./Icons";

function shuffle(arr, seed) {
  const a = arr.slice();
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = ((s * 1103515245 + 12345) & 0x7fffffff) || 1;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Quiz on the Atlas page: the book sometimes spells places differently
 *  (Illendu, Yellandu). Show the book spelling, pick the modern name. */
export default function PlaceQuiz({ atlas }) {
  const places = useMemo(() => atlas?.places || [], [atlas]);
  const eligible = useMemo(
    () => places.filter((p) => p.aliases.some((a) => a.toLowerCase() !== p.name.toLowerCase())),
    [places]
  );
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const pool = useMemo(() => (eligible.length ? shuffle(eligible, 90210) : []), [eligible]);
  const QN = 8;
  const q = pool[qi];
  const bookSpelling = q && (q.aliases.find((a) => a.toLowerCase() !== q.name.toLowerCase()) || q.aliases[1]);
  const opts = useMemo(() => {
    if (!q) return [];
    const others = shuffle(places.filter((p) => p.id !== q.id).map((p) => p.name), 31415).slice(0, 5);
    return shuffle([...others, q.name], 777);
  }, [places, q]);

  const start = () => { setStarted(true); setFinished(false); setQi(0); setScore(0); setPicked(null); setFeedback(null); };

  const answer = (name) => {
    if (!q || picked) return;
    setPicked(name);
    const right = name === q.name;
    if (right) setScore((s) => s + 1);
    setFeedback({
      ok: right,
      text: right ? `Correct — that is ${q.name}` : `That was ${q.name}. The book also spells it ${q.aliases.join(", ")}.`,
    });
    if (qi + 1 >= QN) setFinished(true);
    else { setQi((i) => i + 1); setPicked(null); }
  };

  if (!atlas || !pool.length) return null;
  return (
    <div className="card" style={{ maxWidth: 560, marginTop: 18 }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="panel-title">Name the places quiz</span>
        <span className="spacer" />
        {finished && <span className="chip" style={{ background: "var(--line)" }}>Score {score}/{QN}</span>}
      </div>
      {!started && (
        <>
          <p className="small muted" style={{ margin: 0 }}>The book calls many places by older spellings. Pick the modern name for the one shown.</p>
          <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
            <button className="btn sm" onClick={start}><Icon name="glossary" size={14} /> Start quiz</button>
          </div>
        </>
      )}
      {started && q && (
        <>
          <p className="small" style={{ fontWeight: 700, margin: "0 0 10px" }}>
            The book spells this place: <b style={{ color: "var(--red)" }}>{bookSpelling}</b>
          </p>
          <div className="chips" role="group" aria-label="Choose the place name">
            {opts.map((name) => (
              <button key={name} className={`chip ${picked === name ? "on" : ""}`} disabled={!!picked} onClick={() => answer(name)}>{name}</button>
            ))}
          </div>
          {feedback && (
            <p role="status" aria-live="polite" style={{ marginTop: 10 }}>
              <b style={{ color: feedback.ok ? "var(--red)" : "var(--ink)" }}>{feedback.ok ? "✓ " : "✗ "}{feedback.text}</b>
              {feedback.ok && q && <> <Link to={`/map?place=${q.id}`}><Icon name="map" size={13} /> Open on the map</Link></>}
            </p>
          )}
        </>
      )}
      {finished && (
        <div role="status" aria-live="polite" className="small">
          <p style={{ margin: 0 }}><b>You scored {score}/{QN}.</b></p>
          <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
            <button className="btn sm" onClick={start}>Restart <Icon name="glossary" size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
