import ArchiveQuiz from "./ArchiveQuiz";
import { sample } from "../lib/quiz";

export default function EventQuiz({ atlas }) {
  const events = atlas?.events || [];
  if (events.length < 4) return null;
  return <ArchiveQuiz title="Event quiz" intro="Use the date and excerpt summary to identify each event."
    makeQuestions={() => sample(events, 10).map(e => ({
      prompt: `${e.label} · ${atlas.categories[e.cat].label} — ${e.desc}`,
      answer: e.title,
      options: sample([e.title, ...sample([...new Set(events.map(x => x.title))].filter(title => title !== e.title), 3)], 4),
    }))} />;
}
