import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { Link } from 'react-router-dom';
import { Plus, Play, Clock, Trash2, CheckSquare, XSquare, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import PageContainer from '../components/ui/PageContainer';

// Helper to format seconds as human-readable duration
const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function Dashboard() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Deletion & Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedVideoIds, setSelectedVideoIds] = useState(new Set());
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, data: null }); // type: 'single' | 'bulk'

    const [confirmationModal, setConfirmationModal] = useState(null); // { url, info }

    const { data: videos, isLoading } = useQuery({
        queryKey: ['videos'],
        queryFn: async () => {
            const res = await client.get('/videos');
            return res.data;
        },
    });

    const addVideoMutation = useMutation({
        mutationFn: async (payload) => {
            // Payload can be string (url) or object { url, manualChapters }
            const data = typeof payload === 'string' ? { url: payload } : payload;
            await client.post('/videos', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['videos']);
            setNewVideoUrl('');
            setIsAdding(false);
            setConfirmationModal(null);
        },
    });

    const previewVideoMutation = useMutation({
        mutationFn: async (url) => {
            const res = await client.post('/videos/preview', { url });
            return res.data;
        },
        onSuccess: (data, variables) => {
            if (data.chapters && data.chapters.length > 1) {
                addVideoMutation.mutate(variables);
            } else {
                setConfirmationModal({ url: variables, info: data });
            }
        },
        onError: (error) => {
            console.error("Preview failed", error);
            alert("Failed to preview video. Trying to add directly...");
            addVideoMutation.mutate(newVideoUrl);
        }
    });

    const deleteVideoMutation = useMutation({
        mutationFn: async (id) => {
            await client.delete(`/videos/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['videos']);
            setDeleteModal({ isOpen: false, type: null, data: null });
        },
        onError: (error) => {
            console.error("Delete failed", error);
            alert("Failed to delete video");
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids) => {
            await client.delete('/videos/bulk', { data: { ids } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['videos']);
            setDeleteModal({ isOpen: false, type: null, data: null });
            setSelectedVideoIds(new Set());
            setIsSelectionMode(false);
        },
        onError: (error) => {
            console.error("Bulk delete failed", error);
            alert("Failed to delete videos");
        }
    });

    const handleAddVideo = (e) => {
        e.preventDefault();
        if (newVideoUrl) {
            previewVideoMutation.mutate(newVideoUrl);
        }
    };

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedVideoIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedVideoIds(newSelected);
    };

    const handleDeleteClick = (e, video) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
        setDeleteModal({
            isOpen: true,
            type: 'single',
            data: video
        });
    };

    const handleBulkDeleteClick = () => {
        setDeleteModal({
            isOpen: true,
            type: 'bulk',
            data: { count: selectedVideoIds.size }
        });
    };

    const confirmDelete = () => {
        if (deleteModal.type === 'single') {
            deleteVideoMutation.mutate(deleteModal.data.id);
        } else if (deleteModal.type === 'bulk') {
            bulkDeleteMutation.mutate(Array.from(selectedVideoIds));
        }
    };

    return (
        <div className="min-h-screen bg-background py-8 animate-fade-in">
            <PageContainer>
                <header className="flex flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-primary flex-shrink-0">TubeTime</h1>
                    <div className="flex items-center gap-3 bg-surface-elevated/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
                        <span className="text-text-secondary text-sm font-medium px-2 hidden sm:block truncate max-w-[150px]">
                            {user?.username}
                        </span>
                        <Link
                            to="/stats"
                            className="p-2 text-text-secondary hover:text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                            title="Stats"
                        >
                            <BarChart2 size={20} />
                        </Link>
                        <button
                            onClick={() => logout()}
                            className="p-2 text-text-secondary hover:text-red-400 hover:bg-surface-elevated rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Actions Bar */}
                <div className="mb-8 grid grid-cols-2 gap-4">
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="col-span-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-elevated hover:bg-surface rounded-xl text-text-primary text-sm font-bold transition-all border border-white/5 active:scale-95"
                        >
                            <Plus size={18} />
                            <span className="truncate">Add Video</span>
                        </button>
                    ) : (
                        <form onSubmit={handleAddVideo} className="col-span-2 flex flex-col sm:flex-row gap-2 animate-slide-up">
                            <input
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="Paste YouTube URL..."
                                className="flex-1 px-4 py-3 bg-surface-elevated text-text-primary rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={addVideoMutation.isPending || previewVideoMutation.isPending}
                                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary-dark text-background font-bold rounded-xl text-sm whitespace-nowrap"
                                >
                                    {previewVideoMutation.isPending ? '...' : 'Add'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-3 bg-surface text-text-secondary rounded-xl text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Selection Mode Controls - Always visible in grid, or replacing Add? 
                    The previous design had them side-by-side. 
                    Let's use a grid where "Add" is left, "Select" is right. 
                    If adding, the form takes full width.
                */}
                    {!isAdding && (
                        <div className="col-span-1 flex justify-end">
                            {isSelectionMode ? (
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={handleBulkDeleteClick}
                                        disabled={selectedVideoIds.size === 0}
                                        className="flex-1 flex items-center justify-center gap-2 px-2 py-3 bg-red-600/20 text-red-500 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 size={18} />
                                        <span className="hidden sm:inline">Delete</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsSelectionMode(false);
                                            setSelectedVideoIds(new Set());
                                        }}
                                        className="flex-none px-3 py-3 bg-surface text-text-secondary rounded-xl"
                                    >
                                        <XSquare size={18} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsSelectionMode(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface hover:bg-surface-elevated rounded-xl text-text-secondary hover:text-text-primary text-sm font-bold transition-all border border-white/5 active:scale-95"
                                >
                                    <CheckSquare size={18} />
                                    <span>Select</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-text-secondary animate-pulse">Loading videos...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                        {videos?.map((video, index) => (
                            <div
                                key={video.id}
                                className="relative group animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <Link
                                    to={isSelectionMode ? '#' : `/video/${video.id}`}
                                    onClick={(e) => {
                                        if (isSelectionMode) {
                                            e.preventDefault();
                                            toggleSelection(video.id);
                                        }
                                    }}
                                    className="block bg-surface rounded-xl overflow-hidden hover:ring-2 hover:ring-primary transition-all hover:translate-y-[-4px] shadow-lg"
                                >
                                    <div className="aspect-video relative">
                                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />

                                        {/* Play Overlay (only when not selecting) */}
                                        {!isSelectionMode && (
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Play className="text-primary fill-current drop-shadow-lg" size={48} />
                                            </div>
                                        )}

                                        {/* Selection Overlay */}
                                        {isSelectionMode && (
                                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${selectedVideoIds.has(video.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedVideoIds.has(video.id) ? 'bg-primary border-primary' : 'border-white'}`}>
                                                    {selectedVideoIds.has(video.id) && <CheckSquare size={16} className="text-background" />}
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-xs rounded font-medium">
                                            {formatDuration(video.durationSeconds)}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                            {video.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Clock size={14} />
                                            <span>Added {new Date(video.addedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Link>

                                {/* Individual Delete Button (only when not selecting) */}
                                {!isSelectionMode && (
                                    <button
                                        onClick={(e) => handleDeleteClick(e, video)}
                                        className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all z-10"
                                        title="Delete Video"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <DeleteConfirmationModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, type: null, data: null })}
                    onConfirm={confirmDelete}
                    title={deleteModal.type === 'bulk' ? `Delete ${deleteModal.data?.count} Videos?` : 'Delete Video?'}
                    message={deleteModal.type === 'bulk'
                        ? `Are you sure you want to delete these ${deleteModal.data?.count} videos? This action cannot be undone.`
                        : `Are you sure you want to delete "${deleteModal.data?.title}"? This action cannot be undone.`}
                    isDeleting={deleteVideoMutation.isPending || bulkDeleteMutation.isPending}
                />

                {/* Confirmation Modal for No Chapters */}
                {confirmationModal && (
                    <div className="relative z-50">
                        <div className="fixed inset-0 bg-black/70 transition-opacity animate-in fade-in duration-200" aria-hidden="true" onClick={() => setConfirmationModal(null)} />
                        <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                            <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl pointer-events-auto animate-pop-in border border-white/5">
                                <h3 className="text-xl font-bold mb-4">Check Chapters</h3>
                                <p className="text-text-secondary mb-4">
                                    We found {confirmationModal.info.chapters?.length || 0} chapter(s) for "{confirmationModal.info.title}".
                                </p>
                                <p className="text-text-secondary mb-4 text-sm">
                                    If chapters are available in the description or comments, paste them below.
                                    <br />
                                    <a
                                        href={confirmationModal.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        Open video in YouTube ↗
                                    </a>
                                </p>

                                <textarea
                                    className="w-full h-32 bg-surface-elevated rounded-xl p-3 text-sm text-text-primary mb-6 outline-none focus:ring-2 focus:ring-primary resize-none"
                                    placeholder="Paste chapters here...&#10;00:00 Intro&#10;01:30 Topic 1"
                                    id="manual-chapters-input"
                                />

                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={() => setConfirmationModal(null)}
                                        className="px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-elevated transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            const manualText = document.getElementById('manual-chapters-input').value;
                                            addVideoMutation.mutate({
                                                url: confirmationModal.url,
                                                manualChapters: manualText
                                            });
                                        }}
                                        className="px-4 py-2 rounded-lg bg-primary text-background font-bold hover:bg-primary-dark transition-colors"
                                    >
                                        Import Video
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </PageContainer>
        </div>
    );
}
