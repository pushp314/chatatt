import { PersistOptions, createJSONStorage, persist } from 'zustand/middleware';
import { StateCreator, create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { authService } from '../services/authService';
import { useChatStore } from './chatStore';
import { useUserStore, User } from './userStore';

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  hasValidCredentials: boolean;
  isLoading: boolean;
  error: string | null;
  currentUser: CometChat.User | null;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentUser: (user: CometChat.User | null) => void;
  initialize: () => Promise<void>;
  login: (user: CometChat.User, backendUser: { _id: string; displayName: string; profilePictureURL?: string; phoneNumber: string; status?: string; friends?: string[], aboutStatus?: string }) => void;
  logout: () => Promise<void>;
  setInitialized: (value: boolean) => void;
  setHasValidCredentials: (value: boolean) => void;
  updateCurrentUserInfo: (updatedData: { // MODIFIED: Added function definition
    displayName: string;
    profilePictureURL: string | null;
    aboutStatus: string;
  }) => void;
}

type AuthPersistDefinition = (
  config: StateCreator<AuthState>,
  options: PersistOptions<AuthState, Pick<AuthState, 'isAuthenticated' | 'hasValidCredentials' | 'currentUser'>>
) => StateCreator<AuthState>;


export const useAuthStore = create<AuthState>(
  (persist as AuthPersistDefinition)(
    (set, get) => ({
      isAuthenticated: false,
      isInitialized: false,
      hasValidCredentials: false,
      isLoading: false,
      error: null,
      currentUser: null,

      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setCurrentUser: (user: CometChat.User | null) => set({ currentUser: user }),

      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await CometChat.getLoggedinUser();
          if (user) {
            set({ isAuthenticated: true, currentUser: user });
            useChatStore.getState().setLoggedInUser(user);
          } else {
            set({ isAuthenticated: false, currentUser: null });
          }
        } catch (error) {
          console.error('AuthStore: Initialization error:', error);
          set({ error: 'Failed to initialize auth', isAuthenticated: false, currentUser: null });
        } finally {
          set({ isInitialized: true, isLoading: false });
        }
      },

      login: (user: CometChat.User, backendUser: { _id: string; displayName: string; profilePictureURL?: string; phoneNumber: string; status?: string; friends?: string[], aboutStatus?: string }) => {
        set({ isAuthenticated: true, currentUser: user, error: null, isLoading: false });
        useChatStore.getState().setLoggedInUser(user);

        const userStoreUser: User = {
          uid: backendUser._id,
          name: backendUser.displayName,
          avatar: backendUser.profilePictureURL,
          status: backendUser.status,
          phoneNumber: backendUser.phoneNumber,
          friends: backendUser.friends,
          about: backendUser.aboutStatus, // MODIFIED: Added about status on login
        };
        useUserStore.getState().setCurrentUser(userStoreUser);
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await authService.logout();
          set({ isAuthenticated: false, currentUser: null });
          useChatStore.getState().setLoggedInUser(null);
          useChatStore.getState().clearMessages();
          useUserStore.getState().clear();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to logout';
          set({ error: errorMessage });
          set({ isAuthenticated: false, currentUser: null });
        } finally {
          set({ isLoading: false });
        }
      },
      setInitialized: (value: boolean) => set({ isInitialized: value }),
      setHasValidCredentials: (value: boolean) => set({ hasValidCredentials: value }),

      // MODIFIED: Added function implementation
      updateCurrentUserInfo: (updatedData) => {
        const { currentUser } = get();
        if (currentUser) {
          const updatedCometUser = new CometChat.User(currentUser.getUid());
          updatedCometUser.setName(updatedData.displayName);
          updatedCometUser.setAvatar(updatedData.profilePictureURL || '');
          updatedCometUser.setStatus(currentUser.getStatus());

          set({ currentUser: updatedCometUser });

          useUserStore.getState().updateCurrentUser({
            name: updatedData.displayName,
            avatar: updatedData.profilePictureURL,
            about: updatedData.aboutStatus,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        hasValidCredentials: state.hasValidCredentials,
        currentUser: state.currentUser,
      }),
    }
  )
);