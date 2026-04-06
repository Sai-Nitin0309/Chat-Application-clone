export default function ProfileModal({ activeUser, allContacts, onClose, onLogout, getInitials, getDisplayName, getProfilePic }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fadeInFast">
            <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-slideIn">
                <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="pt-16 pb-12 px-10 text-center">
                    <div className="w-32 h-32 mx-auto rounded-[32px] bg-gradient-to-tr from-cyan-400 to-indigo-600 p-1 mb-6 shadow-2xl shadow-cyan-500/20">
                        <div className="w-full h-full rounded-[28px] bg-slate-900 flex items-center justify-center overflow-hidden">
                            {getProfilePic(activeUser)
                                ? <img src={getProfilePic(activeUser)} alt="User" className="w-full h-full object-cover" />
                                : <span className="text-4xl font-black text-white">{getInitials(activeUser)}</span>
                            }
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-1 tracking-tight">{getDisplayName(activeUser)}</h2>
                    <div className="space-y-4 text-left mt-8">
                        <div className="p-5 bg-white/5 border border-white/5 rounded-3xl">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Email</p>
                            <p className="text-md text-white font-medium">{activeUser?.email}</p>
                        </div>
                        <div className="p-5 bg-white/5 border border-white/5 rounded-3xl">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Contacts in DB</p>
                            <p className="text-md text-white font-medium">{allContacts.length} saved</p>
                        </div>
                    </div>
                </div>
                <div className="px-10 pb-10">
                    <button onClick={onLogout}
                        className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-red-500/20 transition-all active:scale-95">
                        Terminate Session
                    </button>
                </div>
            </div>
        </div>
    );
}
