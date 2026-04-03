import React from 'react';

const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤮', '🤧', '🏨', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '👋', '⭐', '✨', '⚡', '🔥', '💥', '👏', '🎉', '🎊', '🎈', '🎁', '🍕', '🍔', '🍟', '🌭', '🍗', '🍖', '🍤', '🍣', '🍜', '🍝', '🍛', '🍱', '🥟', '🍚', '🍙', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🍰', '🎂', '🧁', '🍮', '🍭', '🍬', '🍫', '🍩', '🍪', '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🎵', '🎶', '✈️', '🚀', '❄️', '🌸', '🌺', '🌻', '🌷', '🌹'];

const EmojiPicker = ({ onSelect }) => {
    return (
        <div className="emoji-picker" style={{
            background: 'rgba(15,20,40,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px 16px 0 0',
            padding: '12px',
            marginBottom: '12px',
            maxHeight: '200px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '8px',
            backdropFilter: 'blur(20px)'
        }}>
            {emojis.map((emoji, idx) => (
                <button
                    key={idx}
                    onClick={() => onSelect(emoji)}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(34,211,238,0.2)';
                        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)';
                        e.currentTarget.style.transform = 'scale(1.2)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

export default React.memo(EmojiPicker);
