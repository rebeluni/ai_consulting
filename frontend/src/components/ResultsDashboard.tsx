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
      ...brief.key_requirements.map((r, i) => ({ id: `req-${r.category}-${i}`, confidence: r.confidence, is_inference: r.is_inference ?? false })),
      ...brief.risks_and_dependencies.map((r, i) => ({ id: `risk-${i}`, confidence: r.severity, is_inference: r.is_inference ?? false })),
      ...brief.action_items.map((a, i) => ({ id: `action-${i}`, confidence: a.priority, is_inference: a.is_inference ?? false })),
    ];

    const total = reviewable.length;
    const inference = reviewable.filter(r => r.is_inference).length;
    const evidenceVerified = total - inference;
    const lowConfidence = brief.key_requirements.filter(r => r.confidence === 'Low').length;

    const confirmed = Object.values(reviewMap).filter(s => s.status === 'confirmed').length;
    const dismissed = Object.values(reviewMap).filter(s => s.status === 'dismissed').length;
    const edited = Object.values(reviewMap).filter(s => s.status === 'edited').length;

    return { total, evidenceVerified, inference, lowConfidence, confirmed, dismissed, edited };
  }, [brief, reviewMap]);
}

function SectionFailure({ id, title }: { id?: string; title: string }) {
  return (
    <div id={id} className="results-section">
      <div className="section-title">{title}</div>
      <div className="section-failure-banner">
        This section couldn't be generated — try analyzing again.
      </div>
    </div>
  );
}

export function ResultsDashboard({ brief, reviewMap, onReview, onHighlight, projectText, onExport }: Props) {
  const stats = useReliabilityStats(brief, reviewMap);
  const failures = brief.partial_failure ?? [];
  const hasFailed = (category: string) => {
    if (category === 'project_overview' || category === 'key_requirements') {
      return failures.includes(category) || failures.includes('overview_and_requirements');
    }
    return failures.includes(category);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* Reliability Strip — computed client-side from JSON */}
      <div className="reliability-strip">
        <span className="reliability-icon">■</span>
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
          Download Brief
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

      {hasFailed('project_overview') ? (
        <SectionFailure id="section-overview" title="Project Overview" />
      ) : (
        <ProjectOverview data={brief.project_overview} />
      )}

      {hasFailed('key_requirements') ? (
        <SectionFailure id="section-requirements" title="Key Requirements" />
      ) : (
        <RequirementsSection items={brief.key_requirements} reviewMap={reviewMap} onReview={onReview} onHighlight={onHighlight} />
      )}

      {hasFailed('open_questions') ? (
        <SectionFailure id="section-questions" title="Open Questions" />
      ) : (
        <OpenQuestionsSection items={brief.open_questions} />
      )}

      {hasFailed('risks_and_dependencies') ? (
        <SectionFailure id="section-risks" title="Risks & Dependencies" />
      ) : (
        <RisksSection items={brief.risks_and_dependencies} reviewMap={reviewMap} onReview={onReview} onHighlight={onHighlight} />
      )}

      {hasFailed('action_items') ? (
        <SectionFailure id="section-actions" title="Action Items" />
      ) : (
        <ActionItemsSection items={brief.action_items} reviewMap={reviewMap} onReview={onReview} onHighlight={onHighlight} />
      )}

      {hasFailed('ai_opportunities') ? (
        <SectionFailure id="section-ai" title="AI Opportunities" />
      ) : (
        <AIOpportunitiesSection items={brief.ai_opportunities} />
      )}

      <QASection projectText={projectText} />
      <PrototypeNotes />
    </div>
  );
}
