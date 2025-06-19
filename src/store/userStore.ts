import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';

export interface User {
  uid: string;
  name: string;
  avatar?: string | null;
  status?: string;
  phoneNumber: string;
  friends?: string[];
  about?: string; // MODIFIED: Ensure this field exists
}

export interface UserState {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;

  setCurrentUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (uid: string) => void;
  updateUserStatus: (uid: string, status: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  clear: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type PersistedUserState = Pick<UserState, 'currentUser' | 'users'>;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      loading: false,
      error: null,

      setCurrentUser: (user) => set({ currentUser: user }),
      setUsers: (users) => set({ users }),
      addUser: (user) =>
        set((state) => ({
          users: [...state.users.filter(u => u.uid !== user.uid), user],
        })),
      removeUser: (uid) =>
        set((state) => ({
          users: state.users.filter((user) => user.uid !== uid),
        })),
      updateUserStatus: (uid, status) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.uid === uid ? { ...user, status } : user,
          ),
          currentUser:
            state.currentUser?.uid === uid
              ? { ...state.currentUser, status }
              : state.currentUser,
        })),
      updateCurrentUser: (updates) =>
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, ...updates }
            : null,
        })),
      clear: () => set({ currentUser: null, users: [], loading: false, error: null }),

      setLoading: (isLoading) => set({ loading: isLoading, error: isLoading ? null : get().error }),
      setError: (errorMsg) => set({ error: errorMsg, loading: false }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedUserState => ({
        currentUser: state.currentUser,
        users: state.users,
      }),
    } as PersistOptions<UserState, PersistedUserState>,
  ),
);