import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: user, isLoading, isError } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            try {
                const res = await client.get('/auth/me');
                return res.data.user;
            } catch (error) {
                return null;
            }
        },
        retry: false,
    });

    const loginMutation = useMutation({
        mutationFn: async ({ username, password }) => {
            const res = await client.post('/auth/login', { username, password });
            return res.data.user;
        },
        onSuccess: (user) => {
            queryClient.setQueryData(['auth', 'me'], user);
            navigate('/');
        },
    });

    const registerMutation = useMutation({
        mutationFn: async ({ username, password }) => {
            await client.post('/auth/register', { username, password });
        },
        onSuccess: () => {
            // Auto login or redirect to login
            navigate('/login');
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await client.post('/auth/logout');
        },
        onSuccess: () => {
            queryClient.setQueryData(['auth', 'me'], null);
            navigate('/login');
        },
    });

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        login: loginMutation.mutate,
        register: registerMutation.mutate,
        logout: logoutMutation.mutate,
        loginError: loginMutation.error,
        registerError: registerMutation.error,
    };
}
