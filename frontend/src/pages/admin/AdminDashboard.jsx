import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminAPI } from '../../services/api';
import { Card, Spinner, ProgressBar } from '../../components/ui/index.jsx';
import { accuracyColor } from '../../utils/helpers';

export default function AdminDashboard() {
  const [data, setData]   = useState(null);
  const [loading, setLoad] = useState(true);
  const navigate           = useNavigate();

  useEffect(() => {
    adminAPI.getStats()
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={36}/></div>;
  if (!data)   return null;

  const { overview, regTrend, testTrend, popularPapers, subjectStats, dataset } = data;

  // Merge reg + test trend by date
  const trendDates = [...new Set([...regTrend.map(r=>r._id), ...testTrend.map(t=>t._id)])].sort();
  const mergedTrend = trendDates.map(d => ({
    date:  d.slice(5),        // MM-DD
    regs:  regTrend.find(r=>r._id===d)?.count  || 0,
    tests: testTrend.find(t=>t._id===d)?.count || 0,
  }));

  return (
    <div style={{ padding: '28px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, marginBottom:6 }}>Platform Dashboard</h1>
      <p style={{ color:'var(--clr-text-muted)', fontSize:14, marginBottom:24 }}>Real-time overview of students and activity</p>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total Students', value: overview.totalStudents,  color:'#6366f1' },
          { label:'New This Week',  value: overview.newThisWeek,    color:'#10b981' },
          { label:'Tests Today',    value: overview.testsToday,     color:'#f59e0b' },
          { label:'Total Tests',    value: overview.totalTests,     color:'#60a5fa' },
          { label:'Active Now',     value: overview.activeNow,      color:'#34d399' },
          { label:'Avg Accuracy',   value:`${overview.avgAccuracy}%`,color: accuracyColor(overview.avgAccuracy) },
        ].map(s => (
          <Card key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--clr-text-muted)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Dataset info */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Full Papers in Dataset',   value: dataset.fullPapers    },
          { label:'Subject Papers',           value: dataset.subjectPapers },
          { label:'Topic-wise Banks',         value: dataset.topicBanks    },
        ].map(s => (
          <Card key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, color:'var(--clr-text-muted)' }}>{s.label}</span>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:20, color:'#f59e0b' }}>{s.value}</span>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>

        {/* Registrations + Tests trend */}
        <Card>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, marginBottom:14 }}>Registrations & Tests (30 days)</h3>
          {mergedTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={mergedTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2638"/>
                <XAxis dataKey="date" tick={{ fill:'#7c8499', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#7c8499', fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background:'#171d2e', border:'1px solid #1e2638', borderRadius:8, fontSize:12 }}/>
                <Line type="monotone" dataKey="regs"  stroke="#6366f1" strokeWidth={2} dot={false} name="New Students"/>
                <Line type="monotone" dataKey="tests" stroke="#f59e0b" strokeWidth={2} dot={false} name="Tests Taken"/>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--clr-text-muted)', fontSize:13 }}>Not enough data yet</div>
          )}
        </Card>

        {/* Subject accuracy */}
        <Card>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, marginBottom:14 }}>Platform-wide Subject Accuracy</h3>
          {subjectStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectStats.slice(0,8).map(s=>({ name:s.subject.slice(0,8), accuracy:s.accuracy }))} layout="vertical">
                <XAxis type="number" domain={[0,100]} tick={{ fill:'#7c8499', fontSize:10 }} tickFormatter={v=>`${v}%`}/>
                <YAxis type="category" dataKey="name" tick={{ fill:'#e8eaf0', fontSize:10 }} width={60}/>
                <Tooltip contentStyle={{ background:'#171d2e', border:'1px solid #1e2638', borderRadius:8, fontSize:12 }} formatter={v=>[`${v}%`,'Accuracy']}/>
                <Bar dataKey="accuracy" fill="#6366f1" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--clr-text-muted)', fontSize:13 }}>No test data yet</div>
          )}
        </Card>
      </div>

      {/* Popular papers + Quick links */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14 }}>Most Attempted Papers</h3>
          </div>
          {popularPapers.length ? popularPapers.slice(0,6).map((p,i) => (
            <div key={p._id} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--clr-text-muted)', width:20 }}>#{i+1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title || p._id}</div>
                <div style={{ fontSize:11, color:'var(--clr-text-muted)' }}>{p.count} attempts · {Math.round(p.avgAccuracy||0)}% avg accuracy</div>
              </div>
            </div>
          )) : <p style={{ color:'var(--clr-text-muted)', fontSize:13 }}>No tests taken yet</p>}
        </Card>

        <Card>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, marginBottom:14 }}>Quick Actions</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label:'View all students',      onClick: ()=>navigate('/admin/students'), icon:'◉' },
              { label:'Browse test sessions',   onClick: ()=>navigate('/admin/tests'),    icon:'✎' },
              { label:'Edit question papers',   onClick: ()=>navigate('/admin/papers'),   icon:'◈' },
              { label:'Create admin account',   onClick: ()=>navigate('/admin/settings'), icon:'⚙' },
            ].map(a => (
              <button key={a.label} onClick={a.onClick} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 14px', borderRadius:10,
                background:'var(--clr-surface2)', border:'1px solid var(--clr-border)',
                color:'var(--clr-text)', fontSize:13, cursor:'pointer', textAlign:'left',
                transition:'all .15s',
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#f59e0b'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--clr-border)'}
              >
                <span style={{ color:'#f59e0b' }}>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
