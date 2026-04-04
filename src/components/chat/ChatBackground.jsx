import React from 'react';

const ChatBackground = () => (
    <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '55%', height: '55%', background: 'rgba(6,182,212,0.06)', borderRadius: '50%', filter: 'blur(140px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '55%', height: '55%', background: 'rgba(99,102,241,0.06)', borderRadius: '50%', filter: 'blur(140px)' }} />
    </div>
);

export default React.memo(ChatBackground);
