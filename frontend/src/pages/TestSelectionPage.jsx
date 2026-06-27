import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useTestStore from '../store/testStore';
import { Spinner } from '../components/ui/index.jsx';
import { formatMinutes } from '../utils/helpers';

const TABS = [
  { label: 'Full paper',    key: 'full_paper'    },
  { label: 'Subject-wise', key: 'subject_paper'  },
  { label: 'Topic-wise',   key: 'topic_wise'     },
];

export default function TestSelectionPage() {
  const [tab, setTab]               = useState(0);
  const [selected, setSelected]     = useState(null);
  const [qCount, setQCount]         = useState('');
  const [starting, setStarting]     = useState(false);
  const [activeSubject, setSubject] = useState('');
  const [activeTopic, setTopic]     = useState('');
  const [showConfig, setShowConfig] = useState(false); // mobile config panel toggle

  const { papers, papersLoading, fetchPapers, startTest, reset } = useTestStore();
  const navigate = useNavigate();

  useEffect(() => {
    reset();
    if (!papers) fetchPapers();
  }, []);

  /* ── derived data ────────────────────────────────────────────── */
  const fullPapers = useMemo(() => papers?.full_papers || [], [papers]);

  const subjectGroups = useMemo(() => {
    const g = {};
    (papers?.subject_papers || []).forEach((p) => {
      if (!g[p.subject]) g[p.subject] = [];
      g[p.subject].push(p);
    });
    return g;
  }, [papers]);

  const subjectList = useMemo(() => Object.keys(subjectGroups).sort(), [subjectGroups]);
  const topicBanks   = useMemo(() => papers?.topic_banks || [], [papers]);
  const topicSubjects = useMemo(
    () => [...new Set(topicBanks.map((b) => b.subject))].sort(),
    [topicBanks],
  );

  function switchTab(i) {
    setTab(i);
    setSelected(null);
    setQCount('');
    setSubject('');
    setTopic('');
    setShowConfig(false);
  }

  /* ── start handler ───────────────────────────────────────────── */
  const handleStart = async () => {
    if (!selected || starting) return;
    setStarting(true);
    try {
      const payload = {
        test_type:       TABS[tab].key,
        paper_ref:       selected.id,
        subject:         selected.title.includes(' — ') ? selected.title.split(' — ')[0] : 'General',
        topic:           selected.title.includes(' — ') ? selected.title.split(' — ')[1] : selected.title,
        total_questions: qCount ? parseInt(qCount) : selected.total,
      };
      const res = await startTest(payload);
      if (res.success) navigate('/test/active');
    } catch (err) {
      console.error('Failed to start test:', err.response?.data || err.message);
    } finally {
      setStarting(false);
    }
  };

  const effectiveQ   = qCount ? parseInt(qCount) : selected?.total;
  const effectiveDur = selected?.duration
    ? qCount
      ? Math.round((parseInt(qCount) / selected.total) * selected.duration)
      : selected.duration
    : null;

  const visibleSubjectPapers = useMemo(() => {
    const src = activeSubject
      ? (subjectGroups[activeSubject] || [])
      : Object.values(subjectGroups).flat();
    return src.map((p, i) => ({
      id:    p.paper_id,
      title: `${p.subject} Paper ${p.paper_number || i + 1}`,
      num:   p.paper_number || i + 1,
      meta:  `100 questions · 90 min`,
      data:  { id: p.paper_id, title: `${p.subject} Paper ${p.paper_number || i + 1}`, duration: 90, total: 100 },
    }));
  }, [subjectGroups, activeSubject]);

  const visibleTopics = useMemo(() =>
    topicBanks
      .filter((b) => !activeSubject || b.subject === activeSubject)
      .map((b, i) => ({
        id:    b.bank_id,
        title: b.topic,
        num:   i + 1,
        meta:  `${b.total_questions} questions · ${b.subject}`,
        data:  { id: b.bank_id, title: `${b.subject} — ${b.topic}`, duration: null, total: b.total_questions },
      })),
  [topicBanks, activeSubject]);

  if (papersLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spinner size={32} />
    </div>
  );

  const SubjectChips = ({ subjects }) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
      {['All', ...subjects].map((s) => {
        const isActive = s === 'All' ? !activeSubject : activeSubject === s;
        return (
          <button
            key={s}
            onClick={() => { setSubject(s === 'All' ? '' : s); setSelected(null); }}
            style={{
              padding: '4px 11px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 500,
              border: `1px solid ${isActive ? '#6366f1' : 'var(--clr-border)'}`,
              background: isActive ? '#6366f1' : 'transparent',
              color: isActive ? '#fff' : 'var(--clr-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );

  /* ── Config panel (shared between desktop sidebar and mobile sheet) */
  const ConfigPanel = () => (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--clr-border)',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--clr-text)',
      }}>
        Test configuration
      </div>
      <div style={{ padding: 16 }}>
        {selected ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Selected
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--clr-text)', lineHeight: 1.4 }}>
                {selected.title}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 6 }}>
                Questions{' '}
                <span style={{ opacity: 0.6 }}>(blank = all {selected.total})</span>
              </label>
              <input
                type="number"
                value={qCount}
                onChange={(e) => setQCount(e.target.value)}
                placeholder={`Max: ${selected.total}`}
                min={5}
                max={selected.total}
                style={{
                  width: '100%',
                  padding: '8px 11px',
                  background: 'var(--clr-surface2)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 8,
                  color: 'var(--clr-text)',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                onBlur={(e)  => (e.target.style.borderColor = 'var(--clr-border)')}
              />
            </div>

            <div style={{
              background: 'var(--clr-surface2)',
              border: '1px solid var(--clr-border)',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 14,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {[
                { label: 'Questions', value: effectiveQ || selected.total },
                ...(effectiveDur ? [{ label: 'Duration', value: formatMinutes(effectiveDur) }] : []),
                { label: 'Marking', value: '+4 / −1 / 0' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 500, color: 'var(--clr-text)' }}>{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={starting}
              style={{
                width: '100%',
                padding: '11px 0',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                background: '#6366f1',
                border: 'none',
                color: '#fff',
                cursor: starting ? 'not-allowed' : 'pointer',
                opacity: starting ? 0.75 : 1,
              }}
            >
              {starting ? 'Starting…' : 'Start test →'}
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, lineHeight: 1.6 }}>
            Select a paper from the list to configure and start your test.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .test-sel-body {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          align-items: start;
        }
        .test-sel-sidebar { display: block; }
        .test-sel-mobile-btn { display: none !important; }
        .test-sel-mobile-sheet { display: none; }

        @media (max-width: 768px) {
          .test-sel-body {
            grid-template-columns: 1fr;
          }
          .test-sel-sidebar { display: none !important; }
          .test-sel-mobile-btn { display: flex !important; }
          .test-sel-mobile-sheet {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 150;
          }
        }
      `}</style>

      <div className="page-container" style={{ padding: '24px 28px 80px', maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 600, color: 'var(--clr-text)', letterSpacing: '-0.02em' }}>
            Start a test
          </h1>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, marginTop: 4 }}>
            Choose your test mode. Full papers simulate real NEET PG CBT conditions.
          </p>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 20,
          background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border)',
          borderRadius: 10, padding: 4,
          overflowX: 'auto',
          width: 'fit-content',
          maxWidth: '100%',
        }}>
          {TABS.map((t, i) => (
            <button
              key={t.key}
              onClick={() => switchTab(i)}
              style={{
                padding: '7px 16px',
                borderRadius: 7, border: 'none',
                cursor: 'pointer', fontWeight: 500,
                fontSize: 13, whiteSpace: 'nowrap',
                background: tab === i ? 'var(--clr-primary)' : 'transparent',
                color: tab === i ? '#fff' : 'var(--clr-text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body — 2 col desktop, 1 col mobile */}
        <div className="test-sel-body">

          {/* Paper list */}
          <div>
            {tab === 0 && (
              <PaperList
                items={fullPapers.map((p, i) => ({
                  id: p.paper_id, title: p.paper_title,
                  num: i + 1, meta: '200 questions · 3h 30m',
                  data: { id: p.paper_id, title: p.paper_title, duration: 210, total: 200 },
                }))}
                selected={selected}
                onSelect={(data) => { setSelected(data); setShowConfig(true); }}
              />
            )}
            {tab === 1 && (
              <div>
                <SubjectChips subjects={subjectList} />
                <PaperList
                  items={visibleSubjectPapers}
                  selected={selected}
                  onSelect={(data) => { setSelected(data); setShowConfig(true); }}
                />
              </div>
            )}
            {tab === 2 && (
              <div>
                <SubjectChips subjects={topicSubjects} />
                <PaperList
                  items={visibleTopics}
                  selected={selected}
                  onSelect={(data) => { setSelected(data); setShowConfig(true); }}
                />
              </div>
            )}
          </div>

          {/* Desktop config sidebar */}
          <div className="test-sel-sidebar" style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
            <ConfigPanel />
            <div style={{
              marginTop: 10, padding: '10px 13px',
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.18)',
              borderRadius: 10, fontSize: 12,
              color: 'var(--clr-text-muted)', lineHeight: 1.65,
            }}>
              <span style={{ color: '#6366f1', fontWeight: 500 }}>Tip:</span>{' '}
              After answering, briefly write <em>why</em> you chose that option.
              This helps identify random guesses vs genuine knowledge.
            </div>
          </div>
        </div>

        {/* Mobile floating "Configure" button — appears when something is selected */}
        {selected && (
          <button
            className="test-sel-mobile-btn"
            onClick={() => setShowConfig(true)}
            style={{
              position: 'fixed', bottom: 72, left: 16, right: 16,
              padding: '13px 0', borderRadius: 10,
              background: '#6366f1', border: 'none', color: '#fff',
              fontSize: 15, fontWeight: 600,
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              zIndex: 90,
            }}
          >
            Configure & Start Test →
          </button>
        )}
      </div>

      {/* Mobile bottom sheet config */}
      {showConfig && (
        <div className="test-sel-mobile-sheet">
          {/* Backdrop */}
          <div
            onClick={() => setShowConfig(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)',
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'var(--clr-surface)',
            borderRadius: '16px 16px 0 0',
            padding: '0 0 32px',
            maxHeight: '85vh',
            overflowY: 'auto',
            animation: 'slideUp 0.25s ease',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--clr-border2)' }} />
            </div>
            <div style={{ padding: '0 20px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--clr-text)' }}>Test configuration</span>
                <button
                  onClick={() => setShowConfig(false)}
                  style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--clr-text-muted)', cursor: 'pointer' }}
                >✕</button>
              </div>
              <ConfigPanel />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Paper list component ─────────────────────────────────────────── */
function PaperList({ items, selected, onSelect }) {
  if (!items.length) return (
    <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, padding: '8px 0' }}>
      No papers available.
    </p>
  );

  return (
    <div style={{
      maxHeight: 520,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      paddingRight: 2,
    }}>
      {items.map((item) => {
        const isSelected = selected?.id === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.data)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 8,
              cursor: 'pointer',
              border: `1px solid ${isSelected ? '#6366f1' : 'var(--clr-border)'}`,
              background: isSelected ? 'rgba(99,102,241,0.07)' : 'var(--clr-surface)',
              transition: 'border-color 0.12s, background 0.12s',
            }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--clr-text-muted)'; }}
            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--clr-border)'; }}
          >
            <span style={{
              width: 28, height: 28, borderRadius: 7,
              background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--clr-surface2)',
              color: isSelected ? '#6366f1' : 'var(--clr-text-muted)',
              fontSize: 11, fontWeight: 600,
              display: 'grid', placeItems: 'center', flexShrink: 0,
              border: `1px solid ${isSelected ? 'rgba(99,102,241,0.3)' : 'var(--clr-border)'}`,
            }}>
              {item.num}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 500,
                color: 'var(--clr-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>
                {item.meta}
              </div>
            </div>
            {isSelected && (
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: '#6366f1', color: '#fff',
                fontSize: 10, display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
}