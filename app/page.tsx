'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, TouchEvent } from 'react';
import { createClient } from '../lib/supabase';
import {
  Bell, Crown, Hash, LogIn, LogOut, MessageCircle, Search, ShieldCheck,
  Users, UserRound, Wifi, Pencil, Plus, Send, Smile, ArrowLeft, RefreshCw,
  X, Sparkles, Zap, ArrowDown
} from 'lucide-react';

type Profile = {
  id: string;
  nickname: string;
  level: string | null;
  college: string | null;
  school: string | null;
  avatar_url: string | null;
  premium_status: string;
  department?: string | null;
  bio?: string | null;
  premium_title?: string | null;
  total_online_seconds?: number | null;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_nickname?: string;
  sender_avatar_url?: string | null;
  reply_to?: {
    sender_id: string;
    sender_nickname: string;
    body: string;
  } | null;
  read_by?: string[];
  delivered_by?: string[];
};

type IncomingRequest = {
  id: string;
  sender_id: string;
  created_at: string;
  sender_nickname: string;
};

type CommunityGroup = {
  id: string;
  name: string;
  conversation_id: string | null;
  avatar_url: string | null;
  created_by: string;
};

type AdCampaign = {
  id: string;
  title: string;
  media_type: string;
  media_path: string;
  target_url: string | null;
  expires_at: string;
};

type Conversation = {
  id: string;
  title: string;
  kind: 'person' | 'group';
  otherUserId?: string;
  avatarUrl?: string | null;
  lastMessageAt?: string | null;
};

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
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverFilter, setDiscoverFilter] = useState<'all' | 'online' | 'school'>('all');
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
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
  const [chatExiting, setChatExiting] = useState(false);
  const pageSwipeStart = useRef<{ x: number; y: number; kind: 'page' | 'chat' } | null>(null);
  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const touchStartX = useRef<Record<string, number>>({});
  const [draggingMessageId, setDraggingMessageId] = useState<string | null>(null);
  const [dragOffsets, setDragOffsets] = useState<Record<string, number>>({});
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Keep the mobile chat aligned with the visible viewport when the keyboard opens.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const updateViewport = () => {
      const keyboardOpen = window.innerHeight - viewport.height > 140;
      document.documentElement.style.setProperty('--rc-visual-height', `${viewport.height}px`);
      document.documentElement.style.setProperty('--rc-visual-offset', `${Math.max(0, viewport.offsetTop)}px`);
      document.documentElement.classList.toggle('rc-keyboard-open', keyboardOpen);
    };
    updateViewport();
    viewport.addEventListener('resize', updateViewport);
    viewport.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);
    return () => {
      viewport.removeEventListener('resize', updateViewport);
      viewport.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      document.documentElement.style.removeProperty('--rc-visual-height');
      document.documentElement.style.removeProperty('--rc-visual-offset');
      document.documentElement.classList.remove('rc-keyboard-open');
    };
  }, []);

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
    try {
      const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
      const path = `${userId}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) { setStatus(`Avatar upload failed: ${uploadError.message}`); return; }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: saveError } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId);
      if (saveError) { setStatus(`Image uploaded, but profile save failed: ${saveError.message}`); return; }
      setProfileForm(old => ({ ...old, avatar_url: data.publicUrl }));
      setProfiles(old => old.map(profile => profile.id === userId ? { ...profile, avatar_url: data.publicUrl } : profile));
      setStatus('Profile avatar saved successfully.');
    } catch {
      setStatus('Something went wrong while saving your avatar.');
    } finally {
      setAvatarUploading(false);
    }
  }

  function nicknameColor(id: string) {
    const palette = ['#7dd3fc', '#f9a8d4', '#c4b5fd', '#86efac', '#fcd34d', '#fda4af', '#a5b4fc', '#67e8f9', '#fdba74', '#d9f99d'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  }

  const refreshCommunity = useCallback(async () => {
    if (!supabase) return;
    const { data: adminResult } = await supabase.rpc('is_admin');
    setIsAdmin(adminResult === true);
    const { data } = await supabase.from('profiles')
      .select('id,nickname,level,college,school,department,bio,avatar_url,premium_status,premium_title,total_online_seconds').limit(200);
    if (data) setProfiles(data as Profile[]);
    if (userId) {
      const { data: req } = await supabase.from('message_requests').select('id')
        .eq('recipient_id', userId).eq('status', 'pending');
      setRequests(req?.length ?? 0);
    }
    const { data: grp } = await supabase.from('groups').select('id,name,conversation_id,avatar_url,created_by').limit(30);
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
    if (!supabase || !userId) {
      setOnlineCount(0);
      return;
    }

    let active = true;
    // Heartbeats run every 30 seconds. A 3-minute freshness window tolerates
    // ordinary background-tab throttling while eventually clearing abandoned sessions.
    const HEARTBEAT_INTERVAL_MS = 30_000;
    const ONLINE_WINDOW_MS = 3 * 60_000;

    const sendHeartbeat = async () => {
      const { error } = await supabase.rpc('heartbeat_user_presence');
      if (error) console.warn('Could not update online heartbeat:', error.message);
    };

    const refreshOnlineCount = async () => {
      const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
      const { data, error } = await supabase
        .from('user_presence')
        .select('user_id,last_seen_at')
        .gte('last_seen_at', cutoff);

      if (error) {
        console.warn('Could not refresh online count:', error.message);
        return;
      }
      if (!active) return;
      const uniqueUsers = new Set((data ?? []).map(row => row.user_id).filter(Boolean));
      setOnlineUserIds([...uniqueUsers]);
      setOnlineCount(uniqueUsers.size);
    };

    const pulse = async () => {
      await sendHeartbeat();
      await refreshOnlineCount();
    };

    void pulse();
    const intervalId = window.setInterval(() => { void pulse(); }, HEARTBEAT_INTERVAL_MS);
    const refreshWhenActive = () => {
      if (document.visibilityState === 'visible') void pulse();
    };
    window.addEventListener('focus', refreshWhenActive);
    document.addEventListener('visibilitychange', refreshWhenActive);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshWhenActive);
      document.removeEventListener('visibilitychange', refreshWhenActive);
    };
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

  async function changeExistingGroupAvatar(group: CommunityGroup, file?: File) {
    if (!file || !supabase || !userId) return;
    if (group.created_by !== userId && !isAdmin) { setStatus('Only the group creator or an admin can change this image.'); return; }
    if (!file.type.startsWith('image/')) { setStatus('Choose an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setStatus('Image must be 5 MB or smaller.'); return; }
    setStatus('Uploading group image...');
    const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const path = `groups/${userId}/${group.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { setStatus(`Upload failed: ${uploadError.message}`); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error } = await supabase.from('groups').update({ avatar_url: data.publicUrl }).eq('id', group.id);
    if (error) { setStatus(`Could not save image: ${error.message}`); return; }
    setGroups(old => old.map(g => g.id === group.id ? { ...g, avatar_url: data.publicUrl } : g));
    setStatus('Group image updated!');
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
  const loadUnreadCounts = useCallback(async () => {
    if (!supabase || !userId) { setUnreadCounts({}); return; }
    const { data, error } = await supabase.rpc('get_unread_message_counts');
    if (error) { console.error('Unread counts could not be loaded:', error.message); return; }
    const counts: Record<string, number> = {};
    for (const row of data ?? []) counts[row.conversation_id] = Number(row.unread_count) || 0;
    setUnreadCounts(counts);
  }, [supabase, userId]);

  const markConversationRead = useCallback(async (conversationId: string) => {
    if (!supabase || !userId) return;
    const { error } = await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
    if (error) { console.error('Could not mark conversation read:', error.message); return; }
    setUnreadCounts(old => ({ ...old, [conversationId]: 0 }));
  }, [supabase, userId]);

  
  const markMessagesDelivered = useCallback(async (conversationId: string) => {
    if (!supabase || !userId || document.visibilityState !== 'visible') return;

    const { data: incomingMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('deleted_at', null)
      .limit(200);

    if (messagesError) {
      console.error('Could not load incoming messages for delivery:', messagesError.message);
      return;
    }

    if (!incomingMessages?.length) return;

    const receipts = incomingMessages.map(message => ({
      message_id: message.id,
      user_id: userId
    }));

    const { error: deliveryError } = await supabase
      .from('message_deliveries')
      .upsert(receipts, { onConflict: 'message_id,user_id', ignoreDuplicates: true });

    if (deliveryError) {
      console.error('Could not mark messages delivered:', deliveryError.message);
    }
  }, [supabase, userId]);
  
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
    let avatarById = new Map<string, string | null>();
    if (privateOtherIds.length) {
      const { data: otherProfiles, error: otherProfileError } = await supabase.from('profiles')
        .select('id,nickname,avatar_url').in('id', privateOtherIds);
      if (otherProfileError) setStatus(`Chats loaded, but some participant names could not be read: ${otherProfileError.message}`);
      nicknameById = new Map((otherProfiles ?? []).map((p: { id: string; nickname: string }) => [p.id, p.nickname]));
      avatarById = new Map((otherProfiles ?? []).map((p: { id: string; avatar_url: string | null }) => [p.id, p.avatar_url]));
    }
    const { data: recentMessages } = await supabase.from('messages').select('conversation_id,created_at').in('conversation_id', ids).is('deleted_at', null).order('created_at', { ascending: false });
    const latestByConversation = new Map<string, string>();
    for (const message of recentMessages ?? []) if (!latestByConversation.has(message.conversation_id)) latestByConversation.set(message.conversation_id, message.created_at);
    const mapped: Conversation[] = (convs ?? []).map((c: { id: string; title: string | null; kind: string }) => {
      const other = (allMembers ?? []).find((m: { conversation_id: string; user_id: string }) => m.conversation_id === c.id && m.user_id !== userId);
      const isGroup = c.kind === 'group';
      return {
        id: c.id,
        title: isGroup ? (c.title || 'Group chat') : (nicknameById.get(other?.user_id ?? '') ? `@${nicknameById.get(other?.user_id ?? '')}` : (c.title && !['Private chat', 'Private conversation'].includes(c.title) ? c.title : 'Private chat')),
        kind: isGroup ? ('group' as const) : ('person' as const),
        otherUserId: other?.user_id,
        avatarUrl: isGroup ? (groups.find(g => g.conversation_id === c.id)?.avatar_url ?? null) : avatarById.get(other?.user_id ?? '') ?? null,
        lastMessageAt: latestByConversation.get(c.id) ?? null
      };
    }).sort((a, b) => (b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0) - (a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0));
    setConversationList(mapped);
    setSelectedConversation(current => current ? (mapped.find(c => c.id === current.id) ?? current) : null);
  }, [supabase, userId, groups]);

  function decodeChatMessage(message: ChatMessage): ChatMessage {
    const prefix = '[[RC_REPLY]]';
    if (!message.body.startsWith(prefix)) return message;
    const newline = message.body.indexOf('\n');
    if (newline < 0) return message;
    try {
      const reply_to = JSON.parse(message.body.slice(prefix.length, newline));
      return { ...message, body: message.body.slice(newline + 1), reply_to };
    } catch { return message; }
  }

  
  const loadChatMessages = useCallback(async (conversationId: string) => {
    if (!supabase || !userId) return;

    const { data, error } = await supabase.from('messages')
      .select('id,conversation_id,sender_id,body,created_at')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      setStatus(`Could not load messages: ${error.message}`);
      return;
    }

    const rows = ((data ?? []) as ChatMessage[]).map(decodeChatMessage);

    const messageIds = rows.map(m => m.id);

    const { data: readReceipts, error: readReceiptsError } = messageIds.length
      ? await supabase.from('message_reads')
          .select('message_id,user_id')
          .in('message_id', messageIds)
      : { data: [], error: null };

    if (readReceiptsError) {
      console.error('Could not load read receipts:', readReceiptsError.message);
    }

    const { data: deliveryReceipts, error: deliveryReceiptsError } = messageIds.length
      ? await supabase.from('message_deliveries')
          .select('message_id,user_id')
          .in('message_id', messageIds)
      : { data: [], error: null };

    if (deliveryReceiptsError) {
      console.error('Could not load delivery receipts:', deliveryReceiptsError.message);
    }

    const readersByMessage: Record<string, string[]> = {};
    for (const receipt of readReceipts ?? []) {
      const existing = readersByMessage[receipt.message_id] ?? [];
      if (!existing.includes(receipt.user_id)) {
        readersByMessage[receipt.message_id] = [...existing, receipt.user_id];
      }
    }

    const deliveryByMessage: Record<string, string[]> = {};
    for (const receipt of deliveryReceipts ?? []) {
      const existing = deliveryByMessage[receipt.message_id] ?? [];
      if (!existing.includes(receipt.user_id)) {
        deliveryByMessage[receipt.message_id] = [...existing, receipt.user_id];
      }
    }


    const senderIds = [...new Set(rows.map(m => m.sender_id))];
    const { data: senders, error: senderError } = senderIds.length
      ? await supabase.from('profiles')
          .select('id,nickname,avatar_url')
          .in('id', senderIds)
      : { data: [], error: null };

    if (senderError) {
      console.error('Could not load sender profiles:', senderError.message);
    }

    const senderMap = new Map(
      (senders ?? []).map(p => [p.id, p])
    );

    setChatMessages(rows.map(m => ({
      ...m,
      sender_nickname: senderMap.get(m.sender_id)?.nickname
        || (m.sender_id === userId ? 'You' : 'Member'),
      sender_avatar_url: senderMap.get(m.sender_id)?.avatar_url || null,
      read_by: readersByMessage[m.id] || [],
delivered_by: deliveryByMessage[m.id] || []
    })));
  }, [supabase, userId]);

  async function sendDraft() {
    const body = draftMessage.trim();
    if (!supabase || !userId || !selectedConversation || !body || sendingMessage) return;
    setSendingMessage(true);
    const storedBody = replyTo ? `[[RC_REPLY]]${JSON.stringify({ sender_id: replyTo.sender_id, sender_nickname: replyTo.sender_nickname || (replyTo.sender_id === userId ? 'You' : 'Member'), body: replyTo.body.slice(0, 500) })}\n${body}` : body;
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: selectedConversation.id, sender_id: userId, body: storedBody
    }).select('id,conversation_id,sender_id,body,created_at').single();
    setSendingMessage(false);
    if (error) { setStatus(`Message not sent: ${error.message}`); return; }
    const { data: sender } = await supabase.from('profiles').select('nickname,avatar_url').eq('id', userId).maybeSingle();
    setChatMessages(old => [...old, { ...decodeChatMessage(data as ChatMessage), sender_nickname: sender?.nickname || 'You', sender_avatar_url: sender?.avatar_url || null }]);
    setConversationList(old => old.map(c => c.id === selectedConversation.id ? { ...c, lastMessageAt: (data as ChatMessage).created_at } : c).sort((a,b) => (b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0) - (a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0)));
    setDraftMessage('');
    setReplyTo(null);
    setShowEmojiPicker(false);
  }

  const scrollChatToLatest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = chatMessagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowScrollToLatest(false);
  }, []);

  useEffect(() => {
    if (!selectedConversation || chatMessages.length === 0) {
      setShowScrollToLatest(false);
      return;
    }
    const frame = window.requestAnimationFrame(() => scrollChatToLatest('smooth'));
    return () => window.cancelAnimationFrame(frame);
  }, [chatMessages, selectedConversation?.id, scrollChatToLatest]);

  function handleChatScroll() {
    const el = chatMessagesRef.current;
    if (!el) return;
    setShowScrollToLatest(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  }

  useEffect(() => { if (userId) { void loadConversations(); void loadUnreadCounts(); } }, [userId, loadConversations, loadUnreadCounts]);
  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase.channel(`unread-refresh-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as ChatMessage;
        if (msg.sender_id === userId) return;
        if (selectedConversation?.id === msg.conversation_id && document.visibilityState === 'visible') {
          void markConversationRead(msg.conversation_id);
        } else {
          void loadUnreadCounts();
        }
      }).subscribe();
    const onFocus = () => { void loadUnreadCounts(); };
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('focus', onFocus); void supabase.removeChannel(channel); };
  }, [supabase, userId, selectedConversation?.id, loadUnreadCounts, markConversationRead]);

  useEffect(() => { if (typeof window !== 'undefined' && 'Notification' in window) setNotificationPermission(Notification.permission); }, []);
  async function enableMessageNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('This browser does not support web push notifications. Try installing/opening the site in a supported browser.'); return;
    }
    if (!supabase || !userId) { setStatus('Sign in before enabling message notifications.'); return; }
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) { setStatus('Push notifications need NEXT_PUBLIC_VAPID_PUBLIC_KEY configured in Render first.'); return; }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') { setStatus('Notifications are blocked. Allow notifications in your browser or phone settings.'); return; }
      const registration = await navigator.serviceWorker.register('/sw.js');
      const ready = await navigator.serviceWorker.ready;
      const toUint8 = (value: string) => {
        const padding = '='.repeat((4 - value.length % 4) % 4);
        const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = window.atob(base64);
        return Uint8Array.from(raw, c => c.charCodeAt(0));
      };
      let subscription = await ready.pushManager.getSubscription();
      if (!subscription) subscription = await ready.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8(vapidPublicKey) });
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { setStatus('Your sign-in session expired. Sign in again and retry.'); return; }
      const response = await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscription: subscription.toJSON() })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not save this device subscription.');
      setStatus('Push notifications enabled on this device. You can receive alerts while the site is in the background when server push is configured.');
    } catch (error) {
      setStatus(`Could not enable push notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Subscribe across conversations so the list updates even when a different chat is open.
  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase.channel(`all-user-messages-${userId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
      const incoming = payload.new as ChatMessage;
      setConversationList(current => current.map(c => c.id === incoming.conversation_id ? { ...c, lastMessageAt: incoming.created_at } : c).sort((a,b) => (b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0) - (a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0)));
      if (incoming.sender_id === userId) return;
      const active = selectedConversation?.id === incoming.conversation_id;
      // Re-read the database-backed count instead of incrementing locally. This avoids
      // duplicate counts when more than one realtime listener receives the same message.
      if (!active) void loadUnreadCounts();
      if (notificationPermission === 'granted' && !active && document.visibilityState !== 'visible') {
        const convo = conversationList.find(c => c.id === incoming.conversation_id);
        void supabase.from('profiles').select('nickname').eq('id', incoming.sender_id).maybeSingle().then(({data}) => {
          try { new Notification(convo?.title || 'New message', { body: `${data?.nickname ? '@' + data.nickname : 'Someone'} sent you a message.`, tag: incoming.conversation_id }); } catch {}
        });
      }
      if (active) void loadChatMessages(incoming.conversation_id);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, userId, selectedConversation?.id, notificationPermission, conversationList, loadChatMessages, loadUnreadCounts]);
  useEffect(() => {
    if (!supabase || !userId || !selectedConversation) { setChatMessages([]); return; }
    
    void loadChatMessages(selectedConversation.id);
    if (document.visibilityState === 'visible') {
      void markMessagesDelivered(selectedConversation.id);
      void markConversationRead(selectedConversation.id);
    }

    const channel = supabase.channel(`messages-${selectedConversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` }, payload => {
        const incoming = payload.new as ChatMessage;
        void (async () => {
          const { data: sender } = await supabase.from('profiles').select('nickname,avatar_url').eq('id', incoming.sender_id).maybeSingle();
          const enriched = { ...decodeChatMessage(incoming), sender_nickname: sender?.nickname || (incoming.sender_id === userId ? 'You' : 'Member'), sender_avatar_url: sender?.avatar_url || null };
          setChatMessages(old => old.some(m => m.id === enriched.id) ? old : [...old, enriched]);
          if (incoming.sender_id !== userId && document.visibilityState === 'visible') {
            void markMessagesDelivered(selectedConversation.id);
            void markConversationRead(selectedConversation.id);
          }
        })();
      })
      // Listen for inserts and updates: an existing receipt may be updated rather than inserted.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reads' }, () => {
        void loadChatMessages(selectedConversation.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_deliveries' }, () => {
        void loadChatMessages(selectedConversation.id);
      }).subscribe();

    // Recover from missed Realtime events when the browser throttles or suspends a tab.
    const refreshActiveChat = () => {
      if (document.visibilityState !== 'visible') return;
      void loadChatMessages(selectedConversation.id);
      void markMessagesDelivered(selectedConversation.id);
      void markConversationRead(selectedConversation.id);
      void loadUnreadCounts();
    };
    const refreshVisibleChat = () => {
      if (document.visibilityState !== 'visible') return;
      void loadChatMessages(selectedConversation.id);
      void markMessagesDelivered(selectedConversation.id);
      void markConversationRead(selectedConversation.id);
      void loadUnreadCounts();
    };
    window.addEventListener('focus', refreshActiveChat);
    document.addEventListener('visibilitychange', refreshActiveChat);
    const refreshInterval = window.setInterval(refreshVisibleChat, 8000);

    return () => {
      window.removeEventListener('focus', refreshActiveChat);
      document.removeEventListener('visibilitychange', refreshActiveChat);
      window.clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  
  }, [supabase, userId, selectedConversation?.id, loadChatMessages, markConversationRead, markMessagesDelivered, loadUnreadCounts]);

  function closeConversationWithMotion() {
    if (!selectedConversation || chatExiting) return;
    setChatExiting(true);
    window.setTimeout(() => {
      setSelectedConversation(null);
      setChatExiting(false);
      setReplyTo(null);
    }, 170);
  }

  function handlePageTouchStart(e: TouchEvent<HTMLElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, button, [contenteditable="true"], .rc-message-row, .rc-chat-empty, .rc-bottom-nav, .rc-modal, .rc-modal-backdrop')) {
      pageSwipeStart.current = null;
      return;
    }
    const touch = e.changedTouches[0];
    if (!touch) return;
    const inChat = Boolean(selectedConversation && target.closest('.rc-chat-panel'));
    pageSwipeStart.current = { x: touch.clientX, y: touch.clientY, kind: inChat ? 'chat' : 'page' };
  }

  function handlePageTouchEnd(e: TouchEvent<HTMLElement>) {
    const start = pageSwipeStart.current;
    pageSwipeStart.current = null;
    const touch = e.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 75 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    if (start.kind === 'chat') {
      if (dx > 0) closeConversationWithMotion();
      return;
    }
    if (selectedConversation) return;
    const currentIndex = NAV_ITEMS.findIndex(item => item.name === tab);
    const nextIndex = dx < 0 ? Math.min(NAV_ITEMS.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
    if (nextIndex !== currentIndex) {
      setTab(NAV_ITEMS[nextIndex].name);
      setShowProfile(false);
      setShowGroup(false);
      setShowEmojiPicker(false);
    }
  }

  function openProfileEditor() {
    if (!userId) { setStatus('Sign in to create your profile.'); return; }
    setEditingProfile(profileExists);
    setShowProfile(true);
  }

  const currentNav = NAV_ITEMS.find(n => n.name === tab);
  const configured = !!supabase;
  const discoverProfiles = profiles.filter(p => {
    if (p.id === userId) return false;
    const query = discoverQuery.trim().toLocaleLowerCase();
    const searchableText = [p.nickname, p.school, p.college, p.department, p.level, p.bio]
      .filter(Boolean).join(' ').toLocaleLowerCase();
    if (query && !searchableText.includes(query)) return false;
    if (discoverFilter === 'online' && !onlineUserIds.includes(p.id)) return false;
    if (discoverFilter === 'school') {
      const mySchool = profileForm.school.trim().toLocaleLowerCase();
      if (!mySchool || (p.school || '').trim().toLocaleLowerCase() !== mySchool) return false;
    }
    return true;
  });

  return <main className="rc-shell" onTouchStart={handlePageTouchStart} onTouchEnd={handlePageTouchEnd}>
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

      {tab === 'Messages' && <section className={`rc-messages-layout ${selectedConversation ? 'has-chat' : ''} ${chatExiting ? 'chat-exiting' : ''}`}>
        <aside className="rc-conversation-list"><div className="rc-list-heading"><div><h2>Conversations</h2><p>Private and group chats</p></div><button type="button" className="rc-icon-btn rc-notification-toggle" onClick={() => void enableMessageNotifications()} title="Enable message notifications" aria-label="Enable message notifications"><Bell size={17}/></button></div>
          {conversationList.map(convo => <button key={convo.id} className={`rc-conversation-row ${selectedConversation?.id === convo.id ? 'active' : ''}`} onClick={() => { setSelectedConversation(convo); void markConversationRead(convo.id); setReplyTo(null); }}><span className="rc-conversation-avatar">{convo.avatarUrl ? <img src={convo.avatarUrl} alt=""/> : convo.kind === 'group' ? <Users size={20}/> : <MessageCircle size={20}/>}</span><span className="rc-conversation-copy"><strong>{convo.title}</strong><small>{convo.kind === 'group' ? 'Group conversation' : 'Private conversation'}</small></span>{(unreadCounts[convo.id] || 0) > 0 && <span className="rc-unread-badge">{unreadCounts[convo.id] > 99 ? '99+' : unreadCounts[convo.id]}</span>}</button>)}
          {conversationList.length === 0 && <div className="rc-empty-conversations"><div className="rc-empty-icon"><MessageCircle size={27}/></div><strong>Your Conversations Will Appear Here.</strong><p>Accept a message request to start a private conversation.</p><button className="rc-text-btn" onClick={() => { setTab('Requests'); void loadIncomingRequests(); }}>View requests <Bell size={14}/></button></div>}
        </aside>
        <section className="rc-chat-panel">
          {selectedConversation ? <><header className="rc-chat-header"><button className="rc-icon-btn rc-back-chat" onClick={closeConversationWithMotion} aria-label="Back to conversations"><ArrowLeft size={19}/></button><div className="rc-conversation-avatar rc-chat-header-avatar">{selectedConversation.avatarUrl ? <img src={selectedConversation.avatarUrl} alt=""/> : selectedConversation.kind === 'group' ? <Users size={20}/> : <MessageCircle size={20}/>}</div><div><strong>{selectedConversation.title}</strong><small>{selectedConversation.kind === 'group' ? 'Group conversation' : 'Private conversation'}</small></div></header><div ref={chatMessagesRef} onScroll={handleChatScroll} className="rc-chat-empty" style={{display:'flex', flexDirection:'column', alignItems:'stretch', gap:'12px', overflowY:'auto', justifyContent: chatMessages.length ? 'flex-start' : 'center'}}>{chatMessages.length === 0 ? <><MessageCircle size={28}/><strong>Your chat starts here</strong><p>Send the first message to begin.</p></> : chatMessages.map(message => {
          const mine = message.sender_id === userId;
          const groupChat = selectedConversation.kind === 'group';
          const senderName = mine ? 'You' : `@${message.sender_nickname || 'Member'}`;
          return <div key={message.id} onTouchStart={e => { touchStartX.current[message.id] = e.changedTouches[0]?.clientX ?? 0; setDraggingMessageId(message.id); }} onTouchMove={e => { const start = touchStartX.current[message.id]; const current = e.changedTouches[0]?.clientX ?? start; if (start !== undefined) setDragOffsets(old => ({...old, [message.id]: Math.max(0, Math.min(72, current - start))})); }} onTouchEnd={e => { const start = touchStartX.current[message.id]; const end = e.changedTouches[0]?.clientX ?? start; if (start !== undefined && end - start > 55) setReplyTo(message); delete touchStartX.current[message.id]; setDraggingMessageId(null); setDragOffsets(old => ({...old, [message.id]: 0})); }} onDoubleClick={() => setReplyTo(message)} title="Swipe right to reply" className={`rc-message-row ${mine ? 'rc-message-mine' : 'rc-message-other'} ${groupChat ? 'rc-message-group' : 'rc-message-private'}`}>
            {!mine && <span className="rc-message-avatar">{message.sender_avatar_url ? <img src={message.sender_avatar_url} alt=""/> : (message.sender_nickname?.[0] || 'M').toUpperCase()}</span>}
            <div className={`rc-message-bubble ${mine ? 'mine' : 'other'} ${draggingMessageId === message.id ? 'rc-message-dragging' : ''}`} style={{transform: `translateX(${dragOffsets[message.id] || 0}px)`, transition: draggingMessageId === message.id ? 'none' : 'transform 180ms ease-out'}}>
              {groupChat && <strong className="rc-message-sender" style={{color: mine ? '#ffffff' : nicknameColor(message.sender_id)}}>{senderName}</strong>}
              {message.reply_to && <div className="rc-replied-message"><strong style={{color: nicknameColor(message.reply_to.sender_id)}}>{message.reply_to.sender_id === userId ? 'You' : '@' + message.reply_to.sender_nickname}</strong><span>{message.reply_to.body.slice(0, 220)}{message.reply_to.body.length > 220 ? '…' : ''}</span></div>}
              <div className="rc-message-body">{message.body}</div>
              
              <small className="rc-message-time">
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {mine && !groupChat && (
                  <span
                    title={
  (message.read_by || []).some(id => id !== userId)
    ? 'Read'
    : (message.delivered_by || []).some(id => id !== userId)
      ? 'Delivered'
      : 'Sent'
                    }
                    aria-label={
  (message.read_by || []).some(id => id !== userId)
    ? 'Read'
    : (message.delivered_by || []).some(id => id !== userId)
      ? 'Delivered'
      : 'Sent'
                    }
                    style={{
                      marginLeft: '5px',
                      fontWeight: 700,
                      color: (message.read_by || []).some(id => id !== userId)
                        ? '#facc15'
                        : '#9ca3af'
                    }}
                  >
                    {(message.read_by || []).some(id => id !== userId)
  ? '✓✓'
  : (message.delivered_by || []).some(id => id !== userId)
    ? '✓✓'
    : '✓'}
                  </span>
                )}
              </small>

            </div>
            {mine && !groupChat && <span className="rc-message-avatar">{message.sender_avatar_url ? <img src={message.sender_avatar_url} alt=""/> : (message.sender_nickname?.[0] || 'Y').toUpperCase()}</span>}
          </div>;
        })}</div>{showScrollToLatest && <button type="button" className="rc-scroll-latest" onClick={() => scrollChatToLatest('smooth')} aria-label="Scroll to latest message" title="Latest message"><ArrowDown size={20}/></button>}<div className="rc-composer-wrap">{replyTo && <div className="rc-reply-preview"><div><strong>Replying to {replyTo.sender_id === userId ? 'yourself' : '@' + (replyTo.sender_nickname || 'Member')}</strong><small>{replyTo.body.slice(0, 110)}{replyTo.body.length > 110 ? '…' : ''}</small></div><button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={16}/></button></div>}<div className="rc-composer"><button className="rc-emoji-toggle" onClick={() => setShowEmojiPicker(v=>!v)} aria-label="Open emoji picker"><Smile size={22}/></button><input name="chat-message" type="text" autoComplete="off" autoCorrect="on" autoCapitalize="sentences" spellCheck={true} inputMode="text" enterKeyHint="send" data-form-type="other" data-lpignore="true" value={draftMessage} onChange={e=>setDraftMessage(e.target.value)} onFocus={e=>{ window.setTimeout(() => e.currentTarget.scrollIntoView({block:'nearest',behavior:'smooth'}), 180); }} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void sendDraft();}}} placeholder="Write a message…" aria-label="Message"/><button className="rc-send-btn" onClick={() => void sendDraft()} disabled={!draftMessage.trim() || sendingMessage} aria-label="Send message"><Send size={18}/></button></div>{showEmojiPicker && <div className="rc-emoji-grid">{EMOJIS.map((emoji, i)=><button key={`${emoji}-${i}`} onClick={() => { setDraftMessage(v=>v+emoji); setShowEmojiPicker(false); }} aria-label={`Add ${emoji}`}>{emoji}</button>)}</div>}</div></> : <div className="rc-chat-no-selection"><div className="rc-chat-big-icon"><MessageCircle size={35}/><Wifi size={16}/></div><h2>Select a conversation</h2><p>Choose a person or group to open your chat.</p></div>}
        </section>
      </section>}

      {tab === 'Discover' && <section className="rc-content-section"><div className="rc-section-title"><div><h2>People you may know</h2><p>Search members and find people from your community.</p></div><button className="rc-text-btn" onClick={() => void refreshCommunity()}>Refresh <RefreshCw size={14}/></button></div>
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:12,marginBottom:20}}>
          <label style={{display:'flex',alignItems:'center',gap:10,background:'#12141c',border:'1px solid #292d3a',borderRadius:14,padding:'0 14px',minHeight:48}}>
            <Search size={18} color="#9ca4b8"/>
            <input aria-label="Search members" type="search" enterKeyHint="search" autoComplete="off" value={discoverQuery} onChange={e => setDiscoverQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} placeholder="Search nickname, school, college, department or bio…" style={{width:'100%',minWidth:0,background:'transparent',border:0,outline:'none',color:'#f7f8fc',padding:'14px 0'}}/>
            {discoverQuery && <button type="button" className="rc-icon-btn" aria-label="Clear search" onClick={() => setDiscoverQuery('')}><X size={15}/></button>}
          </label>
          <div role="group" aria-label="Filter members" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button type="button" className={discoverFilter === 'all' ? 'rc-primary' : 'rc-secondary'} aria-pressed={discoverFilter === 'all'} onClick={() => setDiscoverFilter('all')}>All members</button>
            <button type="button" className={discoverFilter === 'online' ? 'rc-primary' : 'rc-secondary'} aria-pressed={discoverFilter === 'online'} onClick={() => setDiscoverFilter('online')}><span style={{width:7,height:7,borderRadius:'50%',background:'#32d296',display:'inline-block'}}/> Online</button>
            <button type="button" className={discoverFilter === 'school' ? 'rc-primary' : 'rc-secondary'} aria-pressed={discoverFilter === 'school'} onClick={() => setDiscoverFilter('school')}>My school</button>
          </div>
          {discoverFilter === 'school' && !profileForm.school.trim() && <p className="rc-muted" style={{margin:0,fontSize:13}}>Add your school in My Profile to use this filter.</p>}
          <p className="rc-muted" style={{margin:0,fontSize:12}}>{discoverProfiles.length} member{discoverProfiles.length === 1 ? '' : 's'} found</p>
        </div>
        {activeAds.length > 0 && <section className="rc-ad-feed" aria-label="Sponsored community announcements"><div className="rc-section-title"><div><h2>Community spotlight</h2><p>Promotions and announcements</p></div></div><div className="rc-people-grid">{activeAds.map(ad => <article className="rc-person-card rc-ad-card" key={ad.id}><span className="rc-eyebrow">SPONSORED</span><h3>{ad.title}</h3>{ad.media_type === 'image' ? <img src={ad.media_path} alt={ad.title} style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:12}}/> : <video src={ad.media_path} controls playsInline style={{width:'100%',maxHeight:220,borderRadius:12}}/>}{ad.target_url && <a href={ad.target_url} target="_blank" rel="noreferrer" className="rc-primary">Learn more</a>}<small>Expires {new Date(ad.expires_at).toLocaleDateString()}</small></article>)}</div></section>}
        <div className="rc-people-grid">{discoverProfiles.map(p => <article className="rc-person-card rc-discover-person" key={p.id}><div className="rc-discover-main"><div className="rc-person-top"><div className="rc-avatar rc-avatar-large">{p.avatar_url ? <img src={p.avatar_url} alt=""/> : p.nickname?.[0]?.toUpperCase() || 'M'}</div></div><div className="rc-discover-details"><h3>@{p.nickname} {onlineUserIds.includes(p.id) && <span title="Online now" aria-label="Online now" style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#32d296',verticalAlign:'middle',marginLeft:5}}/>}</h3><p className="rc-discover-level-college">{[p.level, p.college].filter(Boolean).join(' · ') || 'Community member'}</p><small>{p.school || 'School not listed'}</small>{p.premium_status === 'active' && <span className="rc-premium-badge"><Crown size={10}/> PREMIUM</span>}</div></div><div className="rc-person-footer"><span><Zap size={13}/> {Math.floor((p.total_online_seconds || 0) / 3600)}h online</span><button className="rc-primary rc-connect" onClick={() => void sendRequest(p.id)}>Connect <Plus size={15}/></button></div></article>)}</div>
        {discoverProfiles.length === 0 && <div className="rc-empty-state"><div className="rc-empty-icon"><Users size={27}/></div><h2>{discoverQuery || discoverFilter !== 'all' ? 'No matching members' : 'No people to show yet'}</h2><p>{discoverQuery || discoverFilter !== 'all' ? 'Try a different search or filter. Search currently checks the members loaded by Discover.' : 'New members will appear here when they create a profile.'}</p>{!profileExists && <button className="rc-primary" onClick={openProfileEditor}>Create profile <Plus size={16}/></button>}{(discoverQuery || discoverFilter !== 'all') && <button className="rc-secondary" onClick={() => { setDiscoverQuery(''); setDiscoverFilter('all'); }}>Clear search and filters</button>}</div>}
      </section>}

      {tab === 'Groups' && <section className="rc-content-section"><div className="rc-section-title"><div><h2>Groups</h2><p>Spaces for courses, clubs and shared interests.</p></div></div><div className="rc-group-list">{groups.map(g => <div className="rc-group-row-wrap" key={g.id}><button className="rc-group-row" onClick={() => { void (async () => { if (!supabase) return; if (!g.conversation_id) { setStatus('This group does not have a chat yet. Ask its owner to recreate it after the SQL migration.'); return; } const { data: conversationId, error } = await supabase.rpc('join_group_with_conversation', { p_group_id: g.id }); if (error) { setStatus(`Could not join group: ${error.message}`); return; } setSelectedConversation({id: conversationId || g.conversation_id!, title:g.name,kind:'group'}); setTab('Messages'); await loadConversations(); })(); }}><span className="rc-group-icon">{g.avatar_url ? <img src={g.avatar_url} alt=""/> : <Users size={22}/>}</span><span className="rc-group-info"><strong>{g.name}</strong><small>MR RICH CONNECT community</small></span><span className="rc-arrow">→</span></button>{(g.created_by === userId || isAdmin) && <label className="rc-edit-group-avatar"><Pencil size={14}/><span>Change image</span><input type="file" accept="image/*" style={{display:'none'}} onChange={e => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ''; void changeExistingGroupAvatar(g, file); }}/></label>}</div>)}</div>{groups.length === 0 && <div className="rc-empty-state"><div className="rc-empty-icon"><Users size={27}/></div><h2>No groups yet</h2><p>Create the first group for your community.</p><button className="rc-primary" onClick={() => setShowGroup(true)}><Plus size={16}/> Create group</button></div>}</section>}

      {tab === 'Requests' && <section className="rc-content-section"><div className="rc-section-title"><div><h2>Message requests</h2><p>Accept a request to open a private conversation.</p></div><button className="rc-text-btn" onClick={() => void loadIncomingRequests()}><RefreshCw size={14}/> Refresh</button></div>
        {incomingRequests.length > 0 ? <div className="rc-group-list">{incomingRequests.map(request => <article className="rc-person-card rc-request-slim" key={request.id}><div className="rc-request-top"><div className="rc-avatar rc-avatar-large">{request.sender_nickname[0]?.toUpperCase() || 'M'}</div><div className="rc-request-details"><h3>@{request.sender_nickname}</h3><p>Wants to start a private conversation.</p><small>{new Date(request.created_at).toLocaleDateString()}</small></div></div><div className="rc-request-actions"><button className="rc-secondary" disabled={requestBusy === request.id} onClick={() => void respondToRequest(request.id, 'decline')}>Decline</button><button className="rc-primary" disabled={requestBusy === request.id} onClick={() => void respondToRequest(request.id, 'accept')}>{requestBusy === request.id ? 'Please wait…' : 'Accept'}</button></div></article>)}</div> : <div className="rc-empty-state"><div className="rc-empty-icon"><Bell size={27}/></div><h2>{requests ? `${requests} pending request${requests === 1 ? '' : 's'}` : 'No new requests'}</h2><p>{requests ? 'A request exists, but the request details could not be loaded. Check the status message above and your Supabase policies.' : 'When someone sends you a message request, it will appear here.'}</p><button className="rc-secondary" onClick={() => void loadIncomingRequests()}><RefreshCw size={15}/> Refresh requests</button></div>}</section>}

      {tab === 'My Profile' && <section className="rc-profile-page">{profileExists ? <><div className="rc-profile-card"><label className="rc-profile-avatar-click" title="Change profile photo"><span className="rc-profile-avatar">{profileForm.avatar_url ? <img src={profileForm.avatar_url} alt="Your profile avatar"/> : nickname?.[0]?.toUpperCase() || <UserRound size={36}/>}<i><Pencil size={14}/></i></span><input className="rc-hidden-file" type="file" accept="image/*" onChange={e => void uploadAvatar(e.target.files?.[0])} disabled={avatarUploading}/></label><span className="rc-eyebrow">COMMUNITY PROFILE</span><h2>@{nickname}</h2><p>{[profileForm.level, profileForm.college].filter(Boolean).join(' · ') || 'Community member'}</p><p>{profileForm.school || 'School not listed'}</p><button className="rc-primary" onClick={() => { setEditingProfile(true); setShowProfile(true); }}><Pencil size={16}/> Edit profile</button></div><div className="rc-privacy-card"><ShieldCheck size={20}/><div><strong>Your information stays private</strong><p>Your name, phone number, department and email aren't shown on your public profile.</p></div></div></> : <div className="rc-empty-state"><div className="rc-empty-icon"><UserRound size={27}/></div><h2>Create your profile</h2><p>Choose a nickname and add your school details to join the community.</p><button className="rc-primary" onClick={openProfileEditor}>Create profile <Plus size={16}/></button></div>}{<section className="rc-content-section rc-online-rankings"><div className="rc-section-title"><div><h2>Community rankings</h2><p>Members ranked by recorded online hours.</p></div></div><div className="rc-group-list">{[...profiles].sort((a,b)=>(b.total_online_seconds||0)-(a.total_online_seconds||0)).slice(0,5).map((p,i)=><div className="rc-group-row" key={p.id}><span className="rc-group-icon">#{i+1}</span><span className="rc-group-info"><strong>@{p.nickname}{p.premium_status === 'active' ? ' ★' : ''}</strong><small>{p.premium_status === 'active' && p.premium_title ? p.premium_title : 'Community member'}</small></span><span className="rc-arrow">{Math.floor((p.total_online_seconds||0)/3600)}h</span></div>)}</div></section>}</section>}
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
    <style jsx global>{`
      @keyframes rc-page-swipe-in { from { opacity: .55; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes rc-chat-swipe-in { from { opacity: .55; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes rc-chat-swipe-out { from { opacity: 1; transform: translateX(0); } to { opacity: .5; transform: translateX(42px); } }
      .rc-content-section, .rc-profile-page, .rc-messages-layout { animation: rc-page-swipe-in 190ms cubic-bezier(.2,.75,.25,1) both; }
      .rc-messages-layout.has-chat .rc-chat-panel { animation: rc-chat-swipe-in 190ms cubic-bezier(.2,.75,.25,1) both; }
      .rc-messages-layout.chat-exiting .rc-chat-panel { animation: rc-chat-swipe-out 160ms ease-in both; pointer-events: none; }
      .rc-person-card, .rc-group-row-wrap, .rc-request-card, .rc-conversation-row, .rc-primary, .rc-secondary, .rc-icon-btn, .rc-bottom-item { transition: transform 150ms ease, border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease; }
      .rc-person-card:active, .rc-group-row-wrap:active, .rc-request-card:active, .rc-conversation-row:active, .rc-primary:active, .rc-secondary:active, .rc-icon-btn:active, .rc-bottom-item:active { transform: scale(.985); }
      .rc-shell { touch-action: pan-y; }
      @media (prefers-reduced-motion: reduce) { .rc-content-section, .rc-profile-page, .rc-messages-layout, .rc-messages-layout.has-chat .rc-chat-panel, .rc-messages-layout.chat-exiting .rc-chat-panel { animation: none !important; transition: none !important; } }
    `}</style>
  </main>;
}
