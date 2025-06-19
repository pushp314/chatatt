import { AppConstants } from '../utils/AppConstants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const api = axios.create({
  baseURL: AppConstants.baseUrl, // This MUST be correct
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(AppConstants.storage.authTokenKey); 
    if (token) {
      config.headers.Authorization = `${AppConstants.tokenType} ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; 
      console.log('Attempting to refresh token...');
      try {
        const refreshToken = await AsyncStorage.getItem(AppConstants.storage.refreshTokenKey);
        if (!refreshToken) {
          console.log('No refresh token found, cannot refresh session.');
          return Promise.reject(new Error('Session expired. No refresh token.'));
        }
        const refreshEndpoint = AppConstants.auth.refreshToken || '/auth/refresh-token';
        const response = await axios.post(`${AppConstants.baseUrl}${refreshEndpoint}`, {
          refreshToken,
        });
        const newAccessToken = response.data.accessToken; 
        if (!newAccessToken) {
            throw new Error('Refresh token request did not return a new access token.');
        }
        await AsyncStorage.setItem(AppConstants.storage.authTokenKey, newAccessToken);
        console.log('Token refreshed successfully.');
        originalRequest.headers.Authorization = `${AppConstants.tokenType} ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error('Error refreshing token:', refreshError.message);
        await AsyncStorage.multiRemove([
            AppConstants.storage.authTokenKey, 
            AppConstants.storage.refreshTokenKey, 
            AppConstants.storage.userKey, 
        ]);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;