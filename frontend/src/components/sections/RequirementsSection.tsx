import type { Requirement, ReviewMap, ReviewStatus, EvidenceSpan } from '../../types';
import { ReviewableCard } from '../ReviewableCard';

// Map both old and new category names to CSS class suffixes
const catClass: Record<string, string> = {
  // New M Moser-aligned vocabulary
  'Interior Design':                'cat-Design',
  'Workplace Strategy & Consulting':'cat-Workplace',
  'Engineering & Sustainability':   'cat-Engineering',
  'Project Delivery':               'cat-Delivery',
  'Business & Operations':          'cat-Business',
  // Legacy fallback labels (in case older analysis responses are displayed)
  'Design':                         'cat-Design',
  'Workplace Strategy':             'cat-Workplace',
  'Engineering':                    'cat-Engineering',
  'Delivery':                       'cat-Delivery',
  'Business / Operations':          'cat-Business',
};

// Display all known categories in priority order
const CATEGORIES = [
  'Interior Design',
  'Workplace Strategy & Consulting',
  'Engineering & Sustainability',
  'Project Delivery',
  'Business & Operations',
  // Legacy fallbacks
  'Design',
  'Workplace Strategy',
  'Engineering',
  'Delivery',
  'Business / Operations',
];

interface Props {
  items: Requirement[];
  reviewMap: ReviewMap;
  onReview: (id: string, status: ReviewStatus, edited?: string) => void;
  onHighlight: (span: EvidenceSpan | null) => void;
}

export function RequirementsSection({ items, reviewMap, onReview, onHighlight }: Props) {
  return (
    <div id="section-requirements" className="results-section">
      <div className="section-title">Key Requirements</div>
      <div className="section-subtitle">{items.length} requirements identified — grouped by category</div>
      {CATEGORIES.map(cat => {
        const catItems = items.filter(r => r.category === cat);
        if (catItems.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className={`cat-badge ${catClass[cat] || ''}`}>{cat}</span>
              <span className="text-muted">({catItems.length})</span>
            </div>
            {catItems.map((req, i) => {
              const id = `req-${cat}-${i}`;
              const span = (req.span_start != null && req.span_end != null)
                ? { start: req.span_start, end: req.span_end }
                : null;
              return (
                <ReviewableCard
                  key={id}
                  id={id}
                  reviewMap={reviewMap}
                  onReview={onReview}
                  mainText={req.requirement}
                  evidence={req.evidence}
                  span={span}
                  onHighlight={onHighlight}
                  metaContent={
                    <span className={`badge badge-${req.confidence}`}>
                      {req.confidence} confidence
                    </span>
                  }
                >
                  {req.requirement}
                </ReviewableCard>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
