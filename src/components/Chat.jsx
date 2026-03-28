import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

// Replace with your backend server URL
const socket = io("https://mes-ioa3.onrender.com/");
// const socket = io("http://localhost:5000");


const Chat = () => {
    // Get the logged-in user details from Redux
    const { activeUser } = useSelector((state) => state.chat);

    // Fallback if no user is found
    const [userName] = useState(activeUser?.name || activeUser?.email?.split('@')[0] || "Guest");

    const [mes, setMsg] = useState({ userName: userName, msg: "" });
    const [allMsg, setAllMsg] = useState([]);
    const [typing, setTyping] = useState(false);
    const [userTyping, setUserTyping] = useState(false);
    const [connected, setConnected] = useState(false);
    const [animIds, setAnimIds] = useState(new Set());

    const bottomRef = useRef(null);
    const typingTimer = useRef(null);
    const inputRef = useRef(null);

    // Socket events
    useEffect(() => {
        if (connected && activeUser?._id) {
            // Tell the server we are online
            socket.emit("user-online", activeUser._id);
            // Join a default room (can be dynamic later)
            socket.emit("join-room", { roomId: "main", userId: activeUser._id });
        }
    }, [connected, activeUser]);

    useEffect(() => {
        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        // Listen for group messages (room chat)
        socket.on("receiveMessage", (data) => {
            const id = Date.now() + Math.random();
            setAllMsg(prev => [...prev, {
                userName: data.senderId === activeUser?._id ? userName : "Other User",
                msg: data.content,
                type: data.type || "text",
                id
            }]);

            // For entrance animation
            setAnimIds(prev => new Set([...prev, id]));
            setTimeout(() => {
                setAnimIds(prev => { const n = new Set(prev); n.delete(id); return n; });
            }, 500);
        });

        // Listen for private messages
        socket.on("receive-private-message", (data) => {
            const id = Date.now() + Math.random();
            setAllMsg(prev => [...prev, {
                userName: data.fromName || data.fromEmail || "Private User",
                msg: data.message,
                type: data.type || "text",
                id,
                isPrivate: true
            }]);
        });

        socket.on("typing", (val) => setUserTyping(val));

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("receiveMessage");
            socket.off("receive-private-message");
            socket.off("typing");
        };
    }, [activeUser, userName]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [allMsg, userTyping]);

    const handleChange = (e) => {
        setMsg(prev => ({ ...prev, [e.target.name]: e.target.value }));

        if (!typing) {
            setTyping(true);
            socket.emit("typing", true);
        }

        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            setTyping(false);
            socket.emit("typing", false);
        }, 1200);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const type = file.type.startsWith('image/') ? 'image' :
                file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' : 'text';

            const payload = {
                senderId: activeUser?._id,
                roomId: "main",
                type,
                content: event.target.result // Base64 for the mockup
            };
            socket.emit("sendMessage", payload);

            // Optimistic add
            setAllMsg(prev => [...prev, { userName, msg: event.target.result, type, id: Date.now() }]);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!mes.msg.trim()) return;

        // Backend expects: { senderId, roomId, type, content }
        const messagePayload = {
            senderId: activeUser?._id,
            roomId: "main", // Should probably be dynamic
            type: "text",
            content: mes.msg
        };

        // Emit message to the server
        socket.emit("sendMessage", messagePayload);

        // Optimistically add your own message to the UI
        const myId = Date.now();
        setAllMsg(prev => [...prev, { ...mes, id: myId, type: "text" }]);

        setMsg(prev => ({ ...prev, msg: "" }));
        inputRef.current?.focus();
    };

    const isMine = (name) => name === userName;

    const getProfilePic = (user) => {
        if (!user) return null;
        if (user.profileImage && user.profileImage.data && user.profileImage.data.data) {
            const buffer = user.profileImage.data.data;
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return `data:${user.profileImage.contentType};base64,${window.btoa(binary)}`;
        }
        if (user.profilePic) {
            if (user.profilePic.startsWith('http')) return user.profilePic;
            return `http://192.168.0.54:5000/${user.profilePic}`;
        }
        return null;
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-[#0a0f1e] text-slate-200 overflow-hidden font-sans">

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between px-8 py-5 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 shadow-2xl z-20">
                <div className="flex items-center gap-4 group">
                    <div className="w-11 h-11 rounded-[14px] bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                        {getProfilePic(activeUser) ? (
                            <img src={getProfilePic(activeUser)} alt="Me" className="w-full h-full object-cover" />
                        ) : (
                            "⚡"
                        )}
                    </div>
                    <div>
                        <h2 className="text-white font-black text-xl tracking-tight leading-none mb-1">LiveStream Chat</h2>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{connected ? 'Socket Connected' : 'Connecting...'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest leading-none mb-1">Active User</p>
                        <p className="text-white font-bold text-sm tracking-tight">{userName}</p>
                    </div>
                </div>
            </div>

            {/* ── MESSAGE LOG ── */}
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-4 scroll-smooth custom-scrollbar">

                {allMsg.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-20 select-none animate-pulse">
                        <div className="text-8xl mb-4">🚀</div>
                        <p className="text-xs font-black uppercase tracking-[0.4em]">Initialize Conversation</p>
                    </div>
                )}

                {allMsg.map((ele, ind) => {
                    const mine = isMine(ele.userName);
                    const isNew = animIds.has(ele.id);

                    return (
                        <div key={ele.id || ind} className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex flex-col gap-1.5 max-w-[75%] ${mine ? 'items-end' : 'items-start'}`}>
                                {!mine && (
                                    <span className="text-[10px] text-slate-500 pl-3 font-black uppercase tracking-widest">{ele.userName}</span>
                                )}
                                <div className={`px-5 py-3.5 rounded-[22px] text-sm leading-relaxed font-semibold break-words transition-all duration-300
                                    ${mine ? 'bg-gradient-to-br from-indigo-500 to-violet-700 text-white rounded-br-sm shadow-xl shadow-indigo-500/20' : 'bg-white/5 text-slate-100 border border-white/5 rounded-bl-sm backdrop-blur-md'}
                                    ${isNew ? 'animate-msgPop' : ''}
                                `}>
                                    {ele.type === "image" ? (
                                        <img src={ele.msg} alt="shared" className="max-w-[200px] rounded-lg" />
                                    ) : ele.type === "video" ? (
                                        <video src={ele.msg} controls className="max-w-[200px] rounded-lg" />
                                    ) : ele.type === "audio" ? (
                                        <audio src={ele.msg} controls className="max-w-[200px]" />
                                    ) : (
                                        ele.msg
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {userTyping && (
                    <div className="flex justify-start animate-fade">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-4 rounded-[18px] rounded-bl-sm">
                            {[0, 1, 2].map(i => (
                                <span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-40"
                                    style={{ animation: `typingDot 1s ease-in-out ${i * 0.15}s infinite` }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={bottomRef} className="h-2" />
            </div>

            {/* ── INPUT SYSTEM ── */}
            <div className="px-6 py-6 bg-slate-900/50 backdrop-blur-xl border-t border-white/5 flex-shrink-0 z-20">
                <form className="max-w-4xl mx-auto flex items-center gap-4" onSubmit={handleSubmit}>
                    <label className="flex items-center justify-center w-14 h-14 bg-white/5 border border-white/10 rounded-[20px] cursor-pointer hover:bg-white/10 transition-colors">
                        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*,audio/*" />
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </label>
                    <div className="flex-1 relative group">
                        <div className="absolute inset-0 bg-cyan-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
                        <input
                            ref={inputRef}
                            type="text"
                            name="msg"
                            value={mes.msg}
                            onChange={handleChange}
                            placeholder={`Message the community...`}
                            autoComplete="off"
                            className="w-full relative bg-white/5 border border-white/10 rounded-[22px] px-8 py-5 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-cyan-500/40 focus:bg-white/[0.08]"
                        />
                    </div>

                    <button type="submit" disabled={!mes.msg.trim()} className="
                        h-14 w-14 flex items-center justify-center rounded-[20px] transition-all duration-300
                        bg-gradient-to-tr from-cyan-400 to-indigo-600 text-white shadow-xl shadow-cyan-600/20
                        hover:scale-110 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:hover:scale-100
                    ">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>

            <style>{`
                @keyframes msgPop {
                    from { opacity: 0; transform: scale(0.9) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes typingDot {
                    0%, 100% { transform: translateY(0); opacity: 0.4; }
                    50% { transform: translateY(-3px); opacity: 1; }
                }
                @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
                .animate-msgPop { animation: msgPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade { animation: fade 0.3s ease-out; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 99px; }
            `}</style>
        </div>
    );
};

export default Chat;
