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

const SIDE_COLOR = { people: "var(--red)", opponent: "#5b4636", state: "var(--violet)" };

/** Quiz on the People page: show a handful of contenders, pick the one
 *  described by a quote of the book. Feedback + score + link to the profile. */
export default function PeopleQuiz({ atlas }) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const people = useMemo(() => atlas?.people || [], [atlas]);

  const pool = useMemo(() => shuffle(people, 24680), [people]);
  const QN = 8;
  const q = pool[qi];
  const opts = useMemo(() => {
    if (!q) return [];
    const others = shuffle(people.filter((p) => p.id !== q.id).map((p) => p.name), 1357).slice(0, 6);
    return shuffle([...others, q.name], 888);
  }, [people, q]);

  const answer = (name) => {
    if (!q || picked) return;
    const right = name === q.name;
    if (right) setScore((s) => s + 1);
    setFeedback({ ok: right, text: right ? `Correct — ${q.name}` : `That was ${q.name}.` });
    if (qi + 1 >= QN) setFinished(true);
    else { setQi((i) => i + 1); setPicked(null); }
  };

  if (!atlas || !pool.length) return null;
  const qc = q ? SIDE_COLOR[q.side] || "var(--red)" : "var(--red)";
  return (
    <div className="card" style={{ maxWidth: 560, marginTop: 18 }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="panel-title">Fighters quiz</span>
        <span className="spacer" />
        {finished && <span className="chip" style={{ background: "var(--line)" }}>Score {score}/{QN}</span>}
      </div>
      {!started && (
        <>
          <p className="small muted" style={{ margin: 0 }}>{people.length} figures from the book. Name the one described.</p>
          <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
            <button className="btn sm" onClick={() => { setStarted(true); setFinished(false); setQi(0); setScore(0); setPicked(null); setFeedback(null); }}><Icon name="users" size={14} /> Start quiz</button>
          </div>
        </>
      )}
      {started && q && (
        <>
          <p className="small" style={{ fontWeight: 700, margin: "0 0 10px" }}>
            <span style={{ color: qc }}><Icon name="users" size={16} /> {q.name}</span>
          </p>
          <p className="small muted" style={{ marginBottom: 10 }}>{q.side} — mentioned in {Object.keys(q.chapters).length} chapters</p>
          <div className="chips" role="group" aria-label="Choose the person">
            {opts.map((name) => (
              <button key={name} className={`chip ${picked === name ? "on" : ""}`} disabled={!!picked} onClick={() => answer(name)}>{name}</button>
            ))}
          </div>
          {feedback && (
            <p role="status" aria-live="polite" style={{ marginTop: 10 }}>
              <b style={{ color: feedback.ok ? "var(--red)" : "var(--ink)" }}>{feedback.ok ? "✓ " : "✗ "}{feedback.text}</b>
              {feedback.ok && q && <> <Link to={`/people#${q.id}`}><Icon name="book" size={13} /> Their profile</Link></>}
            </p>
          )}
        </>
      )}
      {finished && (
        <div role="status" aria-live="polite" className="small">
          <p style={{ margin: 0 }}><b>You scored {score}/{QN}.</b></p>
          <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
            <button className="btn sm" onClick={() => { setFinished(false); setStarted(true); setQi(0); setScore(0); setPicked(null); setFeedback(null); }}>Restart <Icon name="users" size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
