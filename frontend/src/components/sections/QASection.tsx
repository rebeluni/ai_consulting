import { useState, useRef, useEffect } from 'react';
import type { QAMessage } from '../../types';

interface Props { projectText: string; }

export function QASection({ projectText }: Props) {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: QAMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: q,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/api/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, project_text: projectText }),
      });

      let answer = "I couldn't find this information in the provided project material.";
      if (res.ok) {
        const data = await res.json();
        answer = (data as { answer?: string }).answer || answer;
      } else {
        const err = await res.json().catch(() => ({}));
        answer = (err as { detail?: string }).detail || 'The AI was unable to answer. Please try again.';
      }

      const botMsg: QAMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Network error — please check that the backend is running.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div id="section-qa" className="card" style={{ marginTop: '2rem' }}>
      <div className="card-header">
        <p className="card-title">Ask about this project</p>
        <p className="card-desc">Questions are answered strictly from the submitted project material</p>
      </div>
      <div className="qa-section">
        <div className="qa-disclaimer">
          ◎ This assistant only answers from the project notes you submitted. If information is not present,
          it will say so. Do not enter confidential information into this prototype.
        </div>

        {messages.length === 0 && (
          <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
            <p className="text-muted" style={{ marginBottom: '0.875rem' }}>Try asking:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {[
                'What is the project location?',
                'How many employees are planned?',
                'What sustainability certification is targeted?',
                'When are the first design concepts due?',
              ].map(s => (
                <button
                  key={s}
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setInput(s); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="qa-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`qa-message ${msg.role}`}>
                <div className="qa-avatar">
                  {msg.role === 'user' ? 'You' : 'AI'}
                </div>
                <div className="qa-bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="qa-message assistant">
                <div className="qa-avatar">AI</div>
                <div className="qa-bubble" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ animation: 'pulse 1s infinite', animationDelay: '0ms' }}>•</span>
                  <span style={{ animation: 'pulse 1s infinite', animationDelay: '200ms' }}>•</span>
                  <span style={{ animation: 'pulse 1s infinite', animationDelay: '400ms' }}>•</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="qa-input-row">
          <textarea
            className="qa-input"
            placeholder="Ask a question about this project…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            aria-label="Ask a question"
          />
          <button
            className="btn btn-primary"
            onClick={() => { void handleSend(); }}
            disabled={!input.trim() || loading}
            aria-label="Send question"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
