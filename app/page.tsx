'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase';
import { Bell, Crown, Hash, LogIn, LogOut, MessageCircle, Search, ShieldCheck, Users, UserRound, Zap } from 'lucide-react';

type Profile = { id: string; nickname: string; level: string | null; college: string | null; school: string | null; avatar_url: string | null; premium_status: string; total_online_seconds: number };

export default function Home() {
  const [supabase] = useState(() => { try { return createClient(); } catch { return null; } });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [status, setStatus] = useState('Connect Supabase to enable live community features.');
  const [tab, setTab] = useState('Discover');
  const [requests, setRequests] = useState(0);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{id:string;body:string;sender_id:string;created_at:string}[]>([]);
  const [groups, setGroups] = useState<{id:string;name:string}[]>([]);
  const [groupName, setGroupName] = useState('');
  const [profileForm, setProfileForm] = useState({ nickname:'', level:'', college:'', school:'' });
  const [showProfile, setShowProfile] = useState(false);
  const [showGroup, setShowGroup] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user.id ?? null; setUserId(id);
      if (id) loadProfile(id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null; setUserId(id); if (id) loadProfile(id);
    });
    return () => listener.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function loadProfile(id: string) {
    if (!supabase) return;
    const { data, error } = await supabase.from('profiles').select('id,nickname,level,college,school,avatar_url,premium_status,total_online_seconds').eq('id', id).maybeSingle();
    if (error) { setStatus('Signed in. Apply supabase/schema.sql and configure policies to activate your profile.'); return; }
    if (data) { setNickname(data.nickname ?? ''); setProfileForm({ nickname:data.nickname ?? '', level:data.level ?? '', college:data.college ?? '', school:data.school ?? '' }); }
    await refreshCommunity();
    const channel = supabase.channel('online-presence', { config: { presence: { key: id } } });
    channel.on('presence', { event: 'sync' }, () => setOnlineCount(Object.keys(channel.presenceState()).length));
    channel.subscribe(async (state) => { if (state === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() }); });
    return () => { supabase?.removeChannel(channel); };
  }

  async function refreshCommunity() {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('id,nickname,level,college,school,avatar_url,premium_status,total_online_seconds').limit(60);
    if (data) setProfiles(data as Profile[]);
    const { data: req } = await supabase.from('message_requests').select('id').eq('recipient_id', userId).eq('status','pending');
    setRequests(req?.length ?? 0);
    const { data: grp } = await supabase.from('groups').select('id,name').limit(30);
    if (grp) setGroups(grp);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password }); setStatus(error ? error.message : 'Signed in.');
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined } });
    setStatus(error ? error.message : 'Check your email to confirm registration, then sign in. Complete your profile after the database schema is installed.');
  }
  async function signOut() { if (supabase) await supabase.auth.signOut(); setStatus('Signed out.'); }
  async function saveProfile() {
    if (!supabase || !userId) return;
    const clean = profileForm.nickname.trim().replace(/^@/, '');
    if (!clean) { setStatus('Choose a nickname first.'); return; }
    const { error } = await supabase.from('profiles').upsert({ id:userId, nickname:clean, level:profileForm.level, college:profileForm.college, school:profileForm.school });
    setStatus(error ? error.message : 'Profile saved. Private registration details are not part of the public profile.'); setNickname(clean); setShowProfile(false); await refreshCommunity();
  }
  async function sendRequest(recipient: string) {
    if (!supabase || !userId || recipient === userId) return;
    const { error } = await supabase.from('message_requests').insert({ sender_id:userId, recipient_id:recipient });
    setStatus(error ? error.message : 'Message request sent. You can chat after it is accepted.');
  }
  async function sendMessage() {
    if (!supabase || !userId || !message.trim()) return;
    setStatus('Choose a conversation in the full messaging module; this starter keeps messages access-controlled by conversation membership.');
  }
  async function createGroup(e: React.FormEvent) {
    e.preventDefault(); if (!supabase || !userId || !groupName.trim()) return;
    const { data, error } = await supabase.from('groups').insert({ name:groupName.trim(), created_by:userId }).select('id,name').single();
    if (error) { setStatus(error.message); return; }
    await supabase.from('group_members').insert({ group_id:data.id, user_id:userId, role:'owner' });
    setGroups(old => [data, ...old]); setGroupName(''); setShowGroup(false); setStatus('Group created. Invite members from the group details once group invitations are enabled.');
  }

  const configured = !!supabase;
  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><MessageCircle size={23}/></div><div><strong>MR RICH</strong><span>CONNECT</span></div></div>
      <div className="workspace"><span className="online-dot"/> COMMUNITY NETWORK <span className="tiny-pill">BETA</span></div>
      <nav>{[{name:'Discover',icon:Search},{name:'Messages',icon:MessageCircle},{name:'Groups',icon:Users},{name:'Requests',icon:Bell},{name:'My Profile',icon:UserRound}].map(item => <button key={item.name} onClick={() => { setTab(item.name); if(item.name==='My Profile') setShowProfile(true); }} className={`nav-item ${tab===item.name?'active':''}`}><item.icon size={18}/><span>{item.name}</span>{item.name==='Requests'&&requests>0&&<b className="count">{requests}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="premium-card"><Crown size={19}/><strong>Go Premium</strong><p>Stand out with a special title and badge.</p><button onClick={() => setStatus('Premium can be granted by admin approval or connected payment checkout. Configure a payment provider before accepting payments.')}>Explore premium <span>↗</span></button></div><div className="signed-user"><div className="avatar">{nickname?.[0]?.toUpperCase()||'?'}</div><div className="signed-info"><strong>{nickname ? '@'+nickname : userId ? 'Your account' : 'Guest mode'}</strong><small>{userId?'Community member':'Sign in to connect'}</small></div>{userId&&<button className="icon-button" title="Sign out" onClick={signOut}><LogOut size={16}/></button>}</div></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><div><span className="eyebrow">YOUR CAMPUS. YOUR COMMUNITY.</span><h1>{tab==='Discover'?'Find your people.':tab==='Groups'?'Communities & groups':tab==='Requests'?'Message requests':tab==='My Profile'?'Your profile':'Your conversations'}</h1></div><div className="top-actions"><div className="online-stat"><span className="online-dot"/><div><strong>{onlineCount}</strong><small>online now</small></div></div><button className="primary-button" onClick={() => setShowProfile(true)}>Set up profile <span>＋</span></button></div></header>
      {!configured && <div className="notice warning"><ShieldCheck size={18}/><div><strong>Backend not connected yet</strong><p>Copy <code>.env.example</code> to <code>.env.local</code>, add your Supabase project URL and anon key, then run the SQL setup in the included README.</p></div></div>}
      {status && <div className="status-line">{status}</div>}
      {!userId ? <section className="auth-panel"><div className="auth-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-icon"><MessageCircle size={45}/></div><h2>More than a chat.<br/><em>A real connection.</em></h2><p>Meet people, join groups, and grow your campus network.</p><div className="auth-pills"><span>✦ Live community</span><span>✦ Private by design</span></div></div><form className="auth-form" onSubmit={signIn}><span className="eyebrow">WELCOME TO THE NETWORK</span><h2>Connect with your people</h2><p className="muted">Sign in or create an account to get started.</p><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label><label>Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="current-password"/></label><button className="primary-button full" type="submit"><LogIn size={17}/> Sign in</button><button className="secondary-button full" type="button" onClick={signUp}>Create an account</button><small className="privacy-note"><ShieldCheck size={14}/> Your email, phone, name and department are private.</small></form></section> : <>
        {tab==='Discover' && <><section className="hero-banner"><div className="hero-copy"><span className="hero-label"><Zap size={13}/> YOUR NEXT CONNECTION STARTS HERE</span><h2>Make connections.<br/><span>Build your circle.</span></h2><p>Discover people from your school, college and department community.</p><button className="light-button" onClick={()=>setShowProfile(true)}>Complete your profile <span>→</span></button></div><div className="banner-orb"><div className="orb-core"><Users size={46}/></div><span className="float-tag tag-a">✦ Meet people</span><span className="float-tag tag-b">+ New connections</span><span className="float-tag tag-c">● Community</span></div></section><div className="section-heading"><div><h2>People you may know</h2><p>Discover members and send a message request.</p></div><button className="text-button" onClick={refreshCommunity}>Refresh directory ↻</button></div><div className="people-grid">{profiles.filter(p=>p.id!==userId).map(p=><article className="person-card" key={p.id}><div className="person-top"><div className="avatar large">{p.avatar_url?<img src={p.avatar_url} alt=""/>:p.nickname?.[0]?.toUpperCase()||'M'}</div>{p.premium_status==='active'&&<span className="premium-badge"><Crown size={12}/> PREMIUM</span>}</div><h3>@{p.nickname}</h3><p className="person-meta">{[p.level,p.college].filter(Boolean).join(' · ')||'Community member'}</p><p className="school-line">{p.school||'School not listed'}</p><div className="person-footer"><span className="rank-tag"><Zap size={13}/> {Math.floor((p.total_online_seconds||0)/3600)}h online</span><button className="connect-button" onClick={()=>sendRequest(p.id)}>Connect <span>＋</span></button></div></article>)}</div>{profiles.length===0&&<div className="empty-state"><Users size={28}/><strong>Your community is getting ready</strong><p>Once other members register and complete their public profiles, they will appear here.</p></div>}</>}
        {tab==='Groups'&&<><div className="section-heading"><div><h2>Your communities</h2><p>Build a space around your interests.</p></div><button className="primary-button" onClick={()=>setShowGroup(true)}>＋ Create group</button></div><div className="group-list">{groups.map(g=><div className="group-row" key={g.id}><div className="group-icon"><Hash size={22}/></div><div><strong>{g.name}</strong><p>MR RICH CONNECT community</p></div><button className="secondary-button" onClick={()=>setStatus('Group membership and real-time group chat are protected by group membership policies in the database schema.')}>Open group →</button></div>)}{groups.length===0&&<div className="empty-state"><Users size={28}/><strong>No groups yet</strong><p>Create the first community and invite others to join.</p><button className="primary-button" onClick={()=>setShowGroup(true)}>Create a group</button></div>}</div></>}
        {tab==='Messages'&&<div className="chat-placeholder"><div className="chat-empty-icon"><MessageCircle size={32}/></div><h2>Your conversations, all in one place.</h2><p>Accepted requests unlock private chats. Group conversations are available to members only.</p><div className="message-compose"><button className="emoji-button" onClick={()=>setMessage(m=>m+' 😊')}>😊</button><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write a message…"/><button className="primary-button" onClick={sendMessage}>Send ↗</button></div><small>Choose a conversation to send messages. Messages are never public.</small></div>}
        {tab==='Requests'&&<div className="empty-state"><Bell size={28}/><strong>Message requests</strong><p>Your pending requests will appear here. Accepting a request enables a private conversation.</p><button className="secondary-button" onClick={refreshCommunity}>Refresh requests</button></div>}
        {tab==='My Profile'&&<div className="profile-summary"><div className="avatar huge">{nickname?.[0]?.toUpperCase()||'?'}</div><h2>@{nickname||'choose_nickname'}</h2><p>{profileForm.level||'Level not set'} · {profileForm.college||'College not set'}</p><p>{profileForm.school||'School not set'}</p><button className="primary-button" onClick={()=>setShowProfile(true)}>Edit profile</button><div className="privacy-box"><ShieldCheck size={19}/><div><strong>Your private information stays private</strong><p>Your name, phone number, department and email are registration-only fields and are not shown on public profiles.</p></div></div></div>}
      </>}
      <footer><span>© {new Date().getFullYear()} MR RICH CONNECT</span><span><ShieldCheck size={13}/> Built for meaningful connections</span></footer>
    </section>
    {showProfile&&<div className="modal-backdrop" onClick={()=>setShowProfile(false)}><form className="modal" onSubmit={e=>{e.preventDefault();saveProfile();}} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setShowProfile(false)}>×</button><span className="eyebrow">YOUR PUBLIC IDENTITY</span><h2>Set up your profile</h2><p className="muted">Only these fields appear publicly.</p><label>Nickname<input required maxLength={24} value={profileForm.nickname} onChange={e=>setProfileForm({...profileForm,nickname:e.target.value})} placeholder="@yournickname"/></label><label>Level<input value={profileForm.level} onChange={e=>setProfileForm({...profileForm,level:e.target.value})} placeholder="e.g. 200 level"/></label><label>College<input value={profileForm.college} onChange={e=>setProfileForm({...profileForm,college:e.target.value})} placeholder="Your college"/></label><label>School<input value={profileForm.school} onChange={e=>setProfileForm({...profileForm,school:e.target.value})} placeholder="Your school or university"/></label><div className="privacy-box"><ShieldCheck size={17}/><p>Name, phone number, department and email are not included in this public form.</p></div><button className="primary-button full" type="submit">Save public profile</button></form></div>}
    {showGroup&&<div className="modal-backdrop" onClick={()=>setShowGroup(false)}><form className="modal" onSubmit={createGroup} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setShowGroup(false)}>×</button><span className="eyebrow">BRING PEOPLE TOGETHER</span><h2>Create a group</h2><p className="muted">Start a community around a course, club or interest.</p><label>Group name<input required maxLength={60} value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="e.g. Campus Creators"/></label><button className="primary-button full" type="submit">Create group</button></form></div>}
  </main>;
}
