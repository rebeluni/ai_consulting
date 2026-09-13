import type { ProjectOverview as ProjectOverviewType } from '../../types';

interface Props { data: ProjectOverviewType; }

export function ProjectOverview({ data }: Props) {
  return (
    <div id="section-overview" className="results-section">
      <div className="section-title">Project Overview</div>
      <div className="section-subtitle">Extracted from source material</div>
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="overview-grid">
          {[
            { label: 'Project Name', value: data.project_name },
            { label: 'Project Type', value: data.project_type },
            { label: 'Location',     value: data.location },
            { label: 'Timeline',     value: data.timeline },
          ].map(f => (
            <div key={f.label} className="overview-field">
              <label>{f.label}</label>
              <p>{f.value || 'Not specified in source material.'}</p>
            </div>
          ))}
        </div>

        <div className="overview-objective" style={{ marginTop: '1rem' }}>
          <div className="overview-field">
            <label>Project Objective</label>
            <p style={{ marginTop: '0.25rem', lineHeight: 1.7 }}>{data.project_objective}</p>
          </div>
        </div>

        {data.key_stakeholders?.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-soft)' }}>
            <div className="overview-field">
              <label>Key Stakeholders</label>
              <div className="stakeholder-list" style={{ marginTop: '0.375rem' }}>
                {data.key_stakeholders.map((s, i) => (
                  <span key={i} className="tag">{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
