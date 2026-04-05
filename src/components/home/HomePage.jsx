import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveUser, setSelectedContact } from '../../counterSlice';
import { io } from 'socket.io-client';
import { useCollection, useLiveQuery } from 'ikago';
import { getConversationId } from '../../services/ikagoDb';

import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ToastBar from './ToastBar';
import ContextMenuPopup from './ContextMenuPopup';
import ProfileModal from './ProfileModal';

const socket = io("https://mes-ioa3.onrender.com/");

export default function HomePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { activeUser } = useSelector((state) => state.chat);

    // ── IKAGO HOOKS ──
    const contacts = useCollection("contacts");
    const messagesStore = useCollection("messages");
    const allContacts = useLiveQuery("contacts") || [];

    // Refs so socket closures always see latest values
    const contactsRef = useRef(null);
    const messagesStoreRef = useRef(null);
    const selectedChatRef = useRef(null);
    const activeUserRef = useRef(activeUser);
    const pendingMsgsRef = useRef([]);
    const audioRef = useRef(null);
    const bottomRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => { contactsRef.current = contacts; }, [contacts]);
    useEffect(() => { messagesStoreRef.current = messagesStore; }, [messagesStore]);
    useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

    // ── STATE ──
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [connected, setConnected] = useState(false);
    const [onlineUserIds, setOnlineUserIds] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [sendError, setSendError] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [musicState, setMusicState] = useState({ songId: null, isPlaying: false, currentTime: 0 });
    const [contextMenu, setContextMenu] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    // Keep selectedChat ref in sync + reset typing on contact switch
    useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
    useEffect(() => { setIsTyping(false); }, [selectedChat]);

    // ── CONVERSATION ID ──
    const currentConvId = (selectedChat?.userId && activeUser?._id)
        ? getConversationId(activeUser._id, selectedChat.userId)
        : null;

    // ── LOAD MESSAGES FROM INDEXEDDB ──
    useEffect(() => {
        if (!currentConvId || !messagesStore) {
            if (!selectedChat?.isNew) setChatMessages([]);
            return;
        }
        messagesStore
            .where(m => m.conversationId === currentConvId)
            .then(msgs => setChatMessages([...msgs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))))
            .catch(console.error);
    }, [currentConvId, messagesStore]);

    // ── AUTO SCROLL ──
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // ── SOCKET SETUP ──
    useEffect(() => {
        if (!activeUser) { navigate('/'); return; }
        if (socket.connected) socket.emit('user-online', activeUser._id);

        socket.on('connect', () => { setConnected(true); socket.emit('user-online', activeUser._id); });
        socket.on('disconnect', () => setConnected(false));
        socket.on('user-status', (data) => setOnlineUserIds(data.onlineUsers || []));

        socket.on('receive-private-message', async (data) => {
            const cDB = contactsRef.current;
            const mDB = messagesStoreRef.current;
            const me = activeUserRef.current;
            if (!me || !data.fromUserId) return;

            const convId = getConversationId(me._id, data.fromUserId);
            const isActiveChat = selectedChatRef.current?.userId === data.fromUserId;

            if (cDB) {
                try {
                    const existing = await cDB.where(c => c.userId === data.fromUserId);
                    if (!existing.length) {
                        await cDB.add({ userId: data.fromUserId, email: data.fromEmail || data.fromUserId, name: data.fromName || data.fromEmail || 'Unknown', unread: isActiveChat ? 0 : 1, isRequest: true });
                    } else if (!isActiveChat) {
                        const c = existing[0];
                        await cDB.update({ ...c, unread: (c.unread || 0) + 1 });
                    }
                } catch (e) { console.error('Contact save error:', e); }
            }

            if (mDB) {
                try {
                    await mDB.add({ conversationId: convId, fromUserId: data.fromUserId, toUserId: me._id, text: data.message, type: data.type || 'text', timestamp: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(), isMe: false });
                    if (isActiveChat) {
                        const msgs = await mDB.where(m => m.conversationId === convId);
                        setChatMessages([...msgs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
                    } else {
                        const notifId = Date.now() + Math.random();
                        const senderLabel = data.fromName && data.fromName !== 'User' ? data.fromName : (data.fromEmail || 'Someone');
                        setNotifications(prev => [...prev, { id: notifId, fromUserId: data.fromUserId, senderLabel, message: data.type === 'text' ? data.message : `Sent a ${data.type || 'file'}`, type: data.type || 'text' }]);
                        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== notifId)), 6000);
                    }
                } catch (e) { console.error('Message save error:', e); }
            }
        });

        socket.on('message-sent', async (data) => {
            const cDB = contactsRef.current;
            const mDB = messagesStoreRef.current;
            const selected = selectedChatRef.current;
            const me = activeUserRef.current;
            setSendError('');
            if (!data.toUserId || !me) return;
            if (selected?.isNew && cDB) {
                try {
                    const existing = await cDB.where(c => c.userId === data.toUserId);
                    if (!existing.length) await cDB.add({ userId: data.toUserId, email: selected.email, name: selected.name || selected.email });
                    if (mDB && pendingMsgsRef.current.length > 0) {
                        const convId = getConversationId(me._id, data.toUserId);
                        for (const pm of pendingMsgsRef.current) {
                            await mDB.add({ conversationId: convId, fromUserId: me._id, toUserId: data.toUserId, text: pm.text, type: pm.type || 'text', timestamp: pm.timestamp, isMe: true });
                        }
                        pendingMsgsRef.current = [];
                    }
                    setSelectedChat(prev => prev?.isNew ? { ...prev, userId: data.toUserId, isNew: false } : prev);
                } catch (e) { console.error('New contact finalise error:', e); }
            }
        });

        socket.on('message-failed', (data) => { setSendError(data.reason || 'Failed to send — user may not exist'); pendingMsgsRef.current = []; setTimeout(() => setSendError(''), 5000); });
        socket.on('music-state', (s) => setMusicState(s));
        socket.on('play-song', ({ songId, time }) => { setMusicState({ songId, isPlaying: true, currentTime: time }); if (audioRef.current) { audioRef.current.currentTime = time; audioRef.current.play(); } });
        socket.on('pause-song', ({ time }) => { setMusicState(prev => ({ ...prev, isPlaying: false, currentTime: time })); if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = time; } });
        socket.on('seek-song', ({ time }) => { setMusicState(prev => ({ ...prev, currentTime: time })); if (audioRef.current) audioRef.current.currentTime = time; });

        // ── TYPING EVENTS ──
        socket.on('user-typing', (data) => { if (selectedChatRef.current?.userId === data.fromUserId) setIsTyping(true); });
        socket.on('user-stop-typing', (data) => { if (selectedChatRef.current?.userId === data.fromUserId) setIsTyping(false); });

        return () => {
            ['connect', 'disconnect', 'user-status', 'receive-private-message', 'message-sent', 'message-failed',
                'music-state', 'play-song', 'pause-song', 'seek-song', 'user-typing', 'user-stop-typing']
                .forEach(ev => socket.off(ev));
        };
    }, [activeUser, navigate]);

    // ── FILTERS ──
    const filteredContacts = allContacts.filter(c => {
        if (c.email === activeUser?.email) return false;
        if (!searchTerm) return true;
        const t = searchTerm.toLowerCase();
        return (c.email || '').toLowerCase().includes(t) || (c.name || '').toLowerCase().includes(t);
    });
    const exactMatch = allContacts.find(c => c.email?.toLowerCase() === searchTerm.toLowerCase());
    const showNewChatOption = searchTerm.includes('@') && !exactMatch && searchTerm.toLowerCase() !== activeUser?.email?.toLowerCase();

    // ── HANDLERS ──
    const handleSelectContact = async (contact) => {
        pendingMsgsRef.current = [];
        setSendError('');
        setNotifications(prev => prev.filter(n => n.fromUserId !== contact.userId));
        if (contacts && (contact.unread || 0) > 0) {
            try { await contacts.update({ ...contact, unread: 0, isRequest: false }); } catch (e) { console.error(e); }
        }
        dispatch(setSelectedContact(contact));
        navigate('/chat');
    };

    const handleStartNewChat = () => {
        pendingMsgsRef.current = [];
        setSendError('');
        setSearchTerm('');
        dispatch(setSelectedContact({ userId: null, email: searchTerm.trim(), name: searchTerm.trim(), isNew: true }));
        navigate('/chat');
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!messageInput.trim() || !selectedChat) return;
        if (selectedChat?.userId && activeUser?._id) {
            socket.emit('stop-typing', { fromUserId: activeUser._id, toUserId: selectedChat.userId });
            clearTimeout(typingTimeoutRef.current);
        }
        const newMsg = { text: messageInput, type: 'text', timestamp: new Date().toISOString(), isMe: true, id: Date.now() };
        setChatMessages(prev => [...prev, newMsg]);
        if (currentConvId && messagesStore) {
            try { await messagesStore.add({ conversationId: currentConvId, fromUserId: activeUser._id, toUserId: selectedChat.userId, text: messageInput, type: 'text', timestamp: newMsg.timestamp, isMe: true }); } catch (e) { console.error(e); }
        } else if (selectedChat.isNew) { pendingMsgsRef.current.push(newMsg); }
        socket.emit('send-message-by-email', { fromUserId: activeUser._id, toEmail: selectedChat.email, message: messageInput, type: 'text' });
        setMessageInput('');
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        if (selectedChat?.userId && activeUser?._id) {
            socket.emit('typing', { fromUserId: activeUser._id, toUserId: selectedChat.userId });
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => socket.emit('stop-typing', { fromUserId: activeUser._id, toUserId: selectedChat.userId }), 2000);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedChat) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'text';
            const newMsg = { text: ev.target.result, type, timestamp: new Date().toISOString(), isMe: true, id: Date.now() };
            setChatMessages(prev => [...prev, newMsg]);
            if (currentConvId && messagesStore) {
                try { await messagesStore.add({ conversationId: currentConvId, fromUserId: activeUser._id, toUserId: selectedChat.userId, text: ev.target.result, type, timestamp: newMsg.timestamp, isMe: true }); } catch (err) { console.error(err); }
            } else if (selectedChat.isNew) { pendingMsgsRef.current.push(newMsg); }
            socket.emit('send-message-by-email', { fromUserId: activeUser._id, toEmail: selectedChat.email, message: ev.target.result, type });
        };
        reader.readAsDataURL(file);
    };

    const handleMusicAction = (action, data = {}) => socket.emit(`${action}-song`, { roomId: 'main', ...data });
    const handleLogout = () => { localStorage.removeItem('user'); dispatch(setActiveUser(null)); navigate('/'); };
    const handleContextMenu = (e, contact) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, contact }); };

    const handleDeleteContact = async () => {
        if (!contextMenu?.contact) return;
        const contact = contextMenu.contact;
        setContextMenu(null);
        if (!window.confirm(`Delete chat with ${contact.name || contact.email}? This will remove all messages.`)) return;
        try {
            if (messagesStore && activeUser?._id && contact.userId) {
                const convId = getConversationId(activeUser._id, contact.userId);
                const msgs = await messagesStore.where(m => m.conversationId === convId);
                for (const msg of msgs) { try { await messagesStore.delete(msg.id); } catch (_) { } }
            }
            if (contacts && contact.id) await contacts.delete(contact.id);
            if (selectedChat?.email === contact.email) { setSelectedChat(null); setChatMessages([]); }
        } catch (err) { console.error('Error deleting contact:', err); }
    };

    // ── HELPERS ──
    const getInitials = (u) => u?.name ? u.name[0].toUpperCase() : u?.email ? u.email[0].toUpperCase() : '?';
    const getDisplayName = (u) => u?.name || u?.email?.split('@')[0] || 'User';
    const getProfilePic = (user) => {
        if (!user) return null;
        if (user.profileImage?.data?.data) {
            let b = ''; const bytes = new Uint8Array(user.profileImage.data.data);
            for (let i = 0; i < bytes.byteLength; i++) b += String.fromCharCode(bytes[i]);
            return `data:${user.profileImage.contentType};base64,${window.btoa(b)}`;
        }
        if (user.profilePic) return user.profilePic.startsWith('http') ? user.profilePic : `https://mes-ioa3.onrender.com/${user.profilePic}`;
        return null;
    };

    const helpers = { getInitials, getDisplayName, getProfilePic };

    // ── RENDER ──
    return (
        <div className="min-h-screen w-full bg-[#0a0f1e] text-slate-200 flex overflow-hidden font-sans selection:bg-cyan-500/30">

            {/* Background FX */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[140px] animate-pulse-slow" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse-slow" />
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px]" />
            </div>

            <ToastBar
                notifications={notifications}
                allContacts={allContacts}
                onSelectContact={handleSelectContact}
                onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            />

            <Sidebar
                activeUser={activeUser} connected={connected}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                filteredContacts={filteredContacts} showNewChatOption={showNewChatOption}
                selectedChat={selectedChat} onlineUserIds={onlineUserIds}
                onSelectContact={handleSelectContact} onStartNewChat={handleStartNewChat}
                onContextMenu={handleContextMenu} onLogout={handleLogout}
                onShowProfile={() => setShowProfile(true)}
                {...helpers}
            />

            <main className="hidden md:flex flex-1 flex-col bg-slate-950/20 relative overflow-hidden backdrop-blur-md">
                <ChatWindow
                    selectedChat={selectedChat} activeUser={activeUser}
                    chatMessages={chatMessages} messageInput={messageInput}
                    sendError={sendError} isTyping={isTyping}
                    onlineUserIds={onlineUserIds} musicState={musicState}
                    audioRef={audioRef} bottomRef={bottomRef}
                    onSendMessage={handleSendMessage} onInputChange={handleInputChange}
                    onFileUpload={handleFileUpload} onMusicAction={handleMusicAction}
                    {...helpers}
                />
            </main>

            <ContextMenuPopup
                contextMenu={contextMenu}
                onDelete={handleDeleteContact}
                onClose={() => setContextMenu(null)}
            />

            {showProfile && (
                <ProfileModal
                    activeUser={activeUser} allContacts={allContacts}
                    onClose={() => setShowProfile(false)} onLogout={handleLogout}
                    {...helpers}
                />
            )}

            <style>{`
                @keyframes slideIn { from { opacity: 0; transform: translateX(-30px) scale(0.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                @keyframes pulse-slow { 0%, 100% { transform: scale(1); opacity: 0.1; } 50% { transform: scale(1.1); opacity: 0.2; } }
                @keyframes slideInRight { from { opacity: 0; transform: translateX(60px) scale(0.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
                @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-6px); opacity: 1; } }
                .animate-slideIn { animation: slideIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
                .animate-slideInRight { animation: slideInRight 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
                .animate-fadeIn { animation: fadeIn 1s cubic-bezier(0.16,1,0.3,1) forwards; }
                .animate-fadeInFast { animation: fadeIn 0.4s ease-out forwards; }
                .animate-fadeInSlow { animation: fadeIn 1.5s cubic-bezier(0.16,1,0.3,1) forwards; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.1); border-radius: 99px; }
                .active-chat-indicator::before { content: ''; position: absolute; left: 0; top: 25%; height: 50%; width: 4px; background: #22d3ee; border-radius: 0 4px 4px 0; box-shadow: 0 0 10px #22d3ee; }
                .bg-grid-white\\/\\[0\\.02\\] { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.02)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e"); }
            `}</style>
        </div>
    );
}
