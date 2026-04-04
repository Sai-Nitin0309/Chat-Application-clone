import React from 'react';

const ErrorNotification = ({ error, onClose }) => {
    if (!error) return null;
    
    return (
        <div style={{ position: 'relative', zIndex: 10, margin: '10px 20px 0', padding: '10px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, color: '#f87171', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span>⚠ {error}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
    );
};

export default React.memo(ErrorNotification);
