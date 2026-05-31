import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Card, Spinner, Badge } from '../../components/ui/index.jsx';
import { accuracyColor, scoreColor, formatTime } from '../../utils/helpers';

const TYPE_LABELS = { full_paper:'Full Paper', subject_paper:'Subject', topic_wise:'Topic', ai_generated:'AI Gen' };
const TYPE_COLORS = { full_paper:'indigo', subject_paper:'blue', topic_wise:'green', ai_generated:'amber' };

export default function AdminTests() {
  const [data, setData]       = useState(null);
  const [loading, setLoad]    = useState(true);
  const [page, setPage]       = useState(1);
  const [typeFilter, setType] = useState('');
  const [deleting, setDel]    = useState(null);

  const load = () => {
    setLoad(true);
    adminAPI.getAllTests(page, 30, typeFilter)
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  };

  useEffect(()=>{ load(); }, [page, typeFilter]);

  const confirmDelete = async () => {
    try {
      await adminAPI.deleteTest(deleting);
      setDel(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div style={{ padding:'28px 28px', maxWidth:1100, margin:'0 auto' }}>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, marginBottom:6 }}>All Test Sessions</h1>
      <p style={{ color:'var(--clr-text-muted)', fontSize:14, marginBottom:20 }}>
        {data?.total || 0} completed tests
      </p>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
        {['', 'full_paper', 'subject_paper', 'topic_wise', 'ai_generated'].map(t => (
          <button key={t} onClick={()=>{ setType(t); setPage(1); }} style={{
            padding:'5px 14px', borderRadius:99, fontSize:12, cursor:'pointer', fontWeight:600,
            border:`1px solid ${typeFilter===t ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
            background: typeFilter===t ? 'var(--clr-primary)' : 'transparent',
            color: typeFilter===t ? '#fff' : 'var(--clr-text-muted)',
          }}>
            {t ? TYPE_LABELS[t] : 'All Types'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32}/></div>
      ) : (
        <>
          <Card style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--clr-border)', background:'var(--clr-surface2)' }}>
                  {['Student','Paper','Type','Score','Accuracy','Time','Date',''].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--clr-text-muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.sessions?.map(s=>(
                  <tr key={s._id} style={{ borderBottom:'1px solid var(--clr-border)' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--clr-surface2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'9px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{s.user?.name || '—'}</div>
                      <div style={{ fontSize:11, color:'var(--clr-text-muted)' }}>{s.user?.email}</div>
                    </td>
                    <td style={{ padding:'9px 14px', fontSize:12, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.paper_title}</td>
                    <td style={{ padding:'9px 14px' }}><Badge color={TYPE_COLORS[s.test_type]||'gray'}>{TYPE_LABELS[s.test_type]||s.test_type}</Badge></td>
                    <td style={{ padding:'9px 14px', fontWeight:700, color: scoreColor(s.score?.percent) }}>{Math.round(s.score?.percent||0)}%</td>
                    <td style={{ padding:'9px 14px', fontWeight:700, color: accuracyColor(s.accuracy) }}>{s.accuracy}%</td>
                    <td style={{ padding:'9px 14px', fontSize:12, color:'var(--clr-text-muted)' }}>{s.time_taken_sec ? formatTime(s.time_taken_sec) : '—'}</td>
                    <td style={{ padding:'9px 14px', fontSize:11, color:'var(--clr-text-muted)' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                    </td>
                    <td style={{ padding:'9px 14px' }}>
                      <button onClick={()=>setDel(s._id)} style={{
                        padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
                        border:'1px solid rgba(239,68,68,.3)', background:'rgba(239,68,68,.1)', color:'#f87171',
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

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

      {/* Delete confirm */}
      {deleting && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200 }}>
          <div style={{ background:'var(--clr-surface)',border:'1px solid var(--clr-border)',borderRadius:16,padding:28,maxWidth:380,width:'90%' }}>
            <h2 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:18,marginBottom:12 }}>Delete this test session?</h2>
            <p style={{ color:'var(--clr-text-muted)',fontSize:14,marginBottom:20 }}>This action cannot be undone.</p>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={confirmDelete} style={{ padding:'8px 20px',borderRadius:8,background:'#ef4444',color:'#fff',border:'none',fontWeight:700,cursor:'pointer' }}>Delete</button>
              <button onClick={()=>setDel(null)} style={{ padding:'8px 20px',borderRadius:8,background:'var(--clr-surface2)',color:'var(--clr-text)',border:'1px solid var(--clr-border)',cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
