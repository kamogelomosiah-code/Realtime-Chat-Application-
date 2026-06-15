/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Camera, Mic, MicOff, LogOut, Radio, Sun, Moon, Send, Users, X, Bell, BellOff, Volume2, VolumeX, Menu, MoreVertical, Share2, Mail, Link as LinkIcon, Check, ArrowLeft, ChevronRight, Sliders, Settings } from 'lucide-react';
import { Message } from './types';

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Tone 1: E5 (659.25 Hz) - crisp resonant chime tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Tone 2: A5 (880.00 Hz) - slightly delayed higher octave tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch (error) {
    console.error("Audio playback error:", error);
  }
}

interface UserAvatarProps {
  name: string;
  className?: string;
  theme?: 'light' | 'dark';
}

function UserAvatar({ name, className = "w-8 h-8", theme = "dark" }: UserAvatarProps) {
  const hash = hashCode(name || "User");
  const initials = (name || "U").substring(0, 2).toUpperCase();

  // Background style based on theme & hash
  const bgClasses = theme === 'dark'
    ? 'bg-zinc-900 text-zinc-100 border border-zinc-900'
    : 'bg-zinc-100 text-zinc-900 border border-zinc-200';

  // Beautiful geometric variations matching our premium minimalist aesthetic
  const patternType = hash % 6; 
  const shapeType = (hash >> 2) % 6; 
  const accentType = (hash >> 4) % 6; 

  const strokeColor = theme === 'dark' ? 'stroke-zinc-800' : 'stroke-zinc-200';
  const fillColor = theme === 'dark' ? 'fill-zinc-900' : 'fill-zinc-100';

  return (
    <div className={`relative rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${className} ${bgClasses}`}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Patterns */}
        {patternType === 0 && (
          <g opacity="0.12">
            <line x1="0" y1="20" x2="100" y2="20" className={strokeColor} strokeWidth="2" />
            <line x1="0" y1="40" x2="100" y2="40" className={strokeColor} strokeWidth="2" />
            <line x1="0" y1="60" x2="100" y2="60" className={strokeColor} strokeWidth="2" />
            <line x1="0" y1="80" x2="100" y2="80" className={strokeColor} strokeWidth="2" />
          </g>
        )}
        {patternType === 1 && (
          <g opacity="0.12">
            <line x1="20" y1="0" x2="20" y2="100" className={strokeColor} strokeWidth="2" />
            <line x1="40" y1="0" x2="40" y2="100" className={strokeColor} strokeWidth="2" />
            <line x1="60" y1="0" x2="60" y2="100" className={strokeColor} strokeWidth="2" />
            <line x1="80" y1="0" x2="80" y2="100" className={strokeColor} strokeWidth="2" />
          </g>
        )}
        {patternType === 2 && (
          <g opacity="0.1" fill="none" className={strokeColor}>
            <circle cx="50" cy="50" r="15" strokeWidth="2" />
            <circle cx="50" cy="50" r="30" strokeWidth="2" />
            <circle cx="50" cy="50" r="45" strokeWidth="2" />
          </g>
        )}
        {patternType === 3 && (
          <g opacity="0.12" className={strokeColor} strokeWidth="2">
            <line x1="0" y1="0" x2="100" y2="100" />
            <line x1="100" y1="0" x2="0" y2="100" />
          </g>
        )}
        {patternType === 4 && (
          <g opacity="0.12" className={fillColor}>
            <rect x="10" y="10" width="15" height="15" />
            <rect x="75" y="10" width="15" height="15" />
            <rect x="10" y="75" width="15" height="15" />
            <rect x="75" y="75" width="15" height="15" />
          </g>
        )}
        {patternType === 5 && (
          <g opacity="0.12" fill="none" className={strokeColor} strokeWidth="2" strokeDasharray="3 3">
            <path d="M10,50 Q50,0 90,50 T10,50" />
          </g>
        )}

        {/* Foreground Structures */}
        {shapeType === 0 && (
          <rect x="25" y="25" width="50" height="50" className={`${theme === 'dark' ? 'fill-zinc-900/40' : 'fill-zinc-100/40'} ${strokeColor}`} strokeWidth="2" rx="8" transform="rotate(45 50 50)" opacity="0.3" />
        )}
        {shapeType === 1 && (
          <circle cx="50" cy="50" r="28" className={`${theme === 'dark' ? 'fill-zinc-900/30' : 'fill-zinc-100/30'} ${strokeColor}`} strokeWidth="2" opacity="0.4" />
        )}
        {shapeType === 2 && (
          <path d="M50,15 L85,75 L15,75 Z" className={`${theme === 'dark' ? 'fill-zinc-900/30' : 'fill-zinc-100/30'} ${strokeColor}`} strokeWidth="2" rx="4" opacity="0.3" transform="rotate(15 50 50)" />
        )}
        {shapeType === 3 && (
          <g opacity="0.25" className={strokeColor} strokeWidth="2.5">
            <path d="M20,50 L80,50" />
            <path d="M50,20 L50,80" />
          </g>
        )}
        {shapeType === 4 && (
          <g opacity="0.3" className={fillColor}>
            <circle cx="25" cy="50" r="6" />
            <circle cx="50" cy="50" r="10" />
            <circle cx="75" cy="50" r="6" />
          </g>
        )}
        {shapeType === 5 && (
          <path d="M30,30 Q50,0 70,30 T70,70" fill="none" className={strokeColor} strokeWidth="3" opacity="0.25" />
        )}

        {/* Dynamic Micro-Accent highlights based on theme color */}
        {accentType === 0 && (
          <circle cx="80" cy="20" r="8" className="fill-accent" opacity="0.45" />
        )}
        {accentType === 1 && (
          <path d="M0,0 L40,0 L0,40 Z" className="fill-accent" opacity="0.3" />
        )}
        {accentType === 2 && (
          <rect x="42" y="10" width="16" height="16" className="fill-accent" rx="4" transform="rotate(45 50 18)" opacity="0.4" />
        )}
        {accentType === 3 && (
          <g opacity="0.45" className="stroke-accent" strokeWidth="2.5">
            <circle cx="50" cy="50" r="38" fill="none" strokeDasharray="6 30" />
          </g>
        )}
        {accentType === 4 && (
          <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" className="stroke-accent" strokeWidth="1.5" opacity="0.3" />
        )}
        {accentType === 5 && (
          <path d="M15,85 C35,65 65,65 85,85" fill="none" className="stroke-accent" strokeWidth="5" strokeLinecap="round" opacity="0.3" />
        )}
      </svg>

      {/* Clean elegant high-contrast display typography initials */}
      <span className="relative z-10 font-bold tracking-tight select-none uppercase font-sans">
        {initials}
      </span>
    </div>
  );
}

export default function App() {
  const [serverUrl, setServerUrl] = useState<string>(() => {
    const stored = localStorage.getItem('relay_server_url');
    if (stored) return stored;
    return window.location.origin;
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState('');
  const [joined, setJoined] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Sound and Desktop push notification states
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pref_sound') !== 'false';
  });
  const [desktopNotificationEnabled, setDesktopNotificationEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_desktop_notification');
    if (saved !== null) {
      return saved === 'true';
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [toasts, setToasts] = useState<Array<{ id: string; sender: string; text: string; recipient: string; avatarName: string }>>([]);

  // States for Email Invite System and Landing Page Stages
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSenderName, setInviteSenderName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSendingSimulated, setIsSendingSimulated] = useState(false);

  // Landing page stages:
  // 'welcome' - shows active users, "Start Chat" CTA, and "Invite Friends"
  // 'input_name' - shows user icon, name input field, and "Join" button
  const [landingStage, setLandingStage] = useState<'welcome' | 'input_name'>('welcome');

  // Nav menu state
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maintain active state configurations for use inside event listener closure without causing re-registrations
  const selectedRecipientRef = useRef(selectedRecipient);
  selectedRecipientRef.current = selectedRecipient;

  const userNameRef = useRef(userName);
  userNameRef.current = userName;

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const desktopNotificationEnabledRef = useRef(desktopNotificationEnabled);
  desktopNotificationEnabledRef.current = desktopNotificationEnabled;

  const notificationPermissionStatusRef = useRef(notificationPermissionStatus);
  notificationPermissionStatusRef.current = notificationPermissionStatus;

  // Dynamically manage connection when serverUrl changes
  useEffect(() => {
    const endpoint = serverUrl || window.location.origin;
    
    setConnectionStatus('connecting');
    const customSocket = io(endpoint, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
    });

    customSocket.on('connect', () => {
      setConnectionStatus('connected');
    });

    customSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    customSocket.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    setSocket(customSocket);

    return () => {
      customSocket.disconnect();
    };
  }, [serverUrl]);

  // Handle packet subscriptions on active socket changes
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);

      // If message is sent by someone else, handle audio and visual notifications
      if (msg.sender !== userNameRef.current) {
        const activeRecipient = selectedRecipientRef.current;
        const currentUserName = userNameRef.current;

        // Check if user is currently viewing the conversation room this message belongs to
        const isCurrentlyInConversation = 
          (activeRecipient === 'All' && msg.recipient === 'All') || 
          (activeRecipient === msg.sender && msg.recipient === currentUserName);

        // 1. Play harmonic warm chime sound
        if (soundEnabledRef.current) {
          playNotificationSound();
        }

        // 2. Trigger native desktop push notification whenever a message is received
        if (
          desktopNotificationEnabledRef.current && 
          notificationPermissionStatusRef.current === 'granted' && 
          ('Notification' in window)
        ) {
          try {
            const title = `${msg.sender} (${msg.recipient === 'All' ? 'All Users' : 'Direct Message'})`;
            const textBody = msg.text || (msg.image ? '📷 Shared an image' : msg.audio ? '🎙️ Sent a voice note' : 'New message');
            const n = new Notification(title, {
              body: textBody,
              icon: '/favicon.ico',
              tag: msg.sender,
            });
            n.onclick = () => {
              window.focus();
              if (msg.recipient === 'All') {
                setSelectedRecipient('All');
              } else {
                setSelectedRecipient(msg.sender);
              }
              n.close();
            };
          } catch (err) {
            console.warn("Desktop notification trigger failed inside iframe sandbox:", err);
          }
        }

        // 3. Trigger beautifully animated in-app toast if the conversation is not the active one
        if (!isCurrentlyInConversation) {
          const toastId = `${msg.id || Date.now()}-toast`;
          const textBody = msg.text || (msg.image ? '📷 Shared an image' : msg.audio ? '🎙️ Sent a voice note' : 'New message');
          const newToast = {
            id: toastId,
            sender: msg.sender,
            text: textBody,
            recipient: msg.recipient,
            avatarName: msg.sender
          };
          setToasts((prev) => [...prev, newToast]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toastId));
          }, 5000);
        }
      }
    };
    const handleUserList = (users: string[]) => {
      setOnlineUsers(users);
    };
    const handleJoinError = (err: string) => {
      alert(err);
    };
    const handleUserJoined = (username: string) => {
      if (username !== userNameRef.current) {
        if (soundEnabledRef.current) {
          playNotificationSound();
        }
        const toastId = `join-${username}-${Date.now()}`;
        setToasts((prev) => [
          ...prev, 
          {
            id: toastId,
            sender: "System",
            text: `📶 ${username} has joined the stream`,
            recipient: "All",
            avatarName: username
          }
        ]);
        setTimeout(() => {
          setToasts((prev) => prev.filter(t => t.id !== toastId));
        }, 5000);

        setMessages((prev) => [
          ...prev,
          {
            id: `sys-join-${username}-${Date.now()}`,
            text: `📶 ${username} has connected to the frequency`,
            sender: 'System',
            recipient: 'All',
            timestamp: Date.now()
          }
        ]);
      }
    };
    const handleUserLeft = (username: string) => {
      if (username !== userNameRef.current) {
        const toastId = `left-${username}-${Date.now()}`;
        setToasts((prev) => [
          ...prev, 
          {
            id: toastId,
            sender: "System",
            text: `🔌 ${username} left the stream`,
            recipient: "All",
            avatarName: username
          }
        ]);
        setTimeout(() => {
          setToasts((prev) => prev.filter(t => t.id !== toastId));
        }, 5000);

        setMessages((prev) => [
          ...prev,
          {
            id: `sys-left-${username}-${Date.now()}`,
            text: `🔌 ${username} left the frequency`,
            sender: 'System',
            recipient: 'All',
            timestamp: Date.now()
          }
        ]);
      }
    };

    socket.on('chat_message', handleChatMessage);
    socket.on('user_list', handleUserList);
    socket.on('join_error', handleJoinError);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);

    return () => {
      socket.off('chat_message', handleChatMessage);
      socket.off('user_list', handleUserList);
      socket.off('join_error', handleJoinError);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
    };
  }, [socket]);

  const handleJoin = () => {
    if (!userName.trim() || !socket) return;
    socket.once('join_success', () => {
      setJoined(true);
      // Auto-request notification permission on Chrome / modern browsers upon successful stream join
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((res) => {
          setNotificationPermissionStatus(res);
          if (res === 'granted') {
            setDesktopNotificationEnabled(true);
            localStorage.setItem('pref_desktop_notification', 'true');
            try {
              new Notification("Frequencies Calibrated 📶", {
                body: "Ephemeral Relay notifications are now fully active on this device.",
                icon: "/favicon.ico"
              });
            } catch (e) {}
          }
        });
      }
    });
    socket.once('join_error', (err) => { alert(err); });
    socket.emit('join', userName);
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    window.location.reload();
  };

  const handleDesktopNotificationToggle = async () => {
    if (!('Notification' in window)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }

    if (Notification.permission === 'denied') {
      alert("Desktop notifications are blocked by your browser settings. Please enable them in your address bar/browser settings.");
      return;
    }

    if (Notification.permission === 'default') {
      try {
        const res = await Notification.requestPermission();
        setNotificationPermissionStatus(res);
        if (res === 'granted') {
          setDesktopNotificationEnabled(true);
          localStorage.setItem('pref_desktop_notification', 'true');
          new Notification("Notifications Enabled", {
            body: "You will now receive alerts when someone sends a message!",
          });
        }
      } catch (err) {
        console.warn("Failed to request push permission in iframe:", err);
      }
    } else if (Notification.permission === 'granted') {
      const newVal = !desktopNotificationEnabled;
      setDesktopNotificationEnabled(newVal);
      localStorage.setItem('pref_desktop_notification', String(newVal));
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (image?: string, audio?: string) => {
    if ((!input.trim() && !image && !audio) || !userName || !socket) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: input,
      image,
      audio,
      sender: userName,
      recipient: selectedRecipient,
      timestamp: Date.now(),
    };
    socket.emit('chat_message', msg);
    setInput('');
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
            sendMessage(undefined, reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
    };
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
  
  const getUserColor = (name: string) => {
    return theme === 'dark' 
      ? 'bg-zinc-900 text-zinc-100 border border-zinc-800' 
      : 'bg-zinc-100 text-zinc-900 border border-zinc-200';
  };

  const renderInviteModal = () => {
    return (
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop glass blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowInviteModal(false);
                setInviteEmail('');
                setIsSendingSimulated(false);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Modal Sheet Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className={`relative w-full max-w-md rounded-3xl border p-6 overflow-hidden shadow-2xl ${
                theme === 'dark' 
                  ? 'bg-zinc-950 border-zinc-900 text-zinc-100' 
                  : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Share2 size={15} />
                  </div>
                  <h3 className="text-lg font-medium tracking-tight">Invite peers</h3>
                </div>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setIsSendingSimulated(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 font-sans text-left">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Invite friends to sync up onto this same channel frequency instantly! Enter their email to spawn an email draft with your signature or copy the connection link.
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 px-1">Recipient email address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. friend@example.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-full text-sm font-sans focus:outline-none border focus:ring-2 focus:ring-accent/50 focus:border-accent ${
                        theme === 'dark' 
                          ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' 
                          : 'bg-zinc-50 border-zinc-200 text-black placeholder-zinc-400'
                      }`}
                    />
                    <Mail size={16} className="absolute left-4 top-3.5 text-zinc-400" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 px-1">Your signature name</label>
                  <input
                    type="text"
                    value={inviteSenderName}
                    onChange={(e) => setInviteSenderName(e.target.value)}
                    placeholder={userName || "Your name"}
                    className={`w-full px-4 py-3 rounded-full text-sm font-sans focus:outline-none border focus:ring-2 focus:ring-accent/50 focus:border-accent ${
                      theme === 'dark' 
                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' 
                        : 'bg-zinc-50 border-zinc-200 text-black placeholder-zinc-400'
                    }`}
                  />
                </div>

                {/* Simulated Compose Preview Box */}
                <div className={`p-4 rounded-3xl border text-xs space-y-2 block ${
                  theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                }`}>
                  <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-2 font-medium text-[10px] text-zinc-500 uppercase tracking-wide">
                    <span>Template preview</span>
                    <span className="text-accent">● High fidelity</span>
                  </div>
                  <p className="font-semibold text-zinc-350 dark:text-zinc-300">Subject: <span className="font-normal">Connect with me on Ephemeral Relay!</span></p>
                  <p className="leading-relaxed pt-1 font-mono">
                    "Hi there! Connect with me on Ephemeral Relay for a minimalist secure instant conversation of files and voice notes. Join the frequency here: {window.location.origin}"
                  </p>
                </div>

                {/* Actions list */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (!inviteEmail.trim()) {
                        alert("Please specify a recipient email address to spawn the invitation.");
                        return;
                      }
                      
                      const sender = inviteSenderName.trim() || userName.trim() || "A Peer";
                      const subject = encodeURIComponent("Sync up with me on Ephemeral Relay!");
                      const body = encodeURIComponent(`Hi there,\n\n${sender} wants to invite you to join them on Ephemeral Relay, a minimalist real-time chat application.\n\nSync up and chat instantly here:\n${window.location.origin}\n\nHope to see you on stream!`);
                      
                      // Trigger mailto client
                      window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
                      
                      // Run animated simulated sequence
                      setIsSendingSimulated(true);
                      setTimeout(() => {
                        setIsSendingSimulated(false);
                        setShowInviteModal(false);
                        setInviteEmail('');
                        
                        // Show temporary confirmation toast
                        const tempId = `toast-success-invite-${Date.now()}`;
                        setToasts((prev) => [...prev, {
                          id: tempId,
                          sender: "System",
                          text: `✉️ Opened email client invitation for ${inviteEmail}`,
                          recipient: "You",
                          avatarName: "System"
                        }]);
                        setTimeout(() => {
                          setToasts((prev) => prev.filter(t => t.id !== tempId));
                        }, 5000);

                      }, 1000);
                    }}
                    disabled={isSendingSimulated}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-full text-sm font-medium shadow-sm hover:bg-accent/90 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSendingSimulated ? (
                      <span className="animate-pulse">Launching email client...</span>
                    ) : (
                      <>
                        <Mail size={16} />
                        <span>Open mail draft</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                      
                      const tempId = `toast-copied-${Date.now()}`;
                      setToasts((prev) => [...prev, {
                        id: tempId,
                        sender: "System",
                        text: "📋 Link copied to clipboard!",
                        recipient: "You",
                        avatarName: "System"
                      }]);
                      setTimeout(() => {
                        setToasts((prev) => prev.filter(t => t.id !== tempId));
                      }, 5000);
                    }}
                    type="button"
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all cursor-pointer active:scale-95 ${
                      theme === 'dark' 
                        ? 'hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' 
                        : 'hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    {copiedLink ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
                    <span>{copiedLink ? "Link copied" : "Copy share link"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };
  
  if (!joined) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 font-sans relative overflow-hidden"
      >
        <div className="w-full max-w-sm p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center text-center relative z-10 shadow-lg">
          
          <AnimatePresence mode="wait">
            {landingStage === 'welcome' ? (
              <motion.div
                key="welcome-stage"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xl mb-4 font-sans select-none">
                  <Radio size={24} />
                </div>
                <h1 className="text-2xl font-medium mb-1 tracking-tight">
                  Ephemeral Relay
                </h1>
                <p className="text-zinc-500 text-sm mb-8">Minimalist real-time chat</p>

                {/* ACTIVE PEERS CONTAINER */}
                <div className="w-full text-left mb-6">
                  <span className="text-xs text-zinc-500 font-medium tracking-wide block mb-2.5 px-1">
                    Live channel status
                  </span>
                  
                  {onlineUsers.length > 0 ? (
                    <div className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-3xl space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[11px] text-zinc-405 font-sans font-semibold">
                          {onlineUsers.length} Peer{onlineUsers.length > 1 ? 's' : ''} Online Now
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {onlineUsers.map((user) => (
                          <div 
                            key={user}
                            className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-900/60 px-2.5 py-1 rounded-full text-[11px] text-zinc-300 max-w-full"
                          >
                            <UserAvatar name={user} className="w-4 h-4 text-[7px]" theme="dark" />
                            <span className="truncate max-w-[80px] font-sans font-medium">{user}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 px-4 py-4 rounded-3xl flex flex-col items-center text-center">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs opacity-50 mb-1.5"><Radio size={12}/></div>
                      <p className="text-zinc-500 text-sm font-medium">Frequency is quiet</p>
                      <p className="text-xs text-zinc-400 max-w-[180px] leading-relaxed mt-0.5">Be the first to establish a stream</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setLandingStage('input_name')}
                  className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-full font-medium transition-all text-sm shadow-sm active:scale-95 w-full mb-3 cursor-pointer"
                >
                  Start chat
                </button>

                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-6 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full font-medium transition-all text-sm shadow-sm active:scale-95 w-full mb-6 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 size={16} />
                  <span>Invite friends</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="input-name-stage"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center relative"
              >
                {/* Back button */}
                <button
                  onClick={() => setLandingStage('welcome')}
                  className="absolute left-0 top-0 p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-full transition-all flex items-center justify-center cursor-pointer"
                  title="Back to Welcome"
                >
                  <ArrowLeft size={16} />
                </button>

                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1 mt-8 tracking-tight">
                  Choose a pseudonym
                </h2>
                <p className="text-sm text-zinc-500 mb-6">How peers identify your node</p>

                {/* Real-time Dynamic Avatar profile preview */}
                <div className="mb-6 flex flex-col items-center gap-2">
                  <UserAvatar 
                    name={userName.trim() || "?"} 
                    className="w-20 h-20 text-xl font-medium shadow-sm border-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    theme={theme}
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-1">
                    {userName.trim() ? userName.trim() : "Preview"}
                  </span>
                </div>
                
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="Enter your name..."
                  className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-full border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-accent w-full mb-4 font-sans text-base text-center placeholder-zinc-400"
                  autoFocus
                />
                
                <button
                  onClick={handleJoin}
                  disabled={!userName.trim()}
                  className="px-6 py-2.5 bg-accent text-white rounded-full font-medium hover:bg-accent-hover transition-all text-sm shadow-sm active:scale-95 w-full disabled:opacity-40 disabled:cursor-not-allowed mb-6 cursor-pointer"
                >
                  Join stream
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsible Relay URL config for GitHub Pages deployment */}
          <div className="w-full text-left">
            <details className={`group border rounded-2xl px-4 py-3 select-none transition-all duration-300 ${
              theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}>
              <summary className="list-none flex items-center justify-between text-xs font-medium cursor-pointer py-1">
                <span>Relay configuration</span>
                <span className="transition-transform group-open:rotate-180 text-[10px]">▼</span>
              </summary>
              <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">Relay server URL</label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setServerUrl(val);
                      localStorage.setItem('relay_server_url', val);
                    }}
                    placeholder="e.g. http://localhost:3000"
                    className={`px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-accent/50 text-xs font-mono w-full ${
                      theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-300 placeholder-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Status:</span>
                  <span className={`font-medium ${connectionStatus === 'connected' ? 'text-emerald-500' : 'text-zinc-500 animate-pulse'}`}>
                    ● {connectionStatus}
                  </span>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Dynamic Invitation Modal overlay */}
        {showInviteModal && renderInviteModal()}

      </motion.div>
    );
  }

  const displayedMessages = messages.filter((msg) => {
    if (selectedRecipient === "All") {
      return msg.recipient === "All";
    }
    return (
      (msg.sender === userName && msg.recipient === selectedRecipient) ||
      (msg.sender === selectedRecipient && msg.recipient === userName)
    );
  });

  return (
    <div className={`flex flex-col h-[100dvh] ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} font-sans antialiased overflow-hidden`}>
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-[90vw] sm:w-[320px] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`pointer-events-auto cursor-pointer flex gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all active:scale-[0.98] ${
                theme === 'dark'
                  ? 'bg-zinc-900/95 text-zinc-100 border-zinc-800'
                  : 'bg-white/95 text-zinc-900 border-zinc-200'
              }`}
              onClick={() => {
                if (toast.recipient === 'All') {
                  setSelectedRecipient('All');
                } else {
                  setSelectedRecipient(toast.sender);
                }
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
            >
              <UserAvatar name={toast.avatarName} className="w-8 h-8 text-[11px] font-bold" theme={theme} />
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-bold font-display truncate">Incoming from {toast.sender}</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-sans tracking-wide truncate mt-0.5">{toast.text}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
                className="text-zinc-400 hover:text-zinc-205 dark:hover:text-white p-1 self-start transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop overlay for mobile drawer */}
        <AnimatePresence>
          {isAsideOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAsideOpen(false)}
              className="md:hidden fixed inset-0 bg-black z-40"
            />
          )}
        </AnimatePresence>

        {/* Sidebar/Aside - Slide-out menu for mobile, static for desktop */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
          ${isAsideOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          md:translate-x-0 md:relative md:z-0 md:w-64 md:flex flex-col
          bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800
          p-4 space-y-4 flex flex-col h-full
        `}>
          <div className="flex items-center justify-between px-2 pt-2">
            <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Online users</h2>
            <button className="md:hidden text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-bold p-1" onClick={() => setIsAsideOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div 
            onClick={() => { setSelectedRecipient("All"); setIsAsideOpen(false); }}
            className={`cursor-pointer text-sm font-medium flex items-center gap-3 p-3 rounded-full transition-colors font-sans ${selectedRecipient === "All" ? 'text-accent bg-accent/10 dark:bg-accent/20 font-medium' : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-700 hover:bg-zinc-200 hover:text-black'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${selectedRecipient === 'All' ? 'bg-accent/20 text-accent' : theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}>
              <Users size={16} />
            </div>
            <span>Public Room</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {onlineUsers.filter(u => u !== userName).length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 h-32 text-center">
                <p className="text-xs text-zinc-550 dark:text-zinc-500 font-sans">Wait mode</p>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-600 mt-1">Waiting for other peers to align to this channel...</p>
              </div>
            ) : (
              onlineUsers.filter(u => u !== userName).map((user) => (
                <div 
                  key={user} 
                  onClick={() => { setSelectedRecipient(user); setIsAsideOpen(false); }}
                  className={`cursor-pointer text-sm font-medium flex items-center gap-3 p-2 rounded-full transition-colors font-sans ${selectedRecipient === user ? 'text-accent bg-accent/10 dark:bg-accent/20 font-medium' : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-700 hover:bg-zinc-200 hover:text-black'}`}
                >
                  <UserAvatar 
                    name={user} 
                    className="w-8 h-8 text-[11px] font-bold" 
                    theme={theme}
                  />
                  <span className="truncate">{user}</span>
                </div>
              ))
            )}
          </div>

          {/* Notification & Sound Preferences */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 font-sans text-left">
            <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 px-2">Preferences</h3>
            <div className="flex flex-col gap-1">
              {/* Sound toggle button */}
              <button
                onClick={() => {
                  const newVal = !soundEnabled;
                  setSoundEnabled(newVal);
                  localStorage.setItem('pref_sound', String(newVal));
                  if (newVal) playNotificationSound();
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-3xl transition-all text-sm font-medium cursor-pointer ${
                  theme === 'dark' 
                    ? 'hover:bg-zinc-800 text-zinc-300' 
                    : 'hover:bg-zinc-100 text-zinc-700'
                }`}
                title="Toggle audio notification sound chimes"
              >
                <div className="flex items-center gap-1.5">
                  {soundEnabled ? <Volume2 size={13} className="text-accent" /> : <VolumeX size={13} className="text-zinc-500" />}
                  <span>Sound Chime</span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${soundEnabled ? 'text-accent' : 'text-zinc-500'}`}>
                  {soundEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Push alert settings */}
              <button
                onClick={handleDesktopNotificationToggle}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-3xl transition-all text-sm font-medium cursor-pointer ${
                  theme === 'dark' 
                    ? 'hover:bg-zinc-800 text-zinc-300' 
                    : 'hover:bg-zinc-100 text-zinc-700'
                }`}
                title="Toggle native standard desktop push notifications"
              >
                <div className="flex items-center gap-1.5">
                  {desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? (
                    <Bell size={13} className="text-accent" />
                  ) : (
                    <BellOff size={13} className="text-zinc-500" />
                  )}
                  <span>Push Alerts</span>
                </div>
                <div className="flex items-center gap-1">
                  {notificationPermissionStatus === 'default' && (
                    <span className="text-[8px] text-accent font-bold underline uppercase animate-pulse pr-0.5">Request</span>
                  )}
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? 'text-accent' : 'text-zinc-500'
                  }`}>
                    {desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-900 space-y-2 font-sans">
             <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium uppercase">
                <span>Live Presence</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-zinc-400 font-semibold">{onlineUsers.length} online</span>
                </div>
             </div>
             
             {/* Dynamic Relay Server connection display */}
             <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-900 w-full space-y-1">
               <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium uppercase">
                 <span>Relay Server</span>
                 <span className={`font-bold text-[10px] uppercase tracking-wider ${connectionStatus === 'connected' ? 'text-emerald-500' : 'text-accent animate-pulse'}`}>
                   {connectionStatus}
                 </span>
               </div>
               <p className="text-[10px] text-zinc-400 font-mono truncate bg-zinc-100 dark:bg-zinc-900 px-2 py-1.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800" title={serverUrl}>
                 {serverUrl}
               </p>
             </div>
          </div>
        </aside>
        
        {/* Chat Feed */}
        <div className={`flex-1 overflow-y-auto p-3 sm:p-6 ${!selectedRecipient ? 'flex items-center justify-center' : 'space-y-4'}`}>
          <div className="max-w-4xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {!selectedRecipient ? (
                <motion.div
                  key="relay-landing"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-md w-full mx-auto text-center p-6 border rounded-3xl transition-all shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                >
                  <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 text-accent text-2xl mb-4 select-none">
                    <Radio size={24} />
                  </div>

                  <h2 className="text-xl font-medium tracking-tight mb-1">
                    Ephemeral Relay
                  </h2>
                  <p className="text-sm text-zinc-500 tracking-wide leading-relaxed mb-6">
                    Connect securely inside clean workspace frequencies. Choose a stream channel or select an online peer to start.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 mb-6 text-left">
                    <div className={`p-3 rounded-2xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-500 block mb-0.5">Presence</span>
                      <span className="text-sm font-medium text-accent flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        {onlineUsers.length} Online
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-2xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-500 block mb-0.5">Stream</span>
                      <span className={`text-sm font-medium tracking-wide flex items-center gap-1.5 ${connectionStatus === 'connected' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                        {connectionStatus}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-1 text-left">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Select Channel Stream</span>

                    <button
                      onClick={() => setSelectedRecipient("All")}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-98 cursor-pointer ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-900/80' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                          👥
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold font-sans block">Public Room (All)</span>
                          <span className="text-[9px] text-zinc-505 font-medium">Broadcast to all online users</span>
                        </div>
                      </div>
                      <ChevronRight size={13} className="text-zinc-400" />
                    </button>

                    {onlineUsers.filter(u => u !== userName).length > 0 ? (
                      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin pt-1">
                        {onlineUsers.filter(u => u !== userName).map((user) => (
                          <button
                            key={user}
                            onClick={() => setSelectedRecipient(user)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-98 cursor-pointer ${
                              theme === 'dark' ? 'bg-zinc-950/65 border-zinc-900/40' : 'bg-white border-zinc-200/80'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <UserAvatar name={user} className="w-6 h-6 text-[8px]" theme={theme} />
                              <span className="text-xs font-semibold">{user}</span>
                            </div>
                            <span className="text-[10px] text-accent font-bold uppercase tracking-wider flex items-center gap-1">
                              Chat <ChevronRight size={11} />
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-3 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center ${
                        theme === 'dark' ? 'bg-black/20 border-zinc-900/60' : 'bg-zinc-50/55 border-zinc-200'
                      }`}>
                        <span className="text-xs text-zinc-550 italic">No other peers online</span>
                        <button 
                          onClick={() => setShowInviteModal(true)}
                          className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1.5 hover:underline"
                        >
                          Send System Invite +
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {/* Inline header inside chat container */}
                  <div className={`p-4 rounded-3xl border flex items-center justify-between mb-4 shadow-sm transition-all ${
                    theme === 'dark' 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
                      : 'bg-white border-zinc-200 text-zinc-800'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {selectedRecipient === 'All' ? (
                        <>
                          <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-medium shadow-sm">
                            <Radio size={16} />
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-sm font-medium tracking-tight">Public Room</h2>
                            <p className="text-xs text-zinc-500 tracking-tight truncate">{onlineUsers.length} active peers</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <UserAvatar name={selectedRecipient} className="w-9 h-9 text-xs font-medium" theme={theme} />
                          <div className="min-w-0">
                            <h2 className="text-sm font-medium tracking-tight truncate">{selectedRecipient}</h2>
                            <p className="text-xs text-zinc-500 tracking-tight">Direct Connection</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setSelectedRecipient("")}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer border ${
                        theme === 'dark'
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700 hover:text-white'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200 hover:text-black'
                      }`}
                    >
                      Close chat
                    </button>
                  </div>
                  {displayedMessages.length === 0 ? (
                    <div className="h-[40vh] flex flex-col items-center justify-center text-center p-6 text-zinc-550">
                      <span className="text-2xl mb-2 opacity-50">✉️</span>
                      <p className="text-xs sm:text-sm font-sans font-medium text-zinc-400 dark:text-zinc-500">No messages yet with {selectedRecipient === 'All' ? 'everyone' : selectedRecipient}.</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-600 mt-1 max-w-[240px] leading-relaxed">Start the conversation by sending a direct message.</p>
                    </div>
                  ) : (
                    displayedMessages.map((msg) => {
                      if (msg.sender === 'System') {
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-center my-3 w-full"
                          >
                            <span className={`px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                              theme === 'dark'
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}>
                              {msg.text}
                            </span>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${msg.sender === userName ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`flex gap-1.5 sm:gap-2.5 max-w-[90%] sm:max-w-[70%] ${
                              msg.sender === userName
                                ? 'flex-row-reverse'
                                : 'flex-row'
                            }`}
                          >
                            <UserAvatar 
                              name={msg.sender} 
                              className="w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs font-bold" 
                              theme={theme}
                            />
                            <div className="flex flex-col space-y-1 min-w-0">
                              <span className={`text-[10px] text-zinc-500 font-sans tracking-wide ${msg.sender === userName ? 'text-right' : 'text-left'} truncate max-w-[150px] sm:max-w-none`}>
                                {msg.sender === userName ? 'You' : msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div
                                className={`px-3.5 py-2.5 sm:p-3.5 rounded-2xl ${
                                  msg.sender === userName
                                    ? 'bg-accent text-white rounded-tr-none shadow-sm'
                                    : theme === 'dark'
                                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none'
                                      : 'bg-white text-zinc-900 rounded-tl-none border border-zinc-200 shadow-sm'
                                }`}
                              >
                                {msg.image && (
                                  <img 
                                    src={msg.image} 
                                    className="rounded-xl mb-1.5 max-w-full overflow-hidden object-cover border border-zinc-200/10 shadow-inner max-h-60" 
                                    alt="Shared media" 
                                    referrerPolicy="no-referrer" 
                                  />
                                )}
                                {msg.audio && (
                                  <div className="my-1 max-w-full overflow-hidden">
                                    <audio src={msg.audio} controls className="max-w-full w-40 xs:w-48 sm:w-64 h-8 scale-95 origin-left" />
                                  </div>
                                )}
                                {msg.text && (
                                  <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer / Input Controller */}
      {selectedRecipient && (
        <footer className={`px-2.5 py-2 sm:p-5 ${theme === 'dark' ? 'bg-zinc-950 border-t border-zinc-800' : 'bg-white border-t border-zinc-200'} safe-bottom z-10`}>
          <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
            {/* Outlined M3 container for text inputs and actions */}
            <div className={`flex-1 flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-4 sm:py-2 rounded-full border ${
              theme === 'dark' 
                ? 'bg-zinc-900 border-zinc-800' 
                : 'bg-zinc-50 border-zinc-200'
            } transition-all duration-200 min-w-0 shadow-sm focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent`}>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 sm:p-2 text-zinc-400 hover:text-accent active:scale-90 transition-all flex-shrink-0"
                title="Share Image"
              >
                <Camera size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-1 sm:p-2 transition-all active:scale-90 flex-shrink-0 ${isRecording ? 'text-accent animate-pulse' : 'text-zinc-400 hover:text-accent'}`}
                title="Voice Note"
              >
                {isRecording ? <MicOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Mic size={16} className="sm:w-[18px] sm:h-[18px]" />}
              </button>

              {!isRecording && (
                <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'} mx-0.5`} />
              )}

              {isRecording ? (
                <div className="flex-1 flex items-center gap-1.5 text-sm md:text-sm text-accent font-medium animate-pulse py-1">
                  <span className="w-2 h-2 rounded-full bg-accent"></span>
                  <span>Recording audio...</span>
                </div>
              ) : (
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-sm py-1 font-sans placeholder-zinc-500 text-inherit min-w-0"
                />
              )}
            </div>

            <button
              onClick={() => sendMessage()}
              className="flex-shrink-0 p-2 sm:p-3 bg-accent text-white rounded-full font-medium hover:bg-accent-hover active:scale-95 transition-colors shadow-sm flex items-center justify-center min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px]"
              title="Send Message"
            >
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </footer>
      )}

      {/* Modern Bottom Navigation Bar */}
      <div className="px-3 pb-4 pt-1.5 w-full max-w-4xl mx-auto flex-shrink-0 z-30 relative">
        {/* Floating More Options Popover */}
        <AnimatePresence>
          {isNavMenuOpen && (
            <>
              {/* Overlay Backdrop to close the popover */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setIsNavMenuOpen(false)} 
              />
              
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-4 bottom-20 w-72 rounded-3xl shadow-lg border p-4 z-50 text-left ${
                  theme === 'dark' 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                    : 'bg-white border-zinc-200 text-zinc-900'
                }`}
              >
                <div className="space-y-4">
                  {/* Connected User Profile Badge */}
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                    <UserAvatar 
                      name={userName} 
                      className="w-10 h-10 text-sm font-medium" 
                      theme={theme}
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium truncate">{userName}</h4>
                      <span className="text-xs text-zinc-500 block">Connected</span>
                    </div>
                  </div>

                  {/* Settings toggles */}
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium block mb-2 px-1">
                      Preferences
                    </span>

                    {/* Theme Toggle */}
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-3xl transition-all text-sm cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:bg-zinc-800 text-zinc-300' 
                          : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {theme === 'dark' ? <Moon size={16} className="text-accent" /> : <Sun size={16} className="text-accent" />}
                        <span>Dark mode</span>
                      </div>
                      <span className="text-xs font-medium text-accent">
                        {theme === 'dark' ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Sound Chimes */}
                    <button
                      onClick={() => {
                        const newVal = !soundEnabled;
                        setSoundEnabled(newVal);
                        localStorage.setItem('pref_sound', String(newVal));
                        if (newVal) playNotificationSound();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-3xl transition-all text-sm cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:bg-zinc-800 text-zinc-300' 
                          : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {soundEnabled ? <Volume2 size={16} className="text-emerald-500" /> : <VolumeX size={16} className="text-zinc-400" />}
                        <span>Alert sounds</span>
                      </div>
                      <span className={`text-xs font-medium ${soundEnabled ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        {soundEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Push Notifications */}
                    <button
                      onClick={handleDesktopNotificationToggle}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-3xl transition-all text-sm cursor-pointer ${
                        theme === 'dark' 
                          ? 'hover:bg-zinc-800 text-zinc-300' 
                          : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? (
                          <Bell size={16} className="text-emerald-500" />
                        ) : (
                          <BellOff size={16} className="text-zinc-400" />
                        )}
                        <span>Desktop notifications</span>
                      </div>
                      <span className={`text-xs font-medium ${
                        desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? 'text-emerald-500' : 'text-zinc-500'
                      }`}>
                        {desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>

                  {/* Logout block */}
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-3xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <nav className={`py-1.5 px-2 rounded-full border transition-all w-full flex items-center shadow-md ${
          theme === 'dark' 
            ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
            : 'bg-white border-zinc-200 text-zinc-700'
        }`}>
          <div className="flex items-center justify-around w-full gap-1">
            {/* 1. Peers Selector */}
            <button
              onClick={() => setIsAsideOpen(!isAsideOpen)}
              className={`p-3 rounded-full transition-all active:scale-95 cursor-pointer relative ${
                isAsideOpen 
                  ? 'bg-accent/15 text-accent shadow-sm' 
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Toggle peers list"
            >
              <Users size={20} />
              {onlineUsers.length > 1 && !isAsideOpen && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* 2. Public Room Shortcut */}
            <button
              onClick={() => {
                setSelectedRecipient("All");
                setIsAsideOpen(false);
              }}
              className={`p-3 rounded-full transition-all active:scale-95 cursor-pointer ${
                selectedRecipient === "All" && !isAsideOpen
                  ? 'bg-accent text-white shadow-sm'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Public stream room"
            >
              <Radio size={20} />
            </button>

            {/* 3. Send Invite Modal trigger */}
            <button
              onClick={() => {
                setShowInviteModal(true);
              }}
              className="p-3 rounded-full transition-all active:scale-95 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Invite peers to stream"
            >
              <Share2 size={20} />
            </button>

            {/* 4. More Options Trigger */}
            <button
              onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
              className={`p-3 rounded-full transition-all active:scale-95 cursor-pointer ${
                isNavMenuOpen
                  ? 'bg-accent/15 text-accent shadow-sm'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              }`}
              title="Settings & More Options"
            >
              <Sliders size={20} />
            </button>
          </div>
        </nav>
      </div>

      {/* Dynamic Invitation Modal overlay when chatting */}
      {showInviteModal && renderInviteModal()}

    </div>
  );
}


