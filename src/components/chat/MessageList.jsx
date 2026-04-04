import React from 'react';
import MessageItem from './MessageItem';

const MessageList = ({ messages, selectedContact, activeUser, bottomRef, profilePic, initials, displayName }) => {
    return (
        <div style={{ position: 'relative', zIndex: 10, flex: 1, overflowY: 'auto', padding: '20px 20px 10px', display: 'flex', flexDirection: 'column', gap: 10 }} className="custom-scrollbar">

            {messages.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 40, padding: '48px 40px', maxWidth: 320 }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>💬</div>
                        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#f1f5f9' }}>Start the conversation</h2>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                            {selectedContact.isNew ? `Connect with ${displayName(selectedContact)}` : `Chat with ${displayName(selectedContact)}`}
                        </p>
                    </div>
                </div>
            )}

            {messages.map((msg, idx) => (
                <MessageItem 
                    key={msg.id || idx} 
                    msg={msg} 
                    selectedContact={selectedContact} 
                    activeUser={activeUser}
                    profilePic={profilePic}
                    initials={initials}
                />
            ))}

            <div ref={bottomRef} style={{ height: 4 }} />
        </div>
    );
};

export default React.memo(MessageList);
