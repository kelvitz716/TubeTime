import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { ArrowLeft, Clock, PlayCircle, CheckCircle, Flame, TrendingUp } from 'lucide-react';

// Helper to format seconds as human-readable duration
const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
        return `${h}h ${m}m`;
    }
    return `${m}m`;
};

export default function Stats() {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['stats'],
        queryFn: async () => {
            const res = await client.get('/stats');
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-text-secondary">Loading statistics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-red-500">Error loading statistics</div>
            </div>
        );
    }

    const { summary, recentActivity, topVideos } = stats;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-surface border-b border-surface-elevated">
                <div className="max-w-5xl mx-auto px-8 py-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-4 transition-colors">
                        <ArrowLeft size={20} /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold">Your Statistics</h1>
                    <p className="text-text-secondary mt-2">Track your watching progress and activity</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 mt-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* Videos Card */}
                    <div className="bg-surface rounded-2xl p-6 border border-surface-elevated">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <PlayCircle className="text-blue-500" size={24} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold">{summary.totalVideos}</div>
                        <div className="text-text-secondary text-sm">Videos</div>
                    </div>

                    {/* Chapters Card */}
                    <div className="bg-surface rounded-2xl p-6 border border-surface-elevated">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <CheckCircle className="text-green-500" size={24} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold">
                            {summary.watchedChapters}/{summary.totalChapters}
                        </div>
                        <div className="text-text-secondary text-sm">Chapters Watched</div>
                    </div>

                    {/* Watch Time Card */}
                    <div className="bg-surface rounded-2xl p-6 border border-surface-elevated">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Clock className="text-purple-500" size={24} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold">{formatDuration(summary.totalWatchTimeSeconds)}</div>
                        <div className="text-text-secondary text-sm">Watched</div>
                    </div>

                    {/* Remaining Card */}
                    <div className="bg-surface rounded-2xl p-6 border border-surface-elevated">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                                <Flame className="text-orange-500" size={24} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold">{formatDuration(summary.remainingTimeSeconds)}</div>
                        <div className="text-text-secondary text-sm">Remaining</div>
                    </div>
                </div>

                {/* Completion Progress */}
                <div className="bg-surface rounded-2xl p-6 border border-surface-elevated mb-8">
                    <h2 className="text-xl font-bold mb-4">Overall Completion</h2>
                    <div className="flex items-center gap-6">
                        {/* Progress Ring */}
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="none"
                                    className="text-surface-elevated"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeLinecap="round"
                                    className="text-primary"
                                    strokeDasharray={`${(summary.completionPercentage / 100) * 352} 352`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold">{summary.completionPercentage}%</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-text-secondary">
                                You've completed {summary.watchedChapters} out of {summary.totalChapters} chapters
                            </p>
                            <p className="text-text-secondary mt-1">
                                Keep going! {summary.totalChapters - summary.watchedChapters} chapters left to watch.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                {recentActivity.length > 0 && (
                    <div className="bg-surface rounded-2xl p-6 border border-surface-elevated mb-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <TrendingUp size={20} />
                            Recent Activity
                        </h2>
                        <div className="flex gap-2 items-end h-24">
                            {recentActivity.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-primary rounded-t"
                                        style={{
                                            height: `${Math.min(100, (day.chaptersWatched / Math.max(...recentActivity.map(d => d.chaptersWatched))) * 100)}%`,
                                            minHeight: '4px'
                                        }}
                                    />
                                    <span className="text-xs text-text-secondary">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Videos */}
                {topVideos.length > 0 && (
                    <div className="bg-surface rounded-2xl p-6 border border-surface-elevated">
                        <h2 className="text-xl font-bold mb-4">Top Videos</h2>
                        <div className="space-y-4">
                            {topVideos.map((video) => (
                                <Link
                                    key={video.id}
                                    to={`/video/${video.id}`}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-elevated transition-colors"
                                >
                                    <img
                                        src={video.thumbnailUrl}
                                        alt={video.title}
                                        className="w-20 h-12 object-cover rounded-lg"
                                    />
                                    <div className="flex-grow min-w-0">
                                        <h3 className="font-medium truncate">{video.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <span>{video.watchedChapters}/{video.totalChapters} chapters</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 w-12 text-right">
                                        <span className="text-primary font-bold">{video.progress}%</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
