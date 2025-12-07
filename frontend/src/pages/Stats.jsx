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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Videos Card */}
                    <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-glow-success text-center">
                        <div className="text-3xl font-bold text-success mb-1">{summary.totalVideos}</div>
                        <div className="text-text-secondary text-sm font-medium uppercase tracking-wider">Videos</div>
                    </div>

                    {/* Chapters Card */}
                    <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-glow-neon-blue text-center">
                        <div className="text-3xl font-bold text-neon-blue mb-1">
                            {summary.watchedChapters}/{summary.totalChapters}
                        </div>
                        <div className="text-text-secondary text-sm font-medium uppercase tracking-wider">Chapters</div>
                    </div>

                    {/* Watch Time Card */}
                    <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-glow-primary text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{formatDuration(summary.totalWatchTimeSeconds)}</div>
                        <div className="text-text-secondary text-sm font-medium uppercase tracking-wider">Watched</div>
                    </div>

                    {/* Remaining Card */}
                    <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-[0_0_20px_-5px_var(--color-neon-purple)] text-center">
                        <div className="text-3xl font-bold text-neon-purple mb-1">{formatDuration(summary.remainingTimeSeconds)}</div>
                        <div className="text-text-secondary text-sm font-medium uppercase tracking-wider">Remaining</div>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl p-8 border border-white/5 shadow-glow-neon-blue/20 mb-8 flex flex-col sm:flex-row items-center gap-8">
                    {/* Progress Ring with Gradient */}
                    <div className="relative w-48 h-48 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#10B981" /> {/* success */}
                                    <stop offset="100%" stopColor="#3B82F6" /> {/* primary */}
                                </linearGradient>
                                <filter id="glow-spread" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="8" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* Track */}
                            <circle
                                cx="100"
                                cy="100"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                className="text-surface-elevated"
                            />

                            {/* Glow Layer (Blurry Background) */}
                            <circle
                                cx="100"
                                cy="100"
                                r="70"
                                stroke="url(#progressGradient)"
                                strokeWidth="12"
                                fill="none"
                                strokeLinecap="round"
                                filter="url(#glow-spread)"
                                strokeOpacity="0.6"
                                strokeDasharray={`${(summary.completionPercentage / 100) * 440} 440`}
                            />

                            {/* Main Progress Layer (Sharp Foreground) */}
                            <circle
                                cx="100"
                                cy="100"
                                r="70"
                                stroke="url(#progressGradient)"
                                strokeWidth="12"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${(summary.completionPercentage / 100) * 440} 440`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">{summary.completionPercentage}%</span>
                        </div>
                    </div>

                    {/* Right Side Info */}
                    <div className="flex-1 w-full">
                        <h2 className="text-2xl font-bold mb-2">Progress</h2>

                        {/* Linear Bar */}
                        <div className="h-3 w-full bg-surface-elevated rounded-full overflow-hidden mb-4 border border-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-success to-primary shadow-glow-success"
                                style={{ width: `${summary.completionPercentage}%` }}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <p className="text-lg text-text-primary font-medium">
                                <span className="text-success">{summary.watchedChapters}</span> of <span className="text-text-secondary">{summary.totalChapters} Chapters Watched</span>
                            </p>
                            <p className="text-sm text-text-secondary">
                                {summary.totalChapters - summary.watchedChapters} chapters remaining
                            </p>
                        </div>
                    </div>
                </div>

                {/* Weekly Viewing Activity Chart */}
                <div className="bg-surface rounded-2xl p-8 border border-white/5 shadow-glow-neon-blue/20 mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-white">Weekly Viewing Activity</h2>

                    <div className="relative h-64 w-full flex gap-4">
                        {/* Y-Axis Labels */}
                        <div className="flex flex-col justify-between text-text-secondary text-xs font-medium py-6 h-full text-right w-8">
                            <span>{recentActivity.length > 0 ? Math.max(...recentActivity.map(d => d.chaptersWatched), 5) : 5}</span>
                            <span>{recentActivity.length > 0 ? Math.round(Math.max(...recentActivity.map(d => d.chaptersWatched), 5) * 0.75) : 4}</span>
                            <span>{recentActivity.length > 0 ? Math.round(Math.max(...recentActivity.map(d => d.chaptersWatched), 5) * 0.5) : 3}</span>
                            <span>{recentActivity.length > 0 ? Math.round(Math.max(...recentActivity.map(d => d.chaptersWatched), 5) * 0.25) : 1}</span>
                            <span>0</span>
                        </div>

                        {/* Chart Area */}
                        <div className="flex-1 relative">
                            {/* Horizontal Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between py-6 h-full pointer-events-none">
                                <div className="w-full h-[1px] bg-white/5"></div>
                                <div className="w-full h-[1px] bg-white/5"></div>
                                <div className="w-full h-[1px] bg-white/5"></div>
                                <div className="w-full h-[1px] bg-white/5"></div>
                                <div className="w-full h-[1px] bg-white/5"></div>
                            </div>

                            {/* Bars Container */}
                            <div className="absolute inset-0 flex items-end justify-between px-2 pt-6 pb-6 h-full">
                                {(recentActivity.length > 0 ? recentActivity : Array(7).fill({ chaptersWatched: 0, date: new Date() })).map((day, i) => {
                                    const maxVal = recentActivity.length > 0 ? Math.max(...recentActivity.map(d => d.chaptersWatched), 5) : 5;
                                    const heightPct = (day.chaptersWatched / maxVal) * 100;
                                    const dayName = recentActivity.length > 0 ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2) : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][i];

                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                                            {/* Bar */}
                                            <div
                                                className={`w-full max-w-[24px] sm:max-w-[40px] rounded-t-lg bg-gradient-to-b from-[#FFC107] to-[#3B82F6] transition-all duration-500 origin-bottom relative ${day.chaptersWatched > 0 ? 'opacity-90 group-hover:opacity-100 group-hover:scale-y-105' : 'opacity-20 h-1'}`}
                                                style={{ height: day.chaptersWatched > 0 ? `${Math.max(heightPct, 4)}%` : '4px' }}
                                            >
                                                {/* Tooltip */}
                                                {day.chaptersWatched > 0 && (
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-elevated text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none z-10">
                                                        {day.chaptersWatched} chapters
                                                    </div>
                                                )}
                                            </div>

                                            {/* X-Axis Label */}
                                            <span className="text-xs text-text-secondary font-medium uppercase">
                                                {dayName}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

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
