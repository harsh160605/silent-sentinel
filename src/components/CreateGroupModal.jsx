import React, { useState } from 'react';
import { X, Users, Loader, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { createGroup } from '../services/groupService';

const ICON_OPTIONS = ['🏘️', '🎓', '🏢', '🌳', '🏪', '🚶', '🛡️', '👥'];

const CreateGroupModal = ({ onClose, onCreate }) => {
    const { user } = useAuthStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🏘️');
    const [isPrivate, setIsPrivate] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdGroup, setCreatedGroup] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Group name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const group = await createGroup(
                { name: name.trim(), description: description.trim(), icon, isPrivate },
                user?.uid || 'anonymous'
            );
            setCreatedGroup(group);
        } catch (err) {
            setError('Failed to create group. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = async () => {
        if (!createdGroup?.inviteCode) return;

        try {
            await navigator.clipboard.writeText(createdGroup.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleDone = () => {
        onCreate?.(createdGroup);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                {!createdGroup ? (
                    <>
                        <h2>Create Group</h2>
                        <p className="modal-subtitle">
                            Create a private group for your neighborhood, campus, or organization.
                        </p>

                        <form onSubmit={handleSubmit}>
                            {/* Icon Selection */}
                            <div className="form-group">
                                <label>Icon</label>
                                <div className="icon-selector">
                                    {ICON_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            className={`icon-option ${icon === emoji ? 'selected' : ''}`}
                                            onClick={() => setIcon(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Group Name */}
                            <div className="form-group">
                                <label htmlFor="group-name">Group Name</label>
                                <input
                                    type="text"
                                    id="group-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Downtown Neighborhood Watch"
                                    maxLength={50}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label htmlFor="group-desc">Description (optional)</label>
                                <textarea
                                    id="group-desc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What is this group about?"
                                    rows={3}
                                    maxLength={200}
                                />
                            </div>

                            {/* Privacy Toggle */}
                            <div className="form-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={isPrivate}
                                        onChange={(e) => setIsPrivate(e.target.checked)}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span>Private Group (invite only)</span>
                                </label>
                            </div>

                            {error && <div className="alert alert-error">{error}</div>}

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader size={16} className="spinner" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Users size={16} />
                                        Create Group
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="group-created-success">
                        <div className="success-icon-large">
                            <Users size={48} />
                        </div>
                        <h2>Group Created!</h2>
                        <p className="group-created-name">
                            {createdGroup.icon} {createdGroup.name}
                        </p>

                        <div className="invite-code-display">
                            <label>Invite Code</label>
                            <div className="code-box">
                                <span className="code">{createdGroup.inviteCode}</span>
                                <button className="copy-btn" onClick={handleCopyCode}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                            <small>Share this code with people you want to invite</small>
                        </div>

                        <button className="btn-primary" onClick={handleDone}>
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateGroupModal;

