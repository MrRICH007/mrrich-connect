'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createClient } from '../lib/supabase';
import {
  Bell, Crown, Hash, LogIn, LogOut, MessageCircle, Search, ShieldCheck,
  Users, UserRound, Wifi, Pencil, Plus, Send, Smile, ArrowLeft, RefreshCw,
  X, Sparkles, Zap
} from 'lucide-react';

type Profile = {
  id: string;
  nickname: string;
  level: string | null;
  college: string | null;
  school: string | null;
  avatar_url: string | null;
  premium_status: string;
  premium_title?: string | null;
  total_online_seconds: number;
};
type CommunityGroup = { id: string; name: string; conversation_id?: string | null };
type AdCampaign = { id: string; title: string; media_type: 'image' | 'video'; media_path: string; target_url: string | null; expires_at: string };
type IncomingRequest = { id: string; sender_id: string; created_at: string; sender_nickname: string };
type Conversation = { id: string; title: string; kind: 'person' | 'group'; subtitle?: string; otherUserId?: string };
type ChatMessage = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };

const NAV_ITEMS = [
  { name: 'Messages', icon: MessageCircle, hint: 'Your Conversations Will Appear Here.' },
  { name: 'Discover', icon: Search, hint: 'Find People Online' },
  { name: 'Groups', icon: Users, hint: 'Find Your Community' },
  { name: 'Requests', icon: Bell, hint: 'Your Message Requests' },
  { name: 'My Profile', icon: UserRound, hint: 'Your Profile' },
];
const EMOJIS = ['😀','😃','😄','😁','😆','😅','😂','🥹','😊','😍','🥰','😘','😎','🤔','🙌','👏','🙏','💙','❤️','🔥','✨','🎉','👍','👋','💯','😭','🤣','🤝','💬','🌟','😴','🥳'];

export default function Home() {
  const [supabase] = useState(() => { try { return createClient(); } catch { return null; } });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState('Messages');
  const [requests, setRequests] = useState(0);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [requestBusy, setRequestBusy] = useState<string | null>(null);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [activeAds, setActiveAds] = useState<AdCampaign[]>([]);
  const [groupName, setGroupName] = useState('');
  const [profileForm, setProfileForm] = useState({ nickname: '', level: '', college: '', school: '' });
  const [profileExists, setProfileExists] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const refreshCommunity = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles')
      .select('id,nickname,level,college,school,avatar_url,premium_status,premium_title,total_online_seconds').limit(60);
    if (data) setProfiles(data as Profile[]);
    if (userId) {
      const { data: req } = await supabase.from('message_requests').select('id')
        .eq('recipient_id', userId).eq('status', 'pending');
      setRequests(req?.length ?? 0);
    }
    const { data: grp } = await supabase.from('groups').select('id,name,conversation_id').limit(30);
    if (grp) setGroups(grp as CommunityGroup[]);
    const { data: ads } = await supabase.from('ad_campaigns').select('id,title,media_type,media_path,target_url,expires_at').eq('is_enabled', true).lte('starts_at', new Date().toISOString()).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(5);
    if (ads) setActiveAds(ads as AdCampaign[]);
  }, [supabase, userId]);

  const loadIncomingRequests = useCallback(async () => {
    if (!supabase || !userId) { setIncomingRequests([]); return; }
    const { data: rows, error } = await supabase.from('message_requests')
      .select('id,sender_id,created_at')
      .eq('recipient_id', userId).eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      setStatus(`Could not load message requests: ${error.message}`);
      return;
    }
    const pending = rows ?? [];
    setRequests(pending.length);
    if (pending.length === 0) { setIncomingRequests([]); return; }
    const senderIds = [...new Set(pending.map((r: { sender_id: string }) => r.sender_id))];
    const { data: senders, error: profileError } = await supabase.from('profiles')
      .select('id,nickname').in('id', senderIds);
    if (profileError) {
      setStatus(`Requests loaded, but sender profiles could not be read: ${profileError.message}`);
    }
    const nicknameById = new Map((senders ?? []).map((p: { id: string; nickname: string }) => [p.id, p.nickname]));
    setIncomingRequests(pending.map((r: { id: string; sender_id: string; created_at: string }) => ({
      ...r, sender_nickname: nicknameById.get(r.sender_id) || 'Community member'
    })));
  }, [supabase, userId]);

  async function respondToRequest(requestId: string, action: 'accept' | 'decline') {
    if (!supabase) return;
    setRequestBusy(requestId);
    const rpcName = action === 'accept' ? 'accept_message_request' : 'decline_message_request';
    const { data, error } = await supabase.rpc(rpcName, { p_request_id: requestId });
    setRequestBusy(null);
    if (error) {
      setStatus(`Could not ${action} request: ${error.message}`);
      return;
    }
    if (action === 'accept') {
      const conversationId = typeof data === 'string' ? data : data?.id;
      const request = incomingRequests.find(r => r.id === requestId);
      if (conversationId) { const convo = { id: conversationId, title: request?.sender_nickname ? `@${request.sender_nickname}` : 'Private chat', kind: 'person' as const }; setSelectedConversation(convo); setConversationList(old => [convo, ...old.filter(c => c.id !== conversationId)]); }
      setTab('Messages');
      setStatus('Request accepted. The private conversation is ready, but message storage still needs to be connected.');
    } else {
      setStatus('Message request declined.');
    }
    await loadIncomingRequests();
    await refreshCommunity();
  }

  useEffect(() => {
    if (userId && tab === 'Requests') void loadIncomingRequests();
  }, [userId, tab, loadIncomingRequests]);

  const loadProfile = useCallback(async (id: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('profiles')
      .select('id,nickname,level,college,school,avatar_url,premium_status,premium_title,total_online_seconds')
      .eq('id', id).maybeSingle();
    if (error) {
      setStatus('Your account is signed in, but the profiles table or its access policies need to be configured.');
      setProfileExists(false);
      return;
    }
    if (data) {
      setProfileExists(true);
      setNickname(data.nickname ?? '');
      setProfileForm({ nickname: data.nickname ?? '', level: data.level ?? '', college: data.college ?? '', school: data.school ?? '' });
    } else {
      setProfileExists(false);
      setNickname('');
      setProfileForm({ nickname: '', level: '', college: '', school: '' });
    }
    await refreshCommunity();
  }, [supabase, refreshCommunity]);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); setStatus('Supabase is not configured. Add the required environment variables in Render.'); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const id = data.session?.user.id ?? null;
      setUserId(id); setAuthReady(true);
      if (id) void loadProfile(id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      setUserId(id); setAuthReady(true);
      if (id) void loadProfile(id);
      else {
        setProfileExists(false); setNickname(''); setProfiles([]); setGroups([]); setRequests(0);
      }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [supabase, loadProfile]);

  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase.channel('mrrich-community-presence', { config: { presence: { key: userId } } });
    channel.on('presence', { event: 'sync' }, () => setOnlineCount(Object.keys(channel.presenceState()).length));
    channel.subscribe(async state => {
      if (state === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
    });
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, userId]);

  async function signIn(e: FormEvent) {
    e.preventDefault(); if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setStatus(error ? error.message : 'Signed in successfully.');
  }
  async function signUp() {
    if (!supabase) return;
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined } });
    setStatus(error ? error.message : 'Check your email to confirm your registration, then sign in.');
  }
  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setStatus('Signed out.'); setTab('Messages'); setSelectedConversation(null);
  }
  async function saveProfile(e?: FormEvent) {
    e?.preventDefault();
    if (!supabase || !userId) { setStatus('Sign in before creating a profile.'); return; }
    const clean = profileForm.nickname.trim().replace(/^@/, '');
    if (!clean) { setStatus('Choose a nickname first.'); return; }
    const { error } = await supabase.from('profiles').upsert({ id: userId, nickname: clean, level: profileForm.level || null, college: profileForm.college || null, school: profileForm.school || null });
    if (error) { setStatus(error.message); return; }
    setProfileExists(true); setNickname(clean); setShowProfile(false); setEditingProfile(false);
    setStatus('Profile saved.');
    await loadProfile(userId);
  }
  async function sendRequest(recipient: string) {
    if (!supabase || !userId || recipient === userId) return;
    const { error } = await supabase.from('message_requests').insert({ sender_id: userId, recipient_id: recipient });
    setStatus(error ? error.message : 'Message request sent. You can chat after it is accepted.');
  }
  async function createGroup(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !userId || !groupName.trim()) return;
    const { data: groupId, error } = await supabase.rpc('create_group_with_conversation', { p_name: groupName.trim(), p_description: null });
    if (error) { setStatus(`Could not create group: ${error.message}. Run the feature bundle SQL migration first.`); return; }
    const { data } = await supabase.from('groups').select('id,name,conversation_id').eq('id', groupId).single();
    if (data) setGroups(old => [data as CommunityGroup, ...old]);
    setGroupName(''); setShowGroup(false); setStatus('Group and group chat created.');
    await loadConversations();
  }
  const loadConversations = useCallback(async () => {
    if (!supabase || !userId) { setConversationList([]); return; }
    const { data: memberships, error: memberError } = await supabase.from('conversation_members')
      .select('conversation_id').eq('user_id', userId);
    if (memberError) { setStatus(`Could not load conversations: ${memberError.message}`); return; }
    const ids = [...new Set((memberships ?? []).map((m: { conversation_id: string }) => m.conversation_id))];
    if (!ids.length) { setConversationList([]); return; }
    const { data: convs, error: convError } = await supabase.from('conversations')
      .select('id,title,kind').in('id', ids);
    if (convError) { setStatus(`Could not load conversations: ${convError.message}`); return; }

    // Find the other member of each private conversation so the UI can show their nickname.
    const { data: allMembers, error: membersError } = await supabase.from('conversation_members')
      .select('conversation_id,user_id').in('conversation_id', ids);
    if (membersError) { setStatus(`Could not load conversation members: ${membersError.message}`); return; }
    const privateOtherIds = [...new Set((allMembers ?? [])
      .filter((m: { conversation_id: string; user_id: string }) => m.user_id !== userId)
      .map((m: { conversation_id: string; user_id: string }) => m.user_id))];
    let nicknameById = new Map<string, string>();
    if (privateOtherIds.length) {
      const { data: otherProfiles, error: otherProfileError } = await supabase.from('profiles')
        .select('id,nickname').in('id', privateOtherIds);
      if (otherProfileError) setStatus(`Chats loaded, but some participant names could not be read: ${otherProfileError.message}`);
      nicknameById = new Map((otherProfiles ?? []).map((p: { id: string; nickname: string }) => [p.id, p.nickname]));
    }
    const mapped: Conversation[] = (convs ?? []).map((c: { id: string; title: string | null; kind: string }) => {
      const other = (allMembers ?? []).find((m: { conversation_id: string; user_id: string }) => m.conversation_id === c.id && m.user_id !== userId);
      const isGroup = c.kind === 'group';
      return {
        id: c.id,
        title: isGroup ? (c.title || 'Group chat') : (nicknameById.get(other?.user_id ?? '') ? `@${nicknameById.get(other?.user_id ?? '')}` : (c.title && !['Private chat', 'Private conversation'].includes(c.title) ? c.title : 'Private chat')),
        kind: isGroup ? 'group' : 'person',
        otherUserId: other?.user_id
      };
    });
    setConversationList(mapped);
    setSelectedConversation(current => current ? (mapped.find(c => c.id === current.id) ?? current) : null);
  }, [supabase, userId]);

  const loadChatMessages = useCallback(async (conversationId: string) => {
    if (!supabase || !userId) return;
    const { data, error } = await supabase.from('messages')
      .select('id,conversation_id,sender_id,body,created_at')
      .eq('conversation_id', conversationId).is('deleted_at', null)
      .order('created_at', { ascending: true }).limit(200);
    if (error) { setStatus(`Could not load messages: ${error.message}`); return; }
    setChatMessages((data ?? []) as ChatMessage[]);
  }, [supabase, userId]);

  async function sendDraft() {
    const body = draftMessage.trim();
    if (!supabase || !userId || !selectedConversation || !body || sendingMessage) return;
    setSendingMessage(true);
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: selectedConversation.id, sender_id: userId, body
    }).select('id,conversation_id,sender_id,body,created_at').single();
    setSendingMessage(false);
    if (error) { setStatus(`Message not sent: ${error.message}`); return; }
    setChatMessages(old => [...old, data as ChatMessage]);
    setDraftMessage('');
    setShowEmojiPicker(false);
  }

  useEffect(() => { if (userId) void loadConversations(); }, [userId, loadConversations]);
  useEffect(() => {
    if (!supabase || !userId || !selectedConversation) { setChatMessages([]); return; }
    void loadChatMessages(selectedConversation.id);
    const channel = supabase.channel(`messages-${selectedConversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` }, payload => {
        const incoming = payload.new as ChatMessage;
        setChatMessages(old => old.some(m => m.id === incoming.id) ? old : [...old, incoming]);
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, userId, selectedConversation?.id, loadChatMessages]);
  function openProfileEditor() {
    if (!userId) { setStatus('Sign in to create your profile.'); return; }
    setEditingProfile(profileExists);
    setShowProfile(true);
  }

  const currentNav = NAV_ITEMS.find(n => n.name === tab);
  const configured = !!supabase;

  return <main className="rc-shell">
    <header className="rc-mobile-header">
      <div className="rc-brand">
        <div className="rc-brand-mark"><MessageCircle size={31} strokeWidth={2.3}/><Wifi className="rc-logo-wifi" size={15} strokeWidth={3}/></div>
        <div className="rc-brand-type"><strong>MR RICH</strong><span>CONNECT</span></div>
      </div>
      <div className="rc-header-actions">
        {userId && <span className="rc-online-pill"><i/> {onlineCount} online</span>}
        {userId ? <button className="rc-icon-btn" aria-label="Sign out" onClick={signOut}><LogOut size={19}/></button> : <button className="rc-small-login" onClick={() => document.getElementById('rc-email')?.focus()}>Login</button>}
      </div>
    </header>

    {!userId ? <section className="rc-auth-layout">
      <div className="rc-auth-intro"><span className="rc-eyebrow"><Sparkles size={14}/> YOUR CAMPUS. YOUR COMMUNITY.</span><h1>Find your people.<br/><em>Build your circle.</em></h1><p>Connect with people from your school and community.</p><div className="rc-auth-symbol"><MessageCircle size={58}/><Wifi size={25}/></div></div>
      <form className="rc-auth-card" onSubmit={signIn}><span className="rc-eyebrow">WELCOME TO THE NETWORK</span><h2>Sign in</h2><p className="rc-muted">Use your email and password to continue.</p><label>Email address<input id="rc-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label><label>Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="current-password"/></label><button className="rc-primary rc-full" type="submit"><LogIn size={17}/> Sign in</button><button className="rc-secondary rc-full" type="button" onClick={signUp}>Create an account</button><small className="rc-privacy"><ShieldCheck size={14}/> Your private registration details stay private.</small></form>
    </section> : <>
      <div className="rc-page-heading"><div><span className="rc-eyebrow">{tab === 'Messages' ? 'YOUR INBOX' : tab === 'Discover' ? 'MEET YOUR COMMUNITY' : tab === 'Groups' ? 'YOUR COMMUNITIES' : tab === 'Requests' ? 'NEW CONNECTIONS' : 'YOUR SPACE'}</span><h1>{tab === 'Messages' ? 'Messages' : tab === 'Discover' ? 'Find People Online' : tab === 'Groups' ? 'Find Your Community' : tab === 'Requests' ? 'Message Requests' : 'Your Profile'}</h1></div>
        {tab === 'Groups' && <button className="rc-primary" onClick={() => setShowGroup(true)}><Plus size={17}/> Create group</button>}
        {tab === 'Discover' && <button className="rc-icon-btn" aria-label="Refresh people" onClick={() => void refreshCommunity()}><RefreshCw size={18}/></button>}
      </div>

      {!configured && <div className="rc-notice"><ShieldCheck size={18}/><span>Supabase is not configured. Add your project URL and public key to your Render environment variables.</span></div>}
      {status && <div className="rc-status" role="status">{status}<button aria-label="Dismiss notice" onClick={() => setStatus('')}><X size={14}/></button></div>}

      {tab === 'Messages' && <section className={`rc-messages-layout ${selectedConversation ? 'has-chat' : ''}`}>
        <aside className="rc-conversation-list"><div className="rc-list-heading"><div><h2>Conversations</h2><p>Private and group chats</p></div></div>
          {conversationList.map(convo => <button key={convo.id} className={`rc-conversation-row ${selectedConversation?.id === convo.id ? 'active' : ''}`} onClick={() => setSelectedConversation(convo)}><span className="rc-conversation-avatar"><MessageCircle size={20}/></span><span><strong>{convo.title}</strong><small>{convo.kind === 'group' ? 'Group conversation' : 'Private conversation'}</small></span></button>)}
          {conversationList.length === 0 && <div className="rc-empty-conversations"><div className="rc-empty-icon"><MessageCircle size={27}/></div><strong>Your Conversations Will Appear Here.</strong><p>Accept a message request to start a private conversation.</p><button className="rc-text-btn" onClick={() => { setTab('Requests'); void loadIncomingRequests(); }}>View requests <Bell size={14}/></button></div>}
        </aside>
        <section className="rc-chat-panel">
          {selectedConversation ? <><header className="rc-chat-header"><button className="rc-icon-btn rc-back-chat" onClick={() => setSelectedConversation(null)} aria-label="Back to conversations"><ArrowLeft size={19}/></button><div className="rc-conversation-avatar"><MessageCircle size={20}/></div><div><strong>{selectedConversation.title}</strong><small>{selectedConversation.kind === 'group' ? 'Group conversation' : 'Private conversation'}</small></div></header><div className="rc-chat-empty" style={{display:'flex', flexDirection:'column', alignItems:'stretch', gap:'12px', overflowY:'auto', justifyContent: chatMessages.length ? 'flex-start' : 'center'}}>{chatMessages.length === 0 ? <><MessageCircle size={28}/><strong>Your chat starts here</strong><p>Send the first message to begin.</p></> : chatMessages.map(message => <div key={message.id} style={{alignSelf: message.sender_id === userId ? 'flex-end' : 'flex-start', maxWidth:'82%', padding:'10px 13px', borderRadius:'14px', background: message.sender_id === userId ? '#174ea6' : '#202938', color:'#fff', overflowWrap:'anywhere'}}><div>{message.body}</div><small style={{opacity:.7, fontSize:'11px'}}>{new Date(message.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></div>)}</div><div className="rc-composer-wrap"><div className="rc-composer"><button className="rc-emoji-toggle" onClick={() => setShowEmojiPicker(v=>!v)} aria-label="Open emoji picker"><Smile size={22}/></button><input value={draftMessage} onChange={e=>setDraftMessage(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void sendDraft();}}} placeholder="Write a message…" aria-label="Message"/><button className="rc-send-btn" onClick={() => void sendDraft()} disabled={!draftMessage.trim() || sendingMessage} aria-label="Send message"><Send size={18}/></button></div>{showEmojiPicker && <div className="rc-emoji-grid">{EMOJIS.map((emoji, i)=><button key={`${emoji}-${i}`} onClick={() => setDraftMessage(v=>v+emoji)} aria-label={`Add ${emoji}`}>{emoji}</button>)}</div>}</div></> : <div className="rc-chat-no-selection"><div className="rc-chat-big-icon"><MessageCircle size={35}/><Wifi size={16}/></div><h2>Select a conversation</h2><p>Choose a person or group to open your chat.</p></div>}
        </section>
      </section>}

      {tab === 'Discover' && <section className="rc-content-section"><div className="rc-section-title"><div><h2>People you may know</h2><p>Connect with members from your community.</p></div><button className="rc-text-btn" onClick={() => void refreshCommunity()}>Refresh <RefreshCw size={14}/></button></div>
        {activeAds.length > 0 && <section className="rc-ad-feed" aria-label="Sponsored community announcements"><div className="rc-section-title"><div><h2>Community spotlight</h2><p>Promotions and announcements</p></div></div><div className="rc-people-grid">{activeAds.map(ad => <article className="rc-person-card rc-ad-card" key={ad.id}><span className="rc-eyebrow">SPONSORED</span><h3>{ad.title}</h3>{ad.media_type === 'image' ? <img src={ad.media_path} alt={ad.title} style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:12}}/> : <video src={ad.media_path} controls playsInline style={{width:'100%',maxHeight:220,borderRadius:12}}/>}{ad.target_url && <a href={ad.target_url} target="_blank" rel="noreferrer" className="rc-primary">Learn more</a>}<small>Expires {new Date(ad.expires_at).toLocaleDateString()}</small></article>)}</div></section>}
        {profiles.length > 0 && <section className="rc-content-section rc-online-rankings"><div className="rc-section-title"><div><h2>Community rankings</h2><p>Members ranked by recorded online hours.</p></div></div><div className="rc-group-list">{[...profiles].sort((a,b)=>(b.total_online_seconds||0)-(a.total_online_seconds||0)).slice(0,5).map((p,i)=><div className="rc-group-row" key={p.id}><span className="rc-group-icon">#{i+1}</span><span className="rc-group-info"><strong>@{p.nickname}{p.premium_status === 'active' ? ' ★' : ''}</strong><small>{p.premium_status === 'active' && p.premium_title ? p.premium_title : 'Community member'}</small></span><span className="rc-arrow">{Math.floor((p.total_online_seconds||0)/3600)}h</span></div>)}</div></section>}
        <div className="rc-people-grid">{profiles.filter(p => p.id !== userId).map(p => <article className="rc-person-card" key={p.id}><div className="rc-person-top"><div className="rc-avatar rc-avatar-large">{p.avatar_url ? <img src={p.avatar_url} alt=""/> : p.nickname?.[0]?.toUpperCase() || 'M'}</div>{p.premium_status === 'active' && <span className="rc-premium-badge"><Crown size={12}/> PREMIUM</span>}</div><h3>@{p.nickname}</h3>{p.premium_status === 'active' && p.premium_title && <p className="rc-premium-title">{p.premium_title}</p>}<p>{[p.level, p.college].filter(Boolean).join(' · ') || 'Community member'}</p><small>{p.school || 'School not listed'}</small><div className="rc-person-footer"><span><Zap size={13}/> {Math.floor((p.total_online_seconds || 0) / 3600)}h online</span><button className="rc-primary rc-connect" onClick={() => void sendRequest(p.id)}>Connect <Plus size={15}/></button></div></article>)}</div>
        {profiles.filter(p => p.id !== userId).length === 0 && <div className="rc-empty-state"><div className="rc-empty-icon"><Users size={27}/></div><h2>No people to show yet</h2><p>New members will appear here when they create a profile.</p>{!profileExists && <button className="rc-primary" onClick={openProfileEditor}>Create profile <Plus size={16}/></button>}</div>}
      </section>}

      {tab === 'Groups' && <section className="rc-content-section"><div className="rc-section-title"><div><h2>Groups</h2><p>Spaces for courses, clubs and shared interests.</p></div></div><div className="rc-group-list">{groups.map(g => <button className="rc-group-row" key={g.id} onClick={() => { void (async () => { if (!supabase) return; if (!g.conversation_id) { setStatus('This group does not have a chat yet. Ask its owner to recreate it after the SQL migration.'); return; } const { data: conversationId, error } = await supabase.rpc('join_group_with_conversation', { p_group_id: g.id }); if (error) { setStatus(`Could not join group: ${error.message}`); return; } setSelectedConversation({id: conversationId || g.conversation_id!, title:g.name,kind:'group'}); setTab('Messages'); await loadConversations(); })(); }}><span className="rc-group-icon"><Hash size={22}/></span><span className="rc-group-info"><strong>{g.name}</strong><small>MR RICH CONNECT community</small></span><span className="rc-arrow">→</span></button>)}</div>{groups.length === 0 && <div className="rc-empty-state"><div className="rc-empty-icon"><Users size={27}/></div><h2>No groups yet</h2><p>Create the first group for your community.</p><button className="rc-primary" onClick={() => setShowGroup(true)}><Plus size={16}/> Create group</button></div>}</section>}

      {tab === 'Requests' && <section className="rc-content-section"><div className="rc-section-title"><div><h2>Message requests</h2><p>Accept a request to open a private conversation.</p></div><button className="rc-text-btn" onClick={() => void loadIncomingRequests()}><RefreshCw size={14}/> Refresh</button></div>
        {incomingRequests.length > 0 ? <div className="rc-group-list">{incomingRequests.map(request => <article className="rc-person-card" key={request.id}><div className="rc-person-top"><div className="rc-avatar rc-avatar-large">{request.sender_nickname[0]?.toUpperCase() || 'M'}</div><span className="rc-eyebrow">MESSAGE REQUEST</span></div><h3>@{request.sender_nickname}</h3><p>Wants to start a private conversation with you.</p><small>{new Date(request.created_at).toLocaleDateString()}</small><div className="rc-person-footer"><button className="rc-secondary" disabled={requestBusy === request.id} onClick={() => void respondToRequest(request.id, 'decline')}>Decline</button><button className="rc-primary" disabled={requestBusy === request.id} onClick={() => void respondToRequest(request.id, 'accept')}>{requestBusy === request.id ? 'Please wait…' : 'Accept'}</button></div></article>)}</div> : <div className="rc-empty-state"><div className="rc-empty-icon"><Bell size={27}/></div><h2>{requests ? `${requests} pending request${requests === 1 ? '' : 's'}` : 'No new requests'}</h2><p>{requests ? 'A request exists, but the request details could not be loaded. Check the status message above and your Supabase policies.' : 'When someone sends you a message request, it will appear here.'}</p><button className="rc-secondary" onClick={() => void loadIncomingRequests()}><RefreshCw size={15}/> Refresh requests</button></div>}</section>}

      {tab === 'My Profile' && <section className="rc-profile-page">{profileExists ? <><div className="rc-profile-card"><div className="rc-profile-avatar">{nickname?.[0]?.toUpperCase() || <UserRound size={36}/>}</div><span className="rc-eyebrow">COMMUNITY PROFILE</span><h2>@{nickname}</h2><p>{[profileForm.level, profileForm.college].filter(Boolean).join(' · ') || 'Community member'}</p><p>{profileForm.school || 'School not listed'}</p><button className="rc-primary" onClick={() => { setEditingProfile(true); setShowProfile(true); }}><Pencil size={16}/> Edit profile</button></div><div className="rc-privacy-card"><ShieldCheck size={20}/><div><strong>Your information stays private</strong><p>Your name, phone number, department and email aren't shown on your public profile.</p></div></div></> : <div className="rc-empty-state"><div className="rc-empty-icon"><UserRound size={27}/></div><h2>Create your profile</h2><p>Choose a nickname and add your school details to join the community.</p><button className="rc-primary" onClick={openProfileEditor}>Create profile <Plus size={16}/></button></div>}</section>}
    </>}

    <footer className="rc-footer"><span>© {new Date().getFullYear()} MR RICH CONNECT</span><span><ShieldCheck size={13}/> Your campus. Your community.</span></footer>

    {userId && <nav className="rc-bottom-nav" aria-label="Main navigation">{NAV_ITEMS.map(item => <button key={item.name} className={`rc-bottom-item ${tab === item.name ? 'active' : ''}`} onClick={() => { setTab(item.name); setShowProfile(false); setShowGroup(false); setShowEmojiPicker(false); }}><span className="rc-bottom-icon"><item.icon size={24} strokeWidth={tab === item.name ? 2.5 : 2}/>{item.name === 'Requests' && requests > 0 && <i className="rc-nav-badge">{requests}</i>}</span><span className="rc-bottom-label">{item.name === 'My Profile' ? 'Profile' : item.name}</span></button>)}</nav>}

    {showProfile && <div className="rc-modal-backdrop" onClick={() => { setShowProfile(false); setEditingProfile(false); }}><form className="rc-modal" onSubmit={saveProfile} onClick={e => e.stopPropagation()}><button type="button" className="rc-modal-close" onClick={() => { setShowProfile(false); setEditingProfile(false); }} aria-label="Close"><X size={20}/></button><span className="rc-eyebrow">YOUR PUBLIC IDENTITY</span><h2>{editingProfile ? 'Edit profile' : 'Create your profile'}</h2><p className="rc-muted">Only these details appear on your public profile.</p><label>Nickname<input required maxLength={24} value={profileForm.nickname} onChange={e => setProfileForm({...profileForm, nickname:e.target.value})} placeholder="@yournickname"/></label><label>Level<input value={profileForm.level} onChange={e => setProfileForm({...profileForm, level:e.target.value})} placeholder="e.g. 200 level"/></label><label>College<input value={profileForm.college} onChange={e => setProfileForm({...profileForm, college:e.target.value})} placeholder="Your college"/></label><label>School<input value={profileForm.school} onChange={e => setProfileForm({...profileForm, school:e.target.value})} placeholder="Your school or university"/></label><div className="rc-privacy"><ShieldCheck size={15}/> Name, phone, department and email stay private.</div><button className="rc-primary rc-full" type="submit">Save profile</button></form></div>}
    {showGroup && <div className="rc-modal-backdrop" onClick={() => setShowGroup(false)}><form className="rc-modal" onSubmit={createGroup} onClick={e => e.stopPropagation()}><button type="button" className="rc-modal-close" onClick={() => setShowGroup(false)} aria-label="Close"><X size={20}/></button><span className="rc-eyebrow">BRING PEOPLE TOGETHER</span><h2>Create a group</h2><p className="rc-muted">Start a space around a course, club or interest.</p><label>Group name<input required maxLength={60} value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Campus Creators"/></label><button className="rc-primary rc-full" type="submit">Create group</button></form></div>}
    {!authReady && <div className="rc-loading" aria-label="Loading"/>}
  </main>;
}
