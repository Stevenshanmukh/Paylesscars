/**
 * Authentication store using Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/types/auth';
import { authApi } from '@/lib/api';
import { clearTokens, getAccessToken } from '@/lib/api/client';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (data: { email: string; password: string; password_confirm: string; user_type: 'buyer' | 'dealer' }) => Promise<void>;
    logout: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    clearError: () => void;
    checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                console.log('AuthStore: login called for', email);
                set({ isLoading: true, error: null });
                try {
                    console.log('AuthStore: sending api request...');
                    const response = await authApi.login({ email, password });
                    console.log('AuthStore: api response received', response);
                    const { user } = response;
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error: unknown) {
                    console.error('AuthStore: login failed', error);
                    const message = error instanceof Error ? error.message : 'Login failed';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    // Register and get tokens in one call (tokens are set inside authApi.register)
                    const { user } = await authApi.register(data);
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Registration failed';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    await authApi.logout();
                } catch {
                    // Ignore logout errors
                } finally {
                    clearTokens();
                    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
                }
            },

            fetchProfile: async () => {
                set({ isLoading: true });
                try {
                    const user = await authApi.getProfile();
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
                    set({ error: message, isLoading: false, isAuthenticated: false, user: null });
                }
            },

            updateProfile: async (data: Partial<User>) => {
                set({ isLoading: true, error: null });
                try {
                    const user = await authApi.updateProfile(data);
                    set({ user, isLoading: false });
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Failed to update profile';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            clearError: () => set({ error: null }),

            checkAuth: () => {
                const token = getAccessToken();
                if (token && !get().user) {
                    get().fetchProfile();
                } else if (!token) {
                    set({ isAuthenticated: false, user: null });
                }
            },
        }),
        {
            name: 'paylesscars-auth',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);

export default useAuthStore;
