import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveUser, addMessage } from '../counterSlice';
import { io } from 'socket.io-client';

const socket = io("https://mes-ioa3.onrender.com/");

export default function HomePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { activeUser, users, messages } = useSelector((state) => state.chat);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const [connected, setConnected] = useState(false);
    const [onlineUserIds, setOnlineUserIds] = useState([]);

    // Music State
    const [musicState, setMusicState] = useState({ songId: null, isPlaying: false, currentTime: 0 });
    const audioRef = React.useRef(null);

    // Profile Modal State
    const [showProfile, setShowProfile] = useState(false);

    // Protect the route - if no user is logged in, send back to login
    useEffect(() => {
        if (!activeUser) {
            navigate('/');
        } else {
            // Socket setup
            socket.on("connect", () => {
                setConnected(true);
                socket.emit("user-online", activeUser._id);
            });

            socket.on("disconnect", () => setConnected(false));

            socket.on("user-status", (data) => {
                setOnlineUserIds(data.onlineUsers || []);
            });

            socket.on("receive-private-message", (data) => {
                dispatch(addMessage({
                    from: data.fromUserId,
                    to: activeUser._id,
                    text: data.message,
                    timestamp: data.createdAt,
                    fromEmail: data.fromEmail
                }));
            });

            socket.on("message-sent", (data) => {
                console.log("Message delivered/cached:", data);
            });

            // Music Events
            socket.on("music-state", (state) => {
                setMusicState(state);
            });

            socket.on("play-song", ({ songId, time }) => {
                setMusicState({ songId, isPlaying: true, currentTime: time });
                if (audioRef.current) {
                    audioRef.current.currentTime = time;
                    audioRef.current.play();
                }
            });

            socket.on("pause-song", ({ time }) => {
                setMusicState(prev => ({ ...prev, isPlaying: false, currentTime: time }));
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = time;
                }
            });

            socket.on("seek-song", ({ time }) => {
                setMusicState(prev => ({ ...prev, currentTime: time }));
                if (audioRef.current) audioRef.current.currentTime = time;
            });

            return () => {
                socket.off("connect");
                socket.off("disconnect");
                socket.off("user-status");
                socket.off("receive-private-message");
                socket.off("message-sent");
                socket.off("music-state");
                socket.off("play-song");
                socket.off("pause-song");
                socket.off("seek-song");
            };
        }
    }, [activeUser, navigate, dispatch]);

    const handleMusicAction = (action, data = {}) => {
        const roomId = "main"; // Default room
        socket.emit(`${action}-song`, { roomId, ...data });
    };

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (!messageInput.trim() || !selectedChat) return;

        const payload = {
            fromUserId: activeUser._id,
            toEmail: selectedChat.email,
            message: messageInput,
            type: "text"
        };

        socket.emit("send-message-by-email", payload);

        // Optimistically add to local state
        dispatch(addMessage({
            from: activeUser._id,
            to: selectedChat._id || selectedChat.id,
            text: messageInput,
            timestamp: new Date().toISOString(),
            isMe: true
        }));

        setMessageInput("");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !selectedChat) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const type = file.type.startsWith('image/') ? 'image' :
                file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' : 'text';

            const payload = {
                fromUserId: activeUser._id,
                toEmail: selectedChat.email,
                message: event.target.result,
                type
            };
            socket.emit("send-message-by-email", payload);

            // Local optimistic add
            dispatch(addMessage({
                from: activeUser._id,
                to: selectedChat._id || selectedChat.id,
                text: event.target.result,
                type,
                timestamp: new Date().toISOString(),
                isMe: true
            }));
        };
        reader.readAsDataURL(file);
    };

    const getChatMessages = () => {
        if (!selectedChat) return [];
        return messages.filter(m =>
            (m.from === activeUser._id && (m.to === selectedChat._id || m.to === selectedChat.id)) ||
            (m.from === (selectedChat._id || selectedChat.id) && m.to === activeUser._id) ||
            (m.fromEmail === selectedChat.email) // For messages from email lookups
        );
    };

    const handleLogout = () => {
        dispatch(setActiveUser(null));
        navigate('/');
    };

    const filteredUsers = users.filter(user => {
        const email = user.email || "";
        const name = user.name || "";
        return (email.toLowerCase().includes(searchTerm.toLowerCase()) || name.toLowerCase().includes(searchTerm.toLowerCase())) && email !== activeUser?.email;
    });

    const getInitials = (user) => {
        if (user?.name) return user.name[0].toUpperCase();
        if (user?.email) return user.email[0].toUpperCase();
        return "?";
    };

    const getDisplayName = (user) => {
        return user?.name || user?.email?.split('@')[0] || "User";
    };

    const getProfilePic = (pic) => {
        if (!pic) return null;
        if (pic.startsWith('http')) return pic;
        return `http://192.168.0.54:5000/${pic}`;
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0f1e] text-slate-200 flex overflow-hidden font-sans selection:bg-cyan-500/30">

            {/* --- ADANCED BACKGROUND ANIMATIONS --- */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden h-full w-full">
                <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[140px] animate-pulse-slow" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse-slow delay-2000" />
                <div className="absolute top-[30%] right-[15%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[100px] animate-bounce-very-slow" />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }} />                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px]" />
            </div>

            {/* --- SIDEBAR --- */}
            <aside className="w-full md:w-[380px] bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 flex flex-col h-screen z-20 relative">
                {/* Sidebar Header */}
                <header className="p-7 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setShowProfile(true)}>
                        <div className="relative">
                            <div className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-cyan-400 to-indigo-600 p-[2px] shadow-2xl shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-500">
                                <div className="w-full h-full rounded-[20px] bg-slate-900 flex items-center justify-center font-black overflow-hidden">
                                    {getProfilePic(activeUser?.profilePic) ? (
                                        <img src={getProfilePic(activeUser.profilePic)} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-300 to-indigo-300 text-2xl">
                                            {getInitials(activeUser)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a0f1e] rounded-full p-1 border-white/5 border overflow-hidden">
                                <div className="w-full h-full bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <h2 className="text-white font-bold text-lg tracking-tight leading-none mb-1 group-hover:text-cyan-400 transition-colors">
                                {getDisplayName(activeUser)}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase opacity-70">Authenticated</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-3 bg-white/5 hover:bg-red-500/20 rounded-2xl border border-white/5 transition-all group active:scale-90"
                        title="Logout"
                    >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-red-400 group-hover:rotate-12 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </header>

                {/* Sidebar Search Area */}
                <div className="px-6 pb-2">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
                        <input
                            type="text"
                            placeholder="Find a conversation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full relative bg-white/5 border border-white/10 rounded-2xl py-4 px-14 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm group-hover:bg-white/10 placeholder:text-slate-500 placeholder:font-medium text-white shadow-inner"
                        />
                        <svg className="w-5 h-5 absolute left-5 top-4.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* User List Containers */}
                <div className="flex-1 overflow-y-auto mt-4 px-4 pb-10 space-y-3 custom-scrollbar">
                    <div className="px-4 flex items-center justify-between mb-4 mt-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Online Contacts</span>
                        <div className="h-[1px] flex-1 bg-white/5 ml-4" />
                        <span className="ml-4 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/20">{filteredUsers.length}</span>
                    </div>

                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user, idx) => (
                            <div
                                key={user.id || idx}
                                onClick={() => setSelectedChat(user)}
                                className={`flex items-center gap-4 p-5 rounded-[24px] transition-all duration-500 cursor-pointer group animate-slideIn relative border border-transparent ${selectedChat?.email === user.email ? "bg-cyan-500/15 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] active-chat-indicator" : "hover:bg-white/[0.03] hover:border-white/5"}`}
                                style={{ animationDelay: `${idx * 60}ms` }}
                            >
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-[20px] bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:text-cyan-300 group-hover:scale-[1.03] transition-all duration-500 border border-white/5 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                                        {getInitials(user)}
                                    </div>
                                    {onlineUserIds.includes(user._id || user.id) && (
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#0a0f1e] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-extrabold text-white group-hover:text-cyan-400 transition-colors truncate text-md leading-tight">
                                            {getDisplayName(user)}
                                        </h3>
                                        <span className="text-[9px] font-black text-slate-500 mt-1 opacity-70 tracking-tighter uppercase whitespace-nowrap">Active Now</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate font-medium flex items-center gap-1.5 group-hover:text-slate-400">
                                        Open chat window
                                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 px-10 flex flex-col items-center opacity-40 select-none animate-fadeIn">
                            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 text-slate-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] leading-relaxed">Quiet Space <br /> No one around</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* --- MAIN CONTENT WINDOW --- */}
            <main className="hidden md:flex flex-1 flex-col bg-slate-950/20 relative overflow-hidden backdrop-blur-md">

                {selectedChat ? (
                    <div className="flex flex-col h-full animate-fadeInFast relative z-10 overflow-hidden">

                        {/* High-End Header */}
                        <header className="px-10 py-6 backdrop-blur-3xl bg-white/[0.02] border-b border-white/5 flex items-center justify-between group">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-cyan-400/20 to-indigo-600/20 flex items-center justify-center font-black text-2xl text-cyan-400 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:scale-105 transition-transform duration-500">
                                        {getInitials(selectedChat)}
                                    </div>
                                    {onlineUserIds.includes(selectedChat._id || selectedChat.id) && (
                                        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="font-black text-white text-xl tracking-tight leading-none group-hover:text-cyan-400 transition-colors">{getDisplayName(selectedChat)}</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                                        <p className="text-[10px] text-green-400 font-black uppercase tracking-[0.15em] opacity-80">
                                            {onlineUserIds.includes(selectedChat._id || selectedChat.id) ? "Online & Encrypted" : "Offline (Cached Delivery)"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Music Controller Overlay */}
                            <div className="flex items-center gap-4 bg-slate-900/50 border border-white/5 px-6 py-2 rounded-2xl backdrop-blur-md">
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mr-2">Music Sync</span>
                                <button
                                    onClick={() => handleMusicAction(musicState.isPlaying ? 'pause' : 'play', { time: audioRef.current?.currentTime || 0 })}
                                    className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-full text-cyan-400 transition-all active:scale-90"
                                >
                                    {musicState.isPlaying ? (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    )}
                                </button>
                                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden relative">
                                    <div className="absolute top-0 left-0 h-full bg-cyan-500 transition-all duration-300" style={{ width: `${(musicState.currentTime / 300) * 100}%` }} />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {["video", "phone"].map((icon, i) => (
                                    <button key={i} className="p-3.5 bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 rounded-2xl transition-all hover:scale-110 active:scale-90 text-slate-400 hover:text-cyan-400">
                                        {icon === "video" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                                        {icon === "phone" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                                    </button>
                                ))}
                            </div>
                        </header>

                        {/* Interactive Message Stage */}
                        <div className="flex-1 px-10 py-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
                            {getChatMessages().length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center relative">
                                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-900/40 to-transparent pointer-events-none" />
                                    <div className="group relative">
                                        <div className="absolute inset-0 bg-cyan-600/10 blur-[100px] scale-[2]" />
                                        <div className="relative bg-white/[0.02] border border-white/5 p-12 rounded-[60px] text-center max-w-sm backdrop-blur-3xl">
                                            <h3 className="text-2xl font-black text-white mb-3">No messages yet</h3>
                                            <p className="text-sm text-slate-400">Start the conversation with {getDisplayName(selectedChat)}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                getChatMessages().map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.isMe || msg.from === activeUser._id ? 'justify-end' : 'justify-start'} group/msg`}>
                                        <div className={`max-w-[70%] px-6 py-3 rounded-[24px] ${msg.isMe || msg.from === activeUser._id ? 'bg-indigo-600 text-white rounded-br-none shadow-xl shadow-indigo-600/20' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'}`}>
                                            {msg.type === "image" ? (
                                                <img src={msg.text} className="rounded-lg mb-2 max-w-xs cursor-pointer hover:opacity-90 transition-opacity" alt="attached" />
                                            ) : msg.type === "video" ? (
                                                <video src={msg.text} controls className="rounded-lg mb-2 max-w-xs" />
                                            ) : msg.type === "audio" ? (
                                                <audio src={msg.text} controls className="mb-2 max-w-xs" />
                                            ) : (
                                                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                            )}
                                            <div className="flex items-center justify-between gap-4 mt-1 opacity-40 group-hover/msg:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-black uppercase tracking-tighter">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {msg.isMe && (
                                                    <svg className="w-3 h-3 text-cyan-300" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Modern Floating Input Area */}
                        <form onSubmit={handleSendMessage} className="px-10 pb-10 pt-4">
                            <div className="bg-slate-900 border border-white/5 rounded-[40px] p-3 flex items-center gap-4 group/input shadow-2xl focus-within:shadow-[0_0_40px_rgba(6,182,212,0.1)] focus-within:border-cyan-500/20 transition-all duration-700">
                                <div className="flex pl-3 gap-1">
                                    <label className="p-3.5 rounded-full text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-all cursor-pointer" title="Attach File">
                                        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*,audio/*" />
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    </label>
                                    <button type="button" className="p-3.5 rounded-full text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-all" title="Stickers/Emoji">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={`Message ${getDisplayName(selectedChat)}...`}
                                    className="flex-1 bg-transparent py-5 focus:outline-none text-white placeholder:text-slate-600 font-medium text-sm border-x border-white/5 px-6 mx-2"
                                />

                                <button type="submit" disabled={!messageInput.trim()} className="mr-1 h-14 w-14 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-600/20 hover:scale-110 active:scale-95 transition-all group/send border border-white/10 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/send:opacity-100 transition-opacity" />
                                    <svg className="w-7 h-7 text-white transform group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* --- MAJESTIC EMPTY STATE --- */
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-fadeInSlow relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)]" />

                        <div className="relative mb-14 group cursor-pointer" onClick={() => setShowProfile(true)}>
                            <div className="absolute inset-0 bg-cyan-400/20 rounded-[3rem] blur-3xl animate-pulse group-hover:bg-cyan-400/40 transition-all duration-1000 scale-[1.3]" />
                            <div className="w-44 h-44 bg-gradient-to-tr from-[#0a0f1e] to-slate-800 rounded-[3rem] flex items-center justify-center shadow-2xl relative z-10 animate-float border border-white/10 overflow-hidden">
                                {getProfilePic(activeUser?.profilePic) ? (
                                    <img src={getProfilePic(activeUser.profilePic)} className="w-full h-full object-cover" alt="Me" />
                                ) : (
                                    <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-cyan-300 to-indigo-400">
                                        {getInitials(activeUser)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <h2 className="text-6xl font-black mb-6 bg-gradient-to-b from-white to-slate-600 bg-clip-text text-transparent tracking-tighter leading-tight drop-shadow-sm">
                            Ready to Stream, <br /> {getDisplayName(activeUser)}?
                        </h2>

                        <p className="text-slate-400 text-xl max-w-lg leading-relaxed mb-14 mx-auto font-medium opacity-60">
                            Experience the future of seamless, real-time communication. Your private dashboard is synchronized across all devices.
                        </p>

                        <div className="group/btn relative px-8 py-4 rounded-3xl bg-white/[0.03] border border-white/10 transition-all duration-500 overflow-hidden cursor-default shadow-xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                            <div className="flex items-center gap-4 text-cyan-400 font-black text-xs tracking-[0.3em] uppercase relative z-10">
                                <div className="flex gap-1.5 items-center">
                                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                                    <span className="w-2 h-2 bg-cyan-500 rounded-full absolute" />
                                </div>
                                Select a contact to activate
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* --- PROFILE MODAL --- */}
            {showProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fadeInFast">
                    <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-slideIn">
                        <button
                            onClick={() => setShowProfile(false)}
                            className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                        >
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="pt-16 pb-12 px-10 text-center">
                            <div className="w-32 h-32 mx-auto rounded-[32px] bg-gradient-to-tr from-cyan-400 to-indigo-600 p-1 mb-6 shadow-2xl shadow-cyan-500/20">
                                <div className="w-full h-full rounded-[28px] bg-slate-900 flex items-center justify-center overflow-hidden">
                                    {getProfilePic(activeUser?.profilePic) ? (
                                        <img src={getProfilePic(activeUser.profilePic)} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-black text-white">{getInitials(activeUser)}</span>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-white mb-1 tracking-tight">{getDisplayName(activeUser)}</h2>
                            <p className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-10 opacity-70"></p>

                            <div className="space-y-4 text-left">
                                <div className="p-5 bg-white/5 border border-white/5 rounded-3xl group hover:border-cyan-500/20 transition-all">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Email Address</p>
                                    <p className="text-md text-white font-medium group-hover:text-cyan-300 transition-colors">{activeUser?.email}</p>
                                </div>
                                <div className="p-5 bg-white/5 border border-white/5 rounded-3xl group hover:border-cyan-500/20 transition-all">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">User Identification</p>
                                    <p className="text-sm text-white font-mono opacity-60">ID: {activeUser?._id || activeUser?.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 pb-10">
                            <button
                                onClick={handleLogout}
                                className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-red-500/20 transition-all active:scale-95"
                            >
                                Terminate Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CUSTOM ANIMATIONS AND UI STYLES --- */}
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-30px) scale(0.95); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    33% { transform: translateY(-15px) rotate(2deg); }
                    66% { transform: translateY(5px) rotate(-2deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 0.1; }
                    50% { transform: scale(1.1); opacity: 0.2; }
                }
                @keyframes bounce-very-slow {
                    0%, 100% { transform: translate(0, 0); opacity: 0.05; }
                    50% { transform: translate(20px, -20px); opacity: 0.1; }
                }

                .animate-slideIn { animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .animate-fadeIn { animation: fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fadeInFast { animation: fadeIn 0.4s ease-out forwards; }
                .animate-fadeInSlow { animation: fadeIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
                .animate-bounce-very-slow { animation: bounce-very-slow 12s ease-in-out infinite; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.1); border-radius: 99px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.3); }

                .active-chat-indicator::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 25%;
                    height: 50%;
                    width: 4px;
                    background: #22d3ee;
                    border-radius: 0 4px 4px 0;
                    box-shadow: 0 0 10px #22d3ee;
                }

                .bg-grid-white\/\\[0\\.02\\] {
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.02)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
                }
            `}</style>
        </div>
    );
}

