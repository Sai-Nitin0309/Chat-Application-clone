export default function ToastBar({ notifications, allContacts, onSelectContact, onDismiss }) {
    if (!notifications.length) return null;
    return (
        <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    className="pointer-events-auto flex items-center gap-4 bg-slate-900/95 border border-violet-500/40 rounded-[20px] px-5 py-4 shadow-2xl shadow-violet-900/30 backdrop-blur-xl cursor-pointer animate-slideInRight max-w-[320px]"
                    onClick={() => {
                        const contact = allContacts.find(c => c.userId === n.fromUserId);
                        if (contact) onSelectContact(contact);
                        onDismiss(n.id);
                    }}
                >
                    <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg">
                        {(n.senderLabel || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-violet-300 uppercase tracking-wider mb-0.5">New Message</p>
                        <p className="text-xs font-bold text-white truncate">{n.senderLabel}</p>
                        <p className="text-[10px] text-slate-400 truncate">{n.message}</p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
                        className="text-slate-600 hover:text-slate-300 transition-colors text-lg leading-none flex-shrink-0"
                    >×</button>
                </div>
            ))}
        </div>
    );
}
