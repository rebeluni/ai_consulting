export function PrototypeNotes() {
  return (
    <div className="prototype-notes">
      <div className="prototype-notes-title">Prototype Notes &amp; AI Quality</div>
      <div className="prototype-notes-grid">
        <div>
          <div className="pn-section-title">How outputs are generated</div>
          <ul className="pn-list">
            {[
              'All outputs are generated from the text you supply — no external data sources are used.',
              'Source grounding reduces unsupported claims: evidence is extracted from the input material.',
              'Inferences are explicitly labelled and require human validation before use.',
              'Human review (Confirm / Edit / Dismiss) is built into every output item.',
              'This is a prototype using synthetic, fictional project data only.',
            ].map((item, i) => (
              <li key={i}><span className="pn-dot" /> {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="pn-section-title">Known limitations</div>
          <ul className="pn-list">
            {[
              'LLM outputs may contain errors or misinterpretations — treat as a starting point.',
              'Ambiguous requirements may be categorised or interpreted inconsistently.',
              'Professional project decisions require human validation and expert review.',
              'Do not enter confidential, proprietary, or real client information into this prototype.',
              'AI Q&A answers are scoped to the submitted notes and may miss nuance.',
            ].map((item, i) => (
              <li key={i}><span className="pn-dot" style={{ background: '#fca5a5' }} /> {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
