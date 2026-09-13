export function InfoPanel() {
  return (
    <div className="card info-panel">
      <div className="info-panel-section">
        <p className="info-label">What this does</p>
        <div className="info-item">
          <span className="info-icon">■</span>
          <span>Extracts a structured project brief from raw notes, capturing requirements, risks, open questions, and action items.</span>
        </div>
      </div>

      <hr className="divider" />

      <div className="info-panel-section">
        <p className="info-label">Output sections</p>
        {[
          { label: 'Project Overview', desc: 'Name, type, location, objective, stakeholders, timeline' },
          { label: 'Key Requirements', desc: 'Categorised by Design, Workplace Strategy, Engineering, Delivery, Operations' },
          { label: 'Open Questions', desc: 'Missing or ambiguous information flagged for follow-up' },
          { label: 'Risks & Dependencies', desc: 'Identified risks with severity and supporting evidence' },
          { label: 'Action Items', desc: 'Suggested next steps with owner and priority' },
          { label: 'AI Opportunities', desc: '3 areas where AI could assist this project workflow' },
        ].map(item => (
          <div key={item.label} className="info-item" style={{ marginBottom: '0.625rem' }}>
            <span style={{ color: 'var(--color-accent)', fontSize: '0.5rem', width: 16, flexShrink: 0, fontWeight: 600, marginTop: 4 }}>
              ■
            </span>
            <span>
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{item.label}</span>
              <br />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.desc}</span>
            </span>
          </div>
        ))}
      </div>

      <hr className="divider" />

      <div className="info-panel-section">
        <p className="info-label">AI principles</p>
        <div className="info-item">
          <span className="info-icon" style={{ fontSize: '0.5rem' }}>■</span>
          <span style={{ fontSize: '0.8125rem' }}>All outputs are grounded in your source material.</span>
        </div>
        <div className="info-item">
          <span className="info-icon" style={{ fontSize: '0.5rem' }}>■</span>
          <span style={{ fontSize: '0.8125rem' }}>Inferences are explicitly labelled for human review.</span>
        </div>
        <div className="info-item">
          <span className="info-icon" style={{ fontSize: '0.5rem' }}>■</span>
          <span style={{ fontSize: '0.8125rem' }}>Missing information is stated, not invented.</span>
        </div>
      </div>
    </div>
  );
}

