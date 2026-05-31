import { useState } from 'react';
import { adminAPI } from '../../services/api';
import { Card, Btn, Alert } from '../../components/ui/index.jsx';

export default function AdminSettings() {
  const [form, setForm]   = useState({ name:'', email:'', password:'' });
  const [saving, setSave] = useState(false);
  const [msg, setMsg]     = useState(null);

  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const createAdmin = async (e) => {
    e.preventDefault();
    setSave(true); setMsg(null);
    try {
      await adminAPI.createAdmin(form);
      setMsg({ type:'success', text:`Admin account created for ${form.email}` });
      setForm({ name:'', email:'', password:'' });
    } catch(err){
      setMsg({ type:'error', text: err.response?.data?.message || 'Failed to create admin' });
    } finally { setSave(false); }
  };

  return (
    <div style={{ padding:'28px 28px', maxWidth:680, margin:'0 auto' }}>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, marginBottom:6 }}>Settings</h1>
      <p style={{ color:'var(--clr-text-muted)', fontSize:14, marginBottom:28 }}>Admin account management and platform configuration</p>

      {/* Create admin */}
      <Card style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:17, marginBottom:4 }}>Create Admin Account</h2>
        <p style={{ color:'var(--clr-text-muted)', fontSize:13, marginBottom:20 }}>
          Admin accounts have full access to all platform management features.
        </p>

        {msg && <div style={{ marginBottom:16 }}><Alert type={msg.type} message={msg.text} onClose={()=>setMsg(null)}/></div>}

        <form onSubmit={createAdmin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Field label="Full Name">
            <input value={form.name} onChange={set('name')} required
              style={iStyle} placeholder="Admin Name"/>
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={set('email')} required
              style={iStyle} placeholder="admin@example.com"/>
          </Field>
          <Field label="Password">
            <input type="password" value={form.password} onChange={set('password')} required minLength={6}
              style={iStyle} placeholder="Minimum 6 characters"/>
          </Field>
          <Btn type="submit" loading={saving} style={{ width:'fit-content' }}>Create Admin</Btn>
        </form>
      </Card>

      {/* Seed reminder */}
      <Card style={{ borderColor:'rgba(245,158,11,.3)' }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, color:'#f59e0b', marginBottom:10 }}>
          ⚙ First-time Setup
        </h3>
        <p style={{ fontSize:13, color:'var(--clr-text-muted)', lineHeight:1.7 }}>
          To create the very first admin account (before any admin exists), run the seed script from the backend directory:
        </p>
        <pre style={{ background:'var(--clr-surface2)', padding:'10px 14px', borderRadius:8, fontSize:12, color:'#10b981', marginTop:10, overflow:'auto' }}>
{`npm run seed:admin
# Default credentials:
# Email:    admin@neetpg.local
# Password: Admin@1234`}
        </pre>
        <p style={{ fontSize:12, color:'#f87171', marginTop:8 }}>
          ⚠ Change the default password immediately after first login.
        </p>
      </Card>

      {/* Info */}
      <Card style={{ marginTop:16, borderColor:'rgba(99,102,241,.3)' }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, color:'var(--clr-primary)', marginBottom:10 }}>
          Admin Capabilities
        </h3>
        <ul style={{ fontSize:13, color:'var(--clr-text-muted)', lineHeight:2.2, paddingLeft:18 }}>
          <li>View all registered students and their performance</li>
          <li>Edit student profiles and assign roles</li>
          <li>Delete student accounts and test data</li>
          <li>Browse all test sessions platform-wide</li>
          <li>Add, edit, and delete questions in any paper</li>
          <li>View platform-wide analytics and trends</li>
          <li>Create additional admin accounts</li>
        </ul>
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--clr-text-muted)', marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

const iStyle = {
  width:'100%', padding:'9px 12px', background:'var(--clr-surface2)',
  border:'1px solid var(--clr-border)', borderRadius:8, color:'var(--clr-text)', fontSize:14,
};
