import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

// In production with nginx proxy, Socket.IO connects to same origin
// In development, connect to explicit backend URL
const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export function useSocket() {
    const socketRef = useRef(null);
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        // Only connect if user is authenticated
        if (!user?.id) return;

        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: true
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            // Authenticate with user ID to join user-specific room
            socket.emit('authenticate', user.id);
        });

        // Handle progress updates
        socket.on('progress:update', (data) => {
            console.log('Progress update received:', data);
            // Invalidate the video query to refresh data
            queryClient.invalidateQueries(['video', data.videoId]);
            queryClient.invalidateQueries(['stats']);
        });

        // Handle video added
        socket.on('video:added', (video) => {
            console.log('Video added:', video);
            queryClient.invalidateQueries(['videos']);
        });

        // Handle video deleted
        socket.on('video:deleted', (data) => {
            console.log('Video deleted:', data.videoId);
            queryClient.invalidateQueries(['videos']);
            queryClient.invalidateQueries(['stats']);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        // Cleanup on unmount
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [user?.id, queryClient]);

    return socketRef.current;
}

export default useSocket;
