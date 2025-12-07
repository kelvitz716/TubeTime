import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Trash2, CheckCircle, Clock, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react';
import { resourceApi } from '../api/resourceApi';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
};

const getRelativeTime = (targetDate) => {
    if (!targetDate) return null;
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target - now;
    if (diff <= 0) return 'Ready now';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
};

const getUsageDuration = (startedAt) => {
    if (!startedAt) return null;
    const now = new Date();
    const start = new Date(startedAt);
    const diff = now - start;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const ResourceIcon = ({ type }) => {
    if (type === 'GEMINI') {
        return <Sparkles size={18} className="text-neon-blue" />;
    }
    return <Zap size={18} className="text-neon-purple" />;
};

export default function ResourceTracker() {
    const queryClient = useQueryClient();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountEmail, setNewAccountEmail] = useState('');
    const [expandedAccounts, setExpandedAccounts] = useState({});

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const { data: accounts, isLoading, error } = useQuery({
        queryKey: ['resourceAccounts'],
        queryFn: resourceApi.getAllAccounts,
    });

    const addMutation = useMutation({
        mutationFn: resourceApi.addAccount,
        onSuccess: () => {
            queryClient.invalidateQueries(['resourceAccounts']);
            setNewAccountName('');
            setNewAccountEmail('');
        },
    });

    const setActiveMutation = useMutation({
        mutationFn: resourceApi.setActiveAccount,
        onSuccess: () => queryClient.invalidateQueries(['resourceAccounts']),
    });

    const updateQuotaMutation = useMutation({
        mutationFn: ({ quotaId, data }) => resourceApi.updateQuota(quotaId, data),
        onSuccess: () => queryClient.invalidateQueries(['resourceAccounts']),
    });

    const deleteMutation = useMutation({
        mutationFn: resourceApi.deleteAccount,
        onSuccess: () => queryClient.invalidateQueries(['resourceAccounts']),
    });

    const handleAdd = (e) => {
        e.preventDefault();
        if (newAccountName.trim()) {
            addMutation.mutate({ name: newAccountName, email: newAccountEmail });
        }
    };

    const handleExhaustQuota = (quotaId) => {
        const now = new Date();
        const refreshDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updateQuotaMutation.mutate({
            quotaId,
            data: {
                status: 'EXHAUSTED',
                exhaustedAt: now.toISOString(),
                refreshAt: refreshDate.toISOString()
            }
        });
    };

    const handleAvailableQuota = (quotaId) => {
        updateQuotaMutation.mutate({
            quotaId,
            data: {
                status: 'AVAILABLE',
                exhaustedAt: null,
                refreshAt: null
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this account?')) {
            deleteMutation.mutate(id);
        }
    };

    const toggleExpand = (id) => {
        setExpandedAccounts(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const activeAccount = accounts?.find(acc => acc.isActive);

    // Find next refresh across all exhausted quotas
    const allExhaustedQuotas = accounts?.flatMap(acc =>
        (acc.quotas || []).filter(q => q.status === 'EXHAUSTED').map(q => ({ ...q, accountName: acc.name }))
    ) || [];
    const sortedExhausted = [...allExhaustedQuotas].sort((a, b) => new Date(a.refreshAt) - new Date(b.refreshAt));
    const nextRefreshQuota = sortedExhausted[0];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="glass border-b border-white/5">
                <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-4 transition-colors">
                        <ArrowLeft size={20} /> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold">Resource Tracker</h1>
                    <p className="text-text-secondary mt-2">Manage your AI resource quotas</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-8">
                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                    {/* Active Account Card */}
                    <div className={`glass-elevated rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${activeAccount ? 'ring-2 ring-success/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : ''}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CheckCircle size={80} />
                        </div>
                        <h2 className="text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">Active Account</h2>
                        {activeAccount ? (
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                                    <span className="text-2xl sm:text-3xl font-bold text-success">{activeAccount.name}</span>
                                </div>
                                <div className="text-sm text-text-secondary mt-1">{activeAccount.email}</div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-2xl sm:text-3xl font-bold text-red-500 mb-1">No Account Active</div>
                                <div className="text-sm text-text-secondary">Select an account below to start tracking.</div>
                            </div>
                        )}
                    </div>

                    {/* Usage Duration Card */}
                    <div className="glass-elevated rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock size={80} />
                        </div>
                        <h2 className="text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
                            {activeAccount ? 'Usage Duration' : 'Next Refresh'}
                        </h2>
                        {activeAccount ? (
                            <div>
                                <div className="text-2xl sm:text-3xl font-bold text-neon-blue">
                                    {getUsageDuration(activeAccount.startedUsingAt) || '0m'}
                                </div>
                                <div className="text-sm text-text-secondary">Since: {formatDate(activeAccount.startedUsingAt)}</div>
                            </div>
                        ) : nextRefreshQuota ? (
                            <div>
                                <div className="text-2xl sm:text-3xl font-bold text-neon-blue">
                                    {getRelativeTime(nextRefreshQuota.refreshAt)}
                                </div>
                                <div className="text-sm text-text-secondary">
                                    {nextRefreshQuota.accountName} ({nextRefreshQuota.resourceType})
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-2xl sm:text-3xl font-bold text-text-primary">-</div>
                                <div className="text-sm text-text-secondary">All quotas available.</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Account Management */}
                <div className="glass-elevated rounded-2xl p-4 sm:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold">Accounts</h2>

                        <form onSubmit={handleAdd} className="flex gap-2 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Account Name"
                                value={newAccountName}
                                onChange={(e) => setNewAccountName(e.target.value)}
                                className="flex-1 sm:flex-none bg-surface border border-white/10 rounded-xl px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Email"
                                value={newAccountEmail}
                                onChange={(e) => setNewAccountEmail(e.target.value)}
                                className="hidden md:block bg-surface border border-white/10 rounded-xl px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={addMutation.isPending}
                                className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                <Plus size={18} /> Add
                            </button>
                        </form>
                    </div>

                    <div className="space-y-3">
                        {isLoading && <div className="text-text-secondary text-center py-4">Loading accounts...</div>}
                        {error && <div className="text-red-500 text-center py-4">Error loading accounts</div>}

                        {!isLoading && accounts?.length === 0 && (
                            <div className="text-text-secondary text-center py-8 bg-surface rounded-xl border border-white/5 border-dashed">
                                No accounts tracked yet. Add one above to get started.
                            </div>
                        )}

                        {accounts?.map((account) => (
                            <div
                                key={account.id}
                                className={`glass rounded-2xl overflow-hidden transition-all duration-300 ${account.isActive ? 'ring-2 ring-success/50' : ''}`}
                            >
                                {/* Account Header */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => toggleExpand(account.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {account.isActive && <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>}
                                        <div>
                                            <h3 className="font-bold text-lg">{account.name}</h3>
                                            <p className="text-sm text-text-secondary">{account.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!account.isActive && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMutation.mutate(account.id);
                                                }}
                                                className="px-3 py-1.5 bg-success/10 text-success hover:bg-success/20 rounded-xl text-sm font-medium transition-colors"
                                            >
                                                Use This
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(account.id);
                                            }}
                                            className="p-2 text-text-secondary hover:text-red-500 rounded-lg hover:bg-surface transition-colors"
                                            title="Delete Account"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        {expandedAccounts[account.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* Expanded Quotas */}
                                {expandedAccounts[account.id] && (
                                    <div className="border-t border-white/5 p-4 bg-surface/50 space-y-3">
                                        {(account.quotas || []).map((quota) => (
                                            <div key={quota.id} className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <ResourceIcon type={quota.resourceType} />
                                                    <span className="font-medium">{quota.resourceType}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${quota.status === 'AVAILABLE' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-500'}`}>
                                                        {quota.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {quota.status === 'EXHAUSTED' && quota.refreshAt && (
                                                        <span className="text-xs text-neon-blue flex items-center gap-1">
                                                            <RefreshCw size={12} /> {getRelativeTime(quota.refreshAt)}
                                                        </span>
                                                    )}
                                                    {quota.status === 'AVAILABLE' ? (
                                                        <button
                                                            onClick={() => handleExhaustQuota(quota.id)}
                                                            className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            Exhausted
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAvailableQuota(quota.id)}
                                                            className="px-3 py-1.5 bg-success/10 text-success hover:bg-success/20 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            Available
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
