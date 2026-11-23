import { useState } from "react";

export default function ArchiveQuiz({ title, intro, makeQuestions }) {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const start = () => { setQuestions(makeQuestions()); setIndex(0); setPicked(null); setScore(0); };
  const q = questions[index];
  return <section className="card" aria-label={title} style={{ maxWidth: 560, marginTop: 18 }}>
    <h3 className="panel-title">{title}</h3>
    {!questions.length ? <>
      <p className="small muted">{intro}</p>
      <button type="button" className="btn sm" onClick={start}>Start quiz</button>
    </> : q ? <>
      <p className="small muted">Question {index + 1} of {questions.length}</p>
      <p>{q.prompt}</p>
      <div className="chips" role="group" aria-label="Choose an answer">
        {q.options.map(option => <button type="button" key={option} className={`chip ${picked === option ? "on" : ""}`}
          aria-disabled={picked !== null} onClick={() => {
            if (picked !== null) return;
            setPicked(option);
            if (option === q.answer) setScore(s => s + 1);
          }}>{option}</button>)}
      </div>
      <div role="status">{picked !== null && <p><b>{picked === q.answer ? "Correct!" : `Answer: ${q.answer}.`}</b> {q.more}</p>}</div>
      {picked !== null && <button type="button" className="btn sm" onClick={() => { setPicked(null); setIndex(i => i + 1); }}>
        {index + 1 === questions.length ? "See results" : "Next question"}
      </button>}
    </> : <>
      <p role="status">You scored {score}/{questions.length}.</p>
      <button type="button" className="btn sm" onClick={start}>Restart</button>
    </>}
  </section>;
}
