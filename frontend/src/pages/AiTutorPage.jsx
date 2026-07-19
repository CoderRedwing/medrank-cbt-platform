import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { authAPI, streamChatMessage } from '../services/api';
import { Card, Btn, Spinner } from '../components/ui/index.jsx';
import { difficultyColor } from '../utils/helpers';
import MarkdownLite from '../components/MarkdownLite.jsx';
import useTestStore from '../store/testStore';
import useAuthStore from '../store/authStore';

const SUBJECTS = [
  'Medicine', 'Surgery', 'Pathology', 'Pharmacology', 'Microbiology',
  'OBGYN', 'Pediatrics', 'PSM', 'Anatomy', 'Physiology', 'Biochemistry',
  'ENT', 'Ophthalmology', 'Orthopedics', 'Psychiatry', 'Radiology',
  'Anaesthesia', 'Dermatology', 'Forensic Medicine',
];

const DIFFICULTIES = ['Easy', 'Moderate', 'Hard', 'Very Hard'];

const TABS = ['💬 AI Chat', '⚡ Generate Test', '📚 Generate MCQs'];

export default function AiTutorPage() {
  const [activeTab, setTab] = useState(0);

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px) clamp(12px, 4vw, 28px)', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>AI Tutor</h1>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginTop: 4 }}>
          Explain concepts, verify your reasoning, and generate fresh practice questions.
        </p>
      </div>

      <ApiKeySettings />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--clr-surface)', borderRadius: 10, padding: 4, width: 'fit-content', maxWidth: '100%', flexWrap: 'wrap' }}>
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

/* ── AI API key settings (BYOK) ─────────────────────────────────────
   AI Tutor can run on Anthropic, OpenAI, or Gemini — add whichever key(s)
   you have (up to one per provider) and pick which one is active. Each
   student's own key means nobody's usage gets throttled by a shared limit,
   and not every provider needs to be paid for at once. */
const PROVIDER_META = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...', helpUrl: 'https://console.anthropic.com/settings/keys', accent: '#d97757', icon: '✳️', subtext: 'Best explanation quality', recommended: true },
  openai: { label: 'OpenAI', placeholder: 'sk-...', helpUrl: 'https://platform.openai.com/api-keys', accent: '#10a37f', icon: '🌐', subtext: 'Widely available, cheap' },
  gemini: { label: 'Gemini', placeholder: 'AIza...', helpUrl: 'https://aistudio.google.com/apikey', accent: '#4285f4', icon: '✨', subtext: 'Free tier available' },
};
const PROVIDERS = Object.keys(PROVIDER_META);

function ApiKeySettings() {
  const { user, setUser } = useAuthStore();
  const [editingProvider, setEditingProvider] = useState(null);
  const [value, setValue] = useState('');
  const [busyProvider, setBusyProvider] = useState(null);
  const [error, setError] = useState('');
  const [expandedHelp, setExpandedHelp] = useState(null);

  // Legacy accounts stored a single Anthropic-only key before multi-provider
  // support existed — fall back to that for display if nothing new is saved.
  const last4For = (provider) =>
    user?.aiProviders?.[provider]?.last4
    || (provider === 'anthropic' ? user?.aiApiKeyLast4 : null)
    || null;

  const activeProvider = user?.aiActiveProvider || (user?.aiApiKeyLast4 ? 'anthropic' : null);
  const connectedCount = PROVIDERS.filter((p) => last4For(p)).length;

  const refreshUser = async () => {
    const { data } = await authAPI.getMe();
    setUser(data.user);
  };

  const save = async (provider) => {
    if (!value.trim()) return;
    setBusyProvider(provider);
    setError('');
    try {
      await authAPI.saveApiKey(provider, value.trim());
      await refreshUser();
      setValue('');
      setEditingProvider(null);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to save ${PROVIDER_META[provider].label} key`);
    } finally {
      setBusyProvider(null);
    }
  };

  const remove = async (provider) => {
    setBusyProvider(provider);
    setError('');
    try {
      await authAPI.removeApiKey(provider);
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to remove ${PROVIDER_META[provider].label} key`);
    } finally {
      setBusyProvider(null);
    }
  };

  const makeActive = async (provider) => {
    setBusyProvider(provider);
    setError('');
    try {
      await authAPI.setActiveApiKeyProvider(provider);
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to switch active provider');
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <Card style={{ padding: 16, marginBottom: 20, border: connectedCount ? '1px solid var(--clr-border)' : '1px solid rgba(99,102,241,0.35)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>🔑 Your AI provider keys</div>
        <div style={{ fontSize: 11.5, color: 'var(--clr-text-muted)' }}>
          {connectedCount
            ? `${connectedCount} of 3 connected · using ${activeProvider ? PROVIDER_META[activeProvider].label : 'none'}`
            : 'No keys added yet'}
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
        Add a key for any provider you have — Anthropic, OpenAI, or Gemini. Not every key needs to be paid;
        add whichever one works for you and mark it active. Keys are encrypted (AES-256) and only ever used
        to make requests on your behalf.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {PROVIDERS.map((provider) => {
          const meta = PROVIDER_META[provider];
          const last4 = last4For(provider);
          const isActive = activeProvider === provider;
          const isBusy = busyProvider === provider;
          const isEditingThis = editingProvider === provider;

          return (
            <div key={provider} style={{
              border: isActive ? `1px solid ${meta.accent}88` : '1px solid var(--clr-border)',
              borderLeft: `3px solid ${meta.accent}`,
              background: isActive ? `${meta.accent}0d` : 'var(--clr-surface2)',
              borderRadius: 10, padding: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>
                  <span>{meta.icon}</span>{meta.label}
                  {meta.recommended && !isActive && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '1px 6px', borderRadius: 99 }}>
                      RECOMMENDED
                    </span>
                  )}
                </div>
                {isActive && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: meta.accent, background: `${meta.accent}1a`, padding: '2px 7px', borderRadius: 99 }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--clr-text-muted)', marginBottom: 8 }}>{meta.subtext}</div>

              {last4 ? (
                <div style={{ fontSize: 11.5, color: '#16a34a', marginBottom: 8 }}>Connected · ····{last4}</div>
              ) : (
                <div style={{ fontSize: 11.5, color: 'var(--clr-text-muted)', marginBottom: 8 }}>Not connected</div>
              )}

              {!isEditingThis && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Btn size="sm" variant={last4 ? 'secondary' : 'primary'} onClick={() => { setEditingProvider(provider); setValue(''); setError(''); }}>
                    {last4 ? 'Update' : 'Add key'}
                  </Btn>
                  {last4 && !isActive && (
                    <Btn size="sm" variant="ghost" onClick={() => makeActive(provider)} loading={isBusy}>Use this</Btn>
                  )}
                  {last4 && (
                    <Btn size="sm" variant="ghost" onClick={() => remove(provider)} loading={isBusy}>Remove</Btn>
                  )}
                </div>
              )}

              {isEditingThis && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    type="password"
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={meta.placeholder}
                    style={{
                      padding: '7px 10px', background: 'var(--clr-surface)',
                      border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)',
                      fontSize: 12.5, outline: 'none', width: '100%', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn size="sm" onClick={() => save(provider)} loading={isBusy} disabled={!value.trim()}>Save</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => { setEditingProvider(null); setValue(''); setError(''); }}>Cancel</Btn>
                  </div>
                  <button
                    onClick={() => setExpandedHelp((v) => (v === provider ? null : provider))}
                    style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: 0, fontSize: 11.5, textAlign: 'left', textDecoration: 'underline' }}
                  >
                    {expandedHelp === provider ? 'Hide instructions' : `Where do I get a ${meta.label} key?`}
                  </button>
                  {expandedHelp === provider && (
                    <p style={{ fontSize: 11.5, color: 'var(--clr-text-muted)', lineHeight: 1.6, margin: 0 }}>
                      Go to <a href={meta.helpUrl} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>{meta.helpUrl.replace('https://', '')}</a>,
                      sign in, and create a new API key. Paste it above — it's stored encrypted and never shown again in full.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <div style={{ marginTop: 10, fontSize: 12, color: '#dc2626' }}>{error}</div>}
    </Card>
  );
}

/* ── Chat Tab ────────────────────────────────────────────────────── */
function ChatTab() {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    const historyForRequest = history.slice(-10); // conversation context sent to the backend
    setInput('');
    setLoading(true);

    // Push the user message, then an empty assistant placeholder that
    // fills in as chunks arrive — this is what makes the reply "stream".
    setHistory((prev) => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: '' }]);

    let assembled = '';
    await streamChatMessage(
      { message: userMsg, history: historyForRequest, context: { subject, topic } },
      {
        onDelta: (delta) => {
          assembled += delta;
          setHistory((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: assembled };
            return next;
          });
        },
        onDone: () => setLoading(false),
        onError: (msg, isQuotaError) => {
          setHistory((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content: isQuotaError ? `⚠️ ${msg}` : `⚠️ Error: ${msg}`,
            };
            return next;
          });
          setLoading(false);
        },
      }
    );
  };

  const resend = async (userMsg, historyBeforeThis) => {
    setLoading(true);
    setHistory([...historyBeforeThis, { role: 'user', content: userMsg }, { role: 'assistant', content: '' }]);
    let assembled = '';
    await streamChatMessage(
      { message: userMsg, history: historyBeforeThis.slice(-10), context: { subject, topic } },
      {
        onDelta: (delta) => {
          assembled += delta;
          setHistory((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: assembled };
            return next;
          });
        },
        onDone: () => setLoading(false),
        onError: (msg, isQuotaError) => {
          setHistory((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: isQuotaError ? `⚠️ ${msg}` : `⚠️ Error: ${msg}` };
            return next;
          });
          setLoading(false);
        },
      }
    );
  };

  const handleEdit = (index) => {
    if (loading) return;
    const msg = history[index];
    setInput(msg.content);
    setHistory(history.slice(0, index)); // us message aur uske baad wala sab hata do
  };

  const handleRegenerate = (assistantIndex) => {
    if (loading) return;
    const userIndex = assistantIndex - 1;
    if (userIndex < 0 || history[userIndex]?.role !== 'user') return;
    const userMsg = history[userIndex].content;
    resend(userMsg, history.slice(0, userIndex));
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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - clamp(200px, 30vh, 260px))', minHeight: 'clamp(300px, 50vh, 400px)' }}>
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
          history
            .filter((m, i) => !(i === history.length - 1 && m.role === 'assistant' && m.content === '' && loading))
            .map((m, i) => (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                isLastAssistant={m.role === 'assistant' && i === history.length - 1}
                onEdit={() => handleEdit(i)}
                onRegenerate={() => handleRegenerate(i)}
                disabled={loading}
              />
            ))
        )}
        {loading && !history[history.length - 1]?.content && (
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
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 10,
        background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
        borderRadius: 16, padding: '8px 8px 8px 16px', transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
        onFocusCapture={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'}
        onBlurCapture={(e) => e.currentTarget.style.boxShadow = 'none'}
      >
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Ask a question…"
          rows={1}
          style={{
            flex: 1, padding: '10px 0', background: 'transparent', border: 'none',
            color: 'var(--clr-text)', fontSize: 14, resize: 'none', outline: 'none',
            maxHeight: 120, lineHeight: 1.5,
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
            display: 'grid', placeItems: 'center', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
            background: (!input.trim() || loading) ? 'var(--clr-surface2)' : 'var(--clr-primary)',
            color: (!input.trim() || loading) ? 'var(--clr-text-muted)' : '#fff',
            transition: 'background 0.15s, transform 0.1s',
          }}
          onMouseDown={(e) => { if (input.trim() && !loading) e.currentTarget.style.transform = 'scale(0.92)'; }}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {loading ? <Spinner size={16} /> : '➤'}
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>Enter to send · Shift+Enter for newline</span>
        {history.length > 0 && (
          <button onClick={() => setHistory([])} style={{ fontSize: 11, color: 'var(--clr-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear conversation
          </button>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ role, content, isLastAssistant, onEdit, onRegenerate, disabled }) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
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
          whiteSpace: isUser ? 'pre-wrap' : 'normal', wordBreak: 'break-word',
        }}>
          {isUser ? content : <MarkdownLite text={content} />}
        </div>
      </div>

      {/* Action row */}
      {content && (
        <div style={{ display: 'flex', gap: 10, paddingInline: 42, fontSize: 11.5 }}>
          <button onClick={handleCopy} style={actionBtnStyle}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          {isUser && (
            <button onClick={onEdit} disabled={disabled} style={actionBtnStyle}>✏️ Edit</button>
          )}
          {!isUser && isLastAssistant && (
            <button onClick={onRegenerate} disabled={disabled} style={actionBtnStyle}>🔄 Regenerate</button>
          )}
        </div>
      )}
    </div>
  );
}

const actionBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--clr-text-muted)', padding: '2px 4px', fontSize: 11.5,
};

/* ── Generate Test Tab ───────────────────────────────────────────── */
function GenerateTestTab() {
  const [subject, setSubject] = useState('Medicine');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(20);
  const [difficulty, setDiff] = useState('Moderate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { startTest } = useTestStore();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/ai/start-generated-test', { subject, topic, count, difficulty });
      const session = data.data;

      // Inject into test store manually
      // const responses = {};
      // session.questions.forEach((q) => {
      //   responses[q.question_id] = { selected_answer: null, student_reason: '', time_spent_sec: 0, marked_review: false };
      // });
      // useTestStore.setState({
      //   sessionId: session.session_id,
      //   sessionMeta: {
      //     test_type: session.test_type,
      //     paper_title: session.paper_title,
      //     paper_ref: session.paper_ref,
      //     subject: session.subject,
      //     topic: session.topic,
      //     duration_allowed_sec: session.duration_allowed_sec,
      //     total_questions: session.total_questions,
      //   },
      //   questions: session.questions,
      //   responses,
      //   currentIndex: 0,
      //   timeRemainingS: session.duration_allowed_sec,
      //   status: 'active',
      //   analysis: null,
      // });
      // navigate('/test/active');
      const result = useTestStore.getState().loadExternalSession(session);
      if (result.success) navigate('/test/active');
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, width: '100%' }}>
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
  const [subject, setSubject] = useState('Medicine');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDiff] = useState('Moderate');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

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
      <Card style={{ marginBottom: 20, maxWidth: 680, width: '100%' }}>
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