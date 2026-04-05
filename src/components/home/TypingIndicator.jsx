export default function TypingIndicator({ name }) {
    return (
        <div className="flex justify-start animate-fadeInFast">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-white/5 px-5 py-3.5 rounded-[24px] rounded-bl-none shadow-md">
                <span className="text-[10px] font-semibold text-slate-400 mr-1">
                    {name?.split(' ')[0] || 'typing'}
                </span>
                <span className="w-2 h-2 bg-cyan-400 rounded-full"
                    style={{ animation: 'typingBounce 1.2s ease-in-out infinite', animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-cyan-400 rounded-full"
                    style={{ animation: 'typingBounce 1.2s ease-in-out infinite', animationDelay: '200ms' }} />
                <span className="w-2 h-2 bg-cyan-400 rounded-full"
                    style={{ animation: 'typingBounce 1.2s ease-in-out infinite', animationDelay: '400ms' }} />
            </div>
        </div>
    );
}
