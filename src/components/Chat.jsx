import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useCollection } from 'ikago';
import { getConversationId } from '../services/ikagoDb';
import { setSelectedContact } from '../counterSlice';

const SOCKET_URL = "https://mes-ioa3.onrender.com/";
const socket = io(SOCKET_URL);

// Helper: safely get MongoDB id (handles both _id and id)
const getId = (u) => u?._id || u?.id || null;

const Chat = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { activeUser, selectedContact } = useSelector((s) => s.chat);

    const messagesStore = useCollection("messages");
    const contactsStore = useCollection("contacts");

    // --- Stable refs for socket closures ---
    const msgsRef = useRef(null);
    const contactsRef = useRef(null);
    const meRef = useRef(activeUser);
    const contactRef = useRef(selectedContact);
    const pendingRef = useRef([]);
    const inputRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => { msgsRef.current = messagesStore; }, [messagesStore]);
    useEffect(() => { contactsRef.current = contactsStore; }, [contactsStore]);
    useEffect(() => { meRef.current = activeUser; }, [activeUser]);
    useEffect(() => { contactRef.current = selectedContact; }, [selectedContact]);

    // --- State ---
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [connected, setConnected] = useState(socket.connected);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [sendError, setSendError] = useState('');
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Close emoji picker and menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            const inputContainer = e.target.closest('div');
            if (!e.target.closest('button') && !e.target.closest('input[type="text"]')) {
                if (emojiPickerOpen) setEmojiPickerOpen(false);
                if (menuOpen) setMenuOpen(false);
            }
        };
        
        if (emojiPickerOpen || menuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [emojiPickerOpen, menuOpen]);

    // --- Guard: redirect if no user/contact ---
    useEffect(() => {
        if (!activeUser) { navigate('/'); return; }
        if (!selectedContact) { navigate('/home'); return; }
    }, [activeUser, selectedContact, navigate]);

    // --- Conversation key ---
    const myId = getId(activeUser);
    const contactId = selectedContact?.userId || null;
    const convId = myId && contactId ? getConversationId(myId, contactId) : null;

    // --- Load history from IndexedDB ---
    useEffect(() => {
        if (!convId || !messagesStore) { setMessages([]); return; }
        messagesStore
            .where((m) => m.conversationId === convId)
            .then((msgs) => setMessages([...msgs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))))
            .catch(() => { });
    }, [convId, messagesStore]);

    // --- Auto-scroll ---
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- Socket (dep: only activeUser; everything else via refs) ---
    useEffect(() => {
        if (!activeUser) return;

        const myIdNow = getId(activeUser);

        const emitOnline = () => {
            if (myIdNow) socket.emit('user-online', myIdNow);
        };

        if (socket.connected) { setConnected(true); emitOnline(); }

        const onConnect = () => { setConnected(true); emitOnline(); };
        const onDisconnect = () => setConnected(false);
        const onStatus = (d) => setOnlineUsers(d.onlineUsers || []);

        const onPrivateMsg = async (data) => {
            console.log(data);

            const me = meRef.current;
            const contact = contactRef.current;
            const mDB = msgsRef.current;
            const cDB = contactsRef.current;

            const senderId = data.fromUserId || data.senderId;
            if (!me || !senderId) {
                console.warn('[Chat] receive-private-message missing senderId', data);
                return;
            }

            const meId = getId(me);
            const cId = getConversationId(meId, senderId);
            const isHere = senderId === contact?.userId;
            const timestamp = data.createdAt
                ? new Date(data.createdAt).toISOString()
                : new Date().toISOString();

            console.log(isHere, contact);

            // --- Always update UI immediately (no DB dependency) ---

            setMessages((prev) => [
                ...prev,
                { id: Date.now() + Math.random(), text: data.message, type: data.type || 'text', timestamp, fileName: data.fileName || null, isMe: false },
            ]);

            console.log(messages);


            // --- Persist to IndexedDB in background ---
            if (mDB) {
                try {
                    await mDB.add({ conversationId: cId, fromUserId: senderId, toUserId: meId, text: data.message, type: data.type || 'text', timestamp, isMe: false });
                } catch (_) { }
            }

            // --- Auto-save contact ---
            if (cDB && senderId) {
                try {
                    const existing = await cDB.where((c) => c.userId === senderId);
                    if (!existing.length) {
                        await cDB.add({ userId: senderId, email: data.fromEmail || senderId, name: data.fromName || 'Unknown', unread: isHere ? 0 : 1 });
                    } else if (!isHere) {
                        const c = existing[0];
                        await cDB.update({ ...c, unread: (c.unread || 0) + 1 });
                    }
                } catch (_) { }
            }
        };

        const onMsgSent = async (data) => {
            console.log(data);

            setSendError('');
            const me = meRef.current;
            const contact = contactRef.current;
            const mDB = msgsRef.current;
            const cDB = contactsRef.current;
            if (!data.toUserId || !me) return;

            if (contact?.isNew) {
                const meId = getId(me);
                const cId = getConversationId(meId, data.toUserId);
                if (cDB) {
                    try {
                        const ex = await cDB.where((c) => c.userId === data.toUserId);
                        if (!ex.length) await cDB.add({ userId: data.toUserId, email: contact.email, name: contact.name || contact.email });
                    } catch (_) { }
                }
                if (mDB && pendingRef.current.length) {
                    for (const pm of pendingRef.current) {
                        try { await mDB.add({ conversationId: cId, fromUserId: meId, toUserId: data.toUserId, text: pm.text, type: pm.type || 'text', timestamp: pm.timestamp, isMe: true }); } catch (_) { }
                    }
                    pendingRef.current = [];
                }
                dispatch(setSelectedContact({ ...contact, userId: data.toUserId, isNew: false }));
            }
        };

        const onMsgFailed = (d) => {
            setSendError(d.reason || 'Message failed — user not found');
            pendingRef.current = [];
            setTimeout(() => setSendError(''), 5000);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('user-status', onStatus);
        socket.on('receive-private-message', onPrivateMsg);
        socket.on('message-sent', onMsgSent);
        socket.on('message-failed', onMsgFailed);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('user-status', onStatus);
            socket.off('receive-private-message', onPrivateMsg);
            socket.off('message-sent', onMsgSent);
            socket.off('message-failed', onMsgFailed);
        };
    }, [activeUser, dispatch]);

    // --- Send ---
    const handleSend = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || !selectedContact || !activeUser) return;

        const now = new Date().toISOString();
        const myId = getId(activeUser);

        setInput('');
        setTimeout(() => inputRef.current?.focus(), 0);

        // Optimistic UI
        setMessages((prev) => [...prev, { id: Date.now(), text, type: 'text', timestamp: now, isMe: true }]);

        // Persist
        if (convId && messagesStore) {
            try { await messagesStore.add({ conversationId: convId, fromUserId: myId, toUserId: contactId, text, type: 'text', timestamp: now, isMe: true }); } catch (_) { }
        } else if (selectedContact.isNew) {
            pendingRef.current.push({ text, type: 'text', timestamp: now });
        }

        // Emit
        socket.emit('send-message-by-email', {
            fromUserId: myId,
            toEmail: selectedContact.email,
            message: text,
            type: 'text',
        });
    };

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedContact || !activeUser) return;

        e.target.value = '';

        const MAX_BYTES = 50 * 1024 * 1024; // 50MB

        if (file.size > MAX_BYTES) {
            setSendError('File too large (max 50 MB)');
            setTimeout(() => setSendError(''), 600000);
            return;
        }

        console.log("File size within limits");
        let type = file.type ? file.type.split('/')[0] : 'file';
        if (!['image', 'video', 'audio'].includes(type)) {
            type = 'file';
        }

        const now = new Date().toISOString();
        const myId = getId(activeUser);

        // Optimistic UI
        const messageId = Date.now();
        setMessages((prev) => [
            ...prev,
            {
                id: messageId,
                text: 'Sending file...',
                type: 'text',
                timestamp: now,
                isMe: true,
                fileName: file.name
            }
        ]);

        // Small file: send as DataURL
        const reader = new FileReader();

        reader.onload = async (ev) => {
            const content = ev.target.result;
            const now = new Date().toISOString();
            const myId = getId(activeUser);

            // Update optimistic UI
            setMessages((prev) => prev.map(msg =>
                msg.id === messageId ? {
                    ...msg,
                    text: content,
                    type,
                    fileName: file.name
                } : msg
            ));

            // Persist
            if (convId && messagesStore) {
                try { await messagesStore.add({ conversationId: convId, fromUserId: myId, toUserId: contactId, text: content, type, timestamp: now, isMe: true, fileName: file.name }); } catch (_) { }
            } else if (selectedContact.isNew) {
                pendingRef.current.push({ text: content, type, timestamp: now, fileName: file.name });
            }

            socket.emit('send-message-by-email', {
                fromUserId: myId,
                toEmail: selectedContact.email,
                message: content,
                type,
                fileName: file.name
            });
        };

        reader.onerror = () => {
            setSendError('Failed to read file');
        };

        reader.readAsDataURL(file);
    };

    // --- Helpers ---
    const initials = (u) => u?.name ? u.name[0].toUpperCase() : u?.email ? u.email[0].toUpperCase() : '?';
    const displayName = (u) => u?.name || u?.email?.split('@')[0] || 'User';
    const profilePic = (u) => {
        if (!u) return null;
        if (u.profileImage?.data?.data) {
            let b = ''; const bytes = new Uint8Array(u.profileImage.data.data);
            for (let i = 0; i < bytes.byteLength; i++) b += String.fromCharCode(bytes[i]);
            return `data:${u.profileImage.contentType};base64,${window.btoa(b)}`;
        }
        if (u.profilePic) return u.profilePic.startsWith('http') ? u.profilePic : `${SOCKET_URL}${u.profilePic}`;
        return null;
    };

    // --- Emoji picker ---
    const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤮', '🤧', '🏨', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '👋', '⭐', '✨', '⚡', '🔥', '💥', '👏', '🎉', '🎊', '🎈', '🎁', '🍕', '🍔', '🍟', '🌭', '🍗', '🍖', '🍤', '🍣', '🍜', '🍝', '🍛', '🍱', '🥟', '🍚', '🍙', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🍰', '🎂', '🧁', '🍮', '🍭', '🍬', '🍫', '🍩', '🍪', '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🎵', '🎶', '✈️', '🚀', '❄️', '🌸', '🌺', '🌻', '🌷', '🌹'];

    // --- Clear chat handler ---
    const handleClearChat = async () => {
        if (!window.confirm('Are you sure you want to clear this chat? This action cannot be undone.')) return;
        
        try {
            // Clear UI immediately for instant feedback
            setMessages([]);
            setMenuOpen(false);
            
            // Delete from IndexedDB in background
            if (convId && messagesStore) {
                const msgsToDelete = await messagesStore.where((m) => m.conversationId === convId);
                for (const msg of msgsToDelete) {
                    await messagesStore.delete(msg.id);
                }
            }
        } catch (err) {
            console.error('Error clearing chat:', err);
            setSendError('Failed to clear chat');
            setTimeout(() => setSendError(''), 5000);
        }
    };

    if (!activeUser || !selectedContact) return null;

    const isOnline = contactId && onlineUsers.includes(contactId);

    return (
        <div className="h-screen w-screen flex flex-col bg-[#07090f] text-slate-200 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Subtle bg */}
            <div className="fixed inset-0 pointer-events-none">
                <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '55%', height: '55%', background: 'rgba(6,182,212,0.06)', borderRadius: '50%', filter: 'blur(140px)' }} />
                <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '55%', height: '55%', background: 'rgba(99,102,241,0.06)', borderRadius: '50%', filter: 'blur(140px)' }} />
            </div>

            {/* ── HEADER ── */}
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(15,20,40,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>

                {/* Left: back + contact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => navigate('/home')}
                        style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#22d3ee'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                    >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,rgba(34,211,238,0.2),rgba(99,102,241,0.2))', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: '#22d3ee' }}>
                                {initials(selectedContact)}
                            </div>
                            {isOnline && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, background: '#22c55e', border: '2px solid #07090f', borderRadius: '50%' }} />}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: '#f1f5f9', letterSpacing: '-0.3px' }}>{displayName(selectedContact)}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedContact.isNew ? '#facc15' : isOnline ? '#22c55e' : '#475569', display: 'inline-block', boxShadow: isOnline ? '0 0 6px #22c55e' : 'none' }} />
                                <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b' }}>
                                    {selectedContact.isNew ? 'New conversation' : isOnline ? 'Online' : 'Offline — queued delivery'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: me + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '6px 12px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 10, background: 'linear-gradient(135deg,#22d3ee,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                            {profilePic(activeUser) ? <img src={profilePic(activeUser)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(activeUser)}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName(activeUser)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '5px 10px' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444', display: 'inline-block', animation: connected ? 'pls 2s ease-in-out infinite' : 'none' }} />
                        <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b' }}>{connected ? 'Live' : 'Reconnecting'}</span>
                    </div>
                    
                    {/* Three-dot menu */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="menu-btn"
                            style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="12" cy="19" r="2" />
                            </svg>
                        </button>
                        
                        {/* Dropdown menu */}
                        {menuOpen && (
                            <div className="menu-dropdown" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'rgba(15,20,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.4)', minWidth: 180, zIndex: 1000, backdropFilter: 'blur(20px)' }}>
                                <button
                                    onClick={handleClearChat}
                                    className="menu-item"
                                    style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderRadius: '16px 16px 0 0', transition: 'background 0.15s ease' }}
                                >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Clear Chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error */}
            {sendError && (
                <div style={{ position: 'relative', zIndex: 10, margin: '10px 20px 0', padding: '10px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, color: '#f87171', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <span>⚠ {sendError}</span>
                    <button onClick={() => setSendError('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
            )}

            {/* ── MESSAGES ── */}
            <div style={{ position: 'relative', zIndex: 10, flex: 1, overflowY: 'auto', padding: '20px 20px 10px', display: 'flex', flexDirection: 'column', gap: 10 }} className="custom-scrollbar">

                {messages.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 40, padding: '48px 40px', maxWidth: 320 }}>
                            <div style={{ fontSize: 56, marginBottom: 16 }}>💬</div>
                            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#f1f5f9' }}>Start the conversation</h2>
                            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                                {selectedContact.isNew ? `Connect with ${displayName(selectedContact)}` : `Chat with ${displayName(selectedContact)}`}
                            </p>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={msg.id || idx} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: msg.isMe ? 'flex-end' : 'flex-start' }}>

                        {/* Their avatar (left) */}
                        {!msg.isMe && (
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#94a3b8', flexShrink: 0 }}>
                                {initials(selectedContact)}
                            </div>
                        )}

                        {/* Bubble */}
                        <div style={{
                            maxWidth: '68%', padding: '12px 14px', borderRadius: msg.isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            background: msg.isMe ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'rgba(255,255,255,0.05)',
                            border: msg.isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            boxShadow: msg.isMe ? '0 8px 24px rgba(99,102,241,0.25)' : 'none',
                            color: '#f1f5f9'
                        }}>
                            {/* ── Image ── */}
                            {msg.type === 'image' && (
                                <img src={msg.text} alt={msg.fileName || 'image'}
                                    style={{ maxWidth: 260, maxHeight: 200, borderRadius: 12, display: 'block', marginBottom: 4, objectFit: 'cover', cursor: 'pointer' }}
                                    onClick={() => window.open(msg.text, '_blank')}
                                />
                            )}

                            {/* ── Video ── */}
                            {msg.type === 'video' && (
                                <video src={msg.text} controls
                                    style={{ maxWidth: 260, borderRadius: 12, display: 'block', marginBottom: 4 }}
                                />
                            )}

                            {/* ── Audio / Music player ── */}
                            {msg.type === 'audio' && (
                                <div style={{ minWidth: 220 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎵</div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {msg.fileName || 'Audio'}
                                            </p>
                                            <p style={{ margin: 0, fontSize: 9, opacity: 0.5, fontWeight: 600 }}>Audio message</p>
                                        </div>
                                    </div>
                                    <audio src={msg.text} controls
                                        style={{ width: '100%', height: 32, borderRadius: 8 }}
                                    />
                                </div>
                            )}

                            {/* ── Generic file ── */}
                            {msg.type === 'file' && (
                                <a href={msg.text} download={msg.fileName || 'file'}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', padding: '4px 0' }}
                                >
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📎</div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{msg.fileName || 'File'}</p>
                                        <p style={{ margin: 0, fontSize: 9, opacity: 0.5 }}>Tap to download</p>
                                    </div>
                                </a>
                            )}

                            {/* ── Text ── */}
                            {msg.type === 'text' && (
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</p>
                            )}

                            <p style={{ margin: '6px 0 0', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.4, textAlign: msg.isMe ? 'right' : 'left' }}>
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                        </div>

                        {/* My avatar (right) */}
                        {msg.isMe && (
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#22d3ee', flexShrink: 0, overflow: 'hidden' }}>
                                {profilePic(activeUser) ? <img src={profilePic(activeUser)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(activeUser)}
                            </div>
                        )}
                    </div>
                ))}

                <div ref={bottomRef} style={{ height: 4 }} />
            </div>

            {/* ── INPUT ── */}
            <div style={{ position: 'relative', zIndex: 10, padding: '12px 20px 20px', flexShrink: 0 }}>
                {/* Emoji Picker - shown above input when opened */}
                {emojiPickerOpen && (
                    <div style={{ 
                        background: 'rgba(15,20,40,0.95)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '16px 16px 0 0',
                        padding: '12px', 
                        marginBottom: '12px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: '8px',
                        backdropFilter: 'blur(20px)'
                    }}>
                        {emojis.map((emoji, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInput(input + emoji);
                                    inputRef.current?.focus();
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    flexShrink: 0
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(34,211,238,0.2)';
                                    e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)';
                                    e.currentTarget.style.transform = 'scale(1.2)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(15,20,40,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32, padding: '6px 6px 6px 14px', backdropFilter: 'blur(20px)' }}>

                    {/* Attach */}
                    <label className="attach-btn" style={{ cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%', flexShrink: 0 }}>
                        {/* FIX 1: accept now includes audio and document types */}
                        <input type="file" style={{ display: 'none' }} onChange={handleFile} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" />
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </label>

                    {/* Emoji button */}
                    <button
                        type="button"
                        onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                        style={{ cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%', flexShrink: 0, background: 'none', border: 'none', fontSize: '20px' }}
                        title="Emoji picker"
                    >
                        😊
                    </button>

                    {/* Text field */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Message ${displayName(selectedContact)}…`}
                        autoComplete="off"
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', padding: '12px 0' }}
                    />

                    {/* Send */}
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        style={{
                            width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                            background: input.trim() ? 'linear-gradient(135deg,#22d3ee,#6366f1)' : 'rgba(255,255,255,0.05)',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'transform 0.15s', opacity: input.trim() ? 1 : 0.3
                        }}
                        onMouseEnter={e => { if (input.trim()) e.currentTarget.style.transform = 'scale(1.08)'; }}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>

            <style>{`
                @keyframes pls { 0%,100%{opacity:1} 50%{opacity:0.4} }
                .custom-scrollbar::-webkit-scrollbar{width:4px}
                .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
                .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(6,182,212,0.15);border-radius:99px}
                
                /* Attachment button styles */
                .attach-btn {
                    transition: color 0.1s ease;
                }
                .attach-btn:hover {
                    color: #22d3ee !important;
                }
                
                /* Menu button styles */
                .menu-btn {
                    transition: color 0.1s ease !important;
                }
                .menu-btn:hover {
                    color: #22d3ee !important;
                }
                
                /* Menu item styles */
                .menu-item {
                    transition: background 0.1s ease !important;
                }
                .menu-item:hover {
                    background: rgba(239,68,68,0.1) !important;
                }
                
                /* Emoji button styles */
                button[title="Emoji picker"] {
                    transition: color 0.1s ease;
                }
                button[title="Emoji picker"]:hover {
                    color: #22d3ee !important;
                }
            `}</style>
        </div>
    );
};

export default Chat;