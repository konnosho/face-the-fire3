import { useState, useEffect } from "react";
import cover from "./assets/cover.webp";
import magnifier from "./assets/magnifier.webp";
import umbrella from "./assets/umbrella.webp";
import fire from "./assets/fire.webp";

const TOOLKIT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSffGmJsAeaoNUueQtWu02ARcitjj3Ha5V_kYZyZS5dpiisj3Q/viewform";

const TYPES = {
  misrepresentation: { label: "Exposé misrepresentation", dilemma: "Correct the record, confront the attackers, or pivot to the underlying debate?", img: magnifier },
  ally: { label: "Ally exposed to attack", dilemma: "Distance yourself or stand in solidarity, and how?", img: umbrella },
  mistake: { label: "Opposition jumps on a mistake", dilemma: "Apologise or acknowledge, and how does that affect your response to the core attack?", img: fire },
};

const KEY = [
  ["N", "Invented name or detail: swap for your own"],
  ["T", "External threat: who is attacking, and how"],
  ["D", "Internal dilemma trigger: what makes your team disagree"],
  ["A", "Real-world anchor: a real forum, platform or trend"],
  ["E", "Escalation trigger: pushes you past the threshold to respond"],
];

const FIELDS = [
  { id: "context", label: "Context", ph: "e.g. HRC Geneva", chips: ["HRC Geneva", "EU Brussels", "CSW New York", "UNGA", "National / domestic"] },
  { id: "group", label: "Who is the group under pressure?", ph: "e.g. a Geneva-based SRHR NGO", chips: ["An SRHR NGO", "An LGBTQI organisation", "A civil society coalition", "A UN agency", "A member state delegation"] },
  { id: "opposition", label: "What kind of opposition do you face?", ph: "e.g. an anti-gender campaign group", chips: ["An anti-gender campaign group", "An influencer", "A newspaper or broadcaster", "A politician", "Online harassment"] },
  { id: "issue", label: "Issue area", ph: "e.g. comprehensive sexuality education", chips: ["Sexuality education", "Abortion access", "Trans rights", "NGO accreditation or funding"] },
  { id: "avoid", label: "Anything to avoid?", ph: "e.g. avoid election contexts", chips: [] },
];

const MARK = /\[\[([NTDAE]):\s*(.+?)\]\]/g;
const strip = (t) => t.replace(MARK, "$2").replace(/\[\[|\]\]/g, "");

function Marked({ text }) {
  const out = [];
  let last = 0, m, i = 0;
  const re = new RegExp(MARK.source, "g");
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index).replace(/\[\[|\]\]/g, ""));
    out.push(<mark key={i++} className={`hl hl-${m[1]}`}>{m[2]}</mark>);
    last = re.lastIndex;
  }
  out.push(text.slice(last).replace(/\[\[|\]\]/g, ""));
  return <p>{out}</p>;
}

const collect = (stages, code) => {
  const found = [];
  stages.forEach((s) => {
    const re = new RegExp(MARK.source, "g");
    let m;
    while ((m = re.exec(s.text))) if (m[1] === code && !found.includes(m[2])) found.push(m[2]);
  });
  return found;
};

export default function App() {
  const [step, setStep] = useState("home");
  const [vals, setVals] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const generate = async (mode) => {
    setError(""); setStep("loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, fields: mode === "custom" ? vals : {} }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || "Something went wrong. Please try again.");
      setResult(data); setStep("result");
    } catch (e) {
      setError(e.message); setStep(mode === "custom" ? "form" : "home");
    }
  };

  const copy = async (kind) => {
    const clean = result.stages.map((s) => `${s.name}\n${strip(s.text)}`).join("\n\n");
    const full = kind === "notes"
      ? result.stages.map((s) => `${s.name}\n${strip(s.text)}\nHow it's built: ${s.note}`).join("\n\n") + `\n\nWhat this tests: ${result.tests}`
      : clean;
    try { await navigator.clipboard.writeText(full); setCopied(kind); setTimeout(() => setCopied(""), 2000); } catch { setError("Copying isn't available in this browser. Select the text and copy it instead."); }
  };

  const toggleChip = (id, chip) => setVals((v) => ({ ...v, [id]: v[id] === chip ? "" : chip }));

  const type = result && (TYPES[result.type] || TYPES.misrepresentation);
  const swap = result ? [...collect(result.stages, "N"), ...collect(result.stages, "A")] : [];

  return (
    <div className="wrap">
      <div className="warn" role="note">
        <strong>Before you use this tool:</strong> This generator is programmed with anonymised examples of real scenarios designed by experts and activists. Do not enter any information that is not already in the public domain, or that you would not want in the public domain. This tool runs on Mistral AI, a European provider. What you type is sent to Mistral to generate the scenario, and our server does not save it. The same precautions apply as with any AI system.
      </div>

      <header className="title-block">
        <h1>Face the Fire:</h1>
        <p>Scenario generator</p>
      </header>
      <p className="tagline">Role-play scenarios of anti-rights comms threats. Practise in private, based on the <a href={TOOLKIT_URL} target="_blank" rel="noopener noreferrer">Face the Fire toolkit</a>.</p>

      {error && step !== "loading" && <div className="err" role="alert">{error}</div>}

      {step === "home" && (
        <section>
          <img className="cover" src={cover} alt="Illustration of activists role-playing a media crisis while shadowy figures surround the room" />
          <div className="btn-row">
            <button className="btn btn-main" onClick={() => generate("random")}>Generate a completely random scenario</button>
            <button className="btn btn-alt" onClick={() => setStep("form")}>Let me customise my scenario</button>
          </div>
          <p className="intro-note">Every scenario combines an external attack with an internal dilemma, because that combination is what most often causes a real communications crisis. Each one runs from background, to development, to incident, and shows how it was constructed so you can adapt it.</p>
        </section>
      )}

      {step === "form" && (
        <section>
          <h2>Customise your scenario</h2>
          <p className="lede">Type your own answers, or tap an option to fill the box. Everything is optional: anything you leave blank is chosen for you, including the type of scenario. You can describe organisations or people instead of naming them if you prefer.</p>
          {FIELDS.map((f) => (
            <div className="field" key={f.id}>
              <label htmlFor={f.id}>{f.label}</label>
              <input id={f.id} maxLength={200} placeholder={f.ph} value={vals[f.id] || ""} onChange={(e) => setVals({ ...vals, [f.id]: e.target.value })} />
              {f.chips.length > 0 && (
                <div className="chips">
                  {f.chips.map((c) => (
                    <button key={c} type="button" className="chip" aria-pressed={vals[f.id] === c} onClick={() => toggleChip(f.id, c)}>{c}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => setStep("home")}>Back</button>
            <button className="btn btn-main" onClick={() => generate("custom")}>Generate my scenario</button>
          </div>
        </section>
      )}

      {step === "loading" && (
        <section className="loading" aria-live="polite">
          <h2>Building your scenario</h2>
          <p>Writing the background, development and incident</p>
          <div className="bar" />
        </section>
      )}

      {step === "result" && result && (
        <section>
          <div className="result-head">
            <img src={type.img} alt="" />
            <div><span className="type-pill">{type.label}</span></div>
          </div>

          <div className="key">
            <h3>How to read this scenario</h3>
            <ul>{KEY.map(([c, t]) => <li key={c}><span className={`sw-${c}`}>&nbsp;&nbsp;</span>{t}</li>)}</ul>
          </div>

          {result.stages.map((s) => (
            <article className="stage" key={s.name}>
              <div className={`stage-tab tab-${s.name}`}>{s.name[0] + s.name.slice(1).toLowerCase()}</div>
              <div className="stage-body"><Marked text={s.text} /></div>
              {s.note && <div className="stage-note"><b>How it's built: </b>{s.note}</div>}
            </article>
          ))}

          <div className="tests">
            <h3>What this scenario tests</h3>
            <p>{result.tests || type.dilemma}</p>
            <p><b>Key choice:</b> {type.dilemma}</p>
          </div>

          {swap.length > 0 && (
            <div className="adapt">
              <h3>Adapt it</h3>
              <p>Swap these invented or real-world details for your own context: {swap.join("; ")}.</p>
              <p>The orange and red highlights are the engine of the scenario, so keep them when you change the setting.</p>
            </div>
          )}

          <div className="btn-row">
            <button className="btn btn-main" onClick={() => copy("clean")}>{copied === "clean" ? "Copied" : "Copy scenario"}</button>
            <button className="btn btn-alt" onClick={() => copy("notes")}>{copied === "notes" ? "Copied" : "Copy with notes"}</button>
            <button className="btn btn-ghost" onClick={() => generate("random")}>Another random one</button>
            <button className="btn btn-ghost" onClick={() => setStep("form")}>Customise</button>
          </div>
        </section>
      )}

      <footer className="foot">Face the Fire · Scenario generator · Illustrations by Vidushi Yadav (@Vidushiy)</footer>
    </div>
  );
}
