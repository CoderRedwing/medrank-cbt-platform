import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Card, Btn, Spinner, Badge } from '../../components/ui/index.jsx';
import { accuracyColor } from '../../utils/helpers';

export default function AdminStudents() {
  const [data, setData]       = useState(null);
  const [loading, setLoad]    = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [searchInput, setSI]  = useState('');
  const [selected, setSelected] = useState(null);   // student for detail modal
  const [editing, setEditing]   = useState(null);   // student being edited
  const [deleting, setDeleting] = useState(null);   // student id to confirm delete
  const [saving, setSaving]     = useState(false);
  const [editForm, setEF]       = useState({});
  const navigate = useNavigate();

  const load = () => {
    setLoad(true);
    adminAPI.getStudents(page, 30, search)
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  };

  useEffect(() => { load(); }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const openEdit = (s) => {
    setEditing(s);
    setEF({ name: s.name, email: s.email, targetExam: s.targetExam, role: s.role });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminAPI.updateStudent(editing._id, editForm);
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await adminAPI.deleteStudent(deleting);
      setDeleting(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const openDetail = async (id) => {
    try {
      const { data } = await adminAPI.getStudentDetail(id);
      setSelected(data.data);
    } catch (err) {
      alert('Failed to load student detail');
    }
  };

  return (
    <div style={{ padding:'28px 28px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800 }}>Students</h1>
          <p style={{ color:'var(--clr-text-muted)', fontSize:14, marginTop:4 }}>
            {data?.total || 0} registered students
          </p>
        </div>
        {/* Search */}
        <form onSubmit={handleSearch} style={{ display:'flex', gap:8 }}>
          <input value={searchInput} onChange={e=>setSI(e.target.value)}
            placeholder="Search name or email…"
            style={{ padding:'8px 14px', background:'var(--clr-surface)', border:'1px solid var(--clr-border)', borderRadius:8, color:'var(--clr-text)', fontSize:13, width:220 }}/>
          <Btn type="submit" variant="outline" size="sm">Search</Btn>
          {search && <Btn variant="ghost" size="sm" onClick={()=>{ setSearch(''); setSI(''); setPage(1); }}>✕ Clear</Btn>}
        </form>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32}/></div>
      ) : (
        <>
          <Card style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--clr-border)', background:'var(--clr-surface2)' }}>
                  {['Name','Email','Target','Tests','Accuracy','Joined','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--clr-text-muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.students?.map(s => (
                  <tr key={s._id} style={{ borderBottom:'1px solid var(--clr-border)', transition:'background .1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--clr-surface2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{s.name}</div>
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:12, color:'var(--clr-text-muted)' }}>{s.email}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <Badge color="blue">{s.targetExam?.replace('_',' ')}</Badge>
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:13 }}>{s.stats?.totalTestsTaken || 0}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontWeight:700, color: accuracyColor(s.stats?.averageAccuracy||0) }}>
                        {s.stats?.averageAccuracy || 0}%
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'var(--clr-text-muted)' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>openDetail(s._id)} style={aBtn('#6366f1')}>View</button>
                        <button onClick={()=>openEdit(s)}       style={aBtn('#f59e0b')}>Edit</button>
                        <button onClick={()=>setDeleting(s._id)} style={aBtn('#ef4444')}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination */}
          {data?.pages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:16 }}>
              {Array.from({length:data.pages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} style={{
                  width:34, height:34, borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
                  background: page===p ? '#f59e0b' : 'var(--clr-surface)',
                  border:`1px solid ${page===p ? '#f59e0b' : 'var(--clr-border)'}`,
                  color: page===p ? '#000' : 'var(--clr-text-muted)',
                }}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Detail modal ── */}
      {selected && (
        <Modal onClose={()=>setSelected(null)} title={`${selected.student.name} — Detail`}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[
              ['Email',       selected.student.email],
              ['Target',      selected.student.targetExam],
              ['Tests Taken', selected.student.stats?.totalTestsTaken||0],
              ['Avg Accuracy',`${selected.student.stats?.averageAccuracy||0}%`],
              ['Correct',     selected.student.stats?.totalCorrect||0],
              ['Joined',      new Date(selected.student.createdAt).toLocaleDateString()],
            ].map(([k,v])=>(
              <div key={k} style={{ background:'var(--clr-surface2)', padding:'10px 12px', borderRadius:8 }}>
                <div style={{ fontSize:11, color:'var(--clr-text-muted)' }}>{k}</div>
                <div style={{ fontWeight:600, fontSize:14, marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
          <h4 style={{ fontSize:13, fontWeight:700, color:'var(--clr-text-muted)', marginBottom:8 }}>Recent Tests</h4>
          {selected.recentTests?.slice(0,5).map(t=>(
            <div key={t._id} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--clr-border)', fontSize:13 }}>
              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.paper_title}</span>
              <span style={{ color: accuracyColor(t.accuracy), fontWeight:700 }}>{t.accuracy}%</span>
              <span style={{ color:'var(--clr-text-muted)', fontSize:11 }}>{t.correct_count}/{t.total_questions}</span>
            </div>
          ))}
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {editing && (
        <Modal onClose={()=>setEditing(null)} title="Edit Student">
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              {k:'name',label:'Name',type:'text'},
              {k:'email',label:'Email',type:'email'},
            ].map(({k,label,type})=>(
              <FormField key={k} label={label}>
                <input type={type} value={editForm[k]||''} onChange={e=>setEF(p=>({...p,[k]:e.target.value}))} style={iStyle}/>
              </FormField>
            ))}
            <FormField label="Target Exam">
              <select value={editForm.targetExam||''} onChange={e=>setEF(p=>({...p,targetExam:e.target.value}))} style={iStyle}>
                {['NEET_PG','INI_CET','FMGE','OTHER'].map(o=><option key={o}>{o}</option>)}
              </select>
            </FormField>
            <FormField label="Role">
              <select value={editForm.role||'student'} onChange={e=>setEF(p=>({...p,role:e.target.value}))} style={iStyle}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </FormField>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <Btn loading={saving} onClick={saveEdit} size="md">Save</Btn>
              <Btn variant="secondary" onClick={()=>setEditing(null)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {deleting && (
        <Modal onClose={()=>setDeleting(null)} title="Confirm Delete">
          <p style={{ color:'var(--clr-text-muted)', fontSize:14, marginBottom:20 }}>
            This will permanently delete the student and <strong style={{color:'#f87171'}}>all their test data</strong>. This cannot be undone.
          </p>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="danger" onClick={confirmDelete}>Yes, Delete</Btn>
            <Btn variant="secondary" onClick={()=>setDeleting(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// shared helpers
const aBtn = (color) => ({
  padding:'4px 10px', borderRadius:6, border:`1px solid ${color}30`,
  background:`${color}15`, color:color, fontSize:11, fontWeight:600, cursor:'pointer',
});
const iStyle = {
  width:'100%', padding:'9px 12px', background:'var(--clr-surface2)',
  border:'1px solid var(--clr-border)', borderRadius:8, color:'var(--clr-text)', fontSize:13,
};
function FormField({label,children}){
  return(
    <div>
      <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--clr-text-muted)',marginBottom:5}}>{label}</label>
      {children}
    </div>
  );
}
function Modal({title,children,onClose}){
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
      <div style={{background:'var(--clr-surface)',border:'1px solid var(--clr-border)',borderRadius:16,padding:28,maxWidth:520,width:'90%',maxHeight:'85vh',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h2 style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:18}}>{title}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--clr-text-muted)',fontSize:22,cursor:'pointer',lineHeight:1}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
