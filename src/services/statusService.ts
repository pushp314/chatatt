import api from './api';
import { Platform } from 'react-native';
import axios from 'axios';

interface MediaFile {
  uri: string;
  type: string;
  name: string;
}

// NEW: Interface for privacy settings
interface PrivacySettings {
  visibility: 'public' | 'my_contacts' | 'private';
  excludedContacts?: string[];
  includedContacts?: string[];
}

// NEW: Interface for a status object from the API feed
export interface ApiStatus {
    _id: string;
    userId: string;
    userDisplayName: string;
    userProfilePictureURL?: string;
    type: 'text' | 'image' | 'video' | 'gif'; // Added 'gif'
    content?: string;
    mediaURL?: string;
    thumbnailURL?: string;
    backgroundColor?: string;
    fontStyle?: string;
    expiresAt: string;
    privacySettings: PrivacySettings;
    viewedBy: string[]; // List of user IDs who viewed it
    createdAt: string;
    updatedAt: string;
    viewedByMe?: boolean; // Only present in feed for convenience
}

// NEW: Interface for a user's status group in the feed response
export interface UserStatusGroup {
    user: {
        _id: string;
        displayName: string;
        profilePictureURL?: string;
    };
    statuses: ApiStatus[];
}


export const createStatus = async (
  type: 'text' | 'image' | 'video' | 'gif', // Added 'gif'
  content?: string, // Optional for media, required for text
  file?: MediaFile,
  privacySettings?: PrivacySettings, // NEW: Added privacySettings
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('type', type);

    if (content) {
      formData.append('content', content); // Content is now optional for media, serves as caption
    }

    if (file?.uri) {
      formData.append('statusMediaFile', { uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''), type: file.type, name: file.name, } as any);
    }

    // Append privacy settings
    if (privacySettings) {
        formData.append('privacySettings[visibility]', privacySettings.visibility);
        if (privacySettings.excludedContacts && privacySettings.excludedContacts.length > 0) {
            privacySettings.excludedContacts.forEach((contactId, index) => {
                formData.append(`privacySettings[excludedContacts][${index}]`, contactId);
            });
        }
        // If you need includedContacts, add similar logic
    }
    
    const headers = {
        'Content-Type': file?.uri ? 'multipart/form-data' : 'application/json', // Set Content-Type dynamically
    };

    const payload = file?.uri ? formData : { type: type, content: content, privacySettings: privacySettings };

    const response = await api.post('/statuses', payload, { headers: headers });
    return response.data;
  } catch (error) {
    console.error("Error creating status:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Server Response:", error.response.data);
    }
    throw error;
  }
};


/**
 * Fetches all active statuses posted by the authenticated user.
 */
export const getMyStatuses = async (): Promise<ApiStatus[]> => { // Changed return type
    try {
        const response = await api.get('/statuses/my');
        if (response.data && response.data.success) {
            return response.data.data; // Assuming the data is an array of status objects
        }
        return [];
    } catch (error) {
        console.error("Error fetching my statuses:", error);
        if (axios.isAxiosError(error) && error.response) {
            console.error("Server Response:", error.response.data);
        }
        return []; // Return empty array on error
    }
}

// NEW: Function to mark a status as viewed
export const viewStatus = async (statusId: string): Promise<any> => {
    try {
        const response = await api.post(`/statuses/${statusId}/view`);
        return response.data;
    } catch (error) {
        console.error(`Error marking status ${statusId} as viewed:`, error);
        if (axios.isAxiosError(error) && error.response) {
            console.error("Server Response:", error.response.data);
        }
        throw error;
    }
}

// NEW: Function to delete a status
export const deleteStatus = async (statusId: string): Promise<any> => {
    try {
        const response = await api.delete(`/statuses/${statusId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting status ${statusId}:`, error);
        if (axios.isAxiosError(error) && error.response) {
            console.error("Server Response:", error.response.data);
        }
        throw error;
    }
}

// NEW: Function to get the status feed from contacts
export const getStatusFeed = async (): Promise<UserStatusGroup[]> => { // Changed return type
    try {
        const response = await api.get('/statuses/feed');
        if (response.data && response.data.success) {
            return response.data.data; // Assuming it returns an array of UserStatusGroup
        }
        return [];
    } catch (error) {
        console.error("Error fetching status feed:", error);
        if (axios.isAxiosError(error) && error.response) {
            console.error("Server Response:", error.response.data);
        }
        return []; // Return empty array on error
    }
}