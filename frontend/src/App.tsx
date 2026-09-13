import { useState, useCallback } from 'react';
import type { ProjectBrief, ReviewMap, ReviewStatus, EvidenceSpan } from './types';
import { InputPanel } from './components/InputPanel';
import { InfoPanel } from './components/InfoPanel';
import { ResultsDashboard } from './components/ResultsDashboard';

type AppState = 'idle' | 'loading' | 'results' | 'error';

// ─── Export helper ─────────────────────────────────────────────────────────────
function buildExportText(
  brief: ProjectBrief,
  reviewMap: ReviewMap,
  projectText: string,
): string {
  const ov = brief.project_overview;
  const lines: string[] = [];

  lines.push('M MOSER AI BRIEF ASSISTANT — STRUCTURED PROJECT BRIEF');
  lines.push('(AI-generated prototype output — human reviewed before use)');
  lines.push('='.repeat(60));
  lines.push('');

  lines.push('PROJECT OVERVIEW');
  lines.push('-'.repeat(30));
  lines.push(`Project Name : ${ov.project_name}`);
  lines.push(`Type         : ${ov.project_type}`);
  lines.push(`Location     : ${ov.location}`);
  lines.push(`Timeline     : ${ov.timeline}`);
  lines.push(`Stakeholders : ${ov.key_stakeholders.join(', ')}`);
  lines.push('');
  lines.push(`Objective:`);
  lines.push(ov.project_objective);
  lines.push('');

  // Key Requirements — exclude dismissed
  lines.push('KEY REQUIREMENTS');
  lines.push('-'.repeat(30));
  brief.key_requirements.forEach((r, i) => {
    const id = `req-${r.category}-${i}`;
    const state = reviewMap[id];
    if (state?.status === 'dismissed') return;
    const text = state?.editedContent || r.requirement;
    const mark = state?.status === 'confirmed' ? '[✓]' : state?.status === 'edited' ? '[✎]' : '[ ]';
    lines.push(`${mark} [${r.category}] ${text}`);
    lines.push(`    Evidence: ${r.evidence}`);
    lines.push(`    Confidence: ${r.confidence}`);
  });
  lines.push('');

  // Open Questions
  lines.push('OPEN QUESTIONS');
  lines.push('-'.repeat(30));
  brief.open_questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.question}`);
    lines.push(`   Why it matters: ${q.why_it_matters}`);
  });
  lines.push('');

  // Risks & Dependencies — exclude dismissed
  lines.push('RISKS & DEPENDENCIES');
  lines.push('-'.repeat(30));
  brief.risks_and_dependencies.forEach((r, i) => {
    const id = `risk-${i}`;
    const state = reviewMap[id];
    if (state?.status === 'dismissed') return;
    const text = state?.editedContent || r.description;
    const mark = state?.status === 'confirmed' ? '[✓]' : state?.status === 'edited' ? '[✎]' : '[ ]';
    lines.push(`${mark} [${r.type}] [${r.severity}] ${text}`);
    lines.push(`    Evidence: ${r.supporting_evidence}`);
  });
  lines.push('');

  // Action Items — exclude dismissed
  lines.push('ACTION ITEMS');
  lines.push('-'.repeat(30));
  brief.action_items.forEach((a, i) => {
    const id = `action-${i}`;
    const state = reviewMap[id];
    if (state?.status === 'dismissed') return;
    const text = state?.editedContent || a.action;
    const mark = state?.status === 'confirmed' ? '[✓]' : state?.status === 'edited' ? '[✎]' : '[ ]';
    lines.push(`${mark} [${a.priority}] ${text}`);
    lines.push(`    Owner: ${a.suggested_owner}`);
    lines.push(`    Evidence: ${a.evidence}`);
  });
  lines.push('');

  // AI Opportunities
  lines.push('AI OPPORTUNITIES');
  lines.push('-'.repeat(30));
  brief.ai_opportunities.forEach((op, i) => {
    lines.push(`${i + 1}. ${op.opportunity}`);
    lines.push(`   Benefit: ${op.potential_benefit}`);
    lines.push(`   Feasibility: ${op.feasibility}`);
    lines.push(`   Caution: ${op.caution}`);
  });
  lines.push('');

  lines.push('─'.repeat(60));
  lines.push(`Source text length: ${projectText.length} characters`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('Prototype — not for use in production project decisions without human review.');

  return lines.join('\n');
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [projectText, setProjectText] = useState('');
  const [appState, setAppState] = useState<AppState>('idle');
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [reviewMap, setReviewMap] = useState<ReviewMap>({});
  const [activeSpan, setActiveSpan] = useState<EvidenceSpan | null>(null);

  const handleAnalyze = useCallback(async () => {
    const text = projectText.trim();
    if (text.length < 20) return;

    setAppState('loading');
    setErrorMsg('');
    setBrief(null);
    setReviewMap({});
    setActiveSpan(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as { detail?: string }).detail || `Server error (${res.status}). Please try again.`;
        setErrorMsg(msg);
        setAppState('error');
        return;
      }

      const data = await res.json() as ProjectBrief;

      // Basic client-side validation
      if (!data.project_overview || !Array.isArray(data.key_requirements)) {
        throw new Error('The AI response was incomplete or malformed. Please try again.');
      }

      setBrief(data);
      setAppState('results');
      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results-top')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : 'Network error — ensure the backend is running on port 8000.';
      setErrorMsg(message);
      setAppState('error');
    }
  }, [projectText]);

  const handleReview = useCallback(
    (id: string, status: ReviewStatus, editedContent?: string) => {
      setReviewMap(prev => ({
        ...prev,
        [id]: { status, ...(editedContent !== undefined ? { editedContent } : {}) },
      }));
    },
    []
  );

  const handleReset = () => {
    setAppState('idle');
    setBrief(null);
    setErrorMsg('');
    setReviewMap({});
    setActiveSpan(null);
  };

  const handleHighlight = useCallback((span: EvidenceSpan | null) => {
    setActiveSpan(span);
  }, []);

  const handleExport = useCallback(() => {
    if (!brief) return;
    const content = buildExportText(brief, reviewMap, projectText);
    const projectName = brief.project_overview.project_name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    triggerDownload(content, `brief_${projectName}_${Date.now()}.txt`);
  }, [brief, reviewMap, projectText]);

  const isResults = appState === 'results';

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">MM</div>
          <div>
            <div className="header-title">M Moser AI Brief Assistant</div>
            <div className="header-subtitle">Prototype — AI-assisted project intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isResults && (
            <button className="btn btn-secondary btn-sm" onClick={handleReset}>
              New Analysis
            </button>
          )}
          <span className="header-badge">Prototype</span>
        </div>
      </header>

      <main className="main-content">
        {/* Input Section — always visible */}
        <div className="input-section">
          <InputPanel
            value={projectText}
            onChange={setProjectText}
            onAnalyze={() => { void handleAnalyze(); }}
            loading={appState === 'loading'}
            readOnly={isResults}
            activeSpan={isResults ? activeSpan : null}
          />
          {appState === 'idle' && <InfoPanel />}
          {appState === 'error' && (
            <div className="card" style={{ padding: '1.5rem', alignSelf: 'start' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ color: 'var(--color-high)', fontSize: '1.1rem' }}>⚠</span>
                <span className="card-title" style={{ color: 'var(--color-high)' }}>Analysis failed</span>
              </div>
              <p className="text-muted">{errorMsg}</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }} onClick={handleReset}>
                Try again
              </button>
            </div>
          )}
          {appState === 'loading' && (
            <div className="card" style={{ alignSelf: 'start', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Analyzing project notes…</div>
                  <div className="text-muted" style={{ marginTop: 2 }}>Extracting requirements, risks, and actions via AI</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading full-page state */}
        {appState === 'loading' && (
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div className="loading-overlay">
              <div className="spinner" />
              <div className="loading-text">Generating project brief…</div>
              <div className="loading-subtext">
                The AI is analyzing your notes and structuring the output. This typically takes 5–15 seconds.
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {appState === 'results' && brief && (
          <div id="results-top">
            <ResultsDashboard
              brief={brief}
              reviewMap={reviewMap}
              onReview={handleReview}
              onHighlight={handleHighlight}
              onExport={handleExport}
              projectText={projectText}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
