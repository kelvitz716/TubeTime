import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';

export default function Login() {
    const { register: registerAuth, login, loginError, registerError } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isRegistering, setIsRegistering] = useState(false);

    const onSubmit = (data) => {
        if (isRegistering) {
            registerAuth(data);
        } else {
            login(data);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-8 bg-surface rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-primary mb-6 text-center">
                    {isRegistering ? 'Join TubeTime' : 'Welcome Back'}
                </h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
                        <input
                            {...register('username', { required: 'Username is required' })}
                            className="w-full px-4 py-2 bg-surface-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                        <input
                            type="password"
                            {...register('password', { required: 'Password is required' })}
                            className="w-full px-4 py-2 bg-surface-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    {(loginError || registerError) && (
                        <p className="text-red-500 text-sm text-center">
                            {loginError?.response?.data?.message || registerError?.response?.data?.message || 'An error occurred'}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-primary hover:bg-primary-dark text-background font-bold rounded-lg transition-colors"
                    >
                        {isRegistering ? 'Sign Up' : 'Log In'}
                    </button>
                </form>

                <p className="mt-4 text-center text-text-secondary text-sm">
                    {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-primary hover:underline"
                    >
                        {isRegistering ? 'Log In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
}
