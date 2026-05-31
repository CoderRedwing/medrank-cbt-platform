import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTestStore from '../store/testStore';
import { Card, Btn, Spinner, Badge } from '../components/ui/index.jsx';
import { formatMinutes } from '../utils/helpers';

const TABS = ['Full Paper', 'Subject-wise', 'Topic-wise'];

export default function TestSelectionPage() {
  const [tab, setTab]             = useState(0);
  const [selected, setSelected]   = useState(null);
  const [qCount, setQCount]       = useState('');
  const [starting, setStarting]   = useState(false);
  const [filterSubj, setFilter]   = useState('');
  const { papers, papersLoading, fetchPapers, startTest, reset } = useTestStore();
  const navigate                  = useNavigate();

  useEffect(() => {
    reset();
    if (!papers) fetchPapers();
  }, []);

  const handleStart = async () => {
    if (!selected) return;
    setStarting(true);
    const typeMap = ['full_paper', 'subject_paper', 'topic_wise'];
    const res = await startTest({
      test_type:     typeMap[tab],
      paper_ref:     selected.id,
      questionCount: qCount ? parseInt(qCount) : undefined,
    });
    setStarting(false);
    if (res.success) navigate('/test/active');
  };

  if (papersLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={36} />
    </div>
  );

  const fullPapers    = papers?.full_papers    || [];
  const subjectPapers = papers?.subject_papers || [];
  const topicBanks    = papers?.topic_banks    || [];

  // Grouped subject papers
  const subjectGroups = {};
  subjectPapers.forEach((p) => {
    if (!subjectGroups[p.subject]) subjectGroups[p.subject] = [];
    subjectGroups[p.subject].push(p);
  });

  // Unique subjects for topic filter
  const topicSubjects = [...new Set(topicBanks.map((b) => b.subject))].sort();

  return (
    <div style={{ padding: '32px 28px', maxWidth: 980, margin: '0 auto' }}>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
        Start a Test
      </h1>
      <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginBottom: 28 }}>
        Choose your test mode. Full papers simulate real NEET PG CBT conditions.
      </p>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--clr-surface)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map((t, i) => (
          <button
            key={t} onClick={() => { setTab(i); setSelected(null); }}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
              background: tab === i ? 'var(--clr-primary)' : 'transparent',
              color: tab === i ? '#fff' : 'var(--clr-text-muted)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Left — paper list */}
        <div>
          {/* Full papers */}
          {tab === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fullPapers.map((p) => (
                <PaperCard
                  key={p.paper_id}
                  title={p.paper_title}
                  meta={`200 questions · 3h 30m`}
                  badge="Full Paper"
                  badgeColor="indigo"
                  selected={selected?.id === p.paper_id}
                  onClick={() => setSelected({ id: p.paper_id, title: p.paper_title, duration: 210, total: 200 })}
                />
              ))}
            </div>
          )}

          {/* Subject papers */}
          {tab === 1 && (
            <div>
              {Object.entries(subjectGroups).map(([subject, papers]) => (
                <div key={subject} style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    {subject}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {papers.map((p) => (
                      <PaperCard
                        key={p.paper_id}
                        title={`${subject} Paper ${p.paper_number}`}
                        meta={`100 questions · 90 min`}
                        badge={subject.slice(0, 5)}
                        badgeColor="blue"
                        selected={selected?.id === p.paper_id}
                        onClick={() => setSelected({ id: p.paper_id, title: `${subject} Paper ${p.paper_number}`, duration: 90, total: 100 })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Topic banks */}
          {tab === 2 && (
            <div>
              {/* Subject filter */}
              <div style={{ marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilter('')}
                  style={{
                    padding: '4px 12px', borderRadius: 99, fontSize: 12,
                    border: `1px solid ${!filterSubj ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    background: !filterSubj ? 'var(--clr-primary)' : 'transparent',
                    color: !filterSubj ? '#fff' : 'var(--clr-text-muted)', cursor: 'pointer',
                  }}
                >
                  All
                </button>
                {topicSubjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    style={{
                      padding: '4px 12px', borderRadius: 99, fontSize: 12,
                      border: `1px solid ${filterSubj === s ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                      background: filterSubj === s ? 'var(--clr-primary)' : 'transparent',
                      color: filterSubj === s ? '#fff' : 'var(--clr-text-muted)', cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topicBanks
                  .filter((b) => !filterSubj || b.subject === filterSubj)
                  .map((b) => (
                    <PaperCard
                      key={b.bank_id}
                      title={b.topic}
                      meta={`${b.total_questions} questions · ${b.subject}`}
                      badge={b.subject.slice(0, 5)}
                      badgeColor="green"
                      selected={selected?.id === b.bank_id}
                      onClick={() => setSelected({ id: b.bank_id, title: `${b.subject} — ${b.topic}`, duration: null, total: b.total_questions })}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — config panel */}
        <div style={{ position: 'sticky', top: 24, height: 'fit-content' }}>
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              Test Configuration
            </h3>

            {selected ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 4 }}>Selected</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.title}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 4 }}>
                    Questions (leave blank for all {selected.total})
                  </div>
                  <input
                    type="number"
                    value={qCount}
                    onChange={(e) => setQCount(e.target.value)}
                    placeholder={`Max: ${selected.total}`}
                    min={5} max={selected.total}
                    style={{
                      width: '100%', padding: '9px 12px',
                      background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
                      borderRadius: 8, color: 'var(--clr-text)', fontSize: 14,
                    }}
                  />
                </div>

                {selected.duration && (
                  <div style={{ marginBottom: 18, padding: '10px 12px', background: 'var(--clr-surface2)', borderRadius: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--clr-text-muted)' }}>Duration</span>
                      <span style={{ fontWeight: 600 }}>
                        {qCount
                          ? formatMinutes(Math.round((parseInt(qCount) / selected.total) * selected.duration))
                          : formatMinutes(selected.duration)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ color: 'var(--clr-text-muted)' }}>Marking</span>
                      <span style={{ fontWeight: 600 }}>+4 / −1 / 0</span>
                    </div>
                  </div>
                )}

                <Btn size="lg" loading={starting} onClick={handleStart} style={{ width: '100%' }}>
                  Start Test →
                </Btn>
              </>
            ) : (
              <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>
                Select a paper from the list to configure and start your test.
              </p>
            )}
          </Card>

          {/* Info box */}
          <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--clr-primary)' }}>Tip:</strong> After answering, briefly write <em>why</em> you chose that option. This helps identify random guesses vs genuine knowledge.
          </div>
        </div>
      </div>
    </div>
  );
}

function PaperCard({ title, meta, badge, badgeColor, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
        background: selected ? 'rgba(99,102,241,0.12)' : 'var(--clr-surface2)',
        border: `1px solid ${selected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2 }}>{meta}</div>
      </div>
      {selected && <span style={{ color: 'var(--clr-primary)', fontSize: 18, flexShrink: 0 }}>✓</span>}
    </div>
  );
}
