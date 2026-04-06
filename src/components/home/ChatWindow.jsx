import TypingIndicator from './TypingIndicator';

export default function ChatWindow({
    selectedChat, activeUser,
    chatMessages, messageInput,
    sendError, isTyping,
    onlineUserIds, musicState, audioRef, bottomRef,
    onSendMessage, onInputChange, onFileUpload, onMusicAction,
    getInitials, getDisplayName,
}) {
    if (!selectedChat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-fadeInSlow relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)]" />
                <div className="relative mb-14">
                    <div className="absolute inset-0 bg-cyan-400/20 rounded-[3rem] blur-3xl animate-pulse scale-[1.3]" />
                    <div className="w-44 h-44 bg-gradient-to-tr from-[#0a0f1e] to-slate-800 rounded-[3rem] flex items-center justify-center shadow-2xl relative z-10 animate-float border border-white/10 text-7xl">
                        💬
                    </div>
                </div>
                <h2 className="text-5xl font-black mb-4 bg-gradient-to-b from-white to-slate-600 bg-clip-text text-transparent tracking-tighter leading-tight">
                    Welcome, {getDisplayName(activeUser)}
                </h2>
                <p className="text-slate-400 text-lg max-w-lg leading-relaxed mb-12 font-medium opacity-60">
                    Search for a contact by name or paste their email address to start a private, encrypted conversation.
                </p>
                <div className="flex items-center gap-4 text-cyan-400 font-black text-xs tracking-[0.3em] uppercase bg-white/[0.03] border border-white/10 px-8 py-4 rounded-3xl">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                    Select or search a contact
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fadeInFast relative z-10">

            {/* ── Chat Header ── */}
            <header className="px-10 py-6 backdrop-blur-3xl bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-cyan-400/20 to-indigo-600/20 flex items-center justify-center font-black text-xl text-cyan-400 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                            {getInitials(selectedChat)}
                        </div>
                        {selectedChat.userId && onlineUserIds.includes(selectedChat.userId) && (
                            <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                        )}
                    </div>
                    <div>
                        <h2 className="font-black text-white text-xl tracking-tight leading-none">{getDisplayName(selectedChat)}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedChat.isNew ? 'bg-yellow-400' : selectedChat.userId && onlineUserIds.includes(selectedChat.userId) ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`} />
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-70 text-slate-400">
                                {isTyping ? 'typing...' : selectedChat.isNew ? 'New — send first message' : selectedChat.userId && onlineUserIds.includes(selectedChat.userId) ? 'Online' : 'Offline — queued delivery'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Music Sync */}
                <div className="flex items-center gap-4 bg-slate-900/50 border border-white/5 px-6 py-2 rounded-2xl backdrop-blur-md">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mr-2">Music Sync</span>
                    <button
                        onClick={() => onMusicAction(musicState.isPlaying ? 'pause' : 'play', { time: audioRef.current?.currentTime || 0 })}
                        className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-full text-cyan-400 transition-all active:scale-90"
                    >
                        {musicState.isPlaying
                            ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                            : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        }
                    </button>
                    <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${(musicState.currentTime / 300) * 100}%` }} />
                    </div>
                </div>
            </header>

            {/* ── Error Banner ── */}
            {sendError && (
                <div className="mx-10 mt-4 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-black uppercase tracking-wider animate-fadeInFast">
                    ⚠ {sendError}
                </div>
            )}

            {/* ── Messages ── */}
            <div className="flex-1 px-10 py-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
                {chatMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-600/10 blur-[100px] scale-[2]" />
                            <div className="relative bg-white/[0.02] border border-white/5 p-12 rounded-[60px] text-center max-w-sm">
                                <div className="text-5xl mb-4">💬</div>
                                <h3 className="text-xl font-black text-white mb-2">No messages yet</h3>
                                <p className="text-sm text-slate-400">
                                    {selectedChat.isNew
                                        ? `Send a message to start chatting with ${getDisplayName(selectedChat)}`
                                        : `Start the conversation with ${getDisplayName(selectedChat)}`}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : chatMessages.map((msg, idx) => (
                    <div key={msg.id || idx} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} group/msg`}>
                        <div className={`max-w-[70%] px-6 py-3 rounded-[24px] ${msg.isMe
                            ? 'bg-indigo-600 text-white rounded-br-none shadow-xl shadow-indigo-600/20'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'}`}>
                            {msg.type === 'image'
                                ? <img src={msg.text} className="rounded-lg mb-2 max-w-xs" alt="img" />
                                : msg.type === 'video'
                                    ? <video src={msg.text} controls className="rounded-lg mb-2 max-w-xs" />
                                    : msg.type === 'audio'
                                        ? <audio src={msg.text} controls className="mb-2 max-w-xs" />
                                        : <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                            }
                            <div className="flex items-center justify-between gap-4 mt-1 opacity-40 group-hover/msg:opacity-100 transition-opacity">
                                <span className="text-[9px] font-black uppercase tracking-tighter">
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                                {msg.isMe && (
                                    <svg className="w-3 h-3 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && <TypingIndicator name={selectedChat?.name} />}
                <div ref={bottomRef} className="h-2" />
            </div>

            {/* ── Input Area ── */}
            <form onSubmit={onSendMessage} className="px-10 pb-10 pt-4">
                <div className="bg-slate-900 border border-white/5 rounded-[40px] p-3 flex items-center gap-4 focus-within:border-cyan-500/20 focus-within:shadow-[0_0_40px_rgba(6,182,212,0.1)] transition-all duration-700">
                    <div className="flex pl-3 gap-1">
                        <label className="p-3 rounded-full text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-all cursor-pointer">
                            <input type="file" className="hidden" onChange={onFileUpload} accept="image/*,video/*,audio/*" />
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </label>
                    </div>
                    <input
                        type="text"
                        value={messageInput}
                        onChange={onInputChange}
                        placeholder={`Message ${getDisplayName(selectedChat)}…`}
                        className="flex-1 bg-transparent py-5 focus:outline-none text-white placeholder:text-slate-600 font-medium text-sm border-x border-white/5 px-6 mx-2"
                    />
                    <button type="submit" disabled={!messageInput.trim()}
                        className="mr-1 h-14 w-14 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-600/20 hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:hover:scale-100">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
}
