const EVENTS = [
  { date: "1946", title: "Peasant upsurge begins", desc: "Doddi Komarayya's martyrdom, July 4, 1946 — the spark that set afire the Telangana agrarian revolt." },
  { date: "1946-47", title: "Government terror", desc: "Mass arrests, armed police raids on villages, people's resistance." },
  { date: "Aug 15, 1947", title: "Distribution of land begins", desc: "Establishment of people's rule; gram raj committees; agrarian programme." },
  { date: "1947-48", title: "Collection of arms", desc: "Formation of regular guerrilla squads for armed resistance against Nizam and Razakars." },
  { date: "Sep 13, 1948", title: "Indian Army 'police action'", desc: "Entry of Indian Army into Hyderabad State; Nizam surrenders." },
  { date: "1948-51", title: "Terror regime", desc: "50,000-strong force deployed; mass butchery; concentration camps; rape and vandalism." },
  { date: "1949", title: "Partisan resistance", desc: "Guerrilla squads conduct 64 raids; 71 police/military killed; 42 informers/landlords liquidated." },
  { date: "1950", title: "Krishna & Godavari forests", desc: "Nallamala and Godavari forest regions sustain the movement; Koya people's support." },
  { date: "Nov 1950", title: "November Day & Peace Day", desc: "Mass mobilisation in the Krishna forest region." },
  { date: "1951", title: "Extension to Adilabad", desc: "Movement extends to Chennur-Siripur area in Adilabad district." },
  { date: "May 1951", title: "Central Committee meeting", desc: "Decision factors leading to withdrawal." },
  { date: "Oct 21, 1951", title: "Withdrawal of armed struggle", desc: "Telangana armed partisan resistance withdrawn." },
  { date: "1952", title: "First general elections", desc: "Communist Party emerges as single biggest opposition in Parliament." },
  { date: "1956", title: "Linguistic states", desc: "Formation of Andhra Pradesh; states reorganised on linguistic basis." },
];

export default function Timeline() {
  return (
    <div className="container">
      <h1 className="page-title">Timeline of the Struggle</h1>
      <p className="page-sub">Key events from 1946 to 1956.</p>
      <div className="card">
        <div className="timeline">
          {EVENTS.map((e, i) => (
            <div className="tl-item" key={i}>
              <div className="date">{e.date}</div>
              <div className="title">{e.title}</div>
              <div className="desc">{e.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
