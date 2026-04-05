export default function Sidebar({
    activeUser, connected,
    searchTerm, setSearchTerm,
    filteredContacts, showNewChatOption,
    selectedChat, onlineUserIds,
    onSelectContact, onStartNewChat, onContextMenu,
    onLogout, onShowProfile,
    getInitials, getDisplayName, getProfilePic,
}) {
    return (
        <aside className="w-full md:w-[380px] bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 flex flex-col h-screen z-20 relative">

            {/* ── Header ── */}
            <header className="p-7 flex items-center justify-between">
                <div className="flex items-center gap-4 group cursor-pointer" onClick={onShowProfile}>
                    <div className="relative">
                        <div className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-cyan-400 to-indigo-600 p-[2px] shadow-2xl shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-500">
                            <div className="w-full h-full rounded-[20px] bg-slate-900 flex items-center justify-center font-black overflow-hidden">
                                {getProfilePic(activeUser)
                                    ? <img src={getProfilePic(activeUser)} alt="Profile" className="w-full h-full object-cover" />
                                    : <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-300 to-indigo-300 text-2xl">{getInitials(activeUser)}</span>
                                }
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
                        <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase opacity-70">
                            {connected ? '● Connected' : '○ Connecting…'}
                        </p>
                    </div>
                </div>
                <button onClick={onLogout} className="p-3 bg-white/5 hover:bg-red-500/20 rounded-2xl border border-white/5 transition-all group active:scale-90" title="Logout">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-red-400 group-hover:rotate-12 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </header>

            {/* ── Search ── */}
            <div className="px-6 pb-2">
                <div className="relative group">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
                    <input
                        type="text"
                        placeholder="Search contacts or type an email…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full relative bg-white/5 border border-white/10 rounded-2xl py-4 px-14 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-slate-500 placeholder:font-medium text-white shadow-inner"
                    />
                    <svg className="w-5 h-5 absolute left-5 top-[17px] text-slate-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {showNewChatOption && (
                    <button
                        onClick={onStartNewChat}
                        className="mt-3 w-full flex items-center gap-3 px-5 py-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-2xl transition-all group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">+</div>
                        <div className="text-left">
                            <p className="text-xs font-black text-cyan-300">Start new chat</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[220px]">{searchTerm}</p>
                        </div>
                    </button>
                )}
            </div>

            {/* ── Contact List ── */}
            <div className="flex-1 overflow-y-auto mt-4 px-4 pb-10 space-y-3 custom-scrollbar">
                <div className="px-4 flex items-center justify-between mb-4 mt-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                        {searchTerm ? 'Search Results' : 'Contacts'}
                    </span>
                    <div className="h-[1px] flex-1 bg-white/5 ml-4" />
                    <span className="ml-4 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/20">
                        {filteredContacts.length}
                    </span>
                </div>

                {filteredContacts.length > 0 ? filteredContacts.map((contact, idx) => (
                    <div
                        key={contact.id || idx}
                        onClick={() => onSelectContact(contact)}
                        onContextMenu={(e) => onContextMenu(e, contact)}
                        className={`flex items-center gap-4 p-5 rounded-[24px] transition-all duration-500 cursor-pointer group animate-slideIn relative border
                            ${selectedChat?.email === contact.email
                                ? 'bg-cyan-500/15 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] active-chat-indicator'
                                : contact.isRequest && (contact.unread || 0) > 0
                                    ? 'bg-violet-500/10 border-violet-500/30 hover:border-violet-400/50'
                                    : 'border-transparent hover:bg-white/[0.03] hover:border-white/5'}`}
                        style={{ animationDelay: `${idx * 60}ms` }}
                    >
                        <div className="relative">
                            <div className="w-14 h-14 rounded-[18px] bg-slate-800 flex items-center justify-center text-xl font-black text-slate-400 group-hover:text-cyan-300 group-hover:scale-[1.03] transition-all duration-500 border border-white/5">
                                {getInitials(contact)}
                            </div>
                            {onlineUserIds.includes(contact.userId) && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#0a0f1e] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`font-extrabold transition-colors truncate text-md leading-tight ${(contact.unread || 0) > 0 ? 'text-white' : 'text-slate-300 group-hover:text-cyan-400'}`}>
                                    {getDisplayName(contact)}
                                </h3>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                    {onlineUserIds.includes(contact.userId) && (
                                        <span className="text-[9px] font-black text-green-400 uppercase">Online</span>
                                    )}
                                    {(contact.unread || 0) > 0 && (
                                        <span className="min-w-[18px] h-[18px] px-1 bg-cyan-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                                            {contact.unread > 99 ? '99+' : contact.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {contact.isRequest && (contact.unread || 0) > 0 && (
                                    <span className="text-[9px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">New Request</span>
                                )}
                                <p className="text-xs text-slate-500 truncate font-medium">{contact.email}</p>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-16 px-8 flex flex-col items-center opacity-40 select-none animate-fadeIn">
                        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 text-slate-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] leading-relaxed">
                            {searchTerm ? 'No contacts found' : 'No contacts yet'}<br />
                            <span className="text-[9px] opacity-60">Type an email to start a chat</span>
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
}
