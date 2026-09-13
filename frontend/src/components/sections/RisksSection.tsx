import type { RiskOrDependency, ReviewMap, ReviewStatus, EvidenceSpan } from '../../types';
import { ReviewableCard } from '../ReviewableCard';

interface Props {
  items: RiskOrDependency[];
  reviewMap: ReviewMap;
  onReview: (id: string, status: ReviewStatus, edited?: string) => void;
  onHighlight: (span: EvidenceSpan | null) => void;
}

export function RisksSection({ items, reviewMap, onReview, onHighlight }: Props) {
  return (
    <div id="section-risks" className="results-section">
      <div className="section-title">Risks &amp; Dependencies</div>
      <div className="section-subtitle">{items.length} items identified</div>
      {items.map((item, i) => {
        const id = `risk-${i}`;
        const span = (item.span_start != null && item.span_end != null)
          ? { start: item.span_start, end: item.span_end }
          : null;
        return (
          <ReviewableCard
            key={id}
            id={id}
            reviewMap={reviewMap}
            onReview={onReview}
            mainText={item.description}
            evidence={item.supporting_evidence}
            verification={item.verification}
            span={span}
            onHighlight={onHighlight}
            metaContent={
              <>
                <span className={`badge badge-${item.type}`}>{item.type}</span>
                <span className={`badge badge-${item.severity}`}>{item.severity} severity</span>
              </>
            }
          >
            {item.description}
          </ReviewableCard>
        );
      })}
    </div>
  );
}
