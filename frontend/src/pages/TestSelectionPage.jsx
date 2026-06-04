import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTestStore from '../store/testStore';
import { Spinner } from '../components/ui/index.jsx';
import { formatMinutes } from '../utils/helpers';

const TABS = [
  { label: 'Full paper',    key: 'full_paper' },
  { label: 'Subject-wise', key: 'subject_paper' },
  { label: 'Topic-wise',   key: 'topic_wise' },
];

export default function TestSelectionPage() {
  const [tab, setTab]           = useState(0);
  const [selected, setSelected] = useState(null);
  const [qCount, setQCount]     = useState('');
  const [starting, setStarting] = useState(false);
  const [filterSubj, setFilter] = useState('');

  const { papers, papersLoading, fetchPapers, startTest, reset } = useTestStore();
  const navigate = useNavigate();

  useEffect(() => {
    reset();
    if (!papers) fetchPapers();
  }, []);

  const handleStart = async () => {
    if (!selected) return;
    setStarting(true);
    const res = await startTest({
      test_type:     TABS[tab].key,
      paper_ref:     selected.id,
      questionCount: qCount ? parseInt(qCount) : undefined,
    });
    setStarting(false);
    if (res.success) navigate('/test/active');
  };

  if (papersLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spinner size={32} />
    </div>
  );

  const fullPapers    = papers?.full_papers    || [];
  const subjectPapers = papers?.subject_papers || [];
  const topicBanks    = papers?.topic_banks    || [];

  const subjectGroups = {};
  subjectPapers.forEach((p) => {
    if (!subjectGroups[p.subject]) subjectGroups[p.subject] = [];
    subjectGroups[p.subject].push(p);
  });

  const topicSubjects = [...new Set(topicBanks.map((b) => b.subject))].sort();

  const effectiveQ = qCount ? parseInt(qCount) : selected?.total;
  const effectiveDur = selected?.duration
    ? (qCount
        ? Math.round((parseInt(qCount) / selected.total) * selected.duration)
        : selected.duration)
    : null;

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1000, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--clr-text)', letterSpacing: '-0.02em' }}>
          Start a test
        </h1>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, marginTop: 4 }}>
          Choose your test mode. Full papers simulate real NEET PG CBT conditions.
        </p>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 20,
        background: 'var(--clr-surface)',
        border: '1px solid var(--clr-border)',
        borderRadius: 10,
        padding: 4,
        width: 'fit-content',
      }}>
        {TABS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => { setTab(i); setSelected(null); setQCount(''); setFilter(''); }}
            style={{
              padding: '7px 18px',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 13,
              transition: 'all 0.15s',
              background: tab === i ? 'var(--clr-primary)' : 'transparent',
              color: tab === i ? '#fff' : 'var(--clr-text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Body: list + sticky config ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* ── Left: paper list ── */}
        <div>

          {/* Full papers */}
          {tab === 0 && (
            <PaperList
              items={fullPapers.map((p, i) => ({
                id: p.paper_id,
                title: p.paper_title,
                num: i + 1,
                meta: `200 questions · 3h 30m`,
                data: { id: p.paper_id, title: p.paper_title, duration: 210, total: 200 },
              }))}
              selected={selected}
              onSelect={setSelected}
            />
          )}

          {/* Subject papers */}
          {tab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(subjectGroups).map(([subject, spapers]) => (
                <div key={subject}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--clr-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 8,
                    paddingLeft: 2,
                  }}>
                    {subject}
                  </div>
                  <PaperList
                    items={spapers.map((p, i) => ({
                      id: p.paper_id,
                      title: `${subject} Paper ${p.paper_number || i + 1}`,
                      num: p.paper_number || i + 1,
                      meta: `100 questions · 90 min`,
                      data: { id: p.paper_id, title: `${subject} Paper ${p.paper_number || i + 1}`, duration: 90, total: 100 },
                    }))}
                    selected={selected}
                    onSelect={setSelected}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Topic banks */}
          {tab === 2 && (
            <div>
              {/* Subject filter chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {['All', ...topicSubjects].map((s) => {
                  const active = s === 'All' ? !filterSubj : filterSubj === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s === 'All' ? '' : s)}
                      style={{
                        padding: '4px 11px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 500,
                        border: `1px solid ${active ? '#6366f1' : 'var(--clr-border)'}`,
                        background: active ? '#6366f1' : 'transparent',
                        color: active ? '#fff' : 'var(--clr-text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              <PaperList
                items={topicBanks
                  .filter((b) => !filterSubj || b.subject === filterSubj)
                  .map((b, i) => ({
                    id: b.bank_id,
                    title: b.topic,
                    num: i + 1,
                    meta: `${b.total_questions} questions · ${b.subject}`,
                    data: { id: b.bank_id, title: `${b.subject} — ${b.topic}`, duration: null, total: b.total_questions },
                  }))}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
          )}
        </div>

        {/* ── Right: sticky config panel ── */}
        <div style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
          <div style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>

            {/* Panel header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--clr-border)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--clr-text)',
            }}>
              Test configuration
            </div>

            <div style={{ padding: '16px' }}>
              {selected ? (
                <>
                  {/* Selected paper */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Selected
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--clr-text)', lineHeight: 1.4 }}>
                      {selected.title}
                    </div>
                  </div>

                  {/* Question count input */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{
                      fontSize: 12,
                      color: 'var(--clr-text-muted)',
                      display: 'block',
                      marginBottom: 6,
                    }}>
                      Questions{' '}
                      <span style={{ opacity: 0.6 }}>(leave blank for all {selected.total})</span>
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
                      onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                      onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
                    />
                  </div>

                  {/* Stats */}
                  <div style={{
                    background: 'var(--clr-surface2)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
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

                  {/* Start button */}
                  <button
                    onClick={handleStart}
                    disabled={starting}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      background: starting ? '#4f46e5' : '#6366f1',
                      border: 'none',
                      color: '#fff',
                      cursor: starting ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.15s',
                      opacity: starting ? 0.75 : 1,
                    }}
                    onMouseEnter={(e) => { if (!starting) e.currentTarget.style.opacity = '0.88'; }}
                    onMouseLeave={(e) => { if (!starting) e.currentTarget.style.opacity = '1'; }}
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

          {/* Tip box */}
          <div style={{
            marginTop: 10,
            padding: '10px 13px',
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.18)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--clr-text-muted)',
            lineHeight: 1.65,
          }}>
            <span style={{ color: '#6366f1', fontWeight: 500 }}>Tip:</span>{' '}
            After answering, briefly write <em>why</em> you chose that option.
            This helps identify random guesses vs genuine knowledge.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Paper list component ─────────────────────────────────────────────────────
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
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              border: `1px solid ${isSelected ? '#6366f1' : 'var(--clr-border)'}`,
              background: isSelected ? 'rgba(99,102,241,0.07)' : 'var(--clr-surface)',
              transition: 'border-color 0.12s, background 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.borderColor = 'var(--clr-text-muted)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.borderColor = 'var(--clr-border)';
            }}
          >
            {/* Number badge */}
            <span style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--clr-surface2)',
              color: isSelected ? '#6366f1' : 'var(--clr-text-muted)',
              fontSize: 11,
              fontWeight: 600,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              border: `1px solid ${isSelected ? 'rgba(99,102,241,0.3)' : 'var(--clr-border)'}`,
            }}>
              {item.num}
            </span>

            {/* Title + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--clr-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>
                {item.meta}
              </div>
            </div>

            {/* Selected checkmark */}
            {isSelected && (
              <span style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#6366f1',
                color: '#fff',
                fontSize: 10,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}>
                ✓
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}