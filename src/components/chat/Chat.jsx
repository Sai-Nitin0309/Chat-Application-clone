import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useCollection } from 'ikago';
import { getConversationId } from '../../services/ikagoDb';
import { setSelectedContact } from '../../counterSlice';

// Sub-components
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatBackground from './ChatBackground';
import ErrorNotification from './ErrorNotification';

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
    const bottomRef = useRef(null);

    useEffect(() => { msgsRef.current = messagesStore; }, [messagesStore]);
    useEffect(() => { contactsRef.current = contactsStore; }, [contactsStore]);
    useEffect(() => { meRef.current = activeUser; }, [activeUser]);
    useEffect(() => { contactRef.current = selectedContact; }, [selectedContact]);

    // --- State ---
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(socket.connected);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [sendError, setSendError] = useState('');

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

    // --- Socket handlers ---
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
            const me = meRef.current;
            const contact = contactRef.current;
            const mDB = msgsRef.current;
            const cDB = contactsRef.current;

            const senderId = data.fromUserId || data.senderId;
            if (!me || !senderId) return;

            const meId = getId(me);
            const cId = getConversationId(meId, senderId);
            const isHere = senderId === contact?.userId;
            const timestamp = data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString();

            // Update UI if relevant
            if (isHere) {
                setMessages((prev) => [
                    ...prev,
                    { id: Date.now() + Math.random(), text: data.message, type: data.type || 'text', timestamp, fileName: data.fileName || null, isMe: false },
                ]);
            }

            // Persist
            if (mDB) {
                try {
                    await mDB.add({ conversationId: cId, fromUserId: senderId, toUserId: meId, text: data.message, type: data.type || 'text', timestamp, isMe: false });
                } catch (_) { }
            }

            // Auto-save contact
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

    // --- Actions ---
    const handleSend = useCallback(async (text) => {
        if (!text || !selectedContact || !activeUser) return;
        const now = new Date().toISOString();
        const myId = getId(activeUser);

        // Optimistic UI
        setMessages((prev) => [...prev, { id: Date.now(), text, type: 'text', timestamp: now, isMe: true }]);

        // Persist
        if (convId && messagesStore) {
            try { await messagesStore.add({ conversationId: convId, fromUserId: myId, toUserId: contactId, text, type: 'text', timestamp: now, isMe: true }); } catch (_) { }
        } else if (selectedContact.isNew) {
            pendingRef.current.push({ text, type: 'text', timestamp: now });
        }

        // Emit
        socket.emit('send-message-by-email', { fromUserId: myId, toEmail: selectedContact.email, message: text, type: 'text' });
    }, [activeUser, selectedContact, convId, messagesStore, contactId]);

    const handleFile = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedContact || !activeUser) return;
        e.target.value = '';

        const MAX_BYTES = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_BYTES) {
            setSendError('File too large (max 50 MB)');
            setTimeout(() => setSendError(''), 5000);
            return;
        }

        let type = file.type ? file.type.split('/')[0] : 'file';
        if (!['image', 'video', 'audio'].includes(type)) type = 'file';

        const now = new Date().toISOString();
        const myId = getId(activeUser);
        const MIN_LOADER_MS = 6000; // show loader for at least 6 seconds

        const messageId = Date.now();
        setMessages((prev) => [...prev, { id: messageId, text: '', type, timestamp: now, isMe: true, fileName: file.name, uploading: true }]);

        // Read file as data URL
        const readFile = () => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
        });

        // Wait for BOTH: file read AND minimum loader duration
        const [content] = await Promise.all([
            readFile(),
            new Promise((resolve) => setTimeout(resolve, MIN_LOADER_MS)),
        ]);

        // Dismiss loader and show real content
        setMessages((prev) => prev.map(msg =>
            msg.id === messageId ? { ...msg, text: content, type, fileName: file.name, uploading: false } : msg
        ));

        // Persist to IndexedDB
        if (convId && messagesStore) {
            try { await messagesStore.add({ conversationId: convId, fromUserId: myId, toUserId: contactId, text: content, type, timestamp: now, isMe: true, fileName: file.name }); } catch (_) { }
        } else if (selectedContact.isNew) {
            pendingRef.current.push({ text: content, type, timestamp: now, fileName: file.name });
        }

        // Emit via socket
        socket.emit('send-message-by-email', { fromUserId: myId, toEmail: selectedContact.email, message: content, type, fileName: file.name });
    }, [activeUser, selectedContact, convId, messagesStore, contactId]);

    const handleClearChat = useCallback(async () => {
        if (!window.confirm('Are you sure you want to clear this chat?')) return;
        try {
            setMessages([]);
            if (convId && messagesStore) {
                const msgsToDelete = await messagesStore.where((m) => m.conversationId === convId);
                for (const msg of msgsToDelete) await messagesStore.delete(msg.id);
            }
        } catch (err) { console.error('Error clearing chat:', err); }
    }, [convId, messagesStore]);

    const handleErrorClose = useCallback(() => setSendError(''), []);

    // --- Helpers ---
    const initials = useCallback((u) => u?.name ? u.name[0].toUpperCase() : u?.email ? u.email[0].toUpperCase() : '?', []);
    const displayName = useCallback((u) => u?.name || u?.email?.split('@')[0] || 'User', []);
    const profilePic = useCallback((u) => {
        if (!u) return null;
        if (u.profileImage?.data?.data) {
            let b = ''; const bytes = new Uint8Array(u.profileImage.data.data);
            for (let i = 0; i < bytes.byteLength; i++) b += String.fromCharCode(bytes[i]);
            return `data:${u.profileImage.contentType};base64,${window.btoa(b)}`;
        }
        if (u.profilePic) return u.profilePic.startsWith('http') ? u.profilePic : `${SOCKET_URL}${u.profilePic}`;
        return null;
    }, []);

    if (!activeUser || !selectedContact) return null;

    const isOnline = contactId && onlineUsers.includes(contactId);

    return (
        <div className="h-screen w-screen flex flex-col bg-[#07090f] text-slate-200 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            <ChatBackground />

            <ChatHeader 
                selectedContact={selectedContact} 
                activeUser={activeUser} 
                isOnline={isOnline} 
                connected={connected} 
                navigate={navigate}
                profilePic={profilePic}
                initials={initials}
                displayName={displayName}
                onClearChat={handleClearChat}
            />

            <ErrorNotification error={sendError} onClose={handleErrorClose} />

            <MessageList 
                messages={messages} 
                selectedContact={selectedContact} 
                activeUser={activeUser} 
                bottomRef={bottomRef}
                profilePic={profilePic}
                initials={initials}
                displayName={displayName}
            />

            <ChatInput 
                onSend={handleSend} 
                onFile={handleFile} 
                displayName={displayName} 
                selectedContact={selectedContact} 
            />

            <style>{`
                @keyframes pls { 0%,100%{opacity:1} 50%{opacity:0.4} }
                .custom-scrollbar::-webkit-scrollbar{width:4px}
                .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
                .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(6,182,212,0.15);border-radius:99px}
                .attach-btn { transition: color 0.1s ease; }
                .attach-btn:hover { color: #22d3ee !important; }
                .menu-btn { transition: color 0.1s ease !important; }
                .menu-btn:hover { color: #22d3ee !important; }
                .menu-item { transition: background 0.1s ease !important; }
                .menu-item:hover { background: rgba(239,68,68,0.1) !important; }
                button[title="Emoji picker"]:hover { color: #22d3ee !important; }
            `}</style>
        </div>
    );
};

export default Chat;
