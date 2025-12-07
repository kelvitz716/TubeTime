import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { ArrowLeft, CheckCircle, Circle, Play } from 'lucide-react';
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

    if (isLoading) return <div className="p-8 text-text-secondary animate-pulse">Loading...</div>;
    if (!video) return <div className="p-8 text-text-secondary">Video not found</div>;

    return (
        <div className="min-h-screen bg-background pb-20 animate-fade-in">
            {/* Hero */}
            <div className="relative h-[30vh] md:h-[40vh] w-full">
                <div className="absolute inset-0">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 w-full">
                    <PageContainer className="pb-8">
                        <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-4 transition-colors">
                            <ArrowLeft size={20} /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 line-clamp-2 md:line-clamp-none">{video.title}</h1>
                        <p className="text-text-secondary max-w-2xl line-clamp-2 md:line-clamp-3 text-sm md:text-base">{video.description}</p>
                    </PageContainer>
                </div>
            </div>

            {/* Content */}
            <PageContainer className="mt-8">
                {/* Season Progress Header */}
                <div className="mb-6 p-4 bg-surface rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                                Season 1
                            </h2>
                            <span className="text-text-secondary font-mono text-lg">
                                {video.chapters?.filter(c => c.watched).length}/{video.chapters?.length}
                            </span>
                        </div>

                        <div className="flex-shrink-0 animate-pop-in">
                            {video.chapters?.length > 0 && video.chapters.every(c => c.watched) ? (
                                <div className="bg-green-500 rounded-full p-0.5">
                                    <CheckCircle className="text-background" size={24} />
                                </div>
                            ) : (
                                <Circle className="text-text-secondary" size={24} />
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-700 ease-out"
                            style={{
                                width: `${(video.chapters?.length > 0
                                    ? (video.chapters.filter(c => c.watched).length / video.chapters.length) * 100
                                    : 0)}%`
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    {video.chapters?.sort((a, b) => a.sortOrder - b.sortOrder).map((chapter, index) => (
                        <div
                            key={chapter.id}
                            className="group flex items-center gap-4 p-4 bg-surface hover:bg-surface-elevated active:scale-[0.99] rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/5 animate-slide-up"
                            style={{ animationDelay: `${index * 30}ms` }}
                            onClick={() => handleChapterClick(chapter)}
                        >
                            <div className="flex-shrink-0 w-8 md:w-12 text-center font-mono text-text-secondary text-sm md:text-base">
                                {chapter.chapterNumber}
                            </div>

                            <div className="flex-grow">
                                <h3 className="font-medium text-sm md:text-base group-hover:text-primary transition-colors line-clamp-1 md:line-clamp-none">{chapter.title}</h3>
                                <span className="text-xs text-text-secondary">
                                    {formatDuration(chapter.startTimeSeconds)}
                                </span>
                            </div>

                            <div className="flex-shrink-0">
                                {chapter.watched ? (
                                    <CheckCircle className="text-primary animate-pop-in" />
                                ) : (
                                    <Circle className="text-text-secondary group-hover:text-primary transition-colors" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </PageContainer>

            {/* Modal */}
            {markPreviousModal && (
                <div className="relative z-50">
                    <div className="fixed inset-0 bg-black/70 animate-fade-in" aria-hidden="true" onClick={() => setMarkPreviousModal(null)} />
                    <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl pointer-events-auto animate-pop-in border border-white/10">
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
                                    className="px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-elevated transition-colors"
                                >
                                    No, just this one
                                </button>
                                <button
                                    onClick={() => markWatchedMutation.mutate({
                                        chapterId: markPreviousModal.chapterId,
                                        markPrevious: true
                                    })}
                                    className="px-4 py-2 rounded-lg bg-primary text-background font-bold hover:bg-primary-dark transition-colors"
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
