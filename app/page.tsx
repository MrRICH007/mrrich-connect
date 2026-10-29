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

    const hiddenIds = new Set(
      (hiddenRows ?? []).map((row: { conversation_id: string }) => row.conversation_id)
    );

        const ids = [...new Set((memberships ?? []).map((m: { conversation_id: string }) => m.conversation_id))]
      .filter(id => !hiddenIds.has(id));
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
    const { data: recentMessages } = await supabase.from('messages').select('id,conversation_id,created_at,body,sender_id').in('conversation_id', ids).is('deleted_at', null).order('created_at', { ascending: false });
    const latestByConversation = new Map<string, { id: string; created_at: string; body: string; sender_id: string }>();
    for (const message of recentMessages ?? []) if (!latestByConversation.has(message.conversation_id)) latestByConversation.set(message.conversation_id, message);
    const latestMine = [...latestByConversation.values()].filter(m => m.sender_id === userId).map(m => m.id);
    let readIds = new Set<string>();
    let deliveredIds = new Set<string>();
    if (latestMine.length) {
      const [{ data: reads }, { data: deliveries }] = await Promise.all([
        supabase.from('message_reads').select('message_id,user_id').in('message_id', latestMine).neq('user_id', userId),
        supabase.from('message_deliveries').select('message_id,user_id').in('message_id', latestMine).neq('user_id', userId)
      ]);
      readIds = new Set((reads ?? []).map((r: {message_id:string}) => r.message_id));
      deliveredIds = new Set((deliveries ?? []).map((r: {message_id:string}) => r.message_id));
    }
    const mapped: Conversation[] = (convs ?? []).map((c: { id: string; title: string | null; kind: string }) => {
      const other = (allMembers ?? []).find((m: { conversation_id: string; user_id: string }) => m.conversation_id === c.id && m.user_id !== userId);
      const isGroup = c.kind === 'group';
      return {
        id: c.id,
        title: isGroup ? (c.title || 'Group chat') : (nicknameById.get(other?.user_id ?? '') ? `@${nicknameById.get(other?.user_id ?? '')}` : (c.title && !['Private chat', 'Private conversation'].includes(c.title) ? c.title : 'Private chat')),
        kind: isGroup ? ('group' as const) : ('person' as const),
        otherUserId: other?.user_id,
        avatarUrl: isGroup ? (groups.find(g => g.conversation_id === c.id)?.avatar_url ?? null) : avatarById.get(other?.user_id ?? '') ?? null,
        lastMessageAt: latestByConversation.get(c.id)?.created_at ?? null,
        lastMessagePreview: (latestByConversation.get(c.id)?.body || '').replace(/^\[\[RC_REPLY\]\][\s\S]*?\n/, '').replace(/\s+/g, ' ').trim().slice(0, 42),
        lastMessageSenderId: latestByConversation.get(c.id)?.sender_id ?? null,
        lastMessageRead: latestByConversation.get(c.id)?.sender_id === userId && readIds.has(latestByConversation.get(c.id)?.id || ''),
        lastMessageDelivered: latestByConversation.get(c.id)?.sender_id === userId && deliveredIds.has(latestByConversation.get(c.id)?.id || '')
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
      .select('id,conversation_id,sender_id,body,created_at,message_type,media_path')
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

async function playVoiceNote(message: ChatMessage) {
  if (!supabase || !message.media_path) {
    setStatus('Voice note is unavailable.');
    return;
  }

  const existingUrl = voiceUrls[message.id];

  if (existingUrl) {
    setVoiceUrls(old => {
      const next = { ...old };
      delete next[message.id];
      return next;
    });
    return;
  }

  const { data, error } = await supabase.storage
    .from('rc-voice-notes')
    .createSignedUrl(message.media_path, 3600);

  if (error || !data?.signedUrl) {
    setStatus('Could not open voice note. Please try again.');
    return;
  }

  setVoiceUrls(old => ({
    ...old,
    [message.id]: data.signedUrl
  }));
}

  
  async function startVoiceRecording() {
    if (
      !supabase ||
      !userId ||
      !selectedConversation ||
      voiceBusy ||
      isRecordingVoice ||
      voicePreviewUrl
    ) return;

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setStatus('Voice recording is not supported by this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];

      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ].find(type => MediaRecorder.isTypeSupported(type));

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      voiceRecorderRef.current = recorder;

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(voiceChunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });

        voiceStreamRef.current?.getTracks().forEach(track => track.stop());
        voiceStreamRef.current = null;
        setIsRecordingVoice(false);
        setVoiceBusy(false);

        if (audioBlob.size === 0) {
          setStatus('No voice audio was recorded. Please try again.');
          return;
        }

        if (audioBlob.size > 15 * 1024 * 1024) {
          setStatus('Voice note is too large. Please record a shorter note.');
          return;
        }

        const previewUrl = URL.createObjectURL(audioBlob);

        setVoicePreviewBlob(audioBlob);
        setVoicePreviewUrl(previewUrl);
        setVoicePreviewDuration(0);
        setStatus('Listen to your voice note before sending.');
      };

      recorder.start();
      setIsRecordingVoice(true);
      setStatus('Recording voice note… Tap Stop when finished.');
    } catch (error) {
      voiceStreamRef.current?.getTracks().forEach(track => track.stop());
      voiceStreamRef.current = null;
      setStatus(
        `Microphone unavailable: ${
          error instanceof Error ? error.message : 'Permission denied'
        }`
      );
    }
  }

  function stopVoiceRecording() {
    const recorder = voiceRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    setIsRecordingVoice(false);
    setVoiceBusy(true);
    recorder.stop();
  }

  
  function cancelVoicePreview() {
    if (voicePreviewUrl) {
      URL.revokeObjectURL(voicePreviewUrl);
    }

    setVoicePreviewUrl(null);
    setVoicePreviewBlob(null);
    setVoicePreviewDuration(0);
    setStatus('Voice note discarded.');
  }

  async function sendVoicePreview() {
    if (
      !supabase ||
      !userId ||
      !selectedConversation ||
      !voicePreviewBlob ||
      voiceBusy
    ) return;

    const conversationId = selectedConversation.id;
    const audioBlob = voicePreviewBlob;

    if (audioBlob.size === 0) {
      setStatus('No voice audio was recorded.');
      return;
    }

    setVoiceBusy(true);

    const fileExtension = audioBlob.type.includes('mp4')
      ? 'm4a'
      : audioBlob.type.includes('ogg')
        ? 'ogg'
        : 'webm';

    const filePath =
      `${conversationId}/${userId}/${crypto.randomUUID()}.${fileExtension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('rc-voice-notes')
        .upload(filePath, audioBlob, {
          contentType: audioBlob.type,
          upsert: false
        });

      if (uploadError) {
        setStatus(`Voice upload failed: ${uploadError.message}`);
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          body: '🎤 Voice note',
          message_type: 'voice',
          media_path: filePath
        })
        .select(
          'id,conversation_id,sender_id,body,created_at,message_type,media_path'
        )
        .single();

      if (error) {
        await supabase.storage
          .from('rc-voice-notes')
          .remove([filePath]);

        setStatus(`Voice message failed: ${error.message}`);
        return;
      }

      const { data: sender } = await supabase
        .from('profiles')
        .select('nickname,avatar_url')
        .eq('id', userId)
        .maybeSingle();

      setChatMessages(old => [
        ...old,
        {
          ...(data as ChatMessage),
          sender_nickname: sender?.nickname || 'You',
          sender_avatar_url: sender?.avatar_url || null,
          read_by: [],
          delivered_by: []
        }
      ]);

      setConversationList(old =>
        old.map(c =>
          c.id === conversationId
            ? {
                ...c,
                lastMessageAt: data.created_at,
                lastMessagePreview: '🎤 Voice note'
              }
            : c
        ).sort((a, b) =>
          (b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0) -
          (a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0)
        )
      );

      if (voicePreviewUrl) {
        URL.revokeObjectURL(voicePreviewUrl);
      }

      setVoicePreviewUrl(null);
      setVoicePreviewBlob(null);
      setVoicePreviewDuration(0);
      setStatus('Voice note sent.');
    } catch (error) {
      setStatus(
        `Voice note failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setVoiceBusy(false);
    }
  }
  
  
  async function sendDraft() {
    const body = draftMessage.trim();
    if (!supabase || !userId || !selectedConversation || !body || sendingMessage) return;
    
    if (selectedConversation.kind === 'person' && selectedConversation.otherUserId) {
      const { data: blockRows, error: blockError } = await supabase
        .from('user_blocks')
        .select('blocker_id,blocked_id')
        .or(
          `and(blocker_id.eq.${userId},blocked_id.eq.${selectedConversation.otherUserId}),and(blocker_id.eq.${selectedConversation.otherUserId},blocked_id.eq.${userId})`
        );

      if (blockError) {
        setStatus('Could not verify block status. Message not sent.');
        return;
      }

      if (blockRows && blockRows.length > 0) {
        setStatus('Message not sent. A block is active between these users.');
        return;
      }
    }
    
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
  
  async function saveEditedMessage() {
    const body = editMessageText.trim();

    if (!supabase || !userId || !editingMessage || !body || savingEdit) return;
    if (editingMessage.sender_id !== userId) return;

    setSavingEdit(true);

    const { data, error } = await supabase
      .from('messages')
      .update({
        body,
        edited_at: new Date().toISOString()
      })
      .eq('id', editingMessage.id)
      .eq('sender_id', userId)
      .select('id,body,edited_at')
      .single();

    setSavingEdit(false);

    if (error) {
      setStatus(`Message edit failed: ${error.message}`);
      return;
    }

    setChatMessages(old =>
      old.map(message =>
        message.id === editingMessage.id
          ? { ...message, body: data.body }
          : message
      )
    );

    setEditingMessage(null);
    setEditMessageText('');
    setStatus('Message updated.');
  }

  
  async function deleteOwnMessage(message: ChatMessage) {
    if (!supabase || !userId || message.sender_id !== userId) return;

    const confirmed = window.confirm('Delete this message? This removes it for everyone in the conversation.');
    if (!confirmed) return;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', message.id)
      .eq('sender_id', userId);

    if (error) {
      setStatus(`Message deletion failed: ${error.message}`);
      return;
    }

    setChatMessages(old => old.filter(item => item.id !== message.id));

    if (editingMessage?.id === message.id) {
      setEditingMessage(null);
      setEditMessageText('');
    }

    setStatus('Message deleted.');
  }

  
  async function hideConversation(conversationId: string) {
    if (!supabase || !userId) return;

    const confirmed = window.confirm(
      'Hide this conversation from your Messages list?'
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('hidden_conversations')
      .upsert(
        {
          user_id: userId,
          conversation_id: conversationId
        },
        { onConflict: 'user_id,conversation_id' }
      );

    if (error) {
      setStatus(`Could not hide conversation: ${error.message}`);
      return;
    }

    setConversationList(current =>
      current.filter(convo => convo.id !== conversationId)
    );

    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }

    setStatus('Conversation hidden from your list.');
  }

  
  async function leaveGroup(groupId: string, groupName: string) {
    if (!supabase || !userId) return;

    const confirmed = window.confirm(
      `Leave "${groupName}"? You can rejoin later if the group allows it.`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      setStatus(`Could not leave group: ${error.message}`);
      return;
    }

    const group = groups.find(item => item.id === groupId);

    setGroups(current => current.filter(item => item.id !== groupId));

    if (group?.conversation_id) {
      setConversationList(current =>
        current.filter(item => item.id !== group.conversation_id)
      );

      if (selectedConversation?.id === group.conversation_id) {
        setSelectedConversation(null);
      }
    }

    setStatus(`You left "${groupName}".`);
  }
  

  async function blockUser(otherUserId: string, nickname: string) {
    if (!supabase || !userId || !otherUserId || otherUserId === userId) return;

    const confirmed = window.confirm(
      `Block @${nickname}? They will not be able to message you.`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('user_blocks')
      .upsert(
        {
          blocker_id: userId,
          blocked_id: otherUserId
        },
        { onConflict: 'blocker_id,blocked_id' }
      );

    if (error) {
      setStatus(`Could not block user: ${error.message}`);
      return;
    }

    setStatus(`@${nickname} blocked.`);
            }
  
  const scrollChatToLatest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = chatMessagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowScrollToLatest(false);
  }, []);

  const lastAutoScrolledMessageId = useRef<string | null>(null);
  const lastAutoScrolledConversationId = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedConversation || chatMessages.length === 0) {
      setShowScrollToLatest(false);
      lastAutoScrolledConversationId.current = selectedConversation?.id ?? null;
      lastAutoScrolledMessageId.current = null;
      return;
    }
    const latest = chatMessages[chatMessages.length - 1];
    const enteredConversation = lastAutoScrolledConversationId.current !== selectedConversation.id;
    const newMessageArrived = latest?.id !== lastAutoScrolledMessageId.current;
    lastAutoScrolledConversationId.current = selectedConversation.id;
    lastAutoScrolledMessageId.current = latest?.id ?? null;
    if (!enteredConversation && !newMessageArrived) return;
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
    if (!supabase) return;

    let cancelled = false;

    const pendingMessages = chatMessages.filter(
      message =>
        message.message_type === 'voice' &&
        !!message.media_path &&
        !voiceUrls[message.id]
    );

    if (pendingMessages.length === 0) return;

    async function loadVoiceNoteUrls() {
      const loaded: Record<string, string> = {};

      for (const message of pendingMessages) {
        if (!message.media_path) continue;

        const { data, error } = await supabase!.storage
          .from('rc-voice-notes')
          .createSignedUrl(message.media_path, 3600);

        if (!error && data?.signedUrl) {
          loaded[message.id] = data.signedUrl;
        }
      }

      if (cancelled || Object.keys(loaded).length === 0) return;

      setVoiceUrls(previous => ({
        ...loaded,
        ...previous
      }));
    }

    void loadVoiceNoteUrls();

    return () => {
      cancelled = true;
    };
  }, [chatMessages, supabase, voiceUrls]);
  
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
          try { const sender = data?.nickname ? '@' + data.nickname : 'Someone'; const preview = (incoming.body || '').replace(/^\[\[RC_REPLY\]\][\s\S]*?\n/, '').replace(/\s+/g, ' ').trim(); const shortPreview = preview.length > 90 ? preview.slice(0, 87) + '...' : preview; new Notification('MR RICH CONNECT', { body: `${sender}: '${shortPreview}'`, icon: '/icon-192.png', badge: '/icon-192.png', tag: incoming.conversation_id }); } catch {}
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
    const inConversationList = Boolean(target.closest('.rc-conversation-list'));
    // Allow swipes to begin anywhere over the conversation list, including on a row;
    // normal taps still open that conversation because navigation only happens after a clear horizontal drag.
    if (target.closest('input, textarea, select, [contenteditable="true"], .rc-message-row, .rc-bottom-nav, .rc-modal, .rc-modal-backdrop') ||
        (target.closest('button') && !inConversationList && !target.closest('.rc-group-row') && !target.closest('.rc-group-row-wrap'))) {
      pageSwipeStart.current = null;
      return;
    }
    const touch = e.changedTouches[0];
    if (!touch) return;
    const inChat = Boolean(selectedConversation && target.closest('.rc-chat-panel'));
    pageSwipeStart.current = { x: touch.clientX, y: touch.clientY, kind: inChat ? 'chat' : 'page' };
    setPageSwipeAnimating(false);
  }

  
  function handlePageTouchMove(e: TouchEvent<HTMLElement>) {
    const start = pageSwipeStart.current;
    const touch = e.changedTouches[0];
    if (!start || !touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.15) return;

    // Prevent movement beyond the first and last navigation pages.
    if (start.kind === 'page') {
      const currentIndex = NAV_ITEMS.findIndex(item => item.name === tab);
      const atFirstPage = currentIndex <= 0;
      const atLastPage = currentIndex >= NAV_ITEMS.length - 1;

      if ((atFirstPage && dx > 0) || (atLastPage && dx < 0)) {
        setPageSwipeOffset(0);
        return;
      }
    }

    const limit = Math.max(180, window.innerWidth * 0.82);
    setPageSwipeOffset(Math.max(-limit, Math.min(limit, dx)));
  }

  function handlePageTouchEnd(e: TouchEvent<HTMLElement>) {
    const start = pageSwipeStart.current;
    pageSwipeStart.current = null;
    const touch = e.changedTouches[0];

    if (!start || !touch) {
      setPageSwipeOffset(0);
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const horizontal =
      Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.15;

    if (!horizontal) {
      setPageSwipeOffset(0);
      return;
    }

    // Preserve the existing chat swipe-back behavior.
    if (start.kind === 'chat' && dx > 0) {
      setPageSwipeAnimating(true);
      setPageSwipeOffset(Math.max(window.innerWidth, dx + 60));

      window.setTimeout(() => {
        closeConversationWithMotion();
        setPageSwipeOffset(0);
        setPageSwipeAnimating(false);
      }, 100);

      return;
    }

    const currentIndex = NAV_ITEMS.findIndex(item => item.name === tab);
    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;

    // Never navigate past the first or last tab.
    if (nextIndex < 0 || nextIndex >= NAV_ITEMS.length) {
      setPageSwipeOffset(0);
      setPageSwipeAnimating(false);
      return;
    }

    // Animate the shared track to the neighboring panel, then commit the tab.
    setPageSwipeAnimating(true);
    setPageSwipeOffset(dx < 0 ? -window.innerWidth : window.innerWidth);
    window.setTimeout(() => {
      setTab(NAV_ITEMS[nextIndex].name);
      setShowProfile(false);
      setShowGroup(false);
      setShowEmojiPicker(false);
      setPageSwipeOffset(0);
      setPageSwipeAnimating(false);
    }, 125);
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
    const alreadyConnected = conversationList.some(c => c.kind === 'person' && c.otherUserId === p.id);
    if (sentRequestRecipientIds.includes(p.id)) return false;
    if (alreadyConnected && !query) return false;
    const searchableText = [p.nickname, p.school, p.college, p.department, p.level, p.bio]
      .filter(Boolean).join(' ').toLocaleLowerCase();
    if (query && !searchableText.includes(query)) return false;
    if (discoverFilter === 'online' && !onlineUserIds.includes(p.id)) return false;
    if (discoverFilter === 'school') {
      const mySchool = profileForm.school.trim().toLocaleLowerCase();
      if (!mySchool || (p.school || '').trim().toLocaleLowerCase() !== mySchool) return false;
    }
    return true;
  }).sort((a, b) => Number(b.premium_status === 'active') - Number(a.premium_status === 'active'));

    const rankingSeconds = (p: Profile) =>
  Math.max(0, Number(p.total_online_seconds || 0)) *
  (p.premium_status === 'active' ? 3 : 1);

  return (
    <main
      className="rc-shell"
      onTouchStart={handlePageTouchStart}
      onTouchMove={handlePageTouchMove}
      onTouchEnd={handlePageTouchEnd}
    >
    {!userId ? <>
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
    <section className="rc-auth-layout">
      <div className="rc-auth-intro"><span className="rc-eyebrow"><Sparkles size={14}/> YOUR CAMPUS. YOUR COMMUNITY.</span><h1>Find your people.<br/><em>Build your circle.</em></h1><p>Connect with people from your school and community.</p><div className="rc-auth-symbol"><MessageCircle size={58}/><Wifi size={25}/></div></div>
      <form className="rc-auth-card" onSubmit={authMode === 'signin' ? signIn : signUp}>
        <span className="rc-eyebrow">WELCOME TO THE NETWORK</span><h2>{authMode === 'signin' ? 'Sign in' : 'Create your account'}</h2>
        <p className="rc-muted">{authMode === 'signin' ? 'Use your email and password to continue.' : 'Public profile details and private information are collected separately.'}</p>
        {authMode === 'signup' && <>
          <h3>Public profile</h3>
          <label>Nickname<input required maxLength={24} value={registration.nickname} onChange={e=>setRegistration({...registration,nickname:e.target.value})} placeholder="@yournickname"/></label>
          <label>School / institution<input value={registration.school} onChange={e=>setRegistration({...registration,school:e.target.value})} placeholder="Type to search Nigerian institutions…" autoComplete="off"/><div className="rc-school-options rc-school-search-results">{NIGERIAN_SCHOOLS.filter(s=>registration.school.trim().length>0 && s.toLocaleLowerCase().includes(registration.school.toLocaleLowerCase())).slice(0,8).map(s=><button type="button" key={s} className="rc-secondary" onClick={()=>setRegistration({...registration,school:s})}>{s}</button>)}</div></label>
          <label>College / faculty<input value={registration.college} onChange={e=>setRegistration({...registration,college:e.target.value})} placeholder="Your college or faculty"/></label>
          <label>Department<input value={registration.department} onChange={e=>setRegistration({...registration,department:e.target.value})} placeholder="Your department"/></label>
          <label>Level<select value={registration.level} onChange={e=>setRegistration({...registration,level:e.target.value})}><option value="">Select level</option>{PROFILE_LEVELS.map(level=><option key={level} value={level}>{level}</option>)}</select></label>
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
    </section>
    </> : <div className="rc-swipe-viewport"><div className={`rc-swipe-stage ${pageSwipeAnimating ? 'is-swiping' : ''}`} style={{ transform: `translate3d(calc(-${(NAV_ITEMS.findIndex(item => item.name === tab) < 0 ? 0 : NAV_ITEMS.findIndex(item => item.name === tab)) * (100 / NAV_ITEMS.length)}% + ${pageSwipeOffset}px),0,0)` }}>
      {NAV_ITEMS.map((page, pageIndex) => {
        const activeIndex = NAV_ITEMS.findIndex(item => item.name === tab);
        const isActive = page.name === tab;
        const isSwipeNeighbor = (pageSwipeOffset < 0 && pageIndex === activeIndex + 1) || (pageSwipeOffset > 0 && pageIndex === activeIndex - 1);
        return <section className={`rc-tab-panel ${isActive || isSwipeNeighbor ? 'rc-panel-visible' : 'rc-panel-hidden'}`} key={page.name} aria-hidden={!isActive}>
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
      <div className={`rc-page-heading ${['Messages', 'Requests', 'Discover', 'Groups', 'My Profile'].includes(page.name) ? 'rc-simple-page-heading' : ''}`}><div>{page.name === 'Premium' && <span className="rc-eyebrow">MEMBERSHIP</span>}<h1>{page.name === 'Messages' ? 'Messages' : page.name === 'Discover' ? 'Find People Online' : page.name === 'Groups' ? 'Groups' : page.name === 'Requests' ? 'Message Request' : page.name === 'Premium' ? 'Premium Membership' : 'Your Profile'}</h1>{page.name === 'Requests' && <p className="rc-page-subtitle">Accept a request to open a private conversation.</p>}{page.name === 'Groups' && <p className="rc-page-subtitle">Spaces for courses, clubs and shared interests.</p>}</div>
        {page.name === 'Messages' && <button type="button" className="rc-icon-btn rc-heading-notification" onClick={() => void enableMessageNotifications()} title="Enable message notifications" aria-label="Enable message notifications"><Bell size={18}/></button>}
        {page.name === 'Messages' && isAdmin && <a href="/admin" className="rc-icon-btn" title="Admin dashboard" aria-label="Admin dashboard"><ShieldCheck size={18}/></a>}
        {page.name === 'Requests' && <button className="rc-icon-btn" aria-label="Refresh message requests" onClick={() => void loadIncomingRequests()}><RefreshCw size={18}/></button>}
        {page.name === 'Groups' && <button className="rc-primary" onClick={() => setShowGroup(true)}><Plus size={17}/> Create group</button>}
        {page.name === 'Discover' && <button className="rc-icon-btn" aria-label="Refresh people" onClick={() => void refreshCommunity()}><RefreshCw size={18}/></button>}
      </div>

      {!configured && <div className="rc-notice"><ShieldCheck size={18}/><span>Supabase is not configured. Add your project URL and public key to your Render environment variables.</span></div>}
      {status && <div className={`rc-toast rc-toast-${statusType}`} role={statusType === 'error' ? 'alert' : 'status'}>{status}<button aria-label="Dismiss notice" onClick={() => setStatus('')}><X size={14}/></button></div>}

      {page.name === 'Messages' && activeAds.filter(ad => ad.media_type === 'image' && ad.target_url).slice(0, 1).map(ad => <div key={ad.id} className="rc-message-ad-banner" style={{margin:'0 0 12px',width:'100%',aspectRatio:'16 / 9',maxHeight:260,overflow:'hidden',borderRadius:14,border:'1px solid #23365a',background:'#0b1222'}}><a href={ad.target_url || '#'} target="_blank" rel="noopener noreferrer" aria-label={`Open advert: ${ad.title}`} style={{display:'block',width:'100%',height:'100%'}}><img src={ad.media_path} alt={ad.title} style={{display:'block',width:'100%',height:'100%',objectFit:'cover'}}/></a></div>)}

      {page.name === 'Messages' && <section className={`rc-messages-layout ${selectedConversation ? 'has-chat' : ''} ${chatExiting ? 'chat-exiting' : ''}`}>
        <aside className="rc-conversation-list">
          {conversationList.map(convo => (
  <div
    key={convo.id}
    className="rc-conversation-row-wrap"
    style={{
      display: 'flex',
      alignItems: 'stretch',
      gap: 6,
      marginBottom: 6,
    }}
  >
    <button
      type="button"
      className={`rc-conversation-row ${
        selectedConversation?.id === convo.id ? 'active' : ''
      }`}
            style={{ flex: 1, minWidth: 0, touchAction: 'pan-y' }}
      onPointerDown={() => {
        suppressConversationClick.current = false;
        if (conversationHoldTimer.current !== null) {
          window.clearTimeout(conversationHoldTimer.current);
        }
        conversationHoldTimer.current = window.setTimeout(() => {
          setHideActionsConversationId(current => current === convo.id ? null : convo.id);
          suppressConversationClick.current = true;
        }, 550);
      }}
      onPointerUp={() => {
        if (conversationHoldTimer.current !== null) {
          window.clearTimeout(conversationHoldTimer.current);
        }
        conversationHoldTimer.current = null;
      }}
      onPointerLeave={() => {
        if (conversationHoldTimer.current !== null) {
          window.clearTimeout(conversationHoldTimer.current);
        }
        conversationHoldTimer.current = null;
      }}
      onPointerCancel={() => {
        if (conversationHoldTimer.current !== null) {
          window.clearTimeout(conversationHoldTimer.current);
        }
        conversationHoldTimer.current = null;
      }}
      onClick={() => {
        if (suppressConversationClick.current) {
          suppressConversationClick.current = false;
          return;
        }
        setHideActionsConversationId(null);
        setSelectedConversation(convo);
        void markConversationRead(convo.id);
        setReplyTo(null);
      }}
    >
      <span className="rc-conversation-avatar">
        {convo.avatarUrl ? (
          <img src={convo.avatarUrl} alt="" />
        ) : convo.kind === 'group' ? (
          <Users size={20} />
        ) : (
          <MessageCircle size={20} />
        )}
      </span>

      <span className="rc-conversation-copy">
        <strong>{convo.title}</strong>
        <span className="rc-conversation-kind">{convo.kind === 'group' ? 'Group conversation' : 'Private conversation'}</span>
        <small>
          {convo.lastMessagePreview ? (
            <>
              {convo.lastMessagePreview.length >= 42
                ? `${convo.lastMessagePreview.slice(0, 39)}...`
                : convo.lastMessagePreview}
              {convo.lastMessageSenderId === userId && (
                <span
                  className={`rc-preview-ticks ${
                    convo.lastMessageRead ? 'is-read' : ''
                  }`}
                >
                  {convo.lastMessageRead
                    ? '✓✓'
                    : convo.lastMessageDelivered
                      ? '✓✓'
                      : '✓'}
                </span>
              )}
            </>
          ) : (
            'No messages yet'
          )}
        </small>
      </span>

      {(unreadCounts[convo.id] || 0) > 0 && (
        <span className="rc-unread-badge">
          {unreadCounts[convo.id] > 99
            ? '99+'
            : unreadCounts[convo.id]}
        </span>
      )}
    </button>

        {hideActionsConversationId === convo.id && (
      <button
        type="button"
        className="rc-icon-btn"
        aria-label={`Hide conversation with ${convo.title}`}
        title="Hide conversation"
        onClick={() => {
          setHideActionsConversationId(null);
          void hideConversation(convo.id);
        }}
        style={{ flexShrink: 0 }}
      >
        <X size={17} />
      </button>
    )}
  </div>
))}
          {conversationList.length === 0 && <div className="rc-empty-conversations"><div className="rc-empty-icon"><MessageCircle size={27}/></div><strong>Your Conversations Will Appear Here.</strong><p>Accept a message request to start a private conversation.</p><button className="rc-text-btn" onClick={() => { setTab('Requests'); void loadIncomingRequests(); }}>View requests <Bell size={14}/></button></div>}
        </aside>
        <section className="rc-chat-panel">
          {selectedConversation ? <><header className="rc-chat-header"><button className="rc-icon-btn rc-back-chat" onClick={closeConversationWithMotion} aria-label="Back to conversations"><ArrowLeft size={19}/></button><div className="rc-conversation-avatar rc-chat-header-avatar">{selectedConversation.avatarUrl ? <img src={selectedConversation.avatarUrl} alt=""/> : selectedConversation.kind === 'group' ? <Users size={20}/> : <MessageCircle size={20}/>}</div><div><strong>{selectedConversation.title}</strong><small>{selectedConversation.kind === 'group' ? 'Group conversation' : 'Private conversation'}</small>
</div>
{selectedConversation.kind === 'person' && selectedConversation.otherUserId && (
  <button
    type="button"
    onClick={() =>
      void blockUser(
        selectedConversation.otherUserId!,
        selectedConversation.title.replace(/^@/, '')
      )
    }
    style={{
      marginLeft: 'auto',
      padding: '7px 10px',
      border: '1px solid #7f1d1d',
      borderRadius: 8,
      background: 'transparent',
      color: '#fca5a5',
      cursor: 'pointer',
      fontSize: 12
    }}
  >
    Block
  </button>
)}
</header><div ref={chatMessagesRef}
           onScroll={handleChatScroll} className="rc-chat-empty" style={{display:'flex', flexDirection:'column', alignItems:'stretch', gap:'12px', overflowY:'auto', justifyContent: chatMessages.length ? 'flex-start' : 'center'}}>{chatMessages.length === 0 ? <><MessageCircle size={28}/><strong>Your chat starts here</strong><p>Send the first message to begin.</p></> : chatMessages.map(message => {
          const mine = message.sender_id === userId;
          const groupChat = selectedConversation.kind === 'group';
          const senderName = mine ? 'You' : `@${message.sender_nickname || 'Member'}`;
          return <div key={message.id} onPointerDown={() => {
  if (!mine) return;
  if (messageHoldTimer.current !== null) window.clearTimeout(messageHoldTimer.current);
  messageHoldTimer.current = window.setTimeout(() => setMessageActionsMessageId(current => current === message.id ? null : message.id), 550);
}} onPointerUp={() => {
  if (messageHoldTimer.current !== null) window.clearTimeout(messageHoldTimer.current);
  messageHoldTimer.current = null;
}} onPointerLeave={() => {
  if (messageHoldTimer.current !== null) window.clearTimeout(messageHoldTimer.current);
  messageHoldTimer.current = null;
}} onPointerCancel={() => {
  if (messageHoldTimer.current !== null) window.clearTimeout(messageHoldTimer.current);
  messageHoldTimer.current = null;
}} onTouchStart={e => { touchStartX.current[message.id] = e.changedTouches[0]?.clientX ?? 0; setDraggingMessageId(message.id); }} onTouchMove={e => { const start = touchStartX.current[message.id]; const current = e.changedTouches[0]?.clientX ?? start; if (start !== undefined) setDragOffsets(old => ({...old, [message.id]: Math.max(0, Math.min(72, current - start))})); }} onTouchEnd={e => { const start = touchStartX.current[message.id]; const end = e.changedTouches[0]?.clientX ?? start; if (start !== undefined && end - start > 55) setReplyTo(message); delete touchStartX.current[message.id]; setDraggingMessageId(null); setDragOffsets(old => ({...old, [message.id]: 0})); }} onContextMenu={e => { e.preventDefault(); }} onDoubleClick={() => setReplyTo(message)} title={mine ? "Swipe right to reply; press and hold for message options" : "Swipe right to reply"} className={`rc-message-row ${mine ? 'rc-message-mine' : 'rc-message-other'} ${groupChat ? 'rc-message-group' : 'rc-message-private'}`} style={{marginLeft: mine ? '12%' : (groupChat ? 0 : '3%'), marginRight: mine ? 0 : '6%'}}>
            {!mine && groupChat && <span className="rc-message-avatar">{message.sender_avatar_url ? <img src={message.sender_avatar_url} alt=""/> : (message.sender_nickname?.[0] || 'M').toUpperCase()}</span>}
            <div className={`rc-message-bubble ${mine ? 'mine' : 'other'} ${draggingMessageId === message.id ? 'rc-message-dragging' : ''}`} style={{transform: `translateX(${dragOffsets[message.id] || 0}px)`, transition: draggingMessageId === message.id ? 'none' : 'transform 180ms ease-out'}}>
              {groupChat && <strong className="rc-message-sender" style={{color: mine ? '#ffffff' : nicknameColor(message.sender_id)}}>{senderName}</strong>}
              {message.reply_to && <div className="rc-replied-message"><strong style={{color: nicknameColor(message.reply_to.sender_id)}}>{message.reply_to.sender_id === userId ? 'You' : '@' + message.reply_to.sender_nickname}</strong><span>{message.reply_to.body.slice(0, 220)}{message.reply_to.body.length > 220 ? '…' : ''}</span></div>}
              
{editingMessage?.id === message.id ? (
  <div style={{display:'flex',flexDirection:'column',gap:8,minWidth:0}}>
    <textarea
      value={editMessageText}
      onChange={e => setEditMessageText(e.target.value)}
      aria-label="Edit message"
      rows={3}
      maxLength={5000}
      style={{
        width:'100%',
        boxSizing:'border-box',
        padding:10,
        borderRadius:10,
        background:'#0b1220',
        color:'#fff',
        border:'1px solid #2563eb',
        resize:'vertical'
      }}
    />
    <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
      <button
        type="button"
        onClick={() => {
          setEditingMessage(null);
          setEditMessageText('');
        }}
        disabled={savingEdit}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => void saveEditedMessage()}
        disabled={!editMessageText.trim() || savingEdit}
      >
        {savingEdit ? 'Saving…' : 'Save edit'}
      </button>
    </div>
  </div>
) : (
  <>
    
{message.message_type === 'voice' ? (
  <div style={{ minWidth: 220, maxWidth: '100%' }}>
    {voiceUrls[message.id] ? (
      <VoiceNotePlayer src={voiceUrls[message.id]} />
    ) : (
      <div
        style={{
          color: '#93c5fd',
          fontSize: 12,
          padding: '10px 12px'
        }}
      >
        Loading voice note…
      </div>
    )}
  </div>
) : (
  <div className="rc-message-body">{message.body}</div>
)}

        {mine && messageActionsMessageId === message.id && (
      <>
        <button
          type="button"
                    onClick={() => {
            setMessageActionsMessageId(null);
            setEditingMessage(message);
            setEditMessageText(message.body);
          }}
          aria-label="Edit your message"
          style={{
            marginTop: 6,
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid #2563eb',
            background: 'transparent',
            color: '#93c5fd',
            cursor: 'pointer'
          }}
        >
          Edit
        </button>

        <button
          type="button"
                    onClick={() => {
            setMessageActionsMessageId(null);
            void deleteOwnMessage(message);
          }}
          aria-label="Delete your message"
          style={{
            marginTop: 6,
            marginLeft: 6,
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid #7f1d1d',
            background: 'transparent',
            color: '#fca5a5',
            cursor: 'pointer'
          }}
        >
          Delete
        </button>
      </>
  
    )}
  </>
)}
              
              
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

          </div>;
        })}</div>{showScrollToLatest && <button type="button" className="rc-scroll-latest" onClick={() => scrollChatToLatest('smooth')} aria-label="Scroll to latest message" title="Latest message"><ArrowDown size={20}/></button>}{(() => { const activeGroup = selectedConversation.kind === 'group' ? groups.find(g => g.conversation_id === selectedConversation.id) : null; const isGroupAdmin = !!activeGroup && (activeGroup.created_by === userId || isAdmin); const adminOnly = !!activeGroup && activeGroup.members_can_message === false && !isGroupAdmin; return adminOnly ? <div className="rc-admin-only-notice">Only Admin can Send Messages</div> : <div className="rc-composer-wrap">{replyTo && <div className="rc-reply-preview"><div><strong>Replying to {replyTo.sender_id === userId ? 'yourself' : '@' + (replyTo.sender_nickname || 'Member')}</strong><small>{replyTo.body.slice(0, 110)}{replyTo.body.length > 110 ? '…' : ''}</small></div><button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={16}/></button></div>}
{voicePreviewUrl && (
  <div
    style={{
      marginBottom: 12,
      padding: 14,
      borderRadius: 16,
      border: '1px solid rgba(96,165,250,.4)',
      background: 'linear-gradient(135deg, #101b35, #0b1220)',
      boxShadow: '0 8px 24px rgba(0,0,0,.18)'
    }}
  >
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12
    }}>
      <span style={{
        width: 42,
        height: 42,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 13,
        background: 'rgba(37,99,235,.2)',
        color: '#93c5fd'
      }}>
        <AudioLines size={23} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ color: '#f8fafc' }}>Voice note preview</strong>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 3 }}>
          Listen before sending
        </div>
      </div>
      <button
        type="button"
        onClick={cancelVoicePreview}
        disabled={voiceBusy}
        aria-label="Discard voice note"
        title="Discard voice note"
        style={{
          background: 'transparent',
          border: '1px solid #334155',
          color: '#fca5a5',
          borderRadius: 9,
          padding: 8
        }}
      >
        <Trash2 size={18} />
      </button>
    </div>

    <audio
      controls
      src={voicePreviewUrl}
      onLoadedMetadata={e =>
        setVoicePreviewDuration(e.currentTarget.duration || 0)
      }
      style={{ width: '100%', display: 'block', marginBottom: 12 }}
    />

    <div style={{ display: 'flex', gap: 10 }}>
      <button
        type="button"
        onClick={cancelVoicePreview}
        disabled={voiceBusy}
        style={{
          flex: 1,
          padding: '11px 14px',
          borderRadius: 11,
          border: '1px solid #334155',
          background: '#111827',
          color: '#e2e8f0',
          fontWeight: 600
        }}
      >
        <X size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Cancel
      </button>

      <button
        type="button"
        onClick={() => void sendVoicePreview()}
        disabled={voiceBusy || !voicePreviewBlob}
        style={{
          flex: 1,
          padding: '11px 14px',
          borderRadius: 11,
          border: '1px solid #2563eb',
          background: '#2563eb',
          color: '#fff',
          fontWeight: 700,
          opacity: voiceBusy ? 0.65 : 1
        }}
      >
        {voiceBusy ? 'Sending…' : <><Send size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Send voice note</>}
      </button>
    </div>
  </div>
  )}
          <div className="rc-composer"><button type="button" className="rc-emoji-toggle" onClick={() => setShowEmojiPicker(v=>!v)} aria-label="Open emoji picker"><Smile size={22}/></button>

<button
  type="button"
  onClick={() => isRecordingVoice ? stopVoiceRecording() : void startVoiceRecording()}
  disabled={voiceBusy || sendingMessage || !!voicePreviewUrl}
  aria-label={isRecordingVoice ? 'Stop recording' : 'Record voice note'}
  title={isRecordingVoice ? 'Stop recording' : 'Record voice note'}
  style={{
    border: '1px solid #2563eb',
    borderRadius: 12,
    width: 44,
    height: 44,
    display: 'grid',
    placeItems: 'center',
    background: isRecordingVoice ? '#991b1b' : '#172554',
    color: '#dbeafe',
    cursor: voiceBusy || sendingMessage || !!voicePreviewUrl ? 'not-allowed' : 'pointer',
    opacity: voiceBusy || sendingMessage || !!voicePreviewUrl ? 0.6 : 1
  }}
>
  {voiceBusy ? '…' : isRecordingVoice ? <Square size={19} fill="currentColor" /> : <Mic size={21} />}
</button>
<textarea name="chat-message" rows={1} autoComplete="off" autoCorrect="on" autoCapitalize="sentences" spellCheck={true} enterKeyHint="enter" data-form-type="other" data-lpignore="true" value={draftMessage} onChange={e=>{setDraftMessage(e.target.value); e.currentTarget.style.height='auto'; e.currentTarget.style.height=`${Math.min(e.currentTarget.scrollHeight, 120)}px`;}} onFocus={e=>{ window.setTimeout(() => e.currentTarget.scrollIntoView({block:'nearest',behavior:'smooth'}), 180); }} placeholder="Write a message…" aria-label="Message"/><button className="rc-send-btn" onClick={() => void sendDraft()} disabled={!draftMessage.trim() || sendingMessage} aria-label="Send message"><Send size={18}/></button></div>{showEmojiPicker && <div className="rc-emoji-grid">{EMOJIS.map((emoji, i)=><button key={`${emoji}-${i}`} onClick={() => { setDraftMessage(v=>v+emoji); setShowEmojiPicker(false); }} aria-label={`Add ${emoji}`}>{emoji}</button>)}</div>}</div>; })()}</> : <div className="rc-chat-no-selection"><div className="rc-chat-big-icon"><MessageCircle size={35}/><Wifi size={16}/></div><h2>Select a conversation</h2><p>Choose a person or group to open your chat.</p></div>}
        </section>
      </section>}

      {page.name === 'Discover' && <section className="rc-content-section">
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
        <div className="rc-people-grid">{discoverProfiles.map(p => <article className="rc-person-card rc-discover-person" key={p.id}><div className="rc-discover-main"><div className="rc-person-top"><div className="rc-avatar rc-avatar-large">{p.avatar_url ? <img src={p.avatar_url} alt=""/> : p.nickname?.[0]?.toUpperCase() || 'M'}</div></div><div className="rc-discover-details"><h3>@{p.nickname} {p.premium_status === 'active' && p.premium_title && <small className="rc-premium-title"> · {p.premium_title}</small>} {onlineUserIds.includes(p.id) && <span title="Online now" aria-label="Online now" style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#32d296',verticalAlign:'middle',marginLeft:5}}/>}</h3><p className="rc-discover-level-college">{[p.level, p.college].filter(Boolean).join(' · ') || 'Community member'}</p><small>{p.school || 'School not listed'}</small><span className="rc-premium-badge" style={{marginTop:6,display:'inline-flex'}}>{getExperienceTitle(p.total_online_seconds)}</span>{p.premium_status === 'active' && <span className="rc-premium-badge"><Crown size={10}/> PREMIUM</span>}</div></div><div className="rc-person-footer"><span><Zap size={13}/> {Math.floor(rankingSeconds(p) / 3600)} ranking h</span>{conversationList.some(c => c.kind === 'person' && c.otherUserId === p.id) ? <button className="rc-primary rc-connect" onClick={() => { const convo = conversationList.find(c => c.kind === 'person' && c.otherUserId === p.id); if (convo) { setSelectedConversation(convo); setTab('Messages'); setReplyTo(null); void markConversationRead(convo.id); } }}>Message <MessageCircle size={15}/></button> : <button className="rc-primary rc-connect" onClick={() => void sendRequest(p.id)}>Connect <Plus size={15}/></button>}</div></article>)}</div>
        {discoverProfiles.length === 0 && <div className="rc-empty-state"><div className="rc-empty-icon"><Users size={27}/></div><h2>{discoverQuery || discoverFilter !== 'all' ? 'No matching members' : 'No people to show yet'}</h2><p>{discoverQuery || discoverFilter !== 'all' ? 'Try a different search or filter. Search currently checks the members loaded by Discover.' : 'New members will appear here when they create a profile.'}</p>{!profileExists && <button className="rc-primary" onClick={openProfileEditor}>Create profile <Plus size={16}/></button>}{(discoverQuery || discoverFilter !== 'all') && <button className="rc-secondary" onClick={() => { setDiscoverQuery(''); setDiscoverFilter('all'); }}>Clear search and filters</button>}</div>}
      </section>}

      {page.name === 'Groups' && <section className="rc-content-section"><div className="rc-group-list">{groups.map(g => <div className="rc-group-row-wrap" key={g.id}><button className="rc-group-row" onClick={() => { void (async () => { if (!supabase) return; if (!g.conversation_id) { setStatus('This group does not have a chat yet. Ask its owner to recreate it after the SQL migration.'); return; } const { data: conversationId, error } = await supabase.rpc('join_group_with_conversation', { p_group_id: g.id }); if (error) { setStatus(`Could not join group: ${error.message}`); return; } setSelectedConversation({id: conversationId || g.conversation_id!, title:g.name,kind:'group'}); setTab('Messages'); await loadConversations(); })(); }}><span className="rc-group-icon">{g.avatar_url ? <img src={g.avatar_url} alt=""/> : <Users size={22}/>}</span><span className="rc-group-info"><strong>{g.name}</strong><small>MR RICH CONNECT community</small></span><span className="rc-arrow">→</span></button>{(g.created_by === userId || isAdmin) && <button className="rc-edit-group-avatar" aria-label={`Settings for ${g.name}`} title="Group settings" onClick={() => openGroupSettings(g)}><Settings size={17}/>
</button>}
<button
  type="button"
  onClick={() => void leaveGroup(g.id, g.name)}
  aria-label={`Leave ${g.name}`}
  title="Leave group"
  style={{
    flex: '0 0 auto',
    padding: '8px 12px',
    border: '0',
    borderLeft: '1px solid rgba(96,165,250,.25)',
    background: 'transparent',
    color: '#fca5a5',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600
  }}
>
  Leave
</button>
</div>)}</div>{groups.length === 0 &&
<div className="rc-empty-state"><div className="rc-empty-icon"><Users size={27}/></div><h2>No groups yet</h2><p>Create the first group for your community.</p><button className="rc-primary" onClick={() => setShowGroup(true)}><Plus size={16}/> Create group</button></div>}</section>}

      {page.name === 'Requests' && <section className="rc-content-section">
        {incomingRequests.length > 0 ? <div className="rc-group-list">{incomingRequests.map(request => <article className="rc-person-card rc-request-slim" key={request.id}><div className="rc-request-top"><div className="rc-avatar rc-avatar-large">{request.sender_nickname[0]?.toUpperCase() || 'M'}</div><div className="rc-request-details"><h3>@{request.sender_nickname}</h3><p>Wants to start a private conversation.</p><small>{new Date(request.created_at).toLocaleDateString()}</small></div></div><div className="rc-request-actions"><button className="rc-secondary" disabled={requestBusy === request.id} onClick={() => void respondToRequest(request.id, 'decline')}>Decline</button><button className="rc-primary" disabled={requestBusy === request.id} onClick={() => void respondToRequest(request.id, 'accept')}>{requestBusy === request.id ? 'Please wait…' : 'Accept'}</button></div></article>)}</div> : <div className="rc-empty-state"><div className="rc-empty-icon"><Bell size={27}/></div><h2>{requests ? `${requests} pending request${requests === 1 ? '' : 's'}` : 'No new requests'}</h2><p>{requests ? 'A request exists, but the request details could not be loaded. Check the status message above and your Supabase policies.' : 'When someone sends you a message request, it will appear here.'}</p></div>}</section>}

      {page.name === 'My Profile' && <section className="rc-profile-page">{profileExists ? <><div className="rc-profile-card"><label className="rc-profile-avatar-click" title="Change profile photo"><span className="rc-profile-avatar">{profileForm.avatar_url ? <img src={profileForm.avatar_url} alt="Your profile avatar"/> : nickname?.[0]?.toUpperCase() || <UserRound size={36}/>}<i><Pencil size={14}/></i></span><input className="rc-hidden-file" type="file" accept="image/*" onChange={e => void uploadAvatar(e.target.files?.[0])} disabled={avatarUploading}/></label><span className="rc-eyebrow">COMMUNITY PROFILE</span><h2>@{nickname}</h2><p>{[profileForm.level, profileForm.college].filter(Boolean).join(' · ') || 'Community member'}</p><p>{profileForm.school || 'School not listed'}</p>{profiles.find(p => p.id === userId)?.premium_status === 'active' && profileForm.premium_title && <p className="rc-premium-title">{profileForm.premium_title}</p>}<div className="rc-lifetime-summary"><strong className="rc-experience-title">{getExperienceTitle(profiles.find(p => p.id === userId)?.total_online_seconds)}</strong><strong className="rc-lifetime-hours">{Math.floor((profiles.find(p => p.id === userId)?.total_online_seconds || 0) / 3600)} <span>lifetime hours</span></strong></div><button className="rc-primary" onClick={() => { setEditingProfile(true); setShowProfile(true); }}><Pencil size={16}/> Edit profile</button></div><div className="rc-privacy-card"><ShieldCheck size={20}/><div><strong>Your information stays private</strong><p>Your name, phone number, department and email aren't shown on your public profile.</p></div></div></> : <div className="rc-empty-state"><div className="rc-empty-icon"><UserRound size={27}/></div><h2>Create your profile</h2><p>Choose a nickname and add your school details to join the community.</p><button className="rc-primary" onClick={openProfileEditor}>Create profile <Plus size={16}/></button></div>}{<section className="rc-content-section rc-online-rankings"><div className="rc-section-title"><div><h2>Community rankings</h2><p>Members ranked by recorded online hours.</p></div></div><div className="rc-group-list">{(() => { const ranked = [...profiles].sort((a,b)=>rankingSeconds(b)-rankingSeconds(a)); const top = ranked.slice(0,10); const meIndex = ranked.findIndex(p => p.id === userId); if (meIndex >= 10 && meIndex >= 0) top.push(ranked[meIndex]); return top.map(p => { const rank = ranked.findIndex(r => r.id === p.id) + 1; return <div className={`rc-group-row ${p.id === userId ? 'rc-current-rank' : ''}`} key={p.id}><span className="rc-group-icon">#{rank > 999 ? '999+' : rank}</span><span className="rc-group-info"><strong>@{p.nickname}{p.premium_status === 'active' ? ' ★' : ''}</strong><small>{getExperienceTitle(p.total_online_seconds)}{p.premium_status === 'active' && p.premium_title ? ` · ${p.premium_title}` : ''}</small></span><span className="rc-arrow">{Math.floor(rankingSeconds(p)/3600)}<span className="rc-hour-unit">h</span></span></div>; }); })()}</div></section>}</section>}

      {page.name === 'Premium' && <section className="rc-content-section rc-premium-page">
        <button className="rc-secondary rc-premium-back" onClick={() => setTab('My Profile')}><ArrowLeft size={16}/> Back to profile</button>
        <div className="rc-profile-card" style={{ maxWidth: 620, margin: '0 auto', padding: 28 }}>
          <div className="rc-empty-icon" style={{ margin: '0 auto 16px' }}><Crown size={30}/></div>
          <span className="rc-eyebrow">MR RICH CONNECT MEMBERSHIP</span>
          <h2 style={{ fontSize: 30, margin: '12px 0' }}>Go Premium</h2>
          <p>Pay ₦1,500 for one month (30 days) of MR RICH CONNECT Premium.</p>
          <div style={{ margin: '24px 0', padding: 20, border: '1px solid rgba(96,165,250,.35)', borderRadius: 16 }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#60a5fa' }}>₦1,500 <span style={{ fontSize: 15, fontWeight: 500 }}> / month</span></div>
            <p style={{ marginBottom: 0 }}>Your payment covers 30 days of Premium membership from successful payment confirmation. It is not a lifetime subscription.</p>
          </div>
          <ul style={{ textAlign: 'left', lineHeight: 2, paddingLeft: 22 }}>
            <li>Premium Member title on your profile</li>
            <li>Distinct Premium status in the community</li>
            <li>Secure payment through Paystack</li>
          </ul>
          {profileForm && profileExists && profileForm.nickname && <p className="rc-muted">Signed in as @{nickname}</p>}
          {profiles.find(p => p.id === userId)?.premium_status === 'active'
            ? <div className="rc-notice"><Crown size={18}/><span>Your Premium membership is active{profiles.find(p => p.id === userId)?.premium_title ? ` — ${profiles.find(p => p.id === userId)?.premium_title}` : ''}.</span></div>
            : <button className="rc-primary rc-full" disabled={premiumBusy} onClick={() => void startPremiumPayment()}><Crown size={17}/>{premiumBusy ? 'Connecting to Paystack…' : 'Upgrade to Premium — ₦1,500'}</button>}
          <p className="rc-muted" style={{ fontSize: 12, marginTop: 14 }}>Your membership activates only after Paystack confirms successful payment.</p>
        </div>
      </section>}
      </section>;
      })}
    </div></div>}


    {tab !== 'Messages' && <footer className="rc-footer"><span>© {new Date().getFullYear()} MR RICH CONNECT</span><span><ShieldCheck size={13}/> Your campus. Your community.</span></footer>}

    {userId && !selectedConversation && <nav className="rc-bottom-nav" aria-label="Main navigation">{NAV_ITEMS.filter(item => item.name !== 'Premium').map(item => <button key={item.name} className={`rc-bottom-item ${tab === item.name ? 'active' : ''}`} onClick={() => { setTab(item.name); setShowProfile(false); setShowGroup(false); setShowEmojiPicker(false); }}><span className="rc-bottom-icon"><item.icon size={24} strokeWidth={tab === item.name ? 2.5 : 2}/>{item.name === 'Requests' && requests > 0 && <i className="rc-nav-badge">{requests > 99 ? '99+' : requests}</i>}{item.name === 'Messages' && Object.values(unreadCounts).reduce((sum, n) => sum + (n || 0), 0) > 0 && <i className="rc-nav-badge">{Object.values(unreadCounts).reduce((sum, n) => sum + (n || 0), 0) > 99 ? '99+' : Object.values(unreadCounts).reduce((sum, n) => sum + (n || 0), 0)}</i>}</span><span className="rc-bottom-label">{item.name === 'My Profile' ? 'Profile' : item.name}</span></button>)}</nav>}

    {userId && tab === 'My Profile' && !selectedConversation && !showProfile && !showGroup && !marketplaceOpen && <button className="rc-floating-premium" onClick={() => setTab('Premium')}><Crown size={17}/> Premium</button>}
    {userId && !selectedConversation && !showProfile && !showGroup && !showEmojiPicker && !marketplaceOpen && <button
      className="rc-floating-marketplace"
      style={marketplacePosition ? { left: marketplacePosition.x, top: marketplacePosition.y, right: 'auto', bottom: 'auto' } : undefined}
      onPointerDown={e => { marketplaceWasDragged.current = false; const rect = e.currentTarget.getBoundingClientRect(); marketplaceDrag.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, originX: marketplacePosition?.x ?? rect.left, originY: marketplacePosition?.y ?? rect.top }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { const drag = marketplaceDrag.current; if (!drag || drag.pointerId !== e.pointerId) return; if (Math.abs(e.clientX - drag.startX) > 5 || Math.abs(e.clientY - drag.startY) > 5) marketplaceWasDragged.current = true; const rect = e.currentTarget.getBoundingClientRect(); const buttonWidth = rect.width || 48; const buttonHeight = rect.height || 48; const x = Math.max(8, Math.min(window.innerWidth - buttonWidth - 8, drag.originX + e.clientX - drag.startX)); const y = Math.max(8, Math.min(window.innerHeight - buttonHeight - 8, drag.originY + e.clientY - drag.startY)); setMarketplacePosition({ x, y }); }}
      onPointerUp={e => { if (marketplaceDrag.current?.pointerId === e.pointerId) marketplaceDrag.current = null; }}
      onPointerCancel={() => { marketplaceDrag.current = null; }}
      onClick={() => { if (marketplaceWasDragged.current) { marketplaceWasDragged.current = false; return; } setMarketplaceOpen(true); }}
      aria-label="Open Marketplace"
    ><Store size={22}/></button>}
    {marketplaceOpen && <div className="rc-marketplace-screen"><button className="rc-icon-btn rc-marketplace-back" onClick={() => setMarketplaceOpen(false)} aria-label="Back"><ArrowLeft size={19}/></button><div className="rc-marketplace-message"><div className="rc-empty-icon"><Store size={30}/></div><h1>Marketplace coming soon</h1><p>We’re preparing something useful for the MR RICH CONNECT community.</p><button className="rc-primary" onClick={() => setMarketplaceOpen(false)}>Back to MR RICH CONNECT</button></div></div>}

    {showProfile && <div className="rc-modal-backdrop" onClick={() => { setShowProfile(false); setEditingProfile(false); }}><form className="rc-modal" onSubmit={saveProfile} onClick={e => e.stopPropagation()}><button type="button" className="rc-modal-close" onClick={() => { setShowProfile(false); setEditingProfile(false); }} aria-label="Close"><X size={20}/></button><span className="rc-eyebrow">YOUR PUBLIC IDENTITY</span><h2>{editingProfile ? 'Edit profile' : 'Create your profile'}</h2><p className="rc-muted">Public details are visible to members. Private details are only readable by your own account.</p><label>Nickname<input required maxLength={24} value={profileForm.nickname} onChange={e => setProfileForm({...profileForm, nickname:e.target.value})} placeholder="@yournickname"/></label><label>Level<select value={profileForm.level} onChange={e => setProfileForm({...profileForm,level:e.target.value})}><option value="">Select level</option>{PROFILE_LEVELS.map(level=><option key={level} value={level}>{level}</option>)}</select></label><label>College<input value={profileForm.college} onChange={e => setProfileForm({...profileForm, college:e.target.value})} placeholder="Your college"/></label><label>School / institution<input value={profileForm.school} onChange={e => setProfileForm({...profileForm,school:e.target.value})} placeholder="Type to search Nigerian institutions…" autoComplete="off"/><div className="rc-school-options rc-school-search-results">{NIGERIAN_SCHOOLS.filter(s=>profileForm.school.trim().length>0 && s.toLocaleLowerCase().includes(profileForm.school.toLocaleLowerCase())).slice(0,8).map(s=><button type="button" key={s} className="rc-secondary" onClick={()=>setProfileForm({...profileForm,school:s})}>{s}</button>)}</div></label>
<label>Department<input value={profileForm.department} onChange={e => setProfileForm({...profileForm, department:e.target.value})} placeholder="Your department"/></label>
<label>Profile avatar (optional)<input type="file" accept="image/*" onChange={e => void uploadAvatar(e.target.files?.[0])} disabled={avatarUploading}/></label>{avatarUploading && <p className="rc-muted">Uploading avatar…</p>}{profileForm.avatar_url && <div className="rc-avatar-preview"><img src={profileForm.avatar_url} alt="Avatar preview"/><button type="button" className="rc-secondary" onClick={() => setProfileForm({...profileForm,avatar_url:''})}>Remove photo</button></div>}<label>Or paste a profile photo URL<input type="url" value={profileForm.avatar_url} onChange={e => setProfileForm({...profileForm,avatar_url:e.target.value})} placeholder="https://..."/></label>
{profiles.find(p => p.id === userId)?.premium_status === 'active' && <label>Premium title (shown beside your name)<input maxLength={40} value={profileForm.premium_title} onChange={e=>setProfileForm({...profileForm,premium_title:e.target.value})} placeholder="e.g. Forex Trader"/><small className="rc-muted">Up to 40 characters. Available while your Premium membership is active.</small></label>}<label>About me (public)<textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio:e.target.value})} placeholder="Short introduction"/></label>
<h3>Private information — only you can read this</h3>
<label>Full name<input value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name:e.target.value})} placeholder="Your real name"/></label>
<label>Phone number<input type="tel" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone:e.target.value})} placeholder="Private phone number"/></label>
<div className="rc-privacy"><ShieldCheck size={15}/> Email is kept in your authentication account and isn't shown publicly. Full name and phone are stored separately.</div><button className="rc-primary rc-full" type="submit">Save profile</button></form></div>}
    {settingsGroup && <div className="rc-modal-backdrop" onClick={() => setSettingsGroup(null)}><form className="rc-modal" onSubmit={saveGroupSettings} onClick={e => e.stopPropagation()}><button type="button" className="rc-modal-close" onClick={() => setSettingsGroup(null)} aria-label="Close"><X size={20}/></button><span className="rc-eyebrow">GROUP ADMINISTRATION</span><h2>{settingsGroup.name} settings</h2><label>Change group image<input type="file" accept="image/*" onChange={e => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ''; void changeExistingGroupAvatar(settingsGroup, file); }}/></label><label>Member limit<select value={groupSettingsForm.member_limit} onChange={e => setGroupSettingsForm({...groupSettingsForm, member_limit:e.target.value})}>{[100,200,300,400,500,600,700,800,900,1000].map(n => <option key={n} value={String(n)}>{n} members</option>)}<option value="unlimited">Unlimited</option></select></label><fieldset><legend>Allowed user levels</legend><p className="rc-muted">Leave all unchecked to allow every level.</p>{['100','200','300','400','500','Graduate'].map(level => <label className="rc-setting-check" key={level}><span>{level}</span><input type="checkbox" checked={groupSettingsForm.allowed_levels.includes(level)} onChange={e => setGroupSettingsForm({...groupSettingsForm, allowed_levels:e.target.checked ? [...groupSettingsForm.allowed_levels, level] : groupSettingsForm.allowed_levels.filter(v => v !== level)})}/></label>)}</fieldset><fieldset><legend>Allowed schools</legend><p className="rc-muted">Leave all unchecked to allow every school.</p><input type="search" value={groupSchoolSearch} onChange={e=>setGroupSchoolSearch(e.target.value)} placeholder="Search universities, polytechnics, colleges…" aria-label="Search Nigerian schools"/><div className="rc-school-options">{NIGERIAN_SCHOOLS.filter(school=>school.toLocaleLowerCase().includes(groupSchoolSearch.toLocaleLowerCase())).map(school => <label className="rc-setting-check" key={school}><span>{school}</span><input type="checkbox" checked={groupSettingsForm.allowed_schools.includes(school)} onChange={e => setGroupSettingsForm({...groupSettingsForm, allowed_schools:e.target.checked ? [...groupSettingsForm.allowed_schools, school] : groupSettingsForm.allowed_schools.filter(v => v !== school)})}/></label>)}</div>{groupSettingsForm.allowed_schools.length>0 && <small>{groupSettingsForm.allowed_schools.length} school(s) selected</small>}</fieldset><label className="rc-setting-check"><span>Allow members to send messages (otherwise admin only)</span><input type="checkbox" checked={groupSettingsForm.members_can_message} onChange={e => setGroupSettingsForm({...groupSettingsForm, members_can_message:e.target.checked})}/></label><button className="rc-primary rc-full" type="submit">Save group settings</button></form></div>}
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
      .rc-shell { touch-action: pan-y; overflow-x: clip; padding-bottom: 0 !important; min-height: 100dvh; }
      

.rc-swipe-viewport {
  width: 100%;
  overflow: hidden;
  position: relative;
}
.rc-swipe-stage {
  display: flex;
  align-items: flex-start;
  width: 600%;
  position: relative;
  min-height: 0;
  will-change: transform;
  backface-visibility: hidden;
}
.rc-tab-panel {
  flex: 0 0 16.666667%;
  width: 16.666667%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  backface-visibility: hidden;
}
.rc-tab-panel.rc-panel-hidden { height: 0 !important; overflow: hidden !important; }
.rc-tab-panel.rc-panel-visible { height: auto; min-height: 0; }
@media (max-width: 800px) {
  .rc-swipe-viewport:has(.rc-messages-layout.has-chat) { min-height: 100dvh; }
}
.rc-swipe-stage.is-swiping { transition: transform 125ms cubic-bezier(.18,.75,.2,1); }
.rc-shell { position: relative; }
      /* The mobile chat overlay lives inside a transformed swipe track. Keep it
         sized and positioned against its own page panel, not the 500%-wide track. */
      @media (max-width: 800px) {
        .rc-tab-panel { position: relative; }
        .rc-messages-layout.has-chat {
          position: absolute !important;
          inset: calc(76px + var(--rc-visual-offset, 0px)) 0 auto 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: calc(var(--rc-visual-height, 100dvh) - 76px - var(--rc-visual-offset, 0px)) !important;
          max-height: calc(var(--rc-visual-height, 100dvh) - 76px - var(--rc-visual-offset, 0px)) !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }
        html.rc-keyboard-open .rc-messages-layout.has-chat {
          inset: 0 0 auto 0 !important;
          height: var(--rc-visual-height, 100dvh) !important;
          max-height: var(--rc-visual-height, 100dvh) !important;
        }
        .rc-messages-layout.has-chat .rc-chat-panel,
        .rc-messages-layout.has-chat .rc-composer-wrap,
        .rc-messages-layout.has-chat .rc-composer {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }
        .rc-messages-layout.has-chat .rc-composer-wrap { overflow: visible; }
        .rc-messages-layout.has-chat .rc-composer { overflow: hidden; }
      }
      .rc-bottom-nav { position: fixed !important; bottom: 0; z-index: 60; padding-bottom: max(8px, env(safe-area-inset-bottom)); transform: translate3d(0,0,0); }
      @media (prefers-reduced-motion: reduce) { .rc-swipe-stage { transition: none !important; } }
      @media (prefers-reduced-motion: reduce) { .rc-content-section, .rc-profile-page, .rc-messages-layout, .rc-messages-layout.has-chat .rc-chat-panel, .rc-messages-layout.chat-exiting .rc-chat-panel { animation: none !important; transition: none !important; } }

      .rc-simple-page-heading { align-items: center; }
      .rc-simple-page-heading > div { min-width: 0; }
      .rc-page-subtitle { margin: 6px 0 0; color: var(--rc-muted, #9caecb); font-size: 13px; }
      .rc-heading-notification { flex: 0 0 auto; margin-left: auto; }
      .rc-lifetime-summary { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; margin:14px 0; text-align:center; }
      .rc-experience-title, .rc-discover-details .rc-premium-badge { color:#32d296; font-weight:800; line-height:1.25; }
      .rc-lifetime-hours { color:#32d296; font-weight:800; line-height:1.3; }
      .rc-lifetime-hours span { color:#fff; font-weight:500; }
      .rc-premium-back { margin-bottom:14px; }
      .rc-unread-badge, .rc-nav-badge { background:#facc15 !important; color:#172033 !important; font-weight:800; }
      .rc-conversation-copy small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; }
      .rc-preview-ticks { color:#94a3b8; font-weight:800; white-space:nowrap; margin-left:3px; } .rc-preview-ticks.is-read { color:#facc15; }
      .rc-current-rank { border:1px solid rgba(96,165,250,.5); border-radius:12px; }
      .rc-admin-only-notice { width:100%; box-sizing:border-box; text-align:center; padding:18px 12px calc(18px + env(safe-area-inset-bottom)); color:#facc15; font-weight:800; background:rgba(16,43,88,.55); border-top:1px solid rgba(96,165,250,.25); } .rc-hour-unit { display:inline-block; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.82em; font-weight:900; letter-spacing:-.04em; margin-left:2px; }

      .rc-group-row-wrap { display:flex; align-items:stretch; gap:0; border:1px solid rgba(96,165,250,.25); border-radius:14px; overflow:hidden; background:rgba(16,43,88,.42); } .rc-group-row-wrap .rc-group-row { flex:1; min-width:0; border:0; border-radius:0; background:transparent; } .rc-edit-group-avatar { flex:0 0 48px; display:inline-flex; align-items:center; justify-content:center; margin:0; padding:8px; border:0; border-left:1px solid rgba(96,165,250,.25); border-radius:0; background:#102b58; color:#fff; cursor:pointer; } .rc-school-options { max-height:220px; overflow:auto; margin-top:8px; } .rc-modal fieldset input[type="search"] { width:100%; padding:10px; border-radius:10px; background:#0b1730; color:#fff; border:1px solid rgba(148,163,184,.3); }
      .rc-modal fieldset { border:1px solid rgba(148,163,184,.25); border-radius:12px; padding:12px; margin:8px 0 14px; } .rc-modal legend { padding:0 6px; font-weight:700; } .rc-setting-check { display:flex !important; flex-direction:column !important; align-items:flex-start !important; gap:7px !important; margin:12px 0 !important; } .rc-setting-check input { width:auto !important; margin:0 0 0 2px; } .rc-modal select { width:100%; padding:12px; border-radius:10px; background:#0b1730; color:#fff; border:1px solid rgba(148,163,184,.3); }
      .rc-preview-ticks { color:#94a3b8; font-weight:800; white-space:nowrap; } .rc-preview-ticks.is-read { color:#facc15; }
      .rc-current-rank { border:1px solid rgba(96,165,250,.5); border-radius:12px; }
      .rc-admin-only-notice { width:100%; box-sizing:border-box; text-align:center; padding:18px 12px calc(18px + env(safe-area-inset-bottom)); color:#facc15; font-weight:800; background:rgba(16,43,88,.55); border-top:1px solid rgba(96,165,250,.25); } .rc-hour-unit { display:inline-block; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.82em; font-weight:900; letter-spacing:-.04em; margin-left:2px; }
      .rc-floating-premium, .rc-floating-marketplace { position:fixed; z-index:55; display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid rgba(96,165,250,.55); border-radius:999px; background:#102b58; color:#fff; padding:11px 15px; font-weight:700; box-shadow:0 8px 28px rgba(0,0,0,.3); touch-action:none; }
      .rc-floating-premium { right:16px; bottom:calc(86px + env(safe-area-inset-bottom)); }
      .rc-floating-marketplace { right:16px; bottom:calc(140px + env(safe-area-inset-bottom)); cursor:grab; background:#facc15; color:#172033; border-color:#fde047; width:48px; height:48px; padding:0; border-radius:16px; }
      .rc-floating-marketplace:active { cursor:grabbing; }
      .rc-school-search-results { display:flex; flex-direction:column; gap:5px; max-height:180px; overflow:auto; margin-top:6px; } .rc-school-search-results button { text-align:left; justify-content:flex-start; width:100%; white-space:normal; } .rc-premium-title { color:#93c5fd; font-size:.88em; font-weight:700; }
      .rc-marketplace-screen { position:fixed; inset:0; z-index:100; background:#071326; color:#fff; display:flex; align-items:center; justify-content:center; padding:24px; }
      .rc-marketplace-back { position:absolute; top:calc(18px + env(safe-area-inset-top)); left:18px; }
      .rc-marketplace-message { width:min(100%,480px); text-align:center; display:flex; flex-direction:column; align-items:center; gap:12px; }
      .rc-marketplace-message h1 { margin:0; font-size:clamp(26px,5vw,38px); }
      .rc-marketplace-message p { color:#aab9d0; margin:0 0 10px; line-height:1.6; }
      @media (max-width:800px) { .rc-floating-premium { bottom:calc(82px + env(safe-area-inset-bottom)); } .rc-floating-marketplace { bottom:calc(136px + env(safe-area-inset-bottom)); } }

      /* Slim glass panels for each conversation in the Messages list. */
      .rc-conversation-row-wrap { margin-bottom: 7px !important; }
      .rc-conversation-row {
        border: 1px solid rgba(147,197,253,.18) !important;
        border-radius: 12px !important;
        background: rgba(148,163,184,.055) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.035);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 10px 11px !important;
        min-height: 64px;
      }
      .rc-conversation-row.active {
        border-color: rgba(96,165,250,.52) !important;
        background: rgba(37,99,235,.13) !important;
      }
      .rc-conversation-copy strong { font-size: 13px !important; }
      .rc-conversation-copy small { font-size: 11px !important; }

      /* Compact, left-aligned quoted/replied-to message previews. */
      .rc-replied-message {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        justify-content: flex-start !important;
        gap: 1px !important;
        width: fit-content;
        max-width: 100%;
        box-sizing: border-box;
        margin: 0 0 5px !important;
        padding: 3px 7px !important;
        text-align: left !important;
        line-height: 1.25 !important;
        border-left: 2px solid #60a5fa;
        border-radius: 4px 7px 7px 4px;
        background: rgba(2,6,23,.24);
      }
      .rc-replied-message strong,
      .rc-replied-message span {
        display: block !important;
        align-self: stretch;
        margin: 0 !important;
        padding: 0 !important;
        text-align: left !important;
        font-size: 10.5px !important;
        line-height: 1.25 !important;
        overflow-wrap: anywhere;
      }
      .rc-reply-preview {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 4px 8px !important;
        margin: 0 0 5px !important;
        border-radius: 8px !important;
        background: rgba(96,165,250,.09) !important;
        border-left: 2px solid #60a5fa !important;
      }
      .rc-reply-preview > div {
        display: flex !important;
        flex: 1;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 1px !important;
        min-width: 0;
        text-align: left !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .rc-reply-preview strong, .rc-reply-preview small {
        display: block !important;
        text-align: left !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.25 !important;
      }
      .rc-reply-preview strong { font-size: 11px !important; }
      .rc-reply-preview small { font-size: 10.5px !important; }

      /* Smaller text in both private and group message bubbles. */
      .rc-message-body {
        font-size: 12.5px !important;
        line-height: 1.4 !important;
        overflow-wrap: anywhere;
      }
      .rc-message-sender { font-size: 11px !important; line-height: 1.25 !important; }
      .rc-message-time { font-size: 9.5px !important; }
      .rc-message-row { -webkit-user-select: none; user-select: none; }
      .rc-message-row button, .rc-message-row audio, .rc-message-row input {
        -webkit-user-select: auto;
        user-select: auto;
      }

      /* Multiline composer: Enter inserts a newline, the Send button sends. */
      .rc-composer textarea[name="chat-message"] {
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        min-height: 42px;
        max-height: 120px;
        resize: none;
        overflow-y: auto;
        box-sizing: border-box;
        padding: 10px 9px;
        border: 0;
        outline: none;
        background: transparent;
        color: inherit;
        font: inherit;
        line-height: 1.35;
        white-space: pre-wrap;
      }
      /* Reflective glass conversation cards, with no shared enclosing panel. */
      .rc-messages-layout:not(.has-chat) { padding-bottom: calc(104px + env(safe-area-inset-bottom)) !important; background: transparent !important; border: 0 !important; box-shadow: none !important; }
      .rc-conversation-list {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 4px 2px calc(112px + env(safe-area-inset-bottom)) !important;
        overflow-y: auto !important;
        overscroll-behavior-y: contain;
        scrollbar-gutter: stable;
      }
      .rc-conversation-row-wrap { background: transparent !important; border: 0 !important; box-shadow: none !important; }
      .rc-conversation-row {
        position: relative !important;
        overflow: hidden !important;
        background: linear-gradient(128deg, rgba(255,255,255,.105) 0%, rgba(148,163,184,.045) 34%, rgba(37,99,235,.065) 70%, rgba(255,255,255,.025) 100%) !important;
        border: 1px solid rgba(191,219,254,.22) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.17), inset 0 -1px 0 rgba(96,165,250,.07), 0 5px 16px rgba(0,0,0,.12) !important;
        backdrop-filter: blur(16px) saturate(135%);
        -webkit-backdrop-filter: blur(16px) saturate(135%);
      }
      .rc-conversation-row::before {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(112deg, transparent 8%, rgba(255,255,255,.11) 24%, rgba(255,255,255,.025) 37%, transparent 52%);
        opacity: .9;
      }
      .rc-conversation-row > * { position: relative; z-index: 1; }
      .rc-conversation-row.active { background: linear-gradient(125deg, rgba(147,197,253,.17), rgba(37,99,235,.12), rgba(255,255,255,.035)) !important; }
      .rc-conversation-kind { display:block; color:#93c5fd; font-size:10px; line-height:1.2; margin:1px 0 3px; }
      .rc-conversation-copy small { line-height:1.3; }
      .rc-page-heading.rc-simple-page-heading { margin-top: 0 !important; padding-top: 2px !important; }
      .rc-page-heading.rc-simple-page-heading h1 { margin-top: 0 !important; }
      .rc-toast {
        position: fixed !important;
        top: max(12px, calc(env(safe-area-inset-top) + 8px)) !important;
        bottom: auto !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: min( calc(100vw - 24px), 520px) !important;
        max-width: calc(100vw - 24px) !important;
        max-height: min(34dvh, 220px) !important;
        overflow-y: auto !important;
        overflow-wrap: anywhere !important;
        z-index: 9999 !important;
        box-sizing: border-box !important;
      }
      .rc-swipe-viewport { padding-bottom: calc(86px + env(safe-area-inset-bottom)); box-sizing: border-box; }
      .rc-tab-panel.rc-panel-visible { padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
      .rc-conversation-list::-webkit-scrollbar { width: 3px; }
      .rc-conversation-list::-webkit-scrollbar-thumb { background: rgba(147,197,253,.24); border-radius: 99px; }
    `}
</style>
  </main>
);
}
