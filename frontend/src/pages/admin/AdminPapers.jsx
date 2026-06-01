import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Card, Btn, Spinner, Badge } from '../../components/ui/index.jsx';
import { difficultyColor } from '../../utils/helpers';

const TABS = ['Full Papers','Subject Papers','Topic Banks'];
const TYPE_KEYS = ['full','subject','topic'];

const SUBJECTS = ['Medicine','Surgery','Pathology','Pharmacology','Microbiology',
  'OBGYN','Pediatrics','PSM','Anatomy','Physiology','Biochemistry','ENT',
  'Ophthalmology','Orthopedics','Psychiatry','Radiology','Anaesthesia','Dermatology','Forensic Medicine'];

export default function AdminPapers() {
  const [tab, setTab]           = useState(0);
  const [papers, setPapers]     = useState([]);
  const [loading, setLoad]      = useState(true);
  const [selectedPaper, setSP]  = useState(null);   // { id, data }
  const [paperLoading, setPL]   = useState(false);
  const [editQ, setEditQ]       = useState(null);   // question being edited
  const [addMode, setAddMode]   = useState(false);
  const [newQ, setNewQ]         = useState(emptyQ());
  const [saving, setSaving]     = useState(false);
  const [delQ, setDelQ]         = useState(null);
  const [searchQ, setSearchQ]   = useState('');

  function emptyQ(){
    return { question_text:'', options:{A:'',B:'',C:'',D:''}, correct_answer:'A',
             explanation:'', subject:'Medicine', topic:'', difficulty:'Moderate' };
  }

  useEffect(()=>{
    setLoad(true); setSP(null); setSearchQ('');
    adminAPI.listPapers(TYPE_KEYS[tab])
      .then(r=>setPapers(r.data.data))
      .catch(console.error)
      .finally(()=>setLoad(false));
  },[tab]);

  const loadPaper = async (id) => {
    setPL(true); setSearchQ('');
    try {
      const {data} = await adminAPI.getPaperDetail(TYPE_KEYS[tab], id);
      setSP({ id, data:data.data });
    } catch(err){ alert('Failed to load paper'); }
    finally{ setPL(false); }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminAPI.editQuestion(TYPE_KEYS[tab], selectedPaper.id, {
        question_id: editQ.question_id,
        updates: {
          question_text: editQ.question_text,
          options: editQ.options,
          correct_answer: editQ.correct_answer,
          explanation: editQ.explanation,
          difficulty: editQ.difficulty,
          topic: editQ.topic,
        }
      });
      // Reload paper
      await loadPaper(selectedPaper.id);
      setEditQ(null);
    } catch(err){ alert(err.response?.data?.message||'Save failed'); }
    finally{ setSaving(false); }
  };

  const saveAdd = async () => {
    setSaving(true);
    try {
      await adminAPI.addQuestion(TYPE_KEYS[tab], selectedPaper.id, { question: newQ });
      await loadPaper(selectedPaper.id);
      setAddMode(false);
      setNewQ(emptyQ());
    } catch(err){ alert(err.response?.data?.message||'Add failed'); }
    finally{ setSaving(false); }
  };

  const deleteQ = async () => {
    try {
      await adminAPI.deleteQuestion(TYPE_KEYS[tab], selectedPaper.id, delQ);
      await loadPaper(selectedPaper.id);
      setDelQ(null);
    } catch(err){ alert(err.response?.data?.message||'Delete failed'); }
  };

  const filteredQs = selectedPaper?.data?.questions?.filter(q =>
    !searchQ || q.question_text.toLowerCase().includes(searchQ.toLowerCase()) ||
    q.topic?.toLowerCase().includes(searchQ.toLowerCase())
  ) || [];

  return (
    <div style={{ padding:'28px 28px', maxWidth:1300, margin:'0 auto' }}>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, marginBottom:6 }}>Manage Papers</h1>
      <p style={{ color:'var(--clr-text-muted)', fontSize:14, marginBottom:20 }}>Browse, edit, add, and delete questions in the dataset</p>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--clr-surface)', borderRadius:10, padding:4, width:'fit-content' }}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:'7px 18px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, transition:'all .15s',
            background: tab===i ? '#f59e0b' : 'transparent',
            color: tab===i ? '#000' : 'var(--clr-text-muted)',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:20 }}>

        {/* Paper list */}
        <Card style={{ height:'fit-content', padding:0, overflow:'hidden' }}>
          {loading ? <div style={{ padding:30, textAlign:'center' }}><Spinner size={24}/></div> : (
            <div style={{ maxHeight:'calc(100vh - 260px)', overflow:'auto' }}>
              {papers.map(p => {
                const pid = p.paper_id || p.bank_id;
                const isSelected = selectedPaper?.id === pid;
                return (
                  <button key={pid} onClick={()=>loadPaper(pid)} style={{
                    width:'100%', textAlign:'left', padding:'11px 14px', border:'none', cursor:'pointer',
                    borderBottom:'1px solid var(--clr-border)',
                    background: isSelected ? 'rgba(245,158,11,.1)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #f59e0b' : '3px solid transparent',
                    transition:'all .1s',
                  }}>
                    <div style={{ fontSize:13, fontWeight:600, color: isSelected ? '#f59e0b' : 'var(--clr-text)' }}>
                      {p.paper_title || p.topic || pid}
                    </div>
                    <div style={{ fontSize:11, color:'var(--clr-text-muted)', marginTop:2 }}>
                      {p.total_questions} questions {p.subject ? `· ${p.subject}` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Questions panel */}
        <div>
          {!selectedPaper && !paperLoading && (
            <Card>
              <p style={{ color:'var(--clr-text-muted)', fontSize:14, padding:'20px 0', textAlign:'center' }}>Select a paper from the left to view questions</p>
            </Card>
          )}
          {paperLoading && <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={28}/></div>}
          {selectedPaper && !paperLoading && (
            <>
              {/* Paper header */}
              <Card style={{ marginBottom:14, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16 }}>
                    {selectedPaper.data.paper_title || selectedPaper.data.topic}
                  </div>
                  <div style={{ fontSize:12, color:'var(--clr-text-muted)', marginTop:2 }}>
                    {selectedPaper.data.total_questions} questions
                  </div>
                </div>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  placeholder="Search questions…"
                  style={{ padding:'7px 12px', background:'var(--clr-surface2)', border:'1px solid var(--clr-border)', borderRadius:8, color:'var(--clr-text)', fontSize:13, width:200 }}/>
                <Btn size="sm" onClick={()=>setAddMode(true)}>+ Add Question</Btn>
              </Card>

              {/* Question list */}
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:'calc(100vh - 340px)', overflow:'auto' }}>
                {filteredQs.map((q,i) => {
                  const dc = difficultyColor(q.difficulty);
                  return (
                    <Card key={q.question_id} style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                        <span style={{ fontSize:11, color:'var(--clr-text-muted)', fontWeight:700, flexShrink:0, marginTop:2 }}>#{i+1}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, lineHeight:1.6, marginBottom:6 }}>
                            {q.question_text.length>120 ? q.question_text.slice(0,120)+'…' : q.question_text}
                          </div>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, background:dc.bg, color:dc.text, fontWeight:600 }}>{q.difficulty}</span>
                            {q.subject && <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, background:'var(--clr-surface2)', color:'var(--clr-text-muted)' }}>{q.subject}</span>}
                            {q.topic && <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, background:'var(--clr-surface2)', color:'var(--clr-text-muted)' }}>{q.topic}</span>}
                            <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, background:'rgba(16,185,129,.15)', color:'#10b981', fontWeight:700 }}>Ans: {q.correct_answer}</span>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                          <button onClick={()=>setEditQ({...q})} style={aBtnStyle('#6366f1')}>Edit</button>
                          <button onClick={()=>setDelQ(q.question_id)} style={aBtnStyle('#ef4444')}>Del</button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Edit Question Modal ── */}
      {editQ && (
        <QModal title="Edit Question" onClose={()=>setEditQ(null)}>
          <QForm q={editQ} setQ={setEditQ} />
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <Btn loading={saving} onClick={saveEdit}>Save Changes</Btn>
            <Btn variant="secondary" onClick={()=>setEditQ(null)}>Cancel</Btn>
          </div>
        </QModal>
      )}

      {/* ── Add Question Modal ── */}
      {addMode && (
        <QModal title="Add New Question" onClose={()=>{ setAddMode(false); setNewQ(emptyQ()); }}>
          <QForm q={newQ} setQ={setNewQ} />
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <Btn loading={saving} onClick={saveAdd}>Add Question</Btn>
            <Btn variant="secondary" onClick={()=>{ setAddMode(false); setNewQ(emptyQ()); }}>Cancel</Btn>
          </div>
        </QModal>
      )}

      {/* ── Delete Question Confirm ── */}
      {delQ && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200 }}>
          <div style={{ background:'var(--clr-surface)',border:'1px solid var(--clr-border)',borderRadius:16,padding:28,maxWidth:360,width:'90%' }}>
            <h3 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:18,marginBottom:12 }}>Delete question?</h3>
            <p style={{ color:'var(--clr-text-muted)',fontSize:14,marginBottom:20 }}>This cannot be undone.</p>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={deleteQ} style={{ padding:'8px 20px',borderRadius:8,background:'#ef4444',color:'#fff',border:'none',fontWeight:700,cursor:'pointer' }}>Delete</button>
              <button onClick={()=>setDelQ(null)} style={{ padding:'8px 20px',borderRadius:8,background:'var(--clr-surface2)',color:'var(--clr-text)',border:'1px solid var(--clr-border)',cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Question form (shared by edit + add) ──────────────────────── */
function QForm({ q, setQ }) {
  const set = (k) => (e) => setQ(p => ({ ...p, [k]: e.target.value }));
  const setOpt = (k) => (e) => setQ(p => ({ ...p, options: { ...p.options, [k]: e.target.value } }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div>
        <label style={lStyle}>Question Text</label>
        <textarea value={q.question_text} onChange={set('question_text')} rows={4}
          style={{ ...iStyle, resize:'vertical' }}/>
      </div>
      {['A','B','C','D'].map(letter => (
        <div key={letter}>
          <label style={lStyle}>Option {letter}</label>
          <input value={q.options?.[letter]||''} onChange={setOpt(letter)} style={iStyle}/>
        </div>
      ))}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        <div>
          <label style={lStyle}>Correct Answer</label>
          <select value={q.correct_answer} onChange={set('correct_answer')} style={iStyle}>
            {['A','B','C','D'].map(l=><option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={lStyle}>Difficulty</label>
          <select value={q.difficulty} onChange={set('difficulty')} style={iStyle}>
            {['Easy','Moderate','Hard','Very Hard'].map(d=><option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={lStyle}>Subject</label>
          <select value={q.subject||'Medicine'} onChange={set('subject')} style={iStyle}>
            {['Medicine','Surgery','Pathology','Pharmacology','Microbiology','OBGYN','Pediatrics','PSM',
              'Anatomy','Physiology','Biochemistry','ENT','Ophthalmology','Orthopedics','Psychiatry',
              'Radiology','Anaesthesia','Dermatology','Forensic Medicine'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={lStyle}>Topic</label>
        <input value={q.topic||''} onChange={set('topic')} placeholder="e.g. Cardiology" style={iStyle}/>
      </div>
      <div>
        <label style={lStyle}>Explanation</label>
        <textarea value={q.explanation||''} onChange={set('explanation')} rows={3}
          style={{ ...iStyle, resize:'vertical' }}/>
      </div>
    </div>
  );
}

function QModal({ title, children, onClose }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16 }}>
      <div style={{ background:'var(--clr-surface)',border:'1px solid var(--clr-border)',borderRadius:16,padding:28,width:'100%',maxWidth:600,maxHeight:'90vh',overflow:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
          <h2 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:18 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--clr-text-muted)',fontSize:22,cursor:'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const iStyle = { width:'100%', padding:'8px 12px', background:'var(--clr-surface2)', border:'1px solid var(--clr-border)', borderRadius:8, color:'var(--clr-text)', fontSize:13 };
const lStyle = { display:'block', fontSize:12, fontWeight:600, color:'var(--clr-text-muted)', marginBottom:5 };
const aBtnStyle = (color) => ({
  padding:'4px 10px', borderRadius:6, border:`1px solid ${color}30`,
  background:`${color}15`, color, fontSize:11, fontWeight:600, cursor:'pointer',
});
