'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, TouchEvent } from 'react';
import { createClient } from '../lib/supabase';
import {
  Bell, Crown, Hash, LogIn, LogOut, MessageCircle, Search, ShieldCheck,
  Users, UserRound, Wifi, Pencil, Plus, Send, Smile, ArrowLeft, RefreshCw,
  X, Sparkles, Zap, ArrowDown, Store, Settings, Check,
  Mic, Square, Play, Pause, AudioLines, Trash2
} from 'lucide-react';
const NIGERIAN_SCHOOLS = [
  'Abia State University','Abubakar Tafawa Balewa University','Achievers University','Adekunle Ajasin University','Adeleke University','Admiralty University of Nigeria','Ahmadu Bello University','Ajayi Crowther University','Akwa Ibom State University','Al-Hikmah University','Ambrose Alli University','American University of Nigeria','Anchor University','Arthur Jarvis University','Atiba University','Augustine University','Babcock University','Bauchi State University','Bayero University Kano','Baze University','Bells University of Technology','Benson Idahosa University','Benue State University','Bingham University','Bowen University','Caleb University','Caritas University','Chrisland University','Christopher University','Clifford University','Coal City University','Covenant University','Crawford University','Crescent University','Delta State University','Dennis Osadebay University','Dominican University','Ebonyi State University','Edo State University Uzairue','Edwin Clark University','Ekiti State University','Elizade University','Evangel University','Federal University Gashua','Federal University Gusau','Federal University Kashere','Federal University Lafia','Federal University Lokoja','Federal University Otuoke','Federal University Oye-Ekiti','Federal University of Agriculture Abeokuta','Federal University of Technology Akure','Federal University of Technology Minna','Federal University of Technology Owerri','Federal University Dutse','Federal University Birnin Kebbi','Federal University Dutsin-Ma','Federal University Wukari','Fountain University','Godfrey Okoye University','Gombe State University','Gregory University','Hallmark University','Hezekiah University','Ibrahim Badamasi Babangida University','Igbinedion University','Ignatius Ajuru University of Education','Imo State University','Joseph Ayo Babalola University','Kaduna State University','Kano University of Science and Technology','Kebbi State University of Science and Technology','Kings University','Kogi State University','KolaDaisi University','Kwara State University','Lagos State University','Lagos State University of Education','Landmark University','Lead City University','Madonna University','McPherson University','Michael and Cecilia Ibru University','Michael Okpara University of Agriculture','Modibbo Adama University','Mountain Top University','Nasarawa State University','National Open University of Nigeria','Niger Delta University','Nigerian Army University Biu','Nigerian Defence Academy','Nile University of Nigeria','Nnamdi Azikiwe University','Northwest University Kano','Novena University','Obafemi Awolowo University','Oduduwa University','Olabisi Onabanjo University','Ondo State University of Medical Sciences','Osun State University','Pan-Atlantic University','Paul University','Plateau State University','Redeemer’s University','Renaissance University','Rhema University','Ritman University','Rivers State University','Salem University','Samuel Adegboyega University','Skyline University Nigeria','Sokoto State University','Southwestern University Nigeria','Spiritan University','Summit University','Tai Solarin University of Education','Tansian University','Taraba State University','The University of Africa Toru-Orua','Thomas Adewumi University','Umaru Musa Yar’Adua University','University of Abuja','University of Benin','University of Calabar','University of Cross River State','University of Ibadan','University of Ilorin','University of Jos','University of Lagos','University of Maiduguri','University of Mkar','University of Nigeria Nsukka','University of Port Harcourt','University of Uyo','Usmanu Danfodiyo University','Veritas University','Wellspring University','Wesley University','Western Delta University','Yobe State University','Adamawa State Polytechnic','Auchi Polytechnic','Abia State Polytechnic','Abubakar Tatari Ali Polytechnic','Akanu Ibiam Federal Polytechnic Unwana','Akwa Ibom State Polytechnic','Benue State Polytechnic','Delta State Polytechnic Otefe-Oghara','Delta State Polytechnic Ogwashi-Uku','Edo State Polytechnic Usen','Federal Polytechnic Ado-Ekiti','Federal Polytechnic Bauchi','Federal Polytechnic Bida','Federal Polytechnic Damaturu','Federal Polytechnic Ede','Federal Polytechnic Idah','Federal Polytechnic Ilaro','Federal Polytechnic Kaura Namoda','Federal Polytechnic Mubi','Federal Polytechnic Nasarawa','Federal Polytechnic Nekede','Federal Polytechnic Offa','Federal Polytechnic Oko','Federal Polytechnic Ukana','Gateway ICT Polytechnic','Hassan Usman Katsina Polytechnic','Imo State Polytechnic','Institute of Management and Technology Enugu','Kaduna Polytechnic','Kano State Polytechnic','Kwara State Polytechnic','Lagos State Polytechnic','Moshood Abiola Polytechnic','Niger State Polytechnic','Nuhu Bamalli Polytechnic','Ogun State Institute of Technology','Osun State Polytechnic Iree','Plateau State Polytechnic','Ramat Polytechnic','Rivers State Polytechnic','The Polytechnic Ibadan','Yaba College of Technology','Adeyemi College of Education','Alvan Ikoku Federal College of Education','College of Education Agbor','College of Education Akwanga','College of Education Ekiadolor','College of Education Gindiri','College of Education Hong','College of Education Ikere-Ekiti','College of Education Katsina-Ala','College of Education Minna','College of Education Oro','College of Education Warri','Emmanuel Alayande College of Education','Federal College of Education Abeokuta','Federal College of Education Asaba','Federal College of Education Kano','Federal College of Education Kontagora','Federal College of Education Obudu','Federal College of Education Okene','Federal College of Education Omoku','Federal College of Education Pankshin','Federal College of Education (Technical) Akoka','Federal College of Education (Technical) Bichi','Federal College of Education (Technical) Gombe','Federal College of Education (Technical) Umunze','Federal College of Education Zaria','Kashim Ibrahim College of Education','Lagos State College of Education','Nwafor Orizu College of Education','Tai Solarin College of Education','Isaac Jasper Boro College of Education'
];
const PROFILE_LEVELS = ['100','200','300','400','500','Graduate'];

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
    message_type?: 'text' | 'voice';
  media_path?: string | null;
  voice_url?: string;
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
  member_limit?: number | null;
  allowed_levels?: string[] | null;
  allowed_schools?: string[] | null;
  members_can_message?: boolean | null;
  is_premium_only?: boolean | null;
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
  lastMessagePreview?: string;
  lastMessageSenderId?: string | null;
  lastMessageRead?: boolean;
  lastMessageDelivered?: boolean;
};

const NAV_ITEMS = [
  { name: 'Messages', icon: MessageCircle, hint: 'Your Conversations Will Appear Here.' },
  { name: 'Discover', icon: Search, hint: 'Find People Online' },
  { name: 'Groups', icon: Users, hint: 'Find Your Community' },
  { name: 'Requests', icon: Bell, hint: 'Your Message Requests' },
  { name: 'My Profile', icon: UserRound, hint: 'Your Profile' },
  { name: 'Premium', icon: Crown, hint: 'Unlock Premium Membership' },
];
const EMOJIS = ['😀','😃','😄','😁','😆','😅','😂','🥹','😊','😍','🥰','😘','😎','🤔','🙌','👏','🙏','💙','❤️','🔥','✨','🎉','👍','👋','💯','😭','🤣','🤝','💬','🌟','😴','🥳'];

function getExperienceTitle(totalOnlineSeconds: number | null | undefined): string {
  const hours = Math.floor(Math.max(0, totalOnlineSeconds || 0) / 3600);
  if (hours >= 1000) return 'Odogwu';
  if (hours >= 500) return 'Chairman';
  if (hours >= 200) return 'Oga';
  if (hours >= 50) return 'Regular';
  if (hours >= 10) return 'Sharp Guy';
  return 'Newcomer';
}


function VoiceNotePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%', minWidth: 220, maxWidth: 320,
      padding: '10px 12px', borderRadius: 14,
      border: '1px solid rgba(96,165,250,.35)',
      background: 'linear-gradient(135deg,#101b35,#0b1220)',
      color: '#e2e8f0'
    }}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={e =>
          setDuration(Number.isFinite(e.currentTarget.duration)
            ? e.currentTarget.duration : 0)
        }
        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
      />

      <button
        type="button"
        onClick={() => void togglePlayback()}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        style={{
          width: 40, height: 40, flexShrink: 0,
          display: 'grid', placeItems: 'center',
          border: '1px solid #2563eb', borderRadius: '50%',
          background: '#1d4ed8', color: '#fff'
        }}
      >
        {playing
          ? <Pause size={18} fill="currentColor" />
          : <Play size={18} fill="currentColor" />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          disabled={!duration}
          aria-label="Seek voice note"
          onChange={e => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.currentTime = Number(e.currentTarget.value);
            setCurrentTime(audio.currentTime);
          }}
          style={{
            width: '100%', display: 'block',
            accentColor: '#60a5fa'
          }}
        />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          color: '#93c5fd', fontSize: 11,
          fontVariantNumeric: 'tabular-nums'
        }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <AudioLines size={18} color="#60a5fa" />
    </div>
  );
}


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
  const [sentRequestRecipientIds, setSentRequestRecipientIds] = useState<string[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [requestBusy, setRequestBusy] = useState<string | null>(null);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([]);
  const [activeAds, setActiveAds] = useState<AdCampaign[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupAvatarUrl, setGroupAvatarUrl] = useState('');
  const [groupAvatarUploading, setGroupAvatarUploading] = useState(false);
  const [profileForm, setProfileForm] = useState({ nickname: '', level: '', college: '', school: '', department: '', bio: '', avatar_url: '', full_name: '', phone: '', premium_title: '' });
  const [profileExists, setProfileExists] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [settingsGroup, setSettingsGroup] = useState<CommunityGroup | null>(null);
  const [groupSettingsForm, setGroupSettingsForm] = useState({ member_limit: 'unlimited', allowed_levels: [] as string[], allowed_schools: [] as string[], members_can_message: true });
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
   const [hideActionsConversationId, setHideActionsConversationId] = useState<string | null>(null);
  const [messageActionsMessageId, setMessageActionsMessageId] = useState<string | null>(null);
  const conversationHoldTimer = useRef<number | null>(null);
  const messageHoldTimer = useRef<number | null>(null);
  const suppressConversationClick = useRef(false);
  const [chatExiting, setChatExiting] = useState(false);
  const pageSwipeStart = useRef<{ x: number; y: number; kind: 'page' | 'chat' } | null>(null);
  const [pageSwipeOffset, setPageSwipeOffset] = useState(0);
  const [pageSwipeAnimating, setPageSwipeAnimating] = useState(false);
  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  // Keep recently opened conversations in memory so returning to a chat feels instant.
  const chatMessageCache = useRef<Record<string, ChatMessage[]>>({});
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
 const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
const [editMessageText, setEditMessageText] = useState('');
const [savingEdit, setSavingEdit] = useState(false);
  const touchStartX = useRef<Record<string, number>>({});
  const [draggingMessageId, setDraggingMessageId] = useState<string | null>(null);
  const [dragOffsets, setDragOffsets] = useState<Record<string, number>>({});
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
const [voiceUrls, setVoiceUrls] = useState<Record<string, string>>({});
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
const voiceStreamRef = useRef<MediaStream | null>(null);
const voiceChunksRef = useRef<Blob[]>([]);
    const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const [voicePreviewBlob, setVoicePreviewBlob] = useState<Blob | null>(null);
  const [voicePreviewDuration, setVoicePreviewDuration] = useState(0);
  const [draftMessage, setDraftMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [premiumBusy, setPremiumBusy] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [groupSchoolSearch, setGroupSchoolSearch] = useState('');
  const [marketplacePosition, setMarketplacePosition] = useState<{ x: number; y: number } | null>(null);
  const marketplaceDrag = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const marketplaceWasDragged = useRef(false);

  // Keep the mobile chat aligned with the visible viewport when the keyboard opens.
  const internalHistoryRef = useRef<Array<{ tab: string; conversationId: string | null }>>([]);
  const conversationListRef = useRef<Conversation[]>([]);
  conversationListRef.current = conversationList;
  const internalHistorySignatureRef = useRef('');
  const skipInternalHistoryPushRef = useRef(false);

  useEffect(() => {
    const currentSignature = `${tab}|${selectedConversation?.id || ''}`;
    internalHistoryRef.current = [{ tab, conversationId: selectedConversation?.id || null }];
    internalHistorySignatureRef.current = currentSignature;
    window.history.pushState({ mrRichConnectInternal: true }, '', window.location.href);

    const handleBack = () => {
      const stack = internalHistoryRef.current;
      if (stack.length > 1) stack.pop();
      else stack[0] = { tab: 'Messages', conversationId: null };
      const previous = stack[stack.length - 1] || { tab: 'Messages', conversationId: null };
      const targetSignature = `${previous.tab}|${previous.conversationId || ''}`;
      skipInternalHistoryPushRef.current = targetSignature !== internalHistorySignatureRef.current;
      if (previous.conversationId) {
        const previousConversation = conversationListRef.current.find(item => item.id === previous.conversationId);
        if (previousConversation) {
          setTab('Messages');
          setSelectedConversation(previousConversation);
        } else {
          setSelectedConversation(null);
          setTab(previous.tab || 'Messages');
        }
      } else {
        setSelectedConversation(null);
        setTab(previous.tab || 'Messages');
      }
      setShowProfile(false);
      setShowGroup(false);
      setShowEmojiPicker(false);
      setMarketplaceOpen(false);
      setHideActionsConversationId(null);
      setMessageActionsMessageId(null);
      window.history.pushState({ mrRichConnectInternal: true }, '', window.location.href);
    };
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  // Install once; the history handler reads current navigation from the refs below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const signature = `${tab}|${selectedConversation?.id || ''}`;
    if (skipInternalHistoryPushRef.current) {
      skipInternalHistoryPushRef.current = false;
      internalHistorySignatureRef.current = signature;
      return;
    }
    if (signature === internalHistorySignatureRef.current) return;
    internalHistorySignatureRef.current = signature;
    internalHistoryRef.current.push({ tab, conversationId: selectedConversation?.id || null });
    window.history.pushState({ mrRichConnectInternal: true }, '', window.location.href);
  }, [tab, selectedConversation?.id]);

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

  function formatConversationTimestamp(value?: string | null) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
      const { data: sentRequests } = await supabase.from('message_requests')
        .select('recipient_id,status').eq('sender_id', userId);
      setSentRequestRecipientIds([...new Set((sentRequests || []).filter((item: {recipient_id: string; status: string | null}) => item.status !== 'declined').map((item: {recipient_id: string}) => item.recipient_id))]);
    } else {
      setSentRequestRecipientIds([]);
    }
    const { data: grp } = await supabase.from('groups').select('id,name,conversation_id,avatar_url,created_by,member_limit,allowed_levels,allowed_schools,members_can_message').limit(30);
    if (grp) setGroups(grp as CommunityGroup[]);
    if (userId) {
      const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', userId);
      setJoinedGroupIds([...new Set((memberships ?? []).map((row: { group_id: string }) => row.group_id))]);
    } else {
      setJoinedGroupIds([]);
    }
    const { data: ads } = await supabase.from('ad_campaigns').select('id,title,media_type,media_path,target_url,expires_at').eq('is_enabled', true).lte('starts_at', new Date().toISOString()).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(5);
    if (ads) setActiveAds(ads as AdCampaign[]);
  }, [supabase, userId]);

  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase
      .channel(`rc-groups-live-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, payload => {
        const updated = (payload.new || payload.old) as Partial<CommunityGroup> | undefined;
        if (!updated?.id) {
          void refreshCommunity();
          return;
        }
        setGroups(current => {
          if (payload.eventType === 'DELETE') return current.filter(group => group.id !== updated.id);
          const next = payload.new as CommunityGroup;
          const index = current.findIndex(group => group.id === next.id);
          if (index < 0) return [...current, next];
          return current.map(group => group.id === next.id ? { ...group, ...next } : group);
        });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, userId, refreshCommunity]);

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
      setProfileForm({ nickname: data.nickname ?? '', level: data.level ?? '', college: data.college ?? '', school: data.school ?? '', department: data.department ?? '', bio: data.bio ?? '', avatar_url: data.avatar_url ?? '', full_name: privateData?.full_name ?? '', phone: privateData?.phone ?? '', premium_title: data.premium_title ?? '' });
    } else {
      setProfileExists(false);
      setNickname('');
      setProfileForm({ nickname: '', level: '', college: '', school: '', department: '', bio: '', avatar_url: '', full_name: '', phone: '', premium_title: '' });
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
      setOnlineUserIds([]);
      return;
    }

    let active = true;
    let pulseInProgress = false;

    const HEARTBEAT_INTERVAL_MS = 30_000;
    const ONLINE_WINDOW_MS = 90_000;

    const sendHeartbeat = async () => {
      const isVisible = document.visibilityState === 'visible';

      const { error } = await supabase.rpc('heartbeat_user_presence', {
        p_is_visible: isVisible,
      });

      if (error) {
        console.warn('Could not update online heartbeat:', error.message);
      }
    };

    const refreshOnlineCount = async () => {
      const cutoff = new Date(
        Date.now() - ONLINE_WINDOW_MS
      ).toISOString();

      const { data, error } = await supabase
        .from('user_presence')
        .select('user_id,last_seen_at,is_visible')
        .eq('is_visible', true)
        .gte('last_seen_at', cutoff);

      if (error) {
        console.warn('Could not refresh online count:', error.message);
        return;
      }

      if (!active) return;

      const uniqueUsers = new Set(
        (data ?? []).map(row => row.user_id).filter(Boolean)
      );

      setOnlineUserIds([...uniqueUsers]);
      setOnlineCount(uniqueUsers.size);
    };

    const pulse = async () => {
      if (!active || pulseInProgress) return;

      pulseInProgress = true;

      try {
        await sendHeartbeat();
        await refreshOnlineCount();
      } finally {
        pulseInProgress = false;
      }
    };

    // Immediately report whether this tab is visible.
    void pulse();

    const intervalId = window.setInterval(() => {
      void pulse();
    }, HEARTBEAT_INTERVAL_MS);

    const refreshOnVisibilityChange = () => {
      // Report both transitions: visible and hidden.
      void pulse();
    };

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        void pulse();
      }
    };

    document.addEventListener(
      'visibilitychange',
      refreshOnVisibilityChange
    );

    window.addEventListener('focus', refreshOnFocus);

    return () => {
      active = false;
      window.clearInterval(intervalId);

      document.removeEventListener(
        'visibilitychange',
        refreshOnVisibilityChange
      );

      window.removeEventListener('focus', refreshOnFocus);
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
  async function startPremiumPayment() {
    if (!supabase || !userId) { setStatus('Sign in before purchasing Premium.'); return; }
    setPremiumBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Your sign-in session expired. Sign in again.');
      const response = await fetch('/api/premium/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error || 'Could not start Premium payment.');
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not start Premium payment.');
      setPremiumBusy(false);
    }
  }

  useEffect(() => {
    if (!supabase || !userId || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('premium') !== 'payment') return;
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) {
      setStatus('Payment return received, but no payment reference was provided.');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('Sign in again to verify your payment.');
        const response = await fetch('/api/premium/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reference }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) throw new Error(result.error || 'Payment verification failed.');
        if (cancelled) return;
        setStatus('Payment verified! Your Premium membership is active.');
        await loadProfile(userId);
      } catch (error) {
        if (!cancelled) setStatus(error instanceof Error ? error.message : 'Payment verification failed. If you paid, contact support.');
      } finally {
        if (!cancelled) {
          const url = new URL(window.location.href);
          url.searchParams.delete('premium');
          url.searchParams.delete('reference');
          url.searchParams.delete('trxref');
          window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [supabase, userId, loadProfile]);

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setStatus('Signed out.'); setTab('Messages'); setSelectedConversation(null);
  }
  async function saveProfile(e?: FormEvent) {
    e?.preventDefault();
    if (!supabase || !userId) { setStatus('Sign in before creating a profile.'); return; }
    const clean = profileForm.nickname.trim().replace(/^@/, '');
    if (!clean) { setStatus('Choose a nickname first.'); return; }
    const isPremium = profiles.find(p => p.id === userId)?.premium_status === 'active';
    const { error } = await supabase.from('profiles').upsert({ id: userId, nickname: clean, level: profileForm.level || null, college: profileForm.college || null, school: profileForm.school || null, department: profileForm.department || null, bio: profileForm.bio || null, avatar_url: profileForm.avatar_url || null, premium_title: isPremium ? (profileForm.premium_title.trim().slice(0, 40) || null) : null });
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
    if (error) { setStatus(error.message); return; }
    setSentRequestRecipientIds(old => old.includes(recipient) ? old : [...old, recipient]);
    setStatus('Message request sent. You can chat after it is accepted.');
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


  function openGroupSettings(group: CommunityGroup) {
    setSettingsGroup(group);
    setGroupSchoolSearch('');
    setGroupSettingsForm({
      member_limit: group.member_limit ? String(group.member_limit) : 'unlimited',
      allowed_levels: group.allowed_levels ?? [],
      allowed_schools: group.allowed_schools ?? [],
      members_can_message: group.members_can_message !== false
    });
  }

  async function saveGroupSettings(e: FormEvent) {
    e.preventDefault();
    const group = settingsGroup;
    if (!group || !supabase || (group.created_by !== userId && !isAdmin)) return;
    const memberLimit = groupSettingsForm.member_limit === 'unlimited' ? null : Number(groupSettingsForm.member_limit);
    const settings = {
      member_limit: memberLimit,
      allowed_levels: groupSettingsForm.allowed_levels,
      allowed_schools: groupSettingsForm.allowed_schools,
      members_can_message: groupSettingsForm.members_can_message
    };
    const { error } = await supabase.from('groups').update(settings).eq('id', group.id);
    if (error) {
      setStatus(`Could not save group settings: ${error.message}. If these columns are missing, run the supplied SQL migration first.`);
      return;
    }
    setGroups(old => old.map(g => g.id === group.id ? { ...g, ...settings } : g));
    setSettingsGroup(null);
    setStatus('Group settings saved. Join restrictions also need the matching database join-function update to be enforced securely.');
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
    if (memberError) {
      setStatus(`Could not load conversations: ${memberError.message}`);
      return;
    }

    const { data: hiddenRows, error: hiddenError } = await supabase
      .from('hidden_conversations')
      .select('conversation_id')
      .eq('user_id', userId);

    if (hiddenError) {
      setStatus(`Could not load hidden conversations: ${hiddenError.message}`);
      return;
    }

    const hiddenIds = new Set