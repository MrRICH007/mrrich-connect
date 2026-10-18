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
  bio?: string | null;
  department?: string | null;
};
type CommunityGroup = { id: string; name: string; conversation_id?: string | null; avatar_url?: string | null };
type AdCampaign = { id: string; title: string; media_type: 'image' | 'video'; media_path: string; target_url: string | null; expires_at: string };
type IncomingRequest = { id: string; sender_id: string; created_at: string; sender_nickname: string };
type Conversation = { id: string; title: string; kind: 'person' | 'group'; subtitle?: string; otherUserId?: string };
type ChatMessage = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; sender_nickname?: string; sender_avatar_url?: string | null };

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
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [registration, setRegistration] = useState({ nickname: '', full_name: '', phone: '', department: '', level: '', college: '', school: '', bio: '' });
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [tab, setTab] = useState('Messages');
  const [requests, setRequests] = useState(0);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [requestBusy, setRequestBusy] = useState<string | null>(null);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [activeAds, setActiveAds] = useState<AdCampaign[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupAvatarUrl, setGroupAvatarUrl] = useState('');
  const [groupAvatarUploading, setGroupAvatarUploading] = useState(false);
  const [profileForm, setProfileForm] = useState({ nickname: '', level: '', college: '', school: '', department: '', bio: '', avatar_url: '', full_name: '', phone: '' });
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
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!status) return;
    const lower = status.toLowerCase();
    setStatusType(/could not|error|failed|not sent|unable|denied|invalid|need to|must |can't|cannot/.test(lower) ? 'error' : /success|sent\.|saved\.|created\.|accepted\.|signed in|submitted\./.test(lower) ? 'success' : 'info');
    const timer = window.setTimeout(() => setStatus(''), 4200);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function uploadAvatar(file?: File) {
    if (!file || !supabase || !userId) return;
    if (!file.type.startsWith('image/')) { setStatus('Choose an image file for your avatar.'); return; }
    if (file.size > 5 * 1024 * 1024) { setStatus('Avatar images must be 5 MB or smaller.'); return; }
    setAvatarUploading(true);
    const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const path = `${userId}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setAvatarUploading(false); setStatus(`Avatar upload failed: ${error.message}. Create a public Supabase Storage bucket named avatars and allow signed-in users to upload to their own folder.`); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setProfileForm(old => ({ ...old, avatar_url: data.publicUrl }));
    setAvatarUploading(false);
    setStatus('Avatar uploaded. Save your profile to publish it.');
  }

  function nicknameColor(id: string) {
    const palette = ['#7dd3fc', '#f9a8d4', '#c4b5fd', '#86efac', '#fcd34d', '#fda4af', '#a5b4fc', '#67e8f9', '#fdba74', '#d9f99d'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  }

  const refreshCommunity = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles')
      .select('id,nickname,level,college,school,department,bio,avatar_url,premium_status,premium_title,total_online_seconds').limit(60);
    if (data) setProfiles(data as Profile[]);
    if (userId) {
      const { data: req } = await supabase.from('message_requests').select('id')
        .eq('recipient_id', userId).eq('status', 'pending');
      setRequests(req?.length ?? 0);
    }
    const { data: grp } = await supabase.from('groups').select('id,name,conversation_id,avatar_url').limit(30);
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
      .select('id,nickname,level,college,school,department,bio,avatar_url,premium_status,premium_title,total_online_seconds')
      .eq('id', id).maybeSingle();
    if (error) {
      setStatus('Your account is signed in, but the profiles table or its access policies need to be configured.');
      setProfileExists(false);
      return;
    }
    if (data) {
      setProfileExists(true);
      setNickname(data.nickname ?? '');
      const { data: privateData } = await supabase.from('private_profiles').select('full_name,phone').eq('user_id', id).maybeSingle();
      setProfileForm({ nickname: data.nickname ?? '', level: data.level ?? '', college: data.college ?? '', school: data.school ?? '', department: data.department ?? '', bio: data.bio ?? '', avatar_url: data.avatar_url ?? '', full_name: privateData?.full_name ?? '', phone: privateData?.phone ?? '' });
    } else {
      setProfileExists(false);
      setNickname('');
      setProfileForm({ nickname: '', level: '', college: '', school: '', department: '', bio: '', avatar_url: '', full_name: '', phone: '' });
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
  async function signUp(e?: FormEvent) {
    e?.preventDefault();
    if (!supabase) return;
    if (!registration.nickname.trim() || !registration.full_name.trim()) { setStatus('Enter your nickname and full name to register.'); return; }
    const { error } = await supabase.auth.signUp({ email, password, options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      data: { nickname: registration.nickname.trim().replace(/^@/, ''), full_name: registration.full_name.trim(), phone: registration.phone.trim(), department: registration.department.trim(), level: registration.level.trim(), college: registration.college.trim(), school: registration.school.trim(), bio: registration.bio.trim() }
    }});
    setStatus(error ? error.message : 'Registration submitted. Confirm your email, then sign in. Run the profile-fields SQL migration so the database creates the separate public and private records.');
    if (!error) setAuthMode('signin');
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
    const { error } = await supabase.from('profiles').upsert({ id: userId, nickname: clean, level: profileForm.level || null, college: profileForm.college || null, school: profileForm.school || null, department: profileForm.department || null, bio: profileForm.bio || null, avatar_url: profileForm.avatar_url || null });
    if (error) { setStatus(error.message); return; }
    const { error: privateError } = await supabase.from('private_profiles').upsert({ user_id: userId, full_name: profileForm.full_name || null, phone: profileForm.phone || null });
    if (privateError) { setStatus(`Public profile saved, but private details could not be saved: ${privateError.message}`); return; }
    setProfileExists(true); setNickname(clean); setShowProfile(false); setEditingProfile(false);
    setStatus('Profile saved.');
    await loadProfile(userId);
  }
  async function sendRequest(recipient: string) {
    if (!supabase || !userId || recipient === userId) return;
    const { error } = await supabase.from('message_requests').insert({ sender_id: userId, recipient_id: recipient });
    setStatus(error ? error.message : 'Message request sent. You can chat after it is accepted.');
  }
  async function uploadGroupAvatar(file?: File) {
    if (!file || !supabase || !userId) return;
    if (!file.type.startsWith('image/')) { setStatus('Choose an image file for the group avatar.'); return; }
    if (file.size > 5 * 1024 * 1024) { setStatus('Group avatar images must be 5 MB or smaller.'); return; }
    setGroupAvatarUploading(true);
    const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const path = `groups/${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setGroupAvatarUploading(false); setStatus(`Group avatar upload failed: ${error.message}`); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setGroupAvatarUrl(data.publicUrl); setGroupAvatarUploading(false); setStatus('Group avatar uploaded. Create the group to save it.');
  }

  async function createGroup(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !userId || !groupName.trim()) return;
    const { data: groupId, error } = await supabase.rpc('create_group_with_conversation', { p_name: groupName.trim(), p_description: null });
    if (error) { setStatus(`Could not create group: ${error.message}. Run the feature bundle SQL migration first.`); return; }
    if (groupAvatarUrl) { const { error: avatarError } = await supabase.from('groups').update({ avatar_url: groupAvatarUrl }).eq('id', groupId); if (avatarError) { setStatus(`Group created, but avatar could not be saved: ${avatarError.message}`); } }
    const { data } = await supabase.from('groups').select('id,name,conversation_id,avatar_url').eq('id', groupId).single();
    if (data) setGroups(old => [data as CommunityGroup, ...old]);
    setGroupName(''); setGroupAvatarUrl(''); setShowGroup(false); if (!groupAvatarUrl) setStatus('Group and group chat created.');
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
    const rows = (data ?? []) as ChatMessage[];
    const senderIds = [...new Set(rows.map(m => m.sender_id))];
    const { data: senderProfiles } = senderIds.length ? await supabase.from('profiles').select('id,nickname,avatar_url').in('id', senderIds) : { data: [] };
    const senderMap = new Map((senderProfiles ?? []).map((p: {id:string;nickname:string;avatar_url:string|null}) => [p.id, p]));
    setChatMessages(rows.map(m => ({ ...m, sender_nickname: senderMap.get(m.sender_id)?.nickname || (m.sender_id === userId ? 'You' : 'Member'), sender_avatar_url: senderMap.get(m.sender_id)?.avatar_url || null })));
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
    const { data: sender } = await supabase.from('profiles').select('nickname,avatar_url').eq('id', userId).maybeSingle();
    setChatMessages(old => [...old, { ...(data as ChatMessage), sender_nickname: sender?.nickname || 'You', sender_avatar_url: sender?.avatar_url || null }]);
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
        void (async () => {
          const { data: sender } = await supabase.from('profiles').select('nickname,avatar_url').eq('id', incoming.sender_id).maybeSingle();
          const enriched = { ...incoming, sender_nickname: sender?.nickname || (incoming.sender_id === userId ? 'You' : 'Member'), sender_avatar_url: sender?.avatar_url || null };
          setChatMessages(old => old.some(m => m.id === enriched.id) ? old : [...old, enriched]);
        })();
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
      <form className="rc-auth-card" onSubmit={authMode === 'signin' ? signIn : signUp}>
        <span className="rc-eyebrow">WELCOME TO THE NETWORK</span><h2>{authMode === 'signin' ? 'Sign in' : 'Create your account'}</h2>
        <p className="rc-muted">{authMode === 'signin' ? 'Use your email and password to continue.' : 'Public profile details and private information are collected separately.'}</p>
        {authMode === 'signup' && <>
          <h3>Public profile</h3>
          <label>Nickname<input required maxLength={24} value={registration.nickname} onChange={e=>setRegistration({...registration,nickname:e.target.value})} placeholder="@yournickname"/></label>
          <label>School or university<input value={registration.school} onChange={e=>setRegistration({...registration,school:e.target.value})} placeholder="Your institution"/></label>
          <label>College / faculty<input value={registration.college} onChange={e=>setRegistration({...registration,college:e.target.value})} placeholder="Your college or faculty"/></label>
          <label>Department<input value={registration.department} onChange={e=>setRegistration({...registration,department:e.target.value})} placeholder="Your department"/></label>
          <label>Level<input value={registration.level} onChange={e=>setRegistration({...registration,level:e.target.value})} placeholder="e.g. 200 level"/></label>
          <label>About me (optional)<textarea value={registration.bio} onChange={e=>setRegistration({...registration,bio:e.target.value})} placeholder="A short public introduction"/></label>
          <h3>Private information</h3>
          <label>Full name<input required value={registration.full_name} onChange={e=>setRegistration({...registration,full_name:e.target.value})} placeholder="Your real name" autoComplete="name"/></label>
          <label>Phone number (optional)<input type="tel" value={registration.phone} onChange={e=>setRegistration({...registration,phone:e.target.value})} placeholder="Private phone number" autoComplete="tel"/></label>
        </>}
        <label>Email address<input id="rc-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label>
        <label>Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}/></label>
        <button className="rc-primary rc-full" type="submit">{authMode === 'signin' ? <><LogIn size={17}/> Sign in</> : 'Create account'}</button>
        <button className="rc-secondary rc-full" type="button" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>{authMode === 'signin' ? 'Create an account' : 'Already have an account? Sign in'}</button>
        <small className="rc-privacy"><ShieldCheck size={14}/> Full name and phone are private. Email stays in your authentication account.</small>
      </form>
    </section> : <>
      <div className="rc-page-heading"><div><span className="rc-eyebrow">{tab === 'Messages' ? 'YOUR INBOX' : tab === 'Discover' ? 'MEET YOUR COMMUNITY' : tab === 'Groups' ? 'YOUR COMMUNITIES' : tab === 'Requests' ? 'NEW CONNECTIONS' : 'YOUR SPACE'}</span><h1>{tab === 'Messages' ? 'Messages' : tab === 'Discover' ? 'Find People Online' : tab === 'Groups' ? 'Find Your Community' : tab === 'Requests' ? 'Message Requests' : 'Your Profile'}</h1></div>
        {tab === 'Groups' && <button className="rc-primary" onClick={() => setShowGroup(true)}><Plus size={17}/> Create group</button>}
        {tab === 'Discover' && <button className="rc-icon-btn" aria-label="Refresh people" onClick={() => void refreshCommunity()}><RefreshCw size={18}/></button>}
      </div>

      {!configured && <div className="rc-notice"><ShieldCheck size={18}/><span>Supabase is not configured. Add your project URL and public key to your Render environment variables.</span></div>}
      {status && <div className={`rc-toast rc-toast-${statusType}`} role={statusType === 'error' ? 'alert' : 'status'}>{status}<button aria-label="Dismiss notice" onClick={() => setStatus('')}><X size={14}/></button></div>}

      {tab === 'Messages' && <section className={`rc-messages-layout ${selectedConversation ? 'has-chat' : ''}`}>
        <aside className="rc-conversation-list"><div className="rc-list-heading"><div><h2>Conversations</h2><p>Private and group chats</p></div></div>
          {conversationList.map(convo => <button key={convo.id} className={`rc-conversation-row ${selectedConversation?.id === convo.id ? 'active' : ''}`} onClick={() => setSelectedConversation(convo)}><span className="rc-conversation-avatar">{convo.kind === 'group' ? <Users size={20}/> : <MessageCircle size={20}/>}</span><span><strong>{convo.title}</strong><small>{convo.kind === 'group' ? 'Group conversation' : 'Private conversation'}</small></span></button>)}
          {conversationList.length === 0 && <div className="rc-empty-conversations"><div className="rc-empty-icon"><MessageCircle size={27}/></div><strong>Your Conversations Will Appear Here.</strong><p>Accept a message request to start a private conversation.</p><button className="rc-text-btn" onClick={() => { setTab('Requests'); void loadIncomingRequests(); }}>View requests <Bell size={14}/></button></div>}
        </aside>
        <section className="rc-chat-panel">
          {selectedConversation ? <><header className="rc-chat-header"><button className="rc-icon-btn rc-back-chat" onClick={() => setSelectedConversation(null)} aria-label="Back to conversations"><ArrowLeft size={19}/></button><div className="rc-conversation-avatar">{selectedConversation.kind === 'group' ? <Users size={20}/> : <MessageCircle size={20}/>}</div><div><strong>{selectedConversation.title}</strong><small>{selectedConversation.kind === 'group' ? 'Group conversation' : 'Private conversation'}</small></div></header><div className="rc-chat-empty" style={{display:'flex', flexDirection:'column', alignItems:'stretch', gap:'12px', overflowY:'auto', justifyContent: chatMessages.length ? 'flex-start' : 'center'}}>{chatMessages.length === 0 ? <><MessageCircle size={28}/><strong>Your chat starts here</strong><p>Send the first message to begin.</p></> : chatMessages.map(message => {
          const mine = message.sender_id === userId;
          const groupChat = selectedConversation.kind === 'group';
          const senderName = mine ? 'You' : `@${message.sender_nickname || 'Member'}`;
          return <div key={message.id} className={`rc-message-row ${mine ? 'rc-message-mine' : 'rc-message-other'} ${groupChat ? 'rc-message-group' : 'rc-message-private'}`}>
            {!mine && <span className="rc-message-avatar">{message.sender_avatar_url ? <img src={message.sender_avatar_url} alt=""/> : (message.sender_nickname?.[0] || 'M').toUpperCase()}</span>}
            <div className={`rc-message-bubble ${mine ? 'mine' : 'other'}`}>
              {groupChat && <strong className="rc-message-sender" style={{color: mine ? '#ffffff' : nicknameColor(message.sender_id)}}>{senderName}</strong>}
              <div className="rc-message-body">{message.body}</div>
              <small className="rc-message-time">{new Date(message.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small>
            </div>
            {mine && !groupChat && <span className="rc-message-avatar">{message.sender_avatar_url ? <img src={message.sender_avatar_url} alt=""/> : (message.sender_nickname?.[0] || 'Y').toUpperCase()}</span>}
          </div>;
        })}</div><div className="rc-composer-wrap"><div className="rc-composer"><button className="rc-emoji-toggle" onClick={() => setShowEmojiPicker(v=>!v)} aria-label="Open emoji picker"><Smile size={22}/></button><input value={draftMessage} onChange={e=>setDraftMessage(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void sendDraft();}}} placeholder="Write a message…" aria-label="Message"/><button className="rc-send-btn" onClick={() => void sendDraft()} disabled={!draftMessage.trim() || sendingMessage} aria-label="Send message"><Send size={18}/></button></div>{showEmojiPicker && <div className="rc-emoji-grid">{EMOJIS.map((emoji, i)=><button key={`${emoji}-${i}`} onClick={() => { setDraftMessage(v=>v+emoji); setShowEmojiPicker(false); }} aria-label={`Add ${emoji}`}>{emoji}</button>)}</div>}</div></> : <div className="rc-chat-no-selection"><div className="rc-chat-big-icon"><MessageCircle size={35}/><Wifi size={16}/></div><h2>Select a conversation</h2><p>Choose a person or group to open your chat.</p></div>}
        </section>
      </section>}

      {tab === 'Discover' && <section className="rc-content-section"><div className="rc-section-title"><div><h2>People you may know</h2><p>Connect with members from your community.</p></div><button className="rc-text-btn" onClick={() => void refreshCommunity()}>Refresh <RefreshCw size={14}/></button></div>
        {activeAds.length > 0 && <section className="rc-ad-feed" aria-label="Sponsored community announcements"><div className="rc-section-title"><div><h2>Community spotlight</h2><p>Promotions and announcements</p></div></div><div className="rc-people-grid">{activeAds.map(ad => <article className="rc-person-card rc-ad-card" key={ad.id}><span className="rc-eyebrow">SPONSORED</span><h3>{ad.title}</h3>{ad.media_type === 'image' ? <img src={ad.media_path} alt={ad.title} style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:12}}/> : <video src={ad.media_path} controls playsInline style={{width:'100%',maxHeight:220,borderRadius:12}}/>}{ad.target_url && <a href={ad.target_url} target="_blank" rel="noreferrer" className="rc-primary">Learn more</a>}<small>Expires {new Date(ad.expires_at).toLocaleDateString()}</small></article>)}</div></section>}
        {profiles.length > 0 && <section className="rc-content-section rc-online-rankings"><div className="rc-section-title"><div><h2>Community rankings</h2><p>Members ranked by recorded online hours.</p></div></div><div className="rc-group-list">{[...profiles].sort((a,b)=>(b.total_online_seconds||0)-(a.total_online_seconds||0)).slice(0,5).map((p,i)=><div className="rc-group-row" key={p.id}><span className="rc-group-icon">#{i+1}</span><span className="rc-group-info"><strong>@{p.nickname}{p.premium_status === 'active' ? ' ★' : ''}</strong><small>{p.premium_status === 'active' && p.premium_title ? p.premium_title : 'Community member'}</small></span><span className="rc-arrow">{Math.floor((p.total_online_seconds||0)/3600)}h</span></div>)}</div></section>}
        <div className="rc-people-grid">{profiles.filter(p => p.id !== userId).map(p => <article className="rc-person-card" key={p.id}><div className="rc-person-top"><div className="rc-avatar rc-avatar-large">{p.avatar_url ? <img src={p.avatar_url} alt=""/> : p.nickname?.[0]?.toUpperCase() || 'M'}</div>{p.premium_status === 'active' && <span className="rc-premium-badge"><Crown size={12}/> PREMIUM</span>}</div><h3>@{p.nickname}</h3>{p.premium_status === 'active' && p.premium_title && <p className="rc-premium-title">{p.premium_title}</p>}<p>{[p.level, p.college].filter(Boolean).join(' · ') || 'Community member'}</p><small>{p.school || 'School not listed'}</small><div className="rc-person-footer"><span><Zap size={13}/> {Math.floor((p.total_online_seconds || 0) / 3600)}h online</span><button className="rc-primary rc-connect" onClick={() => void sendRequest(p.id)}>Connect <Plus size={15}/></button></div></article>)}</div>
        {profiles.filter(p => p.id !== userId).length === 0 && <div className="rc-empty-state"><div className="rc-empty-icon"><Users size={27}/></div><h2>No people to show yet</h2><p>New members will appear here when they create a profile.</p>{!profileExists && <button className="rc-primary" onClick={openProfileEditor}>Create profile <Plus size={16}/></button>}</div>}
      </section>}

      {tab === 'Groups' && <section className="rc-content-section"><div className="rc-section-title"><div><h2>Groups</h2><p>Spaces for courses, clubs and shared interests.</p></div></div><div className="rc-group-list">{groups.map(g => <button className="rc-group-row" key={g.id} onClick={() => { void (async () => { if (!supabase) return; if (!g.conversation_id) { setStatus('This group does not have a chat yet. Ask its owner to recreate it after the SQL migration.'); return; } const { data: conversationId, error } = await supabase.rpc('join_group_with_conversation', { p_group_id: g.id }); if (error) { setStatus(`Could not join group: ${error.message}`); return; } setSelectedConversation({id: conversationId || g.conversation_id!, title:g.name,kind:'group'}); setTab('Messages'); await loadConversations(); })(); }}><span className="rc-group-icon">{g.avatar_url ? <img src={g.avatar_url} alt=""/> : <Users size={22}/>}</span><span className="rc-group-info"><strong>{g.name}</strong><small>MR RICH CONNECT community</small></span><span className="rc-arrow">→</span></button>)}</div>{groups.length === 0 && <div className="rc-empty-state"><div className="rc-empty-icon"><Users size={27}/></div><h2>No groups yet</h2><p>Create the first group for your community.</p><button className="rc-primary" onClick={() => setShowGroup(true)}><Plus size={16}/> Create group</button></div>}</section>}

      {tab === 'Requests' && <section className="rc-content-section"><div className="rc-section-title"><div><h2>Message requests</h2><p>Accept a request to open a private conversation.</p></div><button className="rc-text-btn" onClick={() => void loadIncomingRequests()}><RefreshCw size={14}/> Refresh</button></div>
        {incomingRequests.length > 0 ? <div className="rc-group-list">{incomingRequests.map(request => <article className="rc-person-card" key={request.id}><div className="rc-person-top"><div className="rc-avatar rc-avatar-large">{request.sender_nickname[0]?.toUpperCase() || 'M'}</div><span className="rc-eyebrow">MESSAGE REQUEST</span></div><h3>@{request.sender_nickname}</h3><p>Wants to start a private conversation with you.</p><small>{new Date(request.created_at).toLocaleDateString()}</small><div className="rc-person-footer"><button className="rc-secondary" disabled={requestBusy === request.id} onClick={() => void respondToRequest(request.id, 'decline')}>Decline</button><button className="rc-primary" disabled={requestBusy === request.id} onClick={() => void respondToRequest(request.id, 'accept')}>{requestBusy === request.id ? 'Please wait…' : 'Accept'}</button></div></article>)}</div> : <div className="rc-empty-state"><div className="rc-empty-icon"><Bell size={27}/></div><h2>{requests ? `${requests} pending request${requests === 1 ? '' : 's'}` : 'No new requests'}</h2><p>{requests ? 'A request exists, but the request details could not be loaded. Check the status message above and your Supabase policies.' : 'When someone sends you a message request, it will appear here.'}</p><button className="rc-secondary" onClick={() => void loadIncomingRequests()}><RefreshCw size={15}/> Refresh requests</button></div>}</section>}

      {tab === 'My Profile' && <section className="rc-profile-page">{profileExists ? <><div className="rc-profile-card"><label className="rc-profile-avatar-click" title="Change profile photo"><span className="rc-profile-avatar">{profileForm.avatar_url ? <img src={profileForm.avatar_url} alt="Your profile avatar"/> : nickname?.[0]?.toUpperCase() || <UserRound size={36}/>}<i><Pencil size={14}/></i></span><input className="rc-hidden-file" type="file" accept="image/*" onChange={e => void uploadAvatar(e.target.files?.[0])} disabled={avatarUploading}/></label><span className="rc-eyebrow">COMMUNITY PROFILE</span><h2>@{nickname}</h2><p>{[profileForm.level, profileForm.college].filter(Boolean).join(' · ') || 'Community member'}</p><p>{profileForm.school || 'School not listed'}</p><button className="rc-primary" onClick={() => { setEditingProfile(true); setShowProfile(true); }}><Pencil size={16}/> Edit profile</button></div><div className="rc-privacy-card"><ShieldCheck size={20}/><div><strong>Your information stays private</strong><p>Your name, phone number, department and email aren't shown on your public profile.</p></div></div></> : <div className="rc-empty-state"><div className="rc-empty-icon"><UserRound size={27}/></div><h2>Create your profile</h2><p>Choose a nickname and add your school details to join the community.</p><button className="rc-primary" onClick={openProfileEditor}>Create profile <Plus size={16}/></button></div>}</section>}
    </>}

    <footer className="rc-footer"><span>© {new Date().getFullYear()} MR RICH CONNECT</span><span><ShieldCheck size={13}/> Your campus. Your community.</span></footer>

    {userId && <nav className="rc-bottom-nav" aria-label="Main navigation">{NAV_ITEMS.map(item => <button key={item.name} className={`rc-bottom-item ${tab === item.name ? 'active' : ''}`} onClick={() => { setTab(item.name); setShowProfile(false); setShowGroup(false); setShowEmojiPicker(false); }}><span className="rc-bottom-icon"><item.icon size={24} strokeWidth={tab === item.name ? 2.5 : 2}/>{item.name === 'Requests' && requests > 0 && <i className="rc-nav-badge">{requests}</i>}</span><span className="rc-bottom-label">{item.name === 'My Profile' ? 'Profile' : item.name}</span></button>)}</nav>}

    {showProfile && <div className="rc-modal-backdrop" onClick={() => { setShowProfile(false); setEditingProfile(false); }}><form className="rc-modal" onSubmit={saveProfile} onClick={e => e.stopPropagation()}><button type="button" className="rc-modal-close" onClick={() => { setShowProfile(false); setEditingProfile(false); }} aria-label="Close"><X size={20}/></button><span className="rc-eyebrow">YOUR PUBLIC IDENTITY</span><h2>{editingProfile ? 'Edit profile' : 'Create your profile'}</h2><p className="rc-muted">Public details are visible to members. Private details are only readable by your own account.</p><label>Nickname<input required maxLength={24} value={profileForm.nickname} onChange={e => setProfileForm({...profileForm, nickname:e.target.value})} placeholder="@yournickname"/></label><label>Level<input value={profileForm.level} onChange={e => setProfileForm({...profileForm, level:e.target.value})} placeholder="e.g. 200 level"/></label><label>College<input value={profileForm.college} onChange={e => setProfileForm({...profileForm, college:e.target.value})} placeholder="Your college"/></label><label>School<input value={profileForm.school} onChange={e => setProfileForm({...profileForm, school:e.target.value})} placeholder="Your school or university"/></label>
<label>Department<input value={profileForm.department} onChange={e => setProfileForm({...profileForm, department:e.target.value})} placeholder="Your department"/></label>
<label>Profile avatar (optional)<input type="file" accept="image/*" onChange={e => void uploadAvatar(e.target.files?.[0])} disabled={avatarUploading}/></label>{avatarUploading && <p className="rc-muted">Uploading avatar…</p>}{profileForm.avatar_url && <div className="rc-avatar-preview"><img src={profileForm.avatar_url} alt="Avatar preview"/><button type="button" className="rc-secondary" onClick={() => setProfileForm({...profileForm,avatar_url:''})}>Remove photo</button></div>}<label>Or paste a profile photo URL<input type="url" value={profileForm.avatar_url} onChange={e => setProfileForm({...profileForm,avatar_url:e.target.value})} placeholder="https://..."/></label>
<label>About me (public)<textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio:e.target.value})} placeholder="Short introduction"/></label>
<h3>Private information — only you can read this</h3>
<label>Full name<input value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name:e.target.value})} placeholder="Your real name"/></label>
<label>Phone number<input type="tel" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone:e.target.value})} placeholder="Private phone number"/></label>
<div className="rc-privacy"><ShieldCheck size={15}/> Email is kept in your authentication account and isn't shown publicly. Full name and phone are stored separately.</div><button className="rc-primary rc-full" type="submit">Save profile</button></form></div>}
    {showGroup && <div className="rc-modal-backdrop" onClick={() => setShowGroup(false)}><form className="rc-modal" onSubmit={createGroup} onClick={e => e.stopPropagation()}><button type="button" className="rc-modal-close" onClick={() => setShowGroup(false)} aria-label="Close"><X size={20}/></button><span className="rc-eyebrow">BRING PEOPLE TOGETHER</span><h2>Create a group</h2><p className="rc-muted">Start a space around a course, club or interest.</p><label>Group name<input required maxLength={60} value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Campus Creators"/></label><label>Group image (optional)<input type="file" accept="image/*" onChange={e => void uploadGroupAvatar(e.target.files?.[0])} disabled={groupAvatarUploading}/></label>{groupAvatarUploading && <p className="rc-muted">Uploading group image…</p>}{groupAvatarUrl && <div className="rc-avatar-preview"><img src={groupAvatarUrl} alt="Group avatar preview"/><button type="button" className="rc-secondary" onClick={() => setGroupAvatarUrl('')}>Remove image</button></div>}<button className="rc-primary rc-full" type="submit" disabled={groupAvatarUploading}>{groupAvatarUploading ? 'Uploading…' : 'Create group'}</button></form></div>}
    {!authReady && <div className="rc-loading" aria-label="Loading"/>}
  </main>;
}
