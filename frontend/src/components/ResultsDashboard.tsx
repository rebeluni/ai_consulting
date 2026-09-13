import { useMemo } from 'react';
import type { ProjectBrief, ReviewMap, ReviewStatus, EvidenceSpan } from '../types';
import { ProjectOverview } from './sections/ProjectOverview';
import { RequirementsSection } from './sections/RequirementsSection';
import { OpenQuestionsSection } from './sections/OpenQuestionsSection';
import { RisksSection } from './sections/RisksSection';
import { ActionItemsSection } from './sections/ActionItemsSection';
import { AIOpportunitiesSection } from './sections/AIOpportunitiesSection';
import { QASection } from './sections/QASection';
import { PrototypeNotes } from './PrototypeNotes';

interface Props {
  brief: ProjectBrief;
  reviewMap: ReviewMap;
  onReview: (id: string, status: ReviewStatus, edited?: string) => void;
  onHighlight: (span: EvidenceSpan | null) => void;
  projectText: string;
  onExport: () => void;
}

const SECTIONS = [
  { id: 'section-overview',     label: 'Overview' },
  { id: 'section-requirements', label: 'Requirements' },
  { id: 'section-questions',    label: 'Open Questions' },
  { id: 'section-risks',        label: 'Risks' },
  { id: 'section-actions',      label: 'Actions' },
  { id: 'section-ai',           label: 'AI Opportunities' },
  { id: 'section-qa',           label: 'Q&A' },
];

/** Compute reliability stats from the brief — pure client-side, no extra API call. */
function useReliabilityStats(brief: ProjectBrief, reviewMap: ReviewMap) {
  return useMemo(() => {
    const reviewable = [
      ...brief.key_requirements.map((r, i) => ({ id: `req-${r.category}-${i}`, confidence: r.confidence, evidence: r.evidence })),
      ...brief.risks_and_dependencies.map((r, i) => ({ id: `risk-${i}`, confidence: r.severity, evidence: r.supporting_evidence })),
      ...brief.action_items.map((a, i) => ({ id: `action-${i}`, confidence: a.priority, evidence: a.evidence })),
    ];

    const total = reviewable.length;
    const INFERENCE_PREFIX = 'Inference';
    const evidenceVerified = reviewable.filter(
      r => r.evidence && !r.evidence.startsWith(INFERENCE_PREFIX)
    ).length;
    const inference = reviewable.filter(
      r => r.evidence && r.evidence.startsWith(INFERENCE_PREFIX)
    ).length;
    const lowConfidence = brief.key_requirements.filter(r => r.confidence === 'Low').length;

    const confirmed = Object.values(reviewMap).filter(s => s.status === 'confirmed').length;
    const dismissed = Object.values(reviewMap).filter(s => s.status === 'dismissed').length;
    const edited = Object.values(reviewMap).filter(s => s.status === 'edited').length;

    return { total, evidenceVerified, inference, lowConfidence, confirmed, dismissed, edited };
  }, [brief, reviewMap]);
}

export function ResultsDashboard({ brief, reviewMap, onReview, onHighlight, projectText, onExport }: Props) {
  const stats = useReliabilityStats(brief, reviewMap);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* Reliability Strip — computed client-side from JSON */}
      <div className="reliability-strip">
        <span className="reliability-icon">◎</span>
        <span className="reliability-stats">
          <strong>{stats.evidenceVerified} of {stats.total}</strong> items evidence-verified
          {stats.inference > 0 && (
            <> · <span className="reliability-warn">{stats.inference} flagged as inference</span></>
          )}
          {stats.lowConfidence > 0 && (
            <> · <span className="reliability-low">{stats.lowConfidence} low-confidence requirement{stats.lowConfidence !== 1 ? 's' : ''}</span></>
          )}
        </span>
        <span className="reliability-review">
          {stats.confirmed > 0 && <span className="reliability-confirmed">✓ {stats.confirmed} confirmed</span>}
          {stats.edited > 0 && <span className="reliability-edited">✎ {stats.edited} edited</span>}
          {stats.dismissed > 0 && <span className="reliability-dismissed">✕ {stats.dismissed} dismissed</span>}
        </span>
        <button
          id="download-brief-btn"
          className="btn btn-secondary btn-sm"
          onClick={onExport}
          style={{ marginLeft: 'auto', flexShrink: 0 }}
          title="Download brief as text file (reviewed state)"
        >
          ↓ Download Brief
        </button>
      </div>

      {/* Review Banner */}
      <div className="review-banner">
        <span>⚠</span>
        <span>
          <strong>Human review recommended</strong> before using these outputs for project decisions.
          Use Confirm, Edit, or Dismiss on each item below.
        </span>
      </div>

      {/* Section Nav */}
      <nav className="section-nav" aria-label="Jump to section">
        {SECTIONS.map(s => (
          <button key={s.id} className="section-nav-item" onClick={() => scrollTo(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      <ProjectOverview data={brief.project_overview} />
      <RequirementsSection items={brief.key_requirements} reviewMap={reviewMap} onReview={onReview} onHighlight={onHighlight} />
      <OpenQuestionsSection items={brief.open_questions} />
      <RisksSection items={brief.risks_and_dependencies} reviewMap={reviewMap} onReview={onReview} onHighlight={onHighlight} />
      <ActionItemsSection items={brief.action_items} reviewMap={reviewMap} onReview={onReview} onHighlight={onHighlight} />
      <AIOpportunitiesSection items={brief.ai_opportunities} />
      <QASection projectText={projectText} />
      <PrototypeNotes />
    </div>
  );
}
