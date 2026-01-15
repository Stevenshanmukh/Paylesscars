/**
 * Notification store using Zustand
 */
import { create } from 'zustand';
import apiClient from '@/lib/api/client';

export interface Notification {
    id: string;
    notification_type: string;
    title: string;
    message: string;
    data: Record<string, unknown>;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get('/notifications/');
            const notifications = response.data.results || response.data;
            const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;
            set({ notifications, unreadCount, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
            set({ error: message, isLoading: false });
        }
    },

    markAsRead: async (id: string) => {
        try {
            await apiClient.post(`/notifications/${id}/mark_read/`);
            const notifications = get().notifications.map((n) =>
                n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
            );
            const unreadCount = notifications.filter((n) => !n.is_read).length;
            set({ notifications, unreadCount });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to mark as read';
            set({ error: message });
        }
    },

    markAllAsRead: async () => {
        try {
            await apiClient.post('/notifications/mark_all_read/');
            const notifications = get().notifications.map((n) => ({
                ...n,
                is_read: true,
                read_at: new Date().toISOString(),
            }));
            set({ notifications, unreadCount: 0 });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to mark all as read';
            set({ error: message });
        }
    },

    clearError: () => set({ error: null }),
}));

export default useNotificationStore;
