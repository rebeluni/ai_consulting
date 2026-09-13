import { useState } from 'react';
import type { ReviewStatus, ReviewState, ReviewMap, EvidenceSpan } from '../types';

type VerificationStatus = 'supported' | 'partial' | 'unsupported' | 'not independently verified';

interface ReviewableCardProps {
  id: string;
  reviewMap: ReviewMap;
  onReview: (id: string, status: ReviewStatus, edited?: string) => void;
  children: React.ReactNode;
  mainText: string;
  metaContent?: React.ReactNode;
  evidence?: string;
  /** Verification status from the independent verification pass */
  verification?: VerificationStatus;
  /** Character offsets into the source text for this item's evidence */
  span?: { start: number; end: number } | null;
  /** Called when the card gains/loses hover focus (for source highlighting) */
  onHighlight?: (span: EvidenceSpan | null) => void;
}

export function ReviewableCard({
  id, reviewMap, onReview, children, mainText, metaContent, evidence,
  verification, span, onHighlight,
}: ReviewableCardProps) {
  const state: ReviewState = reviewMap[id] || { status: 'unreviewed' };
  const [editText, setEditText] = useState(state.editedContent || mainText);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => setIsEditing(true);
  const handleSaveEdit = () => {
    onReview(id, 'edited', editText);
    setIsEditing(false);
  };
  const handleCancelEdit = () => {
    setEditText(state.editedContent || mainText);
    setIsEditing(false);
  };

  const handleMouseEnter = () => {
    if (span && onHighlight) onHighlight({ start: span.start, end: span.end });
  };
  const handleMouseLeave = () => {
    if (onHighlight) onHighlight(null);
  };
  const handleClick = () => {
    if (span && onHighlight) onHighlight({ start: span.start, end: span.end });
  };

  const reviewedBadge = () => {
    if (state.status === 'unreviewed') return null;
    const labels: Record<string, string> = {
      confirmed: '✓ Confirmed',
      dismissed: '✕ Dismissed',
      edited: '✎ Edited',
    };
    return (
      <span className={`rc-reviewed-badge ${state.status}`}>
        {labels[state.status]}
      </span>
    );
  };

  return (
    <div
      className={`reviewable-card ${state.status}${span ? ' has-span' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="rc-header">
        <div className="rc-main">
          {isEditing ? (
            <textarea
              className="edit-textarea"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              autoFocus
            />
          ) : (
            state.status === 'edited' && state.editedContent
              ? state.editedContent
              : children || mainText
          )}
        </div>
        {reviewedBadge()}
      </div>

      {(metaContent || (verification && verification !== 'supported' && verification !== 'not independently verified')) && (
        <div className="rc-meta">
          {metaContent}
          {verification === 'partial' && (
            <span className="verification-badge verification-partial" title="Partially supported by source text — review carefully">
              needs a closer look
            </span>
          )}
          {verification === 'unsupported' && (
            <span className="verification-badge verification-unsupported" title="Could not verify this claim against the source text">
              not in source
            </span>
          )}
        </div>
      )}

      {evidence && !isEditing && (
        <div className="rc-evidence">
          <span style={{ fontStyle: 'normal', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Evidence: </span>
          {evidence}
          {span && <span className="rc-span-indicator" title="Evidence found in source text">◉</span>}
        </div>
      )}

      {isEditing ? (
        <div className="rc-actions">
          <button className="btn btn-sm btn-confirm" onClick={handleSaveEdit}>Save</button>
          <button className="btn btn-sm btn-ghost" onClick={handleCancelEdit}>Cancel</button>
        </div>
      ) : (
        <div className="rc-actions">
          <button className="btn btn-sm btn-confirm" onClick={e => { e.stopPropagation(); onReview(id, 'confirmed'); }} disabled={state.status === 'confirmed'}>
            ✓ Confirm
          </button>
          <button className="btn btn-sm btn-edit" onClick={e => { e.stopPropagation(); handleEdit(); }} disabled={state.status === 'dismissed'}>
            ✎ Edit
          </button>
          <button className="btn btn-sm btn-dismiss" onClick={e => { e.stopPropagation(); onReview(id, 'dismissed'); }} disabled={state.status === 'dismissed'}>
            ✕ Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
