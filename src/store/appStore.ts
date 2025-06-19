import { createJSONStorage, persist } from 'zustand/middleware';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AppState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  hasValidCredentials: boolean;
  login: () => void;
  logout: () => void;
  setInitialized: (value: boolean) => void;
  setHasValidCredentials: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isInitialized: false,
      hasValidCredentials: false,
      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
      setInitialized: (value: boolean) => set({ isInitialized: value }),
      setHasValidCredentials: (value: boolean) => set({ hasValidCredentials: value }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state: AppState) => ({
        isAuthenticated: state.isAuthenticated,
        hasValidCredentials: state.hasValidCredentials,
      }),
    }
  )
);