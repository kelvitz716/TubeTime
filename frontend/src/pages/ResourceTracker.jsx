import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
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

export default function ResourceTracker() {
    const queryClient = useQueryClient();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountEmail, setNewAccountEmail] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
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

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => resourceApi.updateAccount(id, data),
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

    const handleExhaust = (id) => {
        const now = new Date();
        const refreshDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updateMutation.mutate({
            id,
            data: {
                status: 'EXHAUSTED',
                exhaustedAt: now.toISOString(),
                refreshAt: refreshDate.toISOString()
            }
        });
    };

    const handleAvailable = (id) => {
        updateMutation.mutate({
            id,
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

    // Determine current active account
    const activeAccount = accounts?.find(acc => acc.status === 'AVAILABLE');

    // Find next available account
    const exhaustedAccounts = accounts?.filter(acc => acc.status === 'EXHAUSTED') || [];
    const sortedExhausted = [...exhaustedAccounts].sort((a, b) => new Date(a.refreshAt) - new Date(b.refreshAt));
    const nextRefreshAccount = sortedExhausted[0];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-surface border-b border-surface-elevated">
                <div className="max-w-5xl mx-auto px-8 py-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-4 transition-colors">
                        <ArrowLeft size={20} /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold">Resource Tracker</h1>
                    <p className="text-text-secondary mt-2">Optimize your AI resource rotation</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 mt-8">
                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Active Account Card */}
                    <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-glow-success relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CheckCircle size={100} />
                        </div>
                        <h2 className="text-lg font-medium text-text-secondary mb-2">Current Active Account</h2>
                        {activeAccount ? (
                            <div>
                                <div className="text-3xl font-bold text-success mb-1">{activeAccount.name}</div>
                                <div className="text-sm text-text-secondary">{activeAccount.email}</div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-3xl font-bold text-red-500 mb-1">No Accounts Available</div>
                                <div className="text-sm text-text-secondary">Please wait for refresh or add a new account.</div>
                            </div>
                        )}
                    </div>

                    {/* Next Refresh Card */}
                    <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-glow-neon-blue relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock size={100} />
                        </div>
                        <h2 className="text-lg font-medium text-text-secondary mb-2">Next Refresh</h2>
                        {nextRefreshAccount ? (
                            <div>
                                <div className="text-3xl font-bold text-neon-blue mb-1">
                                    {getRelativeTime(nextRefreshAccount.refreshAt)}
                                </div>
                                <div className="text-sm text-text-secondary">
                                    {nextRefreshAccount.name} becomes available at {formatDate(nextRefreshAccount.refreshAt)}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-3xl font-bold text-text-primary mb-1">-</div>
                                <div className="text-sm text-text-secondary">All accounts are available or none tracked.</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Account Management */}
                <div className="bg-surface rounded-2xl p-8 border border-white/5 shadow-glow-neon-blue/20">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Managed Accounts</h2>

                        <form onSubmit={handleAdd} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Account Name"
                                value={newAccountName}
                                onChange={(e) => setNewAccountName(e.target.value)}
                                className="bg-surface-elevated border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Email (Optional)"
                                value={newAccountEmail}
                                onChange={(e) => setNewAccountEmail(e.target.value)}
                                className="bg-surface-elevated border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary hidden sm:block"
                            />
                            <button
                                type="submit"
                                disabled={addMutation.isPending}
                                className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <Plus size={18} /> Add
                            </button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        {isLoading && <div className="text-text-secondary text-center py-4">Loading accounts...</div>}
                        {error && <div className="text-red-500 text-center py-4">Error loading accounts</div>}

                        {!isLoading && accounts?.length === 0 && (
                            <div className="text-text-secondary text-center py-8 bg-surface-elevated rounded-xl border border-white/5 border-dashed">
                                No accounts tracked yet. Add one above to get started.
                            </div>
                        )}

                        {accounts?.map((account) => (
                            <div key={account.id} className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-white/5 hover:border-primary/30 transition-colors">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-lg">{account.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${account.status === 'AVAILABLE' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-500'}`}>
                                            {account.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary">{account.email}</p>
                                    {account.status === 'EXHAUSTED' && (
                                        <p className="text-xs text-neon-blue mt-1 flex items-center gap-1">
                                            <RefreshCw size={12} /> Refreshes: {formatDate(account.refreshAt)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {account.status === 'AVAILABLE' ? (
                                        <button
                                            onClick={() => handleExhaust(account.id)}
                                            className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Mark Exhausted
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleAvailable(account.id)}
                                            className="px-3 py-1.5 bg-success/10 text-success hover:bg-success/20 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Mark Available
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(account.id)}
                                        className="p-2 text-text-secondary hover:text-red-500 rounded-lg hover:bg-surface transition-colors"
                                        title="Delete Account"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
