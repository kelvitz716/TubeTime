import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { Link } from 'react-router-dom';
import { Plus, Play, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);

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
        },
    });

    const handleAddVideo = (e) => {
        e.preventDefault();
        if (newVideoUrl) {
            addVideoMutation.mutate(newVideoUrl);
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

            <div className="mb-12">
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
            </div>

            {isLoading ? (
                <div className="text-text-secondary">Loading videos...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {videos?.map((video) => (
                        <Link to={`/video/${video.id}`} key={video.id} className="group block bg-surface rounded-xl overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                            <div className="aspect-video relative">
                                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="text-primary fill-current" size={48} />
                                </div>
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
                    ))}
                </div>
            )}
        </div>
    );
}
