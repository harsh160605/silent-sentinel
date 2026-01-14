import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    MessageCircle,
    Users,
    Copy,
    Check,
    ArrowLeft,
    Loader
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { getGroupMessages, sendMessage, subscribeToMessages } from '../services/chatService';

const GroupChat = ({ group, onBack }) => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef(null);

    // Load and subscribe to messages
    useEffect(() => {
        if (!group?.id) return;

        setLoading(true);

        // Subscribe to real-time updates
        const unsubscribe = subscribeToMessages(group.id, (msgs) => {
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [group?.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await sendMessage(group.id, user?.uid || 'anonymous', newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(group.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <div className="group-chat">
            {/* Header */}
            <div className="chat-header">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <div className="chat-group-info">
                    <span className="chat-group-icon">{group.icon || '🏘️'}</span>
                    <div>
                        <span className="chat-group-name">{group.name}</span>
                        <span className="chat-group-members">
                            {group.memberCount || group.members?.length || 0} members
                        </span>
                    </div>
                </div>
                <button className="invite-btn" onClick={handleCopyCode} title="Copy invite code">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
            </div>

            {/* Anonymous Notice */}
            <div className="anon-notice">
                <MessageCircle size={14} />
                <span>Messages are anonymous. Your identity is hidden.</span>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {loading ? (
                    <div className="chat-loading">
                        <Loader size={24} className="spinner" />
                        <span>Loading messages...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="no-messages">
                        <MessageCircle size={32} />
                        <p>No messages yet</p>
                        <span>Start the conversation!</span>
                    </div>
                ) : (
                    <>
                        {messages.map(msg => (
                            <div key={msg.id} className="chat-message">
                                <div className="message-avatar">
                                    {msg.anonName?.charAt(0) || '?'}
                                </div>
                                <div className="message-content">
                                    <div className="message-header">
                                        <span className="message-author">{msg.anonName}</span>
                                        <span className="message-time">
                                            {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="message-text">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="chat-input">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    maxLength={500}
                    disabled={sending}
                />
                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                >
                    {sending ? <Loader size={18} className="spinner" /> : <Send size={18} />}
                </button>
            </div>
        </div>
    );
};

export default GroupChat;

