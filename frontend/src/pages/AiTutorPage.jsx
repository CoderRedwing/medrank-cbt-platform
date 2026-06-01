import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, Btn, Spinner } from '../components/ui/index.jsx';
import { difficultyColor } from '../utils/helpers';
import useTestStore from '../store/testStore';

const SUBJECTS = [
  'Medicine','Surgery','Pathology','Pharmacology','Microbiology',
  'OBGYN','Pediatrics','PSM','Anatomy','Physiology','Biochemistry',
  'ENT','Ophthalmology','Orthopedics','Psychiatry','Radiology',
  'Anaesthesia','Dermatology','Forensic Medicine',
];

const DIFFICULTIES = ['Easy','Moderate','Hard','Very Hard'];

const TABS = ['💬 AI Chat', '⚡ Generate Test', '📚 Generate MCQs'];

export default function AiTutorPage() {
  const [activeTab, setTab] = useState(0);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', gap: 12,
    }}>
      <div style={{ fontSize: 36 }}>🔧</div>
      <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 22, color: '#1a1a18' }}>
        AI Features Coming Soon
      </h2>
      <p style={{ color: '#6b6860', maxWidth: 380, lineHeight: 1.6 }}>
        We're currently working on AI features and will update you as soon as they're ready.
      </p>
    </div>
  );

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>AI Tutor</h1>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginTop: 4 }}>
          Explain concepts, verify your reasoning, and generate fresh practice questions.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--clr-surface)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
            background: activeTab === i ? 'var(--clr-primary)' : 'transparent',
            color: activeTab === i ? '#fff' : 'var(--clr-text-muted)',
          }}>{t}</button>
        ))}
      </div>

      {activeTab === 0 && <ChatTab />}
      {activeTab === 1 && <GenerateTestTab />}
      {activeTab === 2 && <GenerateMCQsTab />}
    </div>
  );
}

/* ── Chat Tab ────────────────────────────────────────────────────── */
function ChatTab() {
  const [history, setHistory]   = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [subject, setSubject]   = useState('');
  const [topic, setTopic]       = useState('');
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    const newHistory = [...history, { role: 'user', content: userMsg }];
    setHistory(newHistory);
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', {
        message: userMsg,
        history: history.slice(-10),
        context: { subject, topic },
      });
      setHistory([...newHistory, { role: 'assistant', content: data.data.reply }]);
    } catch (err) {
      setHistory([...newHistory, { role: 'assistant', content: '⚠️ Error: ' + (err.response?.data?.message || 'Something went wrong') }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const STARTERS = [
    'Explain the mechanism of digoxin toxicity',
    'What is the triad of Wernicke\'s encephalopathy?',
    'Difference between Cushing\'s syndrome and disease',
    'High-yield topics in Pharmacology for NEET PG',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 260px)', minHeight: 400 }}>
      {/* Context selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}
          style={{ padding: '7px 12px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)', fontSize: 13, flex: 1 }}>
          <option value="">All subjects</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={topic} onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (optional)"
          style={{ padding: '7px 12px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)', fontSize: 13, flex: 1 }} />
      </div>

      {/* Message area */}
      <Card style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14, padding: 16 }}>
        {history.length === 0 ? (
          <div>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginBottom: 16 }}>
              Ask anything about NEET PG topics. Try:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STARTERS.map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--clr-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--clr-border)'}
                >{s}</button>
              ))}
            </div>
          </div>
        ) : (
          history.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))
        )}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--clr-primary)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 14 }}>🧠</div>
            <div style={{ padding: '10px 14px', background: 'var(--clr-surface2)', borderRadius: '4px 12px 12px 12px', display: 'flex', gap: 4, alignItems: 'center' }}>
              <Spinner size={14} /><span style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </Card>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
          rows={2}
          style={{ flex: 1, padding: '10px 14px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 10, color: 'var(--clr-text)', fontSize: 14, resize: 'none', outline: 'none' }}
          onFocus={(e) => e.target.style.borderColor = 'var(--clr-primary)'}
          onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
        />
        <Btn onClick={send} loading={loading} size="lg" style={{ alignSelf: 'flex-end' }}>Send</Btn>
      </div>
      {history.length > 0 && (
        <button onClick={() => setHistory([])} style={{ marginTop: 8, fontSize: 12, color: 'var(--clr-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Clear conversation
        </button>
      )}
    </div>
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser ? '#2a3450' : 'var(--clr-primary)',
        display: 'grid', placeItems: 'center', fontSize: 14,
      }}>
        {isUser ? '👤' : '🧠'}
      </div>
      <div style={{
        maxWidth: '80%', padding: '10px 14px', fontSize: 14, lineHeight: 1.7,
        borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
        background: isUser ? 'var(--clr-surface2)' : 'rgba(99,102,241,0.1)',
        border: `1px solid ${isUser ? 'var(--clr-border)' : 'rgba(99,102,241,0.25)'}`,
        color: 'var(--clr-text)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {content}
      </div>
    </div>
  );
}

/* ── Generate Test Tab ───────────────────────────────────────────── */
function GenerateTestTab() {
  const [subject, setSubject]   = useState('Medicine');
  const [topic, setTopic]       = useState('');
  const [count, setCount]       = useState(20);
  const [difficulty, setDiff]   = useState('Moderate');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { startTest }           = useTestStore();
  const navigate                = useNavigate();

  const handleGenerate = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/ai/start-generated-test', { subject, topic, count, difficulty });
      const session = data.data;

      // Inject into test store manually
      const responses = {};
      session.questions.forEach((q) => {
        responses[q.question_id] = { selected_answer: null, student_reason: '', time_spent_sec: 0, marked_review: false };
      });
      useTestStore.setState({
        sessionId:   session.session_id,
        sessionMeta: {
          test_type:            session.test_type,
          paper_title:          session.paper_title,
          paper_ref:            session.paper_ref,
          subject:              session.subject,
          topic:                session.topic,
          duration_allowed_sec: session.duration_allowed_sec,
          total_questions:      session.total_questions,
        },
        questions:      session.questions,
        responses,
        currentIndex:   0,
        timeRemainingS: session.duration_allowed_sec,
        status:         'active',
        analysis:       null,
      });
      navigate('/test/active');
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginBottom: 20 }}>
        Generate a completely fresh AI-created test session. Every question is unique and will never repeat.
      </p>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormRow label="Subject">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={selectStyle}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormRow>
          <FormRow label="Topic (optional)">
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Cardiology, Pharmacokinetics"
              style={{ ...inputStyle }} />
          </FormRow>
          <FormRow label="Number of Questions">
            <input type="number" value={count} onChange={(e) => setCount(Math.min(50, Math.max(5, +e.target.value)))}
              min={5} max={50} style={{ ...inputStyle, width: 100 }} />
            <span style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>Max 50</span>
          </FormRow>
          <FormRow label="Difficulty">
            <div style={{ display: 'flex', gap: 8 }}>
              {DIFFICULTIES.map((d) => {
                const dc = difficultyColor(d);
                return (
                  <button key={d} onClick={() => setDiff(d)} style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                    background: difficulty === d ? dc.bg : 'transparent',
                    border: `1px solid ${difficulty === d ? dc.text : 'var(--clr-border)'}`,
                    color: difficulty === d ? dc.text : 'var(--clr-text-muted)',
                  }}>{d}</button>
                );
              })}
            </div>
          </FormRow>

          {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}

          <div style={{ paddingTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Btn loading={loading} onClick={handleGenerate} size="lg">
              ⚡ Generate & Start Test
            </Btn>
            {loading && <span style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>Generating {count} questions…</span>}
          </div>

          <p style={{ fontSize: 12, color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>
            AI-generated tests are marked in your history and counted in your analytics, but kept separate from dataset-based tests in reports.
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ── Generate MCQs Tab (preview only, no test) ───────────────────── */
function GenerateMCQsTab() {
  const [subject, setSubject]     = useState('Medicine');
  const [topic, setTopic]         = useState('');
  const [count, setCount]         = useState(5);
  const [difficulty, setDiff]     = useState('Moderate');
  const [loading, setLoading]     = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState({});

  const generate = async () => {
    setLoading(true); setError(''); setQuestions([]);
    try {
      const { data } = await api.post('/ai/generate', { subject, topic, count, difficulty });
      setQuestions(data.data.questions);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: 20, maxWidth: 680 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <FormRow label="Subject" inline>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...selectStyle, width: 160 }}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormRow>
          <FormRow label="Topic" inline>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Optional"
              style={{ ...inputStyle, width: 160 }} />
          </FormRow>
          <FormRow label="Count" inline>
            <input type="number" value={count} min={1} max={20}
              onChange={(e) => setCount(Math.min(20, Math.max(1, +e.target.value)))}
              style={{ ...inputStyle, width: 70 }} />
          </FormRow>
          <FormRow label="Difficulty" inline>
            <select value={difficulty} onChange={(e) => setDiff(e.target.value)} style={{ ...selectStyle, width: 120 }}>
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </FormRow>
          <Btn loading={loading} onClick={generate}>Generate</Btn>
        </div>
        {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 10 }}>{error}</p>}
      </Card>

      {questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>{questions.length} questions generated · Click to expand</p>
          {questions.map((q, i) => {
            const isOpen = expanded[i];
            const dc = difficultyColor(q.difficulty);
            return (
              <Card key={q.question_id} style={{ cursor: 'pointer' }} onClick={() => setExpanded((p) => ({ ...p, [i]: !isOpen }))}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-text-muted)', flexShrink: 0 }}>Q{i + 1}</span>
                  <div style={{ flex: 1, fontSize: 14, lineHeight: 1.6 }}>
                    {isOpen ? q.question_text : (q.question_text.length > 100 ? q.question_text.slice(0, 100) + '…' : q.question_text)}
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: dc.bg, color: dc.text, flexShrink: 0 }}>
                    {q.difficulty}
                  </span>
                  <span style={{ color: 'var(--clr-text-muted)', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      {Object.entries(q.options).map(([letter, text]) => {
                        const isCorrect = letter === q.correct_answer;
                        return (
                          <div key={letter} style={{
                            padding: '8px 12px', borderRadius: 8, display: 'flex', gap: 10, fontSize: 13,
                            background: isCorrect ? 'rgba(16,185,129,0.1)' : 'var(--clr-surface2)',
                            border: `1px solid ${isCorrect ? '#10b981' : 'var(--clr-border)'}`,
                            color: isCorrect ? '#10b981' : 'var(--clr-text)',
                          }}>
                            <strong style={{ flexShrink: 0 }}>{letter}.</strong> {text}
                            {isCorrect && <span style={{ marginLeft: 'auto', fontWeight: 700, flexShrink: 0 }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                      <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginBottom: 4 }}>EXPLANATION</div>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--clr-text)', whiteSpace: 'pre-wrap' }}>{q.explanation}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */
const selectStyle = {
  padding: '8px 12px', background: 'var(--clr-surface2)',
  border: '1px solid var(--clr-border)', borderRadius: 8,
  color: 'var(--clr-text)', fontSize: 13, cursor: 'pointer',
};
const inputStyle = {
  padding: '8px 12px', background: 'var(--clr-surface2)',
  border: '1px solid var(--clr-border)', borderRadius: 8,
  color: 'var(--clr-text)', fontSize: 13, outline: 'none',
  width: '100%',
};

function FormRow({ label, children, inline = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: inline ? 'row' : 'column', gap: 6, alignItems: inline ? 'center' : 'stretch' }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-muted)', flexShrink: 0 }}>{label}</label>
      {children}
    </div>
  );
}
