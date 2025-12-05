import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { ArrowLeft, CheckCircle, Circle, Play } from 'lucide-react';


export default function VideoDetails() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [markPreviousModal, setMarkPreviousModal] = useState(null); // { chapterId, previousChapterIds }

    const { data: video, isLoading } = useQuery({
        queryKey: ['video', id],
        queryFn: async () => {
            const res = await client.get(`/videos/${id}`);
            return res.data;
        },
    });

    const markWatchedMutation = useMutation({
        mutationFn: async ({ chapterId, markPrevious, unmark }) => {
            if (unmark) {
                await client.delete(`/chapters/${chapterId}/watch`);
            } else {
                await client.post(`/chapters/${chapterId}/watch`, { markPrevious });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['video', id]);
            setMarkPreviousModal(null);
        },
    });

    const handleChapterClick = async (chapter) => {
        if (chapter.watched) {
            markWatchedMutation.mutate({ chapterId: chapter.id, unmark: true });
            return;
        }

        // Check for previous chapters
        try {
            const res = await client.get(`/chapters/${chapter.id}/check-previous`);
            if (res.data.requiresMarkPrevious) {
                setMarkPreviousModal({
                    chapterId: chapter.id,
                    previousChapterIds: res.data.previousChapterIds
                });
            } else {
                markWatchedMutation.mutate({ chapterId: chapter.id, markPrevious: false });
            }
        } catch (error) {
            console.error("Failed to check previous chapters", error);
        }
    };

    if (isLoading) return <div className="p-8 text-text-secondary">Loading...</div>;
    if (!video) return <div className="p-8 text-text-secondary">Video not found</div>;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero */}
            <div className="relative h-[40vh] w-full">
                <div className="absolute inset-0">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 p-8 w-full max-w-5xl mx-auto">
                    <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-4 transition-colors">
                        <ArrowLeft size={20} /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{video.title}</h1>
                    <p className="text-text-secondary max-w-2xl line-clamp-3">{video.description}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-8 mt-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Play size={24} className="text-primary" />
                    Chapters
                </h2>

                <div className="space-y-2">
                    {video.chapters?.sort((a, b) => a.sortOrder - b.sortOrder).map((chapter) => (
                        <div
                            key={chapter.id}
                            className="group flex items-center gap-4 p-4 bg-surface hover:bg-surface-elevated rounded-xl transition-all cursor-pointer"
                            onClick={() => handleChapterClick(chapter)}
                        >
                            <div className="flex-shrink-0 w-12 text-center font-mono text-text-secondary">
                                {chapter.chapterNumber}
                            </div>

                            <div className="flex-grow">
                                <h3 className="font-medium group-hover:text-primary transition-colors">{chapter.title}</h3>
                                <span className="text-xs text-text-secondary">
                                    {Math.floor(chapter.startTimeSeconds / 60)}:{(chapter.startTimeSeconds % 60).toString().padStart(2, '0')}
                                </span>
                            </div>

                            <div className="flex-shrink-0">
                                {chapter.watched ? (
                                    <CheckCircle className="text-primary" />
                                ) : (
                                    <Circle className="text-text-secondary group-hover:text-primary" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {markPreviousModal && (
                <div className="relative z-50">
                    <div className="fixed inset-0 bg-black/70" aria-hidden="true" onClick={() => setMarkPreviousModal(null)} />
                    <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl pointer-events-auto">
                            <h3 className="text-xl font-bold mb-4">Mark Previous Chapters?</h3>
                            <p className="text-text-secondary mb-6">
                                You have {markPreviousModal?.previousChapterIds.length} unwatched chapters before this one.
                                Would you like to mark them as watched too?
                            </p>

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => markWatchedMutation.mutate({
                                        chapterId: markPreviousModal.chapterId,
                                        markPrevious: false
                                    })}
                                    className="px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-elevated"
                                >
                                    No, just this one
                                </button>
                                <button
                                    onClick={() => markWatchedMutation.mutate({
                                        chapterId: markPreviousModal.chapterId,
                                        markPrevious: true
                                    })}
                                    className="px-4 py-2 rounded-lg bg-primary text-background font-bold hover:bg-primary-dark"
                                >
                                    Yes, mark all
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
