/**
 * Vehicle store using Zustand
 */
import { create } from 'zustand';
import type { Vehicle, VehicleFilters } from '@/lib/types/vehicle';
import { vehicleApi } from '@/lib/api';

interface VehicleState {
    vehicles: Vehicle[];
    currentVehicle: Vehicle | null;
    filters: VehicleFilters;
    isLoading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    hasMore: boolean;
    savedVehicles: string[]; // IDs of saved vehicles
    savedVehiclesLoaded: boolean;

    // Actions
    fetchVehicles: (page?: number) => Promise<void>;
    fetchVehicle: (id: string) => Promise<void>;
    setFilters: (filters: VehicleFilters) => void;
    clearFilters: () => void;
    searchVehicles: (query: string) => Promise<void>;
    saveVehicle: (id: string) => Promise<void>;
    unsaveVehicle: (id: string) => Promise<void>;
    fetchSavedVehicles: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

const initialFilters: VehicleFilters = {};

export const useVehicleStore = create<VehicleState>((set, get) => ({
    vehicles: [],
    currentVehicle: null,
    filters: initialFilters,
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    hasMore: false,
    savedVehicles: [],
    savedVehiclesLoaded: false,

    fetchVehicles: async (page = 1) => {
        set({ isLoading: true, error: null });
        try {
            const response = await vehicleApi.list(get().filters, page);
            set({
                vehicles: page === 1 ? response.results : [...get().vehicles, ...response.results],
                totalCount: response.count,
                currentPage: page,
                hasMore: response.next !== null,
                isLoading: false,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch vehicles';
            set({ error: message, isLoading: false });
        }
    },

    fetchVehicle: async (id: string) => {
        // Optimistic: Check if we already have this vehicle in the list
        const existing = get().vehicles.find(v => v.id === id);
        if (existing) {
            set({ currentVehicle: existing, isLoading: true, error: null });
        } else {
            set({ isLoading: true, error: null });
        }

        try {
            const vehicle = await vehicleApi.get(id);
            set({ currentVehicle: vehicle, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch vehicle';
            set({ error: message, isLoading: false });
        }
    },

    setFilters: (filters: VehicleFilters) => {
        set({ filters: { ...get().filters, ...filters }, vehicles: [], currentPage: 1 });
        get().fetchVehicles(1);
    },

    clearFilters: () => {
        set({ filters: initialFilters, vehicles: [], currentPage: 1 });
        get().fetchVehicles(1);
    },

    searchVehicles: async (query: string) => {
        set({ isLoading: true, error: null });
        try {
            const vehicles = await vehicleApi.search(query);
            set({ vehicles, totalCount: vehicles.length, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Search failed';
            set({ error: message, isLoading: false });
        }
    },

    fetchSavedVehicles: async () => {
        // Check if user is authenticated before fetching saved vehicles
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token) {
            // Guest user - just mark as loaded with empty list
            set({ savedVehicles: [], savedVehiclesLoaded: true });
            return;
        }

        try {
            const saved = await vehicleApi.getSaved();
            const savedIds = saved.map(sv => sv.vehicle.id);
            set({ savedVehicles: savedIds, savedVehiclesLoaded: true });
        } catch (error) {
            // Silently handle errors for guests/expired tokens
            console.error('Failed to fetch saved vehicles:', error);
            set({ savedVehicles: [], savedVehiclesLoaded: true });
        }
    },

    saveVehicle: async (id: string) => {
        const saved = get().savedVehicles;
        if (saved.includes(id)) return;

        // Optimistic update
        set({ savedVehicles: [...saved, id] });

        try {
            await vehicleApi.saveVehicle(id);
        } catch (error) {
            // Revert on error
            console.error('Failed to save vehicle:', error);
            set({ savedVehicles: saved });
        }
    },

    unsaveVehicle: async (id: string) => {
        const saved = get().savedVehicles;
        if (!saved.includes(id)) return;

        // Optimistic update
        set({ savedVehicles: saved.filter(v => v !== id) });

        try {
            await vehicleApi.removeSaved(id);
        } catch (error) {
            // Revert on error
            console.error('Failed to unsave vehicle:', error);
            set({ savedVehicles: saved });
        }
    },

    clearError: () => set({ error: null }),

    reset: () => set({
        vehicles: [],
        currentVehicle: null,
        filters: initialFilters,
        isLoading: false,
        error: null,
        totalCount: 0,
        currentPage: 1,
        hasMore: false,
    }),
}));

export default useVehicleStore;

