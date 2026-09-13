import type { ActionItem, ReviewMap, ReviewStatus, EvidenceSpan } from '../../types';
import { ReviewableCard } from '../ReviewableCard';

interface Props {
  items: ActionItem[];
  reviewMap: ReviewMap;
  onReview: (id: string, status: ReviewStatus, edited?: string) => void;
  onHighlight: (span: EvidenceSpan | null) => void;
}

export function ActionItemsSection({ items, reviewMap, onReview, onHighlight }: Props) {
  return (
    <div id="section-actions" className="results-section">
      <div className="section-title">Action Items</div>
      <div className="section-subtitle">{items.length} suggested actions — review and assign before use</div>
      {items.map((item, i) => {
        const id = `action-${i}`;
        const span = (item.span_start != null && item.span_end != null)
          ? { start: item.span_start, end: item.span_end }
          : null;
        return (
          <ReviewableCard
            key={id}
            id={id}
            reviewMap={reviewMap}
            onReview={onReview}
            mainText={item.action}
            evidence={item.evidence}
            span={span}
            onHighlight={onHighlight}
            metaContent={
              <>
                <span className={`badge badge-${item.priority}`}>{item.priority} priority</span>
                <span className="tag" style={{ fontSize: '0.6875rem' }}>
                  Owner: {item.suggested_owner}
                </span>
              </>
            }
          >
            {item.action}
          </ReviewableCard>
        );
      })}
    </div>
  );
}
