export default function ContextMenuPopup({ contextMenu, onDelete, onClose }) {
    if (!contextMenu) return null;
    return (
        <>
            <div
                className="fixed inset-0 z-[150]"
                onClick={onClose}
                onContextMenu={(e) => { e.preventDefault(); onClose(); }}
            />
            <div
                className="fixed z-[160] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-fadeInFast"
                style={{ top: contextMenu.y, left: contextMenu.x, minWidth: '180px' }}
            >
                <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
                        {contextMenu.contact?.name || contextMenu.contact?.email}
                    </p>
                </div>
                <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-bold"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Chat
                </button>
            </div>
        </>
    );
}
