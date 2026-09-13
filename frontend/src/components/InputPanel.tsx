import { useMemo } from 'react';
import type { EvidenceSpan } from '../types';

const EXAMPLE_TEXT = `Project: Horizon Workplace Transformation
Location: Singapore
Client: Meridian Financial Services

Overview:
The client is planning a comprehensive workplace transformation across approximately 20,000 sq ft across two floors of their existing Grade A office building in the CBD. The goal is to create a flexible, activity-based workplace that supports hybrid working patterns for approximately 180 employees.

Workspace Requirements:
The client has requested a range of workspace typologies including open collaboration areas, quiet focus zones, formal and informal meeting rooms, and informal social spaces. The current workplace is predominantly fixed desk with limited collaboration areas.

Sustainability:
Sustainability has been flagged as an important objective by the client leadership team. However, the client has not yet confirmed whether they are targeting a specific green building certification (e.g. WELL, BCA Green Mark). The sustainability brief is still being developed.

Phasing:
The project is expected to be delivered in two phases. Phase 1 will focus on floors 12 and 13 while Phase 2 scope is yet to be confirmed. The client would like to maintain business continuity throughout the fit-out.

Programme:
The client workplace lead has indicated that the first design concepts are required within six weeks of appointment. The overall project completion is expected within 12 months. No specific interim milestones have been confirmed.

Project Team:
The project team includes the client workplace lead (Sarah Tan), the client IT and facilities management teams, design consultants, MEP engineering consultants, and the delivery/contractor team. A specialist acoustic consultant may be required but has not been formally appointed.

Outstanding Information:
Existing building services drawings and as-built information are still being collected from the building management. Furniture strategy and budget have not been confirmed. Headcount growth assumptions beyond current 180 employees have not been provided.

Budget:
An initial budget range has been indicated but has not been formally approved by the client CFO. The client is expecting the design team to work within the indicative budget without formal confirmation.`;

interface InputPanelProps {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  /** When set, the panel switches to read-only mode with highlighted span */
  readOnly?: boolean;
  activeSpan?: EvidenceSpan | null;
}

/** Build highlighted HTML from plain text + an optional span to highlight. */
function buildHighlightedHtml(text: string, span: EvidenceSpan | null): string {
  if (!span) return escapeHtml(text);
  const before = escapeHtml(text.slice(0, span.start));
  const highlight = escapeHtml(text.slice(span.start, span.end));
  const after = escapeHtml(text.slice(span.end));
  return `${before}<mark class="evidence-highlight">${highlight}</mark>${after}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function InputPanel({
  value, onChange, onAnalyze, loading, readOnly = false, activeSpan = null,
}: InputPanelProps) {
  const handleLoadExample = () => onChange(EXAMPLE_TEXT);
  const charCount = value.length;
  const canAnalyze = value.trim().length >= 20 && !loading;

  const highlightedHtml = useMemo(() => {
    if (!readOnly) return '';
    return buildHighlightedHtml(value, activeSpan ?? null);
  }, [readOnly, value, activeSpan]);

  return (
    <div className="card">
      <div className="card-header">
        <p className="card-title">Project Input</p>
        <p className="card-desc">
          {readOnly
            ? 'Hover or click a card below to highlight its source evidence here'
            : 'Paste project notes, meeting notes, or a project brief'}
        </p>
      </div>
      <div className="card-body">
        {readOnly ? (
          // Read-only highlighted view
          <div
            className="project-textarea-readonly"
            // Safe: escapeHtml prevents injection; only <mark> tag injected
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <textarea
            className="project-textarea"
            placeholder={`Example:\n"Project: Horizon Workplace Transformation\nLocation: Singapore\nClient is planning a workplace transformation..."`}
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={loading}
            aria-label="Project notes input"
          />
        )}
        <div className="textarea-footer">
          <span className="char-count">{charCount.toLocaleString()} characters</span>
          {!readOnly && (
            <div className="btn-group">
              <button
                id="load-example-btn"
                className="btn btn-secondary"
                onClick={handleLoadExample}
                disabled={loading}
              >
                ↺ Load Example
              </button>
              <button
                id="analyze-btn"
                className="btn btn-primary"
                onClick={onAnalyze}
                disabled={!canAnalyze}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Analyzing…
                  </>
                ) : (
                  <>→ Analyze Project</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
