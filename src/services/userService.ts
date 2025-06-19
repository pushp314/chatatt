import api from './api';
import { AppConstants } from '../utils/AppConstants';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import axios from 'axios';
import { Asset } from 'react-native-image-picker';

// --- INTERFACES ---

export interface UserProfile {
  _id: string;
  phoneNumber: string;
  displayName: string;
  profilePictureURL: string | null;
  aboutStatus: string;
  status: string;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
  privacySettings: any;
  notificationSettings: any;
  chatSettings: any;
}

export interface SyncedCometChatUser {
  _id: string;
  phoneNumber: string;
  displayName: string;
  profilePictureURL?: string;
  status?: string;
  blockedByMe?: boolean;
}

export interface NotificationSettings {
  callTone: string;
  conversationTonesEnabled: boolean;
  groupTone: string;
  messageTone: string;
  osNotificationChannelsConfig: {
    new_messages: boolean;
    calls: boolean;
  };
  vibrationPattern: string;
}

export interface NotificationSettingsResponse {
  success: boolean;
  data?: NotificationSettings;
  message: string;
  statusCode: number;
}

export interface PrivacySettings {
  aboutVisibility: 'public' | 'my_contacts' | 'nobody';
  groupAddPermissions: 'everyone' | 'my_contacts';
  lastSeenAndOnline: 'everyone' | 'my_contacts' | 'nobody';
  profilePhotoVisibility: 'everyone' | 'my_contacts' | 'nobody';
  readReceiptsEnabled: boolean;
  securityNotificationsEnabled: boolean;
}

export interface PrivacySettingsResponse {
  success: boolean;
  data?: PrivacySettings;
  message: string;
  statusCode: number;
}

export interface MediaAutoDownloadSettings {
  audio_mobile: boolean;
  audio_roaming: boolean;
  audio_wifi: boolean;
  documents_mobile: boolean;
  documents_roaming: boolean;
  documents_wifi: boolean;
  images_mobile: boolean;
  images_roaming: boolean;
  images_wifi: boolean;
  videos_mobile: boolean;
  videos_roaming: boolean;
  videos_wifi: boolean;
}

export interface DataStorageSettingsResponse {
  success: boolean;
  data?: {
    mediaAutoDownload: MediaAutoDownloadSettings;
  };
  message: string;
  statusCode: number;
}

interface BackendUser {
  _id: string;
  displayName: string;
  profilePictureURL?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
}

interface SyncContactsResponseData {
  success: boolean;
  data?: SyncedCometChatUser[];
  message: string;
}

interface FileUploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    filename: string;
    size: number;
    mimetype: string;
  };
}

// --- USER SERVICE ---

export const userService = {
  /**
   * FIXED: Updates profile with image using multipart/form-data
   * Uses correct field name 'profilePictureFile' to match backend multer middleware
   */
  updateProfileWithImage: async (profileData: {
    displayName?: string;
    aboutStatus?: string;
  }, imageAsset: Asset): Promise<UserProfile> => {
    if (!imageAsset.uri || !imageAsset.type || !imageAsset.fileName) {
      throw new Error('Invalid image asset provided for upload.');
    }

    try {
      const formData = new FormData();
      
      // Add profile data to FormData
      if (profileData.displayName) {
        formData.append('displayName', profileData.displayName);
      }
      if (profileData.aboutStatus) {
        formData.append('aboutStatus', profileData.aboutStatus);
      }
      
      // FIXED: Use 'profilePictureFile' to match your backend multer middleware
      formData.append('profilePictureFile', {
        uri: imageAsset.uri,
        type: imageAsset.type,
        name: imageAsset.fileName,
      } as any);

      const response = await api.put<ApiResponse<UserProfile>>('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update profile with image');
    } catch (error) {
      console.error('Error updating profile with image:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'An error occurred during profile update with image.');
      }
      throw error;
    }
  },

  /**
   * Updates profile data only (no image) using JSON
   */
  updateMyProfile: async (profileData: {
    displayName?: string;
    aboutStatus?: string;
    profilePictureUrl?: string | null;
  }): Promise<UserProfile> => {
    try {
      const response = await api.put<ApiResponse<UserProfile>>('/users/me', profileData, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update profile');
    } catch (error) {
      console.error('Error updating my profile:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data || error;
      }
      throw error;
    }
  },

  /**
   * Gets current user profile
   */
  getMyProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get<ApiResponse<UserProfile>>('/users/me');
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch user profile');
    } catch (error) {
      console.error('Error fetching my profile:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data || error;
      }
      throw error;
    }
  },

  /**
   * Removes current user's profile picture
   */
  removeMyProfilePicture: async (): Promise<{ message: string; profilePictureURL: null }> => {
    try {
      const response = await api.delete<ApiResponse<{ message: string; profilePictureURL: null }>>('/users/me/profile-picture');
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to remove profile picture');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data || error;
      }
      throw error;
    }
  },

  /**
   * Syncs device contacts with server
   */
  syncDeviceContacts: async (
    phoneNumbers: string[],
  ): Promise<SyncContactsResponseData> => {
    try {
      const response = await api.post<SyncContactsResponseData>(
        AppConstants.contacts.sync,
        { phoneNumbers },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data || error;
      }
      throw error;
    }
  },

  /**
   * Gets all users from CometChat
   */
  getUsers: async (): Promise<CometChat.User[]> => {
    const usersRequest = new CometChat.UsersRequestBuilder()
      .setLimit(100)
      .build();
    return usersRequest.fetchNext();
  },

  /**
   * Gets blocked users
   */
  getBlockedUsers: async (): Promise<CometChat.User[]> => {
    try {
      const response = await api.get('/users/me/blocked');
      if (response.data && response.data.success) {
        return response.data.data.map((userData: any) => {
          const user = new CometChat.User(userData._id);
          user.setName(userData.displayName || `User ${userData._id.slice(-4)}`);
          user.setAvatar(userData.profilePictureURL);
          user.setStatus(userData.status || 'offline');
          return user;
        });
      }
      return [];
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      return [];
    }
  },

  /**
   * Unblocks a user
   */
  unblockUserAPI: async (userIdToUnblock: string): Promise<any> => {
    try {
      const response = await api.post('/users/me/unblock', { targetUserId: userIdToUnblock });
      return response.data;
    } catch (error) {
      console.error('Error calling unblock API:', error);
      throw error;
    }
  },
  
  /**
   * Gets notification settings
   */
  getNotificationSettings: async (): Promise<ApiResponse<NotificationSettings>> => {
    try {
      const response = await api.get<ApiResponse<NotificationSettings>>('/users/me/settings/notifications');
      return response.data;
    } catch (error) {
      console.error('API Error fetching notification settings:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data || error;
      }
      throw error;
    }
  },

  /**
   * Updates notification settings
   */
  updateNotificationSettings: async (settings: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> => {
    try {
      const response = await api.put<ApiResponse<NotificationSettings>>('/users/me/settings/notifications', settings);
      return response.data;
    } catch (error) {
      console.error('API Error updating notification settings:', error);
      if (axios.isAxiosError(error) && error.response) { throw error.response.data; }
      throw error;
    }
  },

  /**
   * Deletes the current user's profile picture from the server
   */
  deleteProfilePicture: async (): Promise<ApiResponse<BackendUser>> => {
    try {
      console.log("Attempting to delete profile picture...");
      const response = await api.delete<ApiResponse<BackendUser>>(
        '/users/me/profile-picture'
      );
      
      if (response.data.success) {
        console.log("Profile picture deleted successfully.");
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete profile picture.');
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data || error;
      }
      throw error;
    }
  },

  /**
   * Gets privacy settings
   */
  getPrivacySettings: async (): Promise<PrivacySettingsResponse> => {
    try {
      const response = await api.get<PrivacySettingsResponse>('/users/me/settings/privacy');
      return response.data;
    } catch (error) {
      console.error('API Error fetching privacy settings:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data || error;
      }
      throw error;
    }
  },

  /**
   * Updates privacy settings
   */
  updatePrivacySettings: async (settings: PrivacySettings): Promise<PrivacySettingsResponse> => {
    try {
      const response = await api.put<PrivacySettingsResponse>('/users/me/settings/privacy', settings);
      return response.data;
    } catch (error) {
      console.error('API Error updating privacy settings:', error);
      if (axios.isAxiosError(error) && error.response) { throw error.response.data; }
      throw error;
    }
  },

  /**
   * Gets data storage settings
   */
  getDataStorageSettings: async (): Promise<DataStorageSettingsResponse> => {
    try {
      const response = await api.get<DataStorageSettingsResponse>('/users/me/settings/data-storage');
      return response.data;
    } catch (error) {
      console.error('API Error fetching data storage settings:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data || error;
      }
      throw error;
    }
  },

  /**
   * Updates data storage settings
   */
  updateDataStorageSettings: async (settings: { mediaAutoDownload: MediaAutoDownloadSettings }): Promise<DataStorageSettingsResponse> => {
    try {
      const response = await api.put<DataStorageSettingsResponse>('/users/me/settings/data-storage', settings);
      return response.data;
    } catch (error) {
      console.error('API Error updating data storage settings:', error);
      if (axios.isAxiosError(error) && error.response) { throw error.response.data; }
      throw error;
    }
  },
};