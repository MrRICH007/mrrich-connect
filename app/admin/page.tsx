'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { ShieldCheck, Search, Users, Megaphone, Crown, Trash2, Ban, RefreshCw, Save, Upload, ArrowLeft } from 'lucide-react';

type UserRow = { id:string; nickname:string; level:string|null; school:string|null; college:string|null; department:string|null; bio:string|null; avatar_url:string|null; premium_status:string; premium_title:string|null; total_online_seconds:number|null; is_blocked:boolean; is_protected:boolean; email:string; private_profile:{full_name:string|null;phone:string|null}|null };
type GroupRow = { id:string; name:string; conversation_id:string|null; member_limit:number|null; allowed_levels:string[]|null; allowed_schools:string[]|null; members_can_message:boolean|null; is_premium_only:boolean|null };
type AdRow = { id:string; title:string; media_path:string; target_url:string|null; expires_at:string; is_enabled:boolean };
export default function AdminPage(){
 const [supabase] = useState(()=>createClient()); const [token,setToken]=useState(''); const [allowed,setAllowed]=useState(false); const [loading,setLoading]=useState(true); const [tab,setTab]=useState<'users'|'groups'|'ads'>('users'); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
 const [query,setQuery]=useState(''); const [users,setUsers]=useState<UserRow[]>([]); const [groupQuery,setGroupQuery]=useState(''); const [groups,setGroups]=useState<GroupRow[]>([]); const [ads,setAds]=useState<AdRow[]>([]); const [busy,setBusy]=useState<string|null>(null);
 const [adTitle,setAdTitle]=useState(''); const [adUrl,setAdUrl]=useState(''); const [adExpiry,setAdExpiry]=useState(''); const [adImage,setAdImage]=useState<File|null>(null);
 async function request(path:string,init:RequestInit={}){ const r=await fetch(path,{...init,headers:{...(init.body instanceof FormData?{}:{'Content-Type':'application/json'}),Authorization:`Bearer ${token}`,...init.headers}}); const data=await r.json().catch(()=>({})); if(!r.ok) throw new Error(data.error||'Request failed'); return data; }
 useEffect(()=>{let alive=true; (async()=>{try{const {data}=await supabase.auth.getSession(); const session=data.session;if(!session) throw new Error('Sign in to MR RICH CONNECT first, then open /admin.'); const {data:admin,error:e}=await supabase.rpc('is_admin'); if(e||admin!==true) throw new Error('Admin access denied. Your account is not listed as an admin.'); if(alive){setToken(session.access_token);setAllowed(true);}}catch(e:any){if(alive)setError(e.message||'Could not verify admin access.');}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[supabase]);
 useEffect(()=>{if(!allowed||!token)return;let alive=true;const timer=setTimeout(()=>{request(`/api/admin/users?q=${encodeURIComponent(query)}`).then(d=>alive&&setUsers(d.users||[])).catch(e=>alive&&setError(e.message));},180);return()=>{alive=false;clearTimeout(timer)}},[allowed,token,query]);
 useEffect(()=>{if(!allowed||!token)return;let alive=true;const timer=setTimeout(()=>{request(`/api/admin/groups?q=${encodeURIComponent(groupQuery)}`).then(d=>alive&&setGroups(d.groups||[])).catch(e=>alive&&setError(e.message));},180);return()=>{alive=false;clearTimeout(timer)}},[allowed,token,groupQuery]);
 useEffect(()=>{if(allowed&&token)request('/api/admin/ads').then(d=>setAds(d.ads||[])).catch(e=>setError(e.message));},[allowed,token]);
 
async function userAction(
  u: UserRow,
  action: 'premium' | 'block' | 'delete',
  value?: string | boolean
) {
  if (
    action === 'delete' &&
    !confirm(`Permanently delete @${u.nickname}? This cannot be undone.`)
  ) return;

  if (
    action === 'block' &&
    !confirm(`${value ? 'Block' : 'Unblock'} @${u.nickname}?`)
  ) return;

  setBusy(u.id);
  setError('');

  try {
    if (action === 'delete') {
      await request(`/api/admin/users/${u.id}`, {
        method: 'DELETE'
      });

      setUsers(old => old.filter(x => x.id !== u.id));
      setNotice('User account deleted.');
    } else {
      if (action === 'premium' && value !== 'active' && value !== 'inactive') {
        throw new Error('Invalid Premium status.');
      }

      if (action === 'block' && typeof value !== 'boolean') {
        throw new Error('Invalid block status.');
      }

      await request(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, value })
      });

      setUsers(old =>
        old.map(x => {
          if (x.id !== u.id) return x;

          if (action === 'premium') {
            return {
              ...x,
              premium_status: value as string
            };
          }

          return {
            ...x,
            is_blocked: value as boolean
          };
        })
      );
      setNotice('User updated.');
    }
  } catch (e: any) {
    setError(e.message || 'The user update failed.');
  } finally {
    setBusy(null);
  }
}

 
async function groupAction(g: GroupRow, action: 'save' | 'delete') {
  if (
    action === 'delete' &&
    !confirm(`Delete group “${g.name}” and its conversation?`)
  ) {
    return;
  }

  setBusy(g.id);

  try {
    if (action === 'delete') {
      await request(`/api/admin/groups/${g.id}`, {
        method: 'DELETE'
      });

      setGroups(old => old.filter(x => x.id !== g.id));
      setNotice('Group deleted.');
    } else {
      const name = prompt('Group name', g.name);
      if (name === null) return;

      const limit = prompt(
        'Member limit (leave blank for unlimited)',
        g.member_limit ? String(g.member_limit) : ''
      );

      // Stop safely if the prompt is cancelled.
      if (limit === null) return;

      const levels = prompt(
        'Allowed levels, comma separated (blank = any)',
        (g.allowed_levels || []).join(',')
      );
      if (levels === null) return;

      const schools = prompt(
        'Allowed schools, comma separated (blank = any)',
        (g.allowed_schools || []).join(',')
      );
      if (schools === null) return;

      const canMessage = confirm(
        'Allow regular members to send messages? OK = yes, Cancel = admins only.'
      );

      const premium = confirm('Make this a Premium-only group?');

      const memberLimit = limit.trim() === '' ? null : Number(limit);

      if (
        memberLimit !== null &&
        (!Number.isInteger(memberLimit) || memberLimit < 1)
      ) {
        throw new Error('Member limit must be a positive whole number or left blank.');
      }

      const updated = {
        name: name.trim(),
        member_limit: memberLimit,
        allowed_levels: levels.split(',').map(x => x.trim()).filter(Boolean),
        allowed_schools: schools.split(',').map(x => x.trim()).filter(Boolean),
        members_can_message: canMessage,
        is_premium_only: premium
      };

      await request(`/api/admin/groups/${g.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updated)
      });

      setGroups(old =>
        old.map(x => x.id === g.id ? { ...x, ...updated } : x)
      );

      setNotice('Group settings saved.');
    }
  } catch (e: any) {
    setError(e.message || 'The group action failed.');
  } finally {
    setBusy(null);
  }
}
 
 async function uploadAd(e:React.FormEvent){e.preventDefault();if(!adImage){setError('Choose an advert image first.');return}setBusy('ad');try{const form=new FormData();form.set('image',adImage);form.set('title',adTitle);form.set('target_url',adUrl);form.set('expires_at',new Date(adExpiry).toISOString());const data=await request('/api/admin/ads',{method:'POST',body:form});setAds(old=>[data.ad,...old]);setAdTitle('');setAdUrl('');setAdExpiry('');setAdImage(null);setNotice('Advert uploaded and published.')}catch(e:any){setError(e.message)}finally{setBusy(null)}}
 const css=`*{box-sizing:border-box}body{margin:0}.admin{min-height:100dvh;background:#070b16;color:#eef4ff;padding:22px 14px 50px;font-family:system-ui,-apple-system,sans-serif}.wrap{max-width:1050px;margin:auto}.top{display:flex;align-items:center;gap:12px;margin-bottom:22px}.brand{font-weight:850;letter-spacing:.04em}.sub{color:#8e9bb6;font-size:13px;margin-top:4px}.panel{background:#0d1426;border:1px solid #1b2b49;border-radius:16px;padding:16px;margin-bottom:14px}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.btn{border:1px solid #263b60;background:#111e36;color:#dce9ff;border-radius:10px;padding:10px 12px;font-weight:650;cursor:pointer}.btn.active,.primary{background:#245bdb;border-color:#3978ff;color:white}.danger{border-color:#713447;color:#ffb8c6}.search{width:100%;background:#070e1d;border:1px solid #2a3c5d;color:white;border-radius:11px;padding:13px;font:inherit;margin:6px 0 12px}.user{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}.name{font-weight:800;font-size:16px}.muted{color:#a2aec5;font-size:13px;line-height:1.55;overflow-wrap:anywhere}.actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.pill{display:inline-block;border:1px solid #24467b;background:#10234a;color:#9ec5ff;border-radius:30px;padding:3px 8px;font-size:11px;margin:4px 4px 0 0}.grid{display:grid;grid-template-columns:1fr;gap:10px}.field{display:grid;gap:6px;font-size:13px;color:#aebbd3}.field input{min-width:0;background:#070e1d;color:white;border:1px solid #2a3c5d;border-radius:9px;padding:11px;font:inherit}.preview{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;background:#050914}.alert{padding:12px;border-radius:10px;background:#311725;color:#ffc1cf;margin:10px 0}.success{padding:12px;border-radius:10px;background:#102b29;color:#a8f5d6;margin:10px 0}@media(min-width:700px){.admin{padding:32px}.user{grid-template-columns:minmax(0,1fr) auto;align-items:start}.grid{grid-template-columns:1fr 1fr}.wide{grid-column:1/-1}}`;
 return <main className="admin"><style>{css}</style><div className="wrap"><div className="top"><a className="btn" href="/" aria-label="Back to app"><ArrowLeft size={17}/></a><div><div className="brand"><ShieldCheck size={18} style={{verticalAlign:'middle',marginRight:7,color:'#6ea2ff'}}/>MR RICH CONNECT · ADMIN</div><div className="sub">Restricted tools for authorized administrators</div></div></div>{loading&&<div className="panel">Verifying admin access…</div>}{error&&<div className="alert">{error}</div>}{notice&&<div className="success">{notice}</div>}{allowed&&<><div className="tabs"><button className={`btn ${tab==='users'?'active':''}`} onClick={()=>setTab('users')}><Users size={15} style={{verticalAlign:'middle',marginRight:5}}/>Users ({users.length})</button><button className={`btn ${tab==='groups'?'active':''}`} onClick={()=>setTab('groups')}><Users size={15} style={{verticalAlign:'middle',marginRight:5}}/>Groups ({groups.length})</button><button className={`btn ${tab==='ads'?'active':''}`} onClick={()=>setTab('ads')}><Megaphone size={15} style={{verticalAlign:'middle',marginRight:5}}/>Adverts ({ads.length})</button></div>
 {tab==='users'&&<><section className="panel"><h2>All users</h2><p className="muted">Search updates as you type. Private profile fields are visible only to authorized admins.</p><input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search nickname, level or school…"/><div className="muted">Showing {users.length} matching profiles (up to 1,000 loaded per search).</div></section>{users.map(u=><section className="panel user" key={u.id}><div><div className="name">@{u.nickname||'(no nickname)'} {u.is_protected&&<span className="pill">OWNER · PROTECTED</span>}</div><span className="pill">Level {u.level||'—'}</span><span className="pill">Premium: {u.premium_status||'inactive'}</span>{u.is_blocked&&<span className="pill" style={{color:'#ffb8c6'}}>BLOCKED</span>}<div className="muted" style={{marginTop:8}}>Email: {u.email||'—'}<br/>Full name: {u.private_profile?.full_name||'—'}<br/>Phone: {u.private_profile?.phone||'—'}<br/>School: {u.school||'—'}<br/>College: {u.college||'—'}<br/>Department: {u.department||'—'}<br/>Bio: {u.bio||'—'}<br/>User ID: {u.id}</div><div className="actions"><button className="btn" disabled={busy===u.id} onClick={()=>userAction(u,'premium',u.premium_status==='active'?'inactive':'active')}><Crown size={14} style={{verticalAlign:'middle',marginRight:5}}/>{u.premium_status==='active'?'Remove Premium':'Grant Premium'}</button>{!u.is_protected&&<><button className="btn" disabled={busy===u.id} onClick={()=>userAction(u,'block',!u.is_blocked)}><Ban size={14} style={{verticalAlign:'middle',marginRight:5}}/>{u.is_blocked?'Unblock':'Block'}</button><button className="btn danger" disabled={busy===u.id} onClick={()=>userAction(u,'delete')}><Trash2 size={14} style={{verticalAlign:'middle',marginRight:5}}/>Delete</button></>}</div></div></section>)}{users.length===0&&<div className="panel">No matching users found.</div>}</>}
 {tab==='groups'&&<><section className="panel"><h2>Group management</h2><input className="search" value={groupQuery} onChange={e=>setGroupQuery(e.target.value)} placeholder="Search groups as you type…"/></section>{groups.map(g=><section className="panel" key={g.id}><div className="name">{g.name}</div><div className="muted">Members can message: {g.members_can_message===false?'Admins only':'Yes'} · Premium-only: {g.is_premium_only?'Yes':'No'} · Limit: {g.member_limit||'Unlimited'}</div><div className="actions"><button className="btn" disabled={busy===g.id} onClick={()=>groupAction(g,'save')}><Save size={14} style={{verticalAlign:'middle',marginRight:5}}/>Edit settings</button><button className="btn danger" disabled={busy===g.id} onClick={()=>groupAction(g,'delete')}><Trash2 size={14} style={{verticalAlign:'middle',marginRight:5}}/>Delete group</button></div></section>)}{groups.length===0&&<div className="panel">No groups match this search.</div>}</>}
 {tab==='ads'&&<><section className="panel"><h2>Upload a message-page advert</h2><p className="muted">Landscape 16:9 crop. Users can tap the image to open the destination in a new tab.</p><form onSubmit={uploadAd} className="grid"><label className="field">Advert title<input required value={adTitle} onChange={e=>setAdTitle(e.target.value)} maxLength={120}/></label><label className="field">Destination URL<input required type="url" placeholder="https://example.com" value={adUrl} onChange={e=>setAdUrl(e.target.value)}/></label><label className="field">Expiry date and time<input required type="datetime-local" value={adExpiry} onChange={e=>setAdExpiry(e.target.value)}/></label><label className="field">Image (max 5 MB)<input required type="file" accept="image/*" onChange={e=>setAdImage(e.target.files?.[0]||null)}/></label>{adImage&&<div className="wide"><img className="preview" src={URL.createObjectURL(adImage)} alt="Advert preview"/></div>}<div className="wide"><button className="btn primary" disabled={busy==='ad'} type="submit"><Upload size={15} style={{verticalAlign:'middle',marginRight:5}}/>{busy==='ad'?'Uploading…':'Upload and publish advert'}</button></div></form></section>{ads.map(a=><section className="panel" key={a.id}><img className="preview" src={a.media_path} alt={a.title}/><div className="name" style={{marginTop:10}}>{a.title}</div><div className="muted">Expires {new Date(a.expires_at).toLocaleString()} · {a.is_enabled?'Enabled':'Disabled'}<br/>Destination: {a.target_url}</div></section>)}</>}
 </>}</div></main>
}
