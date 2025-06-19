import { AppConstants } from '../utils/AppConstants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import api from './api';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import { Asset } from 'react-native-image-picker';
import { User, useUserStore } from '../store/userStore';

// --- INTERFACES ---

interface ProfileData {
  name: string;
  profilePictureUrl: string; // URL for default avatar if no image is uploaded
  about: string;
}

interface BackendUser extends User {
  _id: string;
  displayName: string;
}

interface AuthResponseData {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
  cometChatAuthToken?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

const PHONE_COUNTRY_CODE = '+91';

// --- PRIVATE HELPER FUNCTION ---

const _finalizeLogin = async (
  backendUser: BackendUser,
  accessToken: string,
  refreshToken: string,
  cometChatAuthToken?: string
) => {
  await AsyncStorage.multiSet([
    [AppConstants.storage.authTokenKey, accessToken],
    [AppConstants.storage.refreshTokenKey, refreshToken],
    [AppConstants.storage.userKey, JSON.stringify(backendUser)],
  ]);

  if (!cometChatAuthToken) {
    throw new Error('CometChat auth token is missing. Cannot log in.');
  }
  await CometChat.login(cometChatAuthToken);
  console.log('CometChat login successful.');

  const loggedInCometChatUser = await CometChat.getLoggedinUser();
  if (!loggedInCometChatUser) {
    throw new Error('Failed to get CometChat user object after login.');
  }

  useAuthStore.getState().login(loggedInCometChatUser, backendUser);
  useUserStore.getState().setCurrentUser(backendUser);
};

// --- EXPORTED AUTH SERVICE ---

export const authService = {
  getFullPhoneNumber: (tenDigitNumber: string) =>
    `${PHONE_COUNTRY_CODE}${tenDigitNumber.trim()}`,

  requestOtp: async (phoneNumber: string) => {
    const response = await api.post<ApiResponse<{ developmentOtp: string }>>(
      AppConstants.auth.requestOtp,
      { phoneNumber }
    );
    return response.data;
  },

  loginWithOtp: async (phoneNumber: string, otp: string) => {
    try {
      const response = await api.post<ApiResponse<AuthResponseData>>(
        AppConstants.auth.loginWithOtp,
        { phoneNumber, otp }
      );

      if (response.data.success && response.data.data) {
        const { user, accessToken, refreshToken, cometChatAuthToken } = response.data.data;
        await _finalizeLogin(user, accessToken, refreshToken, cometChatAuthToken);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const apiError = new Error(error.response.data.message || 'API Error') as any;
        apiError.status = error.response.status;
        throw apiError;
      }
      throw error;
    }
  },

  verifyOtpAndRegister: async (
    phoneNumber: string,
    otp: string,
    profile: ProfileData,
    image?: Asset
  ) => {
    const formData = new FormData();
    formData.append('phoneNumber', phoneNumber);
    formData.append('otp', otp);

    // FINAL FIX: Send profile fields individually using bracket notation
    // to match the format the backend developer provided.
    formData.append('profile[name]', profile.name);
    formData.append('profile[about]', profile.about);
    
    // If an image is selected, upload it.
    if (image && image.uri && image.type && image.fileName) {
      formData.append('profilePictureFile', {
        uri: image.uri,
        type: image.type,
        name: image.fileName,
      } as any);
    } 
    // If no image is selected, send the default URL you generated.
    else {
      formData.append('profile[profilePictureUrl]', profile.profilePictureUrl);
    }

    const response = await api.post<ApiResponse<AuthResponseData>>(
      AppConstants.auth.verifyOtpAndRegister,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    if (response.data.success && response.data.data) {
      const { user, accessToken, refreshToken, cometChatAuthToken } = response.data.data;
      await _finalizeLogin(user, accessToken, refreshToken, cometChatAuthToken);
      return response.data;
    } else {
      throw new Error(response.data.message || 'Registration failed.');
    }
  },

  logout: async () => {
    try {
      await CometChat.logout();
      console.log('CometChat logout successful');
    } catch (cometError) {
      console.error('CometChat logout error:', cometError);
    }

    const keysToRemove = [
      AppConstants.storage.authTokenKey,
      AppConstants.storage.refreshTokenKey,
      AppConstants.storage.userKey,
      'auth-storage',
      'chat-storage',
      'user-storage',
    ];
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('AsyncStorage cleared for keys:', keysToRemove.join(', '));
  },
};