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
import { getUserGroups, joinGroupByCode, getPublicGroups, joinGroupById } from '../services/groupService';
import CreateGroupModal from './CreateGroupModal';
import GroupChat from './GroupChat';

const GroupsPanel = ({ isOpen, onClose }) => {
    const { user } = useAuthStore();
    const [userGroups, setUserGroups] = useState([]);
    const [publicGroups, setPublicGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [joining, setJoining] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('my-groups'); // 'my-groups' or 'discover'

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
            const [myGroups, discoveryGroups] = await Promise.all([
                getUserGroups(user?.uid || 'anonymous'),
                getPublicGroups(10)
            ]);

            setUserGroups(myGroups);
            // Filter out groups the user is already in from discovery
            const userGroupIds = new Set(myGroups.map(g => g.id));
            setPublicGroups(discoveryGroups.filter(g => !userGroupIds.has(g.id)));
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinPublicGroup = async (groupId) => {
        setJoining(true);
        try {
            const result = await joinGroupById(groupId, user?.uid || 'anonymous');
            if (result.success) {
                loadGroups();
            }
        } catch (error) {
            console.error('Error joining public group:', error);
        } finally {
            setJoining(false);
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
        setUserGroups(prev => [newGroup, ...prev]);
        setShowCreateModal(false);
        setActiveTab('my-groups');
    };

    const handleGroupClick = (group) => {
        setSelectedGroup(group);
    };

    if (!isOpen) return null;

    return (
        <div className="groups-panel">
            {selectedGroup ? (
                <GroupChat
                    group={selectedGroup}
                    onBack={() => setSelectedGroup(null)}
                />
            ) : (
                <>
                    {/* Header */}
                    <div className="feed-header">
                        <div className="feed-title">
                            <Users size={18} />
                            <h3>Community Hubs</h3>
                            <span className="feed-count">{userGroups.length}</span>
                        </div>
                        <div className="groups-header-actions">
                            <button className="btn-create-group" onClick={() => setShowCreateModal(true)}>
                                <Plus size={16} />
                                <span>Create</span>
                            </button>
                            <button className="btn-close-panel" onClick={onClose} title="Close Panel">
                                <X size={18} />
                            </button>
                        </div>
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

                    {/* Tabs */}
                    <div className="groups-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'my-groups' ? 'active' : ''}`}
                            onClick={() => setActiveTab('my-groups')}
                        >
                            My Groups
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
                            onClick={() => setActiveTab('discover')}
                        >
                            Discover
                        </button>
                    </div>

                    {/* Groups List */}
                    <div className="groups-list">
                        {loading ? (
                            <div className="groups-loading">
                                <Loader size={24} className="spinner" />
                                <span>Syncing Nodes...</span>
                            </div>
                        ) : activeTab === 'my-groups' ? (
                            userGroups.length > 0 ? (
                                userGroups.map(group => (
                                    <div
                                        key={group.id}
                                        className="group-card"
                                        onClick={() => handleGroupClick(group)}
                                    >
                                        <div className="group-icon">{group.icon || '🏘️'}</div>
                                        <div className="group-info">
                                            <div className="group-name-row">
                                                <span className="group-name">{group.name}</span>
                                                {!group.isPrivate && <span className="public-badge">Public</span>}
                                            </div>
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
                                    <p>No active hubs</p>
                                    <span>Form a group or enter an invite code to begin.</span>
                                </div>
                            )
                        ) : (
                            /* Discovery Tab */
                            publicGroups.length > 0 ? (
                                publicGroups.map(group => (
                                    <div
                                        key={group.id}
                                        className="group-card discovery-card"
                                    >
                                        <div className="group-icon">{group.icon || '🏘️'}</div>
                                        <div className="group-info">
                                            <span className="group-name">{group.name}</span>
                                            <span className="group-members">
                                                {group.memberCount || group.members?.length || 0} members
                                            </span>
                                        </div>
                                        <button
                                            className="btn-join-direct"
                                            onClick={() => handleJoinPublicGroup(group.id)}
                                            disabled={joining}
                                        >
                                            {joining ? <Loader size={14} className="spinner" /> : 'Join'}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="no-groups">
                                    <Users size={32} />
                                    <p>No new public nodes</p>
                                    <span>All local frequency nodes are currently private.</span>
                                </div>
                            )
                        )}
                    </div>
                </>
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleGroupCreated}
                />
            )}
        </div>
    );
};

export default GroupsPanel;
