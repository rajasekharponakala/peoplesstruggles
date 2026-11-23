import { Link } from "react-router-dom";
import ArchiveQuiz from "./ArchiveQuiz";
import { sample } from "../lib/quiz";

export default function PlaceQuiz({ atlas }) {
  const places = atlas?.places || [];
  const aliases = places.flatMap(p => {
    const alias = p.aliases.find(a => a.toLowerCase() !== p.name.toLowerCase() &&
      !places.some(other => other !== p && [other.name, ...other.aliases].some(name => name.toLowerCase() === a.toLowerCase())));
    return alias ? [{ p, alias }] : [];
  });
  if (!aliases.length) return null;
  return <ArchiveQuiz title="Name the places quiz" intro="Match alternate spellings used in the source to their names in the atlas."
    makeQuestions={() => sample(aliases, 8).map(({ p, alias }) => ({
      prompt: `How is “${alias}” listed in the atlas?`, answer: p.name,
      options: sample([p.name, ...sample([...new Set(places.map(x => x.name))].filter(name => name !== p.name), 3)], 4),
      more: <Link to={`/map?place=${p.id}`}>Open {p.name} on the map</Link>,
    }))} />;
}
