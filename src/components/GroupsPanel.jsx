import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    LogIn,
    ChevronRight,
    Copy,
    Check,
    Loader,
    X
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getUserGroups, joinGroupByCode } from '../services/groupService';
import CreateGroupModal from './CreateGroupModal';
import GroupChat from './GroupChat';

const GroupsPanel = ({ isOpen, onClose }) => {
    const { user } = useAuthStore();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [joining, setJoining] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // Load user's groups
    useEffect(() => {
        if (isOpen && user) {
            loadGroups();
        }
        if (!isOpen) {
            setSelectedGroup(null);
        }
    }, [isOpen, user]);

    const loadGroups = async () => {
        setLoading(true);
        try {
            const userGroups = await getUserGroups(user?.uid || 'anonymous');
            setGroups(userGroups);
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = async () => {
        if (!joinCode.trim()) return;

        setJoining(true);
        setJoinError('');

        try {
            const result = await joinGroupByCode(joinCode.trim(), user?.uid || 'anonymous');

            if (result.success) {
                setJoinCode('');
                loadGroups();
            } else {
                setJoinError(result.error || 'Failed to join group');
            }
        } catch (error) {
            setJoinError('Failed to join group');
        } finally {
            setJoining(false);
        }
    };

    const handleCopyCode = async (code, e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleGroupCreated = (newGroup) => {
        setGroups(prev => [newGroup, ...prev]);
        setShowCreateModal(false);
    };

    const handleGroupClick = (group) => {
        setSelectedGroup(group);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="groups-panel">
                {selectedGroup ? (
                    <GroupChat
                        group={selectedGroup}
                        onBack={() => setSelectedGroup(null)}
                    />
                ) : (
                    <>
                        {/* Header */}
                        <div className="groups-header">
                            <div className="groups-title">
                                <Users size={18} />
                                <h3>Community Groups</h3>
                            </div>
                            <button className="btn-create-group" onClick={() => setShowCreateModal(true)}>
                                <Plus size={16} />
                                <span>Create</span>
                            </button>
                        </div>

                        {/* Join Group */}
                        <div className="join-group-section">
                            <div className="join-input-group">
                                <input
                                    type="text"
                                    placeholder="Enter invite code"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    maxLength={6}
                                />
                                <button
                                    className="btn-join"
                                    onClick={handleJoinGroup}
                                    disabled={!joinCode.trim() || joining}
                                >
                                    {joining ? <Loader size={14} className="spinner" /> : <LogIn size={14} />}
                                </button>
                            </div>
                            {joinError && <span className="join-error">{joinError}</span>}
                        </div>

                        {/* Groups List */}
                        <div className="groups-list">
                            {loading ? (
                                <div className="groups-loading">
                                    <Loader size={24} className="spinner" />
                                    <span>Loading groups...</span>
                                </div>
                            ) : groups.length > 0 ? (
                                groups.map(group => (
                                    <div
                                        key={group.id}
                                        className="group-card"
                                        onClick={() => handleGroupClick(group)}
                                    >
                                        <div className="group-icon">{group.icon || '🏘️'}</div>
                                        <div className="group-info">
                                            <span className="group-name">{group.name}</span>
                                            <span className="group-members">
                                                {group.memberCount || group.members?.length || 0} members • Click to chat
                                            </span>
                                        </div>
                                        <div className="group-actions">
                                            <button
                                                className="copy-code-btn"
                                                onClick={(e) => handleCopyCode(group.inviteCode, e)}
                                                title="Copy invite code"
                                            >
                                                {copiedCode === group.inviteCode ? (
                                                    <Check size={14} className="copied" />
                                                ) : (
                                                    <Copy size={14} />
                                                )}
                                            </button>
                                            <ChevronRight size={16} className="chevron" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-groups">
                                    <Users size={32} />
                                    <p>No groups yet</p>
                                    <span>Create a group or join one with an invite code</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleGroupCreated}
                />
            )}
        </>
    );
};

export default GroupsPanel;

