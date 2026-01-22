/**
 * Negotiation store using Zustand
 */
import { create } from 'zustand';
import { negotiationApi } from '@/lib/api';
import type { Negotiation } from '@/lib/types/negotiation';

interface NegotiationState {
    negotiations: Negotiation[];
    currentNegotiation: Negotiation | null;
    isLoading: boolean;
    error: string | null;
    totalCount: number;

    // Actions
    fetchNegotiations: (status?: string) => Promise<void>;
    fetchNegotiation: (id: string) => Promise<void>;
    createNegotiation: (vehicleId: string, amount: number, message?: string) => Promise<Negotiation>;
    submitOffer: (negotiationId: string, amount: number, message?: string) => Promise<void>;
    acceptOffer: (negotiationId: string) => Promise<void>;
    rejectNegotiation: (negotiationId: string, reason?: string) => Promise<void>;
    cancelNegotiation: (negotiationId: string) => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

export const useNegotiationStore = create<NegotiationState>((set, get) => ({
    negotiations: [],
    currentNegotiation: null,
    isLoading: false,
    error: null,
    totalCount: 0,

    fetchNegotiations: async (status?: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await negotiationApi.list(1, status);
            set({
                negotiations: response.results || [],
                totalCount: response.count || 0,
                isLoading: false,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch negotiations';
            set({ error: message, isLoading: false });
        }
    },

    fetchNegotiation: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const negotiation = await negotiationApi.get(id);
            set({ currentNegotiation: negotiation, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch negotiation';
            set({ error: message, isLoading: false, currentNegotiation: null });
        }
    },

    createNegotiation: async (vehicleId: string, amount: number, message?: string) => {
        set({ isLoading: true, error: null });
        try {
            const negotiation = await negotiationApi.create({
                vehicle_id: vehicleId,
                initial_amount: amount,
                message,
            });
            set((state) => ({
                negotiations: [negotiation, ...state.negotiations],
                isLoading: false,
            }));
            return negotiation;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create negotiation';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    submitOffer: async (negotiationId: string, amount: number, message?: string) => {
        set({ isLoading: true, error: null });
        try {
            const updatedNegotiation = await negotiationApi.submitOffer(negotiationId, {
                amount: String(amount),
                message
            });
            set({ currentNegotiation: updatedNegotiation, isLoading: false });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit offer';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    acceptOffer: async (negotiationId: string) => {
        // Find current negotiation to revert if needed
        const previousNegotiation = get().currentNegotiation;
        const previousList = get().negotiations;

        // Optimistic update
        if (previousNegotiation && previousNegotiation.id === negotiationId) {
            const optimisticallyUpdated = { ...previousNegotiation, status: 'accepted' as const, is_active: false };
            set({
                currentNegotiation: optimisticallyUpdated,
                negotiations: previousList.map(n => n.id === negotiationId ? optimisticallyUpdated : n),
                isLoading: true // Keep loading true until server confirms
            });
        } else {
            set({ isLoading: true });
        }

        try {
            const updatedNegotiation = await negotiationApi.accept(negotiationId);
            set((state) => ({
                currentNegotiation: updatedNegotiation,
                negotiations: state.negotiations.map((n) =>
                    n.id === negotiationId ? updatedNegotiation : n
                ),
                isLoading: false,
            }));
        } catch (error: unknown) {
            // Revert on error
            set({
                currentNegotiation: previousNegotiation,
                negotiations: previousList,
                isLoading: false
            });
            const message = error instanceof Error ? error.message : 'Failed to accept offer';
            set({ error: message });
            throw error;
        }
    },

    rejectNegotiation: async (negotiationId: string, reason?: string) => {
        const previousNegotiation = get().currentNegotiation;
        const previousList = get().negotiations;

        if (previousNegotiation && previousNegotiation.id === negotiationId) {
            const optimisticallyUpdated = { ...previousNegotiation, status: 'rejected' as const, is_active: false };
            set({
                currentNegotiation: optimisticallyUpdated,
                negotiations: previousList.map(n => n.id === negotiationId ? optimisticallyUpdated : n),
                isLoading: true
            });
        } else {
            set({ isLoading: true });
        }

        try {
            const updatedNegotiation = await negotiationApi.reject(negotiationId, reason);
            set((state) => ({
                currentNegotiation: updatedNegotiation,
                negotiations: state.negotiations.map((n) =>
                    n.id === negotiationId ? updatedNegotiation : n
                ),
                isLoading: false,
            }));
        } catch (error: unknown) {
            set({
                currentNegotiation: previousNegotiation,
                negotiations: previousList,
                isLoading: false
            });
            const message = error instanceof Error ? error.message : 'Failed to reject';
            set({ error: message });
            throw error;
        }
    },

    cancelNegotiation: async (negotiationId: string) => {
        const previousNegotiation = get().currentNegotiation;
        const previousList = get().negotiations;

        if (previousNegotiation && previousNegotiation.id === negotiationId) {
            const optimisticallyUpdated = { ...previousNegotiation, status: 'cancelled' as const, is_active: false };
            set({
                currentNegotiation: optimisticallyUpdated,
                negotiations: previousList.map(n => n.id === negotiationId ? optimisticallyUpdated : n),
                isLoading: true
            });
        } else {
            set({ isLoading: true });
        }

        try {
            const updatedNegotiation = await negotiationApi.cancel(negotiationId);
            set((state) => ({
                currentNegotiation: updatedNegotiation,
                negotiations: state.negotiations.map((n) =>
                    n.id === negotiationId ? updatedNegotiation : n
                ),
                isLoading: false,
            }));
        } catch (error: unknown) {
            set({
                currentNegotiation: previousNegotiation,
                negotiations: previousList,
                isLoading: false
            });
            const message = error instanceof Error ? error.message : 'Failed to cancel';
            set({ error: message });
            throw error;
        }
    },

    clearError: () => set({ error: null }),

    reset: () =>
        set({
            negotiations: [],
            currentNegotiation: null,
            isLoading: false,
            error: null,
            totalCount: 0,
        }),
}));
