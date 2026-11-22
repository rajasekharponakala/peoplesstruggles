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

/** Quiz: given a shuffled event, pick the event whose label matches.
 *  Immediate feedback + score, restartable. Uses only atlas data. */
export default function EventQuiz({ atlas }) {
  const events = atlas.events;
  const C = atlas.categories;
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const pool = useMemo(() => shuffle(events, 12345), [events]);
  const QN = 10;
  const q = pool[qi];
  const opts = useMemo(() => {
    if (!q) return [];
    const others = shuffle(events.filter((e) => e.id !== q.id), 6789).slice(0, 3);
    return shuffle([...others, q], 7654);
  }, [events, q]);

  const start = () => {
    setStarted(true); setFinished(false); setQi(0); setScore(0); setPicked(null); setAnswered(false); setFeedback(null);
  };
  const pick = (o) => {
    if (answered || !q) return;
    setPicked(o.id);
    setAnswered(true);
    const right = o.id === q.id;
    if (right) setScore((s) => s + 1);
    const fb = right ? { ok: true, text: `Correct — the event is: ${q.title}` } : { ok: false, text: `No, that was: ${q.title}` };
    setFeedback(fb);
    if (qi + 1 >= pool.length) setFinished(true);
    else { setPicked(null); setAnswered(false); setQi(qi + 1); }
  };
  const restart = () => { setFinished(false); start(); };

  if (!atlas || events.length < QN) return null;
  return (
    <div className="card" style={{ maxWidth: 560, marginTop: 18 }}>
      <div className="row" style={{ marginBottom: 10 }}><span className="panel-title">Event quiz</span><span className="spacer" />{finished && <span className="chip" style={{ background: "var(--line)" }}>Score {score}/{QN}</span>}</div>
      {!started && (
        <>
          <p className="small muted" style={{ margin: 0 }}>{QN} random events from the timeline. Pick the one described by the date and category.</p>
          <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
            <button className="btn sm" onClick={start}><Icon name="play" size={14} /> Start quiz</button>
          </div>
        </>
      )}
      {started && !finished && q && (
        <>
          <p className="small" style={{ fontWeight: 700, margin: "0 0 10px" }}>
            {q.label} — <span style={{ color: C[q.cat].color }}>{C[q.cat].label}</span>
          </p>
          <div className="chips" role="group" aria-label="Choose the event">
            {opts.map((o) => (
              <button key={o.id} className={`chip ${picked === o.id ? "on" : ""}`} style={{ "--c": C[o.cat].color }} disabled={answered} onClick={() => pick(o)}>
                <span className="dot" style={{ background: C[o.cat].color }} /> {o.title}
              </button>
            ))}
          </div>
          {feedback && (
            <p role="status" aria-live="polite" style={{ marginTop: 10 }}>
              <b style={{ color: feedback.ok ? "var(--red)" : "var(--ink)" }}>{feedback.ok ? "✓ " : "✗ "}{feedback.text}</b>
              {q.desc && <> · <span className="muted">{q.desc.slice(0, 150)}…</span></>}
            </p>
          )}
        </>
      )}
      {finished && (
        <div role="status" aria-live="polite" className="small">
          <p style={{ margin: 0 }}><b>You scored {score}/{QN}.</b></p>
          <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
            <button className="btn sm" onClick={restart}>Restart <Icon name="play" size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
