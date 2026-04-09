import React from 'react';

const SOCKET_URL = "https://mes-ioa3.onrender.com/";

const MessageItem = ({ msg, selectedContact, activeUser, profilePic, initials }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: msg.isMe ? 'flex-end' : 'flex-start' }}>

            {/* Their avatar (left) */}
            {!msg.isMe && (
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#94a3b8', flexShrink: 0 }}>
                    {initials(selectedContact)}
                </div>
            )}

            {/* Bubble */}
            <div style={{
                maxWidth: '68%', padding: '12px 14px', borderRadius: msg.isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: msg.isMe ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'rgba(255,255,255,0.05)',
                border: msg.isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: msg.isMe ? '0 8px 24px rgba(99,102,241,0.25)' : 'none',
                color: '#f1f5f9'
            }}>

                {/* ── Upload Loader ── */}
                {msg.uploading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, padding: '4px 0' }}>
                        {/* Spinning ring with file emoji inside */}
                        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                            <svg viewBox="0 0 40 40" style={{ width: 40, height: 40, animation: 'msgSpin 1s linear infinite' }}>
                                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                                <circle cx="20" cy="20" r="16" fill="none" stroke="#a78bfa" strokeWidth="3"
                                    strokeDasharray="60 40" strokeLinecap="round" />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                                {msg.type === 'image' ? '🖼️' : msg.type === 'video' ? '🎬' : msg.type === 'audio' ? '🎵' : '📎'}
                            </div>
                        </div>
                        {/* Labels */}
                        <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>
                                {msg.fileName || 'File'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'msgDot 1s ease-in-out infinite' }} />
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'msgDot 1s ease-in-out 0.2s infinite' }} />
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'msgDot 1s ease-in-out 0.4s infinite' }} />
                                <p style={{ margin: 0, marginLeft: 2, fontSize: 10, fontWeight: 600, opacity: 0.65, color: '#c4b5fd' }}>Uploading…</p>
                            </div>
                        </div>
                        <style>{`
                            @keyframes msgSpin { to { transform: rotate(360deg); } }
                            @keyframes msgDot { 0%,100% { opacity: 0.25; transform: scale(0.75); } 50% { opacity: 1; transform: scale(1.2); } }
                        `}</style>
                    </div>
                )}

                {/* ── Image ── */}
                {!msg.uploading && msg.type === 'image' && (
                    <img src={msg.text} alt={msg.fileName || 'image'}
                        style={{ maxWidth: 260, maxHeight: 200, borderRadius: 12, display: 'block', marginBottom: 4, objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => window.open(msg.text, '_blank')}
                    />
                )}

                {/* ── Video ── */}
                {!msg.uploading && msg.type === 'video' && (
                    <video src={msg.text} controls
                        style={{ maxWidth: 260, borderRadius: 12, display: 'block', marginBottom: 4 }}
                    />
                )}

                {/* ── Audio ── */}
                {!msg.uploading && msg.type === 'audio' && (
                    <div style={{ minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎵</div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {msg.fileName || 'Audio'}
                                </p>
                                <p style={{ margin: 0, fontSize: 9, opacity: 0.5, fontWeight: 600 }}>Audio message</p>
                            </div>
                        </div>
                        <audio src={msg.text} controls style={{ width: '100%', height: 32, borderRadius: 8 }} />
                    </div>
                )}

                {/* ── Generic file ── */}
                {!msg.uploading && msg.type === 'file' && (
                    <a href={msg.text} download={msg.fileName || 'file'}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', padding: '4px 0' }}
                    >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📎</div>
                        <div>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{msg.fileName || 'File'}</p>
                            <p style={{ margin: 0, fontSize: 9, opacity: 0.5 }}>Tap to download</p>
                        </div>
                    </a>
                )}

                {/* ── Text ── */}
                {!msg.uploading && msg.type === 'text' && (
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</p>
                )}

                <p style={{ margin: '6px 0 0', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.4, textAlign: msg.isMe ? 'right' : 'left' }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    {msg.isMe && (
                        <span style={{ marginLeft: 4, color: msg.status === 'seen' ? '#ff0000' : '#ffffff', opacity: msg.status === 'seen' ? 1 : 0.6 }}>
                            {msg.status === 'sent' ? '✓' : '✓✓'}
                        </span>
                    )}
                </p>
            </div>

            {/* My avatar (right) */}
            {msg.isMe && (
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#22d3ee', flexShrink: 0, overflow: 'hidden' }}>
                    {profilePic(activeUser) ? <img src={profilePic(activeUser)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(activeUser)}
                </div>
            )}
        </div>
    );
};

export default React.memo(MessageItem);
