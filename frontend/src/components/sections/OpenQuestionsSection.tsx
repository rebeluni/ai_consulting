import type { OpenQuestion } from '../../types';

interface Props { items: OpenQuestion[]; }

export function OpenQuestionsSection({ items }: Props) {
  return (
    <div id="section-questions" className="results-section">
      <div className="section-title">Open Questions</div>
      <div className="section-subtitle">Missing or ambiguous information that requires follow-up</div>
      {items.map((q, i) => (
        <div key={i} className="question-card">
          <div className="question-num">{i + 1}</div>
          <div className="question-content">
            <div className="question-text">{q.question}</div>
            <div className="question-why-label">Why it matters</div>
            <div className="question-why">{q.why_it_matters}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
