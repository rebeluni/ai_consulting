import type { AIOpportunity } from '../../types';

interface Props { items: AIOpportunity[]; }

export function AIOpportunitiesSection({ items }: Props) {
  return (
    <div id="section-ai" className="results-section">
      <div className="section-title">AI Opportunities</div>
      <div className="section-subtitle">
        Suggested areas where AI could assist this project — feasibility and limitations noted
      </div>
      <div className="ai-opp-grid">
        {items.map((opp, i) => (
          <div key={i} className="ai-opp-card">
            <div className="ai-opp-meta">
              <span className={`badge badge-${opp.feasibility}`}>{opp.feasibility} feasibility</span>
            </div>
            <div className="ai-opp-title">{opp.opportunity}</div>
            <div className="ai-opp-benefit">{opp.potential_benefit}</div>
            <div className="ai-opp-caution">
              <span style={{ fontWeight: 600 }}>⚠ Limitation: </span>{opp.caution}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
