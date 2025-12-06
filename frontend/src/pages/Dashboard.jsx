import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { Link } from 'react-router-dom';
import { Plus, Play, Clock, Trash2, CheckSquare, XSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

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
        mutationFn: async (url) => {
            await client.post('/videos', { url });
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
        <div className="min-h-screen bg-background p-8">
            <header className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-bold text-primary">TubeTime</h1>
                <div className="flex items-center gap-4">
                    <span className="text-text-secondary">Hi, {user?.username}</span>
                    <button onClick={() => logout()} className="text-sm text-text-secondary hover:text-text-primary">
                        Logout
                    </button>
                </div>
            </header>

            <div className="mb-12 flex justify-between items-start">
                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-surface-elevated hover:bg-surface rounded-xl text-text-primary transition-colors"
                    >
                        <Plus size={20} />
                        Add New Video
                    </button>
                ) : (
                    <form onSubmit={handleAddVideo} className="flex gap-4 max-w-2xl">
                        <input
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            placeholder="Paste YouTube URL..."
                            className="flex-1 px-4 py-3 bg-surface-elevated text-text-primary rounded-xl outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={addVideoMutation.isPending}
                            className="px-6 py-3 bg-primary hover:bg-primary-dark text-background font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {addVideoMutation.isPending ? 'Adding...' : 'Add'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-6 py-3 bg-surface text-text-secondary hover:text-text-primary rounded-xl"
                        >
                            Cancel
                        </button>
                    </form>
                )}

                {/* Selection Mode Controls */}
                <div className="flex items-center gap-3">
                    {isSelectionMode ? (
                        <>
                            <span className="text-text-secondary mr-2">{selectedVideoIds.size} selected</span>
                            <button
                                onClick={handleBulkDeleteClick}
                                disabled={selectedVideoIds.size === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 size={18} />
                                Delete Selected
                            </button>
                            <button
                                onClick={() => {
                                    setIsSelectionMode(false);
                                    setSelectedVideoIds(new Set());
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-surface text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                            >
                                <XSquare size={18} />
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsSelectionMode(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-surface text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                        >
                            <CheckSquare size={18} />
                            Select
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="text-text-secondary">Loading videos...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {videos?.map((video) => (
                        <div key={video.id} className="relative group">
                            <Link
                                to={isSelectionMode ? '#' : `/video/${video.id}`}
                                onClick={(e) => {
                                    if (isSelectionMode) {
                                        e.preventDefault();
                                        toggleSelection(video.id);
                                    }
                                }}
                                className="block bg-surface rounded-xl overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                            >
                                <div className="aspect-video relative">
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />

                                    {/* Play Overlay (only when not selecting) */}
                                    {!isSelectionMode && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Play className="text-primary fill-current" size={48} />
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

                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-xs rounded">
                                        {Math.floor(video.durationSeconds / 60)}:{(video.durationSeconds % 60).toString().padStart(2, '0')}
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
                                    className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
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
                    <div className="fixed inset-0 bg-black/70" aria-hidden="true" onClick={() => setConfirmationModal(null)} />
                    <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl pointer-events-auto">
                            <h3 className="text-xl font-bold mb-4">No Chapters Found</h3>
                            <p className="text-text-secondary mb-6">
                                The video "{confirmationModal.info.title}" appears to have {confirmationModal.info.chapters?.length || 0} chapter(s).
                                Do you want to proceed with importing it anyway?
                            </p>

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setConfirmationModal(null)}
                                    className="px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-elevated"
                                >
                                    No, cancel
                                </button>
                                <button
                                    onClick={() => addVideoMutation.mutate(confirmationModal.url)}
                                    className="px-4 py-2 rounded-lg bg-primary text-background font-bold hover:bg-primary-dark"
                                >
                                    Yes, proceed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
