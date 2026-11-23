import { Link } from "react-router-dom";
import ArchiveQuiz from "./ArchiveQuiz";
import { sample } from "../lib/quiz";

export default function PeopleQuiz({ atlas }) {
  const people = (atlas?.people || []).filter(p => p.bio);
  if (people.length < 4) return null;
  return <ArchiveQuiz title="People quiz" intro="Use each biographical clue to identify a figure from the book."
    makeQuestions={() => sample(people, 8).map(p => ({
      prompt: p.bio, answer: p.name,
      options: sample([p.name, ...sample([...new Set(people.map(x => x.name))].filter(name => name !== p.name), 3)], 4),
      more: <Link to={`/people#${p.id}`}>Read {p.name}’s profile</Link>,
    }))} />;
}
