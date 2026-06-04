import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Card, Btn, Spinner, Badge } from '../../components/ui/index.jsx';
import { difficultyColor } from '../../utils/helpers';

const TABS = ['Full Papers', 'Subject Papers', 'Topic Banks'];
const TYPE_KEYS = ['full', 'subject', 'topic'];

const SUBJECTS = [
  'Medicine','Surgery','Pathology','Pharmacology','Microbiology',
  'OBGYN','Pediatrics','PSM','Anatomy','Physiology','Biochemistry','ENT',
  'Ophthalmology','Orthopedics','Psychiatry','Radiology','Anaesthesia',
  'Dermatology','Forensic Medicine',
];

const DIFFICULTY_CONFIG = {
  Easy:      { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  Moderate:  { bg: '#fef9c3', text: '#a16207', dot: '#eab308' },
  Hard:      { bg: '#ffedd5', text: '#c2410c', dot: '#f97316' },
  'Very Hard': { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
};

export default function AdminPapers() {
  const [tab, setTab]          = useState(0);
  const [papers, setPapers]    = useState([]);
  const [loading, setLoad]     = useState(true);
  const [selectedPaper, setSP] = useState(null);
  const [paperLoading, setPL]  = useState(false);
  const [editQ, setEditQ]      = useState(null);
  const [addMode, setAddMode]  = useState(false);
  const [newQ, setNewQ]        = useState(emptyQ());
  const [saving, setSaving]    = useState(false);
  const [delQ, setDelQ]        = useState(null);
  const [searchQ, setSearchQ]  = useState('');

  function emptyQ() {
    return {
      question_text: '', options: { A: '', B: '', C: '', D: '' },
      correct_answer: 'A', explanation: '', subject: 'Medicine',
      topic: '', difficulty: 'Moderate',
    };
  }

  useEffect(() => {
    setLoad(true); setSP(null); setSearchQ('');
    adminAPI.listPapers(TYPE_KEYS[tab])
      .then(r => setPapers(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [tab]);

  const loadPaper = async (id) => {
    setPL(true); setSearchQ('');
    try {
      const { data } = await adminAPI.getPaperDetail(TYPE_KEYS[tab], id);
      setSP({ id, data: data.data });
    } catch { alert('Failed to load paper'); }
    finally { setPL(false); }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminAPI.editQuestion(TYPE_KEYS[tab], selectedPaper.id, {
        question_id: editQ.question_id,
        updates: {
          question_text: editQ.question_text, options: editQ.options,
          correct_answer: editQ.correct_answer, explanation: editQ.explanation,
          difficulty: editQ.difficulty, topic: editQ.topic,
        },
      });
      await loadPaper(selectedPaper.id);
      setEditQ(null);
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const saveAdd = async () => {
    setSaving(true);
    try {
      await adminAPI.addQuestion(TYPE_KEYS[tab], selectedPaper.id, { question: newQ });
      await loadPaper(selectedPaper.id);
      setAddMode(false); setNewQ(emptyQ());
    } catch (err) { alert(err.response?.data?.message || 'Add failed'); }
    finally { setSaving(false); }
  };

  const deleteQ = async () => {
    try {
      await adminAPI.deleteQuestion(TYPE_KEYS[tab], selectedPaper.id, delQ);
      await loadPaper(selectedPaper.id);
      setDelQ(null);
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const filteredQs = selectedPaper?.data?.questions?.filter(q =>
    !searchQ ||
    q.question_text.toLowerCase().includes(searchQ.toLowerCase()) ||
    q.topic?.toLowerCase().includes(searchQ.toLowerCase())
  ) || [];

  return (
    <div style={styles.page}>

      {/* ── Page header ── */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Manage Papers</h1>
          <p style={styles.pageSubtitle}>Browse, edit, add and delete questions across the dataset</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={styles.tabBar}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            ...styles.tabBtn,
            ...(tab === i ? styles.tabBtnActive : {}),
          }}>
            {t}
            {tab === i && <span style={styles.tabIndicator} />}
          </button>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div style={styles.grid}>

        {/* Paper list */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarLabel}>
              {loading ? '—' : papers.length} papers
            </span>
          </div>
          <div style={styles.paperList}>
            {loading
              ? <div style={styles.spinnerWrap}><Spinner size={22} /></div>
              : papers.map(p => {
                  const pid = p.paper_id || p.bank_id;
                  const active = selectedPaper?.id === pid;
                  return (
                    <button key={pid} onClick={() => loadPaper(pid)}
                      style={{ ...styles.paperItem, ...(active ? styles.paperItemActive : {}) }}>
                      <div style={{ ...styles.paperItemTitle, color: active ? '#f59e0b' : 'var(--clr-text)' }}>
                        {p.paper_title || p.topic || pid}
                      </div>
                      <div style={styles.paperItemMeta}>
                        <span style={styles.metaPill}>
                          {p.total_questions} Qs
                        </span>
                        {p.subject && <span style={styles.metaPill}>{p.subject}</span>}
                      </div>
                    </button>
                  );
                })
            }
          </div>
        </aside>

        {/* Questions panel */}
        <main style={styles.main}>
          {!selectedPaper && !paperLoading && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📄</div>
              <p style={styles.emptyTitle}>Select a paper</p>
              <p style={styles.emptyText}>Choose a paper from the sidebar to view and manage its questions.</p>
            </div>
          )}

          {paperLoading && (
            <div style={styles.spinnerWrap}><Spinner size={28} /></div>
          )}

          {selectedPaper && !paperLoading && (
            <>
              {/* Panel toolbar */}
              <div style={styles.toolbar}>
                <div style={styles.toolbarLeft}>
                  <span style={styles.toolbarTitle}>
                    {selectedPaper.data.paper_title || selectedPaper.data.topic}
                  </span>
                  <span style={styles.toolbarCount}>
                    {filteredQs.length}/{selectedPaper.data.total_questions} questions
                  </span>
                </div>
                <div style={styles.toolbarRight}>
                  <div style={styles.searchWrap}>
                    <svg style={styles.searchIcon} viewBox="0 0 20 20" fill="none">
                      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <input
                      value={searchQ} onChange={e => setSearchQ(e.target.value)}
                      placeholder="Search questions or topics…"
                      style={styles.searchInput}
                    />
                    {searchQ && (
                      <button onClick={() => setSearchQ('')} style={styles.searchClear}>×</button>
                    )}
                  </div>
                  <button onClick={() => setAddMode(true)} style={styles.addBtn}>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Question
                  </button>
                </div>
              </div>

              {/* Question cards */}
              <div style={styles.questionList}>
                {filteredQs.length === 0 && (
                  <div style={{ ...styles.emptyState, padding: '40px 0' }}>
                    <p style={styles.emptyText}>No questions match your search.</p>
                  </div>
                )}
                {filteredQs.map((q, i) => {
                  const dc = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG.Moderate;
                  return (
                    <div key={q.question_id} style={styles.qCard}>
                      <div style={styles.qCardLeft}>
                        <span style={styles.qNum}>#{i + 1}</span>
                      </div>
                      <div style={styles.qCardBody}>
                        <p style={styles.qText}>
                          {q.question_text.length > 140
                            ? q.question_text.slice(0, 140) + '…'
                            : q.question_text}
                        </p>
                        <div style={styles.qTags}>
                          <span style={{ ...styles.diffBadge, background: dc.bg, color: dc.text }}>
                            <span style={{ ...styles.diffDot, background: dc.dot }} />
                            {q.difficulty}
                          </span>
                          <span style={{ ...styles.answerBadge }}>
                            ✓ {q.correct_answer}
                          </span>
                          {q.subject && <span style={styles.tagChip}>{q.subject}</span>}
                          {q.topic   && <span style={styles.tagChip}>{q.topic}</span>}
                        </div>
                      </div>
                      <div style={styles.qCardActions}>
                        <button onClick={() => setEditQ({ ...q })} style={styles.editBtn}>Edit</button>
                        <button onClick={() => setDelQ(q.question_id)} style={styles.delBtn}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Edit Modal ── */}
      {editQ && (
        <Modal title="Edit Question" onClose={() => setEditQ(null)}>
          <QForm q={editQ} setQ={setEditQ} />
          <div style={styles.modalFooter}>
            <button onClick={saveEdit} disabled={saving} style={styles.primaryBtn}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => setEditQ(null)} style={styles.ghostBtn}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ── Add Modal ── */}
      {addMode && (
        <Modal title="Add New Question" onClose={() => { setAddMode(false); setNewQ(emptyQ()); }}>
          <QForm q={newQ} setQ={setNewQ} />
          <div style={styles.modalFooter}>
            <button onClick={saveAdd} disabled={saving} style={styles.primaryBtn}>
              {saving ? 'Adding…' : 'Add Question'}
            </button>
            <button onClick={() => { setAddMode(false); setNewQ(emptyQ()); }} style={styles.ghostBtn}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {delQ && (
        <div style={styles.overlay}>
          <div style={styles.confirmBox}>
            <div style={styles.confirmIcon}>🗑️</div>
            <h3 style={styles.confirmTitle}>Delete this question?</h3>
            <p style={styles.confirmText}>This action cannot be undone. The question will be permanently removed from the paper.</p>
            <div style={styles.confirmActions}>
              <button onClick={deleteQ} style={styles.dangerBtn}>Yes, delete</button>
              <button onClick={() => setDelQ(null)} style={styles.ghostBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Question Form ────────────────────────────────────────────── */
function QForm({ q, setQ }) {
  const set    = k => e => setQ(p => ({ ...p, [k]: e.target.value }));
  const setOpt = k => e => setQ(p => ({ ...p, options: { ...p.options, [k]: e.target.value } }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Question Text">
        <textarea value={q.question_text} onChange={set('question_text')} rows={4}
          style={{ ...styles.input, resize: 'vertical' }} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {['A', 'B', 'C', 'D'].map(l => (
          <Field key={l} label={`Option ${l}`}>
            <input value={q.options?.[l] || ''} onChange={setOpt(l)} style={styles.input} />
          </Field>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Field label="Correct Answer">
          <select value={q.correct_answer} onChange={set('correct_answer')} style={styles.input}>
            {['A', 'B', 'C', 'D'].map(l => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Difficulty">
          <select value={q.difficulty} onChange={set('difficulty')} style={styles.input}>
            {['Easy', 'Moderate', 'Hard', 'Very Hard'].map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Subject">
          <select value={q.subject || 'Medicine'} onChange={set('subject')} style={styles.input}>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Topic">
        <input value={q.topic || ''} onChange={set('topic')} placeholder="e.g. Cardiology" style={styles.input} />
      </Field>

      <Field label="Explanation">
        <textarea value={q.explanation || ''} onChange={set('explanation')} rows={3}
          style={{ ...styles.input, resize: 'vertical' }} />
      </Field>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

/* ── Modal Shell ─────────────────────────────────────────────── */
function Modal({ title, children, onClose }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modalBox}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{title}</h2>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">×</button>
        </div>
        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const styles = {
  page: {
    padding: '32px 32px 60px',
    maxWidth: 1400,
    margin: '0 auto',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
  },
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--clr-text)',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  pageSubtitle: {
    fontSize: 13,
    color: 'var(--clr-text-muted)',
    margin: '4px 0 0',
  },

  /* Tabs */
  tabBar: {
    display: 'flex',
    gap: 0,
    marginBottom: 24,
    borderBottom: '1px solid var(--clr-border)',
  },
  tabBtn: {
    position: 'relative',
    padding: '10px 18px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--clr-text-muted)',
    transition: 'color .15s',
  },
  tabBtnActive: {
    color: '#f59e0b',
    fontWeight: 700,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    background: '#f59e0b',
    borderRadius: '2px 2px 0 0',
    display: 'block',
  },

  /* Grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: 20,
    alignItems: 'start',
  },

  /* Sidebar */
  sidebar: {
    background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '10px 14px',
    borderBottom: '1px solid var(--clr-border)',
    background: 'var(--clr-surface2)',
  },
  sidebarLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--clr-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  paperList: {
    maxHeight: 'calc(100vh - 280px)',
    overflowY: 'auto',
  },
  paperItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '12px 14px',
    border: 'none',
    borderBottom: '1px solid var(--clr-border)',
    borderLeft: '3px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background .1s',
  },
  paperItemActive: {
    background: 'rgba(245,158,11,.07)',
    borderLeft: '3px solid #f59e0b',
  },
  paperItemTitle: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.4,
    marginBottom: 5,
  },
  paperItemMeta: {
    display: 'flex',
    gap: 5,
    flexWrap: 'wrap',
  },
  metaPill: {
    fontSize: 10,
    fontWeight: 600,
    padding: '1px 7px',
    borderRadius: 99,
    background: 'var(--clr-surface2)',
    color: 'var(--clr-text-muted)',
    border: '1px solid var(--clr-border)',
  },

  /* Main panel */
  main: {
    minHeight: 400,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)',
    borderRadius: 12,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12, opacity: 0.5 },
  emptyTitle: { fontSize: 15, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 6px' },
  emptyText:  { fontSize: 13, color: 'var(--clr-text-muted)', margin: 0, textAlign: 'center', maxWidth: 280 },

  /* Toolbar */
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    padding: '12px 16px',
    background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)',
    borderRadius: 12,
  },
  toolbarLeft: { display: 'flex', alignItems: 'baseline', gap: 10 },
  toolbarTitle: { fontSize: 14, fontWeight: 700, color: 'var(--clr-text)' },
  toolbarCount: { fontSize: 12, color: 'var(--clr-text-muted)', fontWeight: 500 },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 8 },

  /* Search */
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 10,
    width: 14,
    height: 14,
    color: 'var(--clr-text-muted)',
    pointerEvents: 'none',
  },
  searchInput: {
    padding: '7px 32px 7px 30px',
    background: 'var(--clr-surface2)',
    border: '1px solid var(--clr-border)',
    borderRadius: 8,
    color: 'var(--clr-text)',
    fontSize: 13,
    width: 220,
    outline: 'none',
  },
  searchClear: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    color: 'var(--clr-text-muted)',
    fontSize: 16,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    background: '#f59e0b',
    color: '#000',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity .15s',
  },

  /* Question list */
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 'calc(100vh - 360px)',
    overflowY: 'auto',
  },

  /* Question card */
  qCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 16px',
    background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)',
    borderRadius: 10,
    transition: 'border-color .15s',
  },
  qCardLeft: {
    flexShrink: 0,
    paddingTop: 2,
  },
  qNum: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--clr-text-muted)',
    letterSpacing: '0.04em',
  },
  qCardBody: { flex: 1, minWidth: 0 },
  qText: {
    fontSize: 13,
    lineHeight: 1.65,
    color: 'var(--clr-text)',
    margin: '0 0 10px',
  },
  qTags: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },

  diffBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '2px 8px 2px 6px',
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 700,
  },
  diffDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  answerBadge: {
    padding: '2px 8px',
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 700,
    background: 'rgba(16,185,129,.12)',
    color: '#059669',
  },
  tagChip: {
    padding: '2px 8px',
    borderRadius: 99,
    fontSize: 11,
    background: 'var(--clr-surface2)',
    color: 'var(--clr-text-muted)',
    border: '1px solid var(--clr-border)',
  },
  qCardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    flexShrink: 0,
  },
  editBtn: {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(99,102,241,.35)',
    background: 'rgba(99,102,241,.08)',
    color: '#6366f1',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background .1s',
  },
  delBtn: {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(239,68,68,.3)',
    background: 'rgba(239,68,68,.07)',
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background .1s',
  },

  /* Overlay / Modals */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.6)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: 16,
  },
  modalBox: {
    background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 620,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: '1px solid var(--clr-border)',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
    color: 'var(--clr-text)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--clr-text-muted)',
    fontSize: 24,
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 2px',
    borderRadius: 6,
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  modalFooter: {
    display: 'flex',
    gap: 8,
    paddingTop: 18,
    borderTop: '1px solid var(--clr-border)',
    marginTop: 8,
  },

  /* Confirm box */
  confirmBox: {
    background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)',
    borderRadius: 16,
    padding: 32,
    maxWidth: 380,
    width: '100%',
    textAlign: 'center',
  },
  confirmIcon: { fontSize: 40, marginBottom: 14, opacity: 0.8 },
  confirmTitle: { fontSize: 17, fontWeight: 700, color: 'var(--clr-text)', margin: '0 0 10px' },
  confirmText:  { fontSize: 13, color: 'var(--clr-text-muted)', margin: '0 0 24px', lineHeight: 1.6 },
  confirmActions: { display: 'flex', gap: 8, justifyContent: 'center' },

  /* Buttons */
  primaryBtn: {
    padding: '9px 20px',
    background: '#f59e0b',
    color: '#000',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  ghostBtn: {
    padding: '9px 20px',
    background: 'var(--clr-surface2)',
    color: 'var(--clr-text)',
    border: '1px solid var(--clr-border)',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  dangerBtn: {
    padding: '9px 20px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },

  /* Form */
  input: {
    width: '100%',
    padding: '8px 11px',
    background: 'var(--clr-surface2)',
    border: '1px solid var(--clr-border)',
    borderRadius: 8,
    color: 'var(--clr-text)',
    fontSize: 13,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
  },
  fieldLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--clr-text-muted)',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  spinnerWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
};