import React, { useState, useEffect } from 'react';

const ChatHeader = ({ selectedContact, activeUser, isOnline, connected, navigate, profilePic, initials, displayName, onClearChat }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.menu-btn')) {
                if (menuOpen) setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [menuOpen]);

    return (
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(15,20,40,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>

            {/* Left: back + contact */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                    onClick={() => navigate('/home')}
                    style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#22d3ee'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,rgba(34,211,238,0.2),rgba(99,102,241,0.2))', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: '#22d3ee' }}>
                            {initials(selectedContact)}
                        </div>
                        {isOnline && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, background: '#22c55e', border: '2px solid #07090f', borderRadius: '50%' }} />}
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: '#f1f5f9', letterSpacing: '-0.3px' }}>{displayName(selectedContact)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedContact.isNew ? '#facc15' : isOnline ? '#22c55e' : '#475569', display: 'inline-block', boxShadow: isOnline ? '0 0 6px #22c55e' : 'none' }} />
                            <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b' }}>
                                {selectedContact.isNew ? 'New conversation' : isOnline ? 'Online' : 'Offline — queued delivery'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: me + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '6px 12px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 10, background: 'linear-gradient(135deg,#22d3ee,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                        {profilePic(activeUser) ? <img src={profilePic(activeUser)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(activeUser)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName(activeUser)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '5px 10px' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444', display: 'inline-block', animation: connected ? 'pls 2s ease-in-out infinite' : 'none' }} />
                    <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b' }}>{connected ? 'Live' : 'Reconnecting'}</span>
                </div>

                {/* Three-dot menu */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="menu-btn"
                        style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                        </svg>
                    </button>

                    {/* Dropdown menu */}
                    {menuOpen && (
                        <div className="menu-dropdown" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'rgba(15,20,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.4)', minWidth: 180, zIndex: 1000, backdropFilter: 'blur(20px)' }}>
                            <button
                                onClick={onClearChat}
                                className="menu-item"
                                style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderRadius: '16px 16px 0 0', transition: 'background 0.15s ease' }}
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                                </svg>
                                Clear Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(ChatHeader);
