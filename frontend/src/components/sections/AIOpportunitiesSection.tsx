import type { AIOpportunity } from '../../types';

interface Props { items: AIOpportunity[]; }

// Color tokens for recommendation badge
const recClass: Record<string, string> = {
  'Pilot':           'badge-Low',    // green — go
  'Explore':         'badge-Medium', // amber — cautious
  'Defer':           'badge-Medium',
  'Not recommended': 'badge-High',   // red — stop
};

// Compact attribute row: label + value chip
function AttrCell({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  const colorClass =
    value === 'High'   ? 'ai-attr-high'   :
    value === 'Medium' ? 'ai-attr-medium' :
    value === 'Low'    ? 'ai-attr-low'    :
    value === 'Yes'    ? 'ai-attr-high'   :
    value === 'No'     ? 'ai-attr-low'    : '';
  return (
    <div className="ai-attr-cell">
      <span className="ai-attr-label">{label}</span>
      <span className={`ai-attr-value ${colorClass}`}>{value}</span>
    </div>
  );
}

export function AIOpportunitiesSection({ items }: Props) {
  return (
    <div id="section-ai" className="results-section">
      <div className="section-title">AI Opportunities</div>
      <div className="section-subtitle">
        Structured assessment of where AI could assist this project — review feasibility and limitations before acting
      </div>
      <div className="ai-opp-grid">
        {items.map((opp, i) => (
          <div key={i} className="ai-opp-card">

            {/* Header: title + top-level badges */}
            <div className="ai-opp-header">
              <div className="ai-opp-title">{opp.opportunity}</div>
              <div className="ai-opp-badges">
                <span className={`badge badge-${opp.feasibility}`}>{opp.feasibility} feasibility</span>
                {opp.recommendation && (
                  <span className={`badge ${recClass[opp.recommendation] ?? 'badge-Medium'}`}>
                    {opp.recommendation}
                  </span>
                )}
              </div>
            </div>

            {/* Assessment attribute grid — only shown when new fields are present */}
            {(opp.potential_value || opp.effort || opp.data_availability || opp.risk) && (
              <div className="ai-attr-grid">
                <AttrCell label="Value"      value={opp.potential_value} />
                <AttrCell label="Effort"     value={opp.effort} />
                <AttrCell label="Data avail" value={opp.data_availability} />
                <AttrCell label="Oversight"  value={opp.human_oversight_required} />
                <AttrCell label="Risk"       value={opp.risk} />
              </div>
            )}

            {/* Supporting prose */}
            <div className="ai-opp-benefit">{opp.potential_benefit}</div>
            <div className="ai-opp-caution">
              <span style={{ fontWeight: 600 }}>Limitation: </span>{opp.caution}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
