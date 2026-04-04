import React, { useState, useRef, useEffect, useCallback } from 'react';
import EmojiPicker from './EmojiPicker';

const ChatInput = ({ onSend, onFile, displayName, selectedContact }) => {
    const [input, setInput] = useState('');
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const inputRef = useRef(null);

    // Close emoji picker on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.emoji-trigger') && !e.target.closest('.emoji-picker')) {
                if (emojiPickerOpen) setEmojiPickerOpen(false);
            }
        };
        if (emojiPickerOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [emojiPickerOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text) return;
        onSend(text);
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleEmojiSelect = useCallback((emoji) => {
        setInput(prev => prev + emoji);
        inputRef.current?.focus();
    }, []);

    const toggleEmojiPicker = useCallback(() => {
        setEmojiPickerOpen(prev => !prev);
    }, []);

    return (
        <div style={{ position: 'relative', zIndex: 10, padding: '12px 20px 20px', flexShrink: 0 }}>
            {/* Optimized Emoji Picker */}
            {emojiPickerOpen && <EmojiPicker onSelect={handleEmojiSelect} />}
            
            <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(15,20,40,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32, padding: '6px 6px 6px 14px', backdropFilter: 'blur(20px)' }}>

                <label className="attach-btn" style={{ cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%', flexShrink: 0 }}>
                    <input type="file" style={{ display: 'none' }} onChange={onFile} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" />
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </label>

                <button
                    type="button"
                    onClick={toggleEmojiPicker}
                    className="emoji-trigger"
                    style={{ cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%', flexShrink: 0, background: 'none', border: 'none', fontSize: '20px' }}
                    title="Emoji picker"
                >
                    😊
                </button>

                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message ${displayName(selectedContact)}…`}
                    autoComplete="off"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', padding: '12px 0' }}
                />

                <button
                    type="submit"
                    disabled={!input.trim()}
                    style={{
                        width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                        background: input.trim() ? 'linear-gradient(135deg,#22d3ee,#6366f1)' : 'rgba(255,255,255,0.05)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'transform 0.15s', opacity: input.trim() ? 1 : 0.3
                    }}
                    onMouseEnter={e => { if (input.trim()) e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default React.memo(ChatInput);
