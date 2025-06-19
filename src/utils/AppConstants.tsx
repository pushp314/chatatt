// src/utils/AppConstants.tsx

import {
  API_BASE_URL,
  COMETCHAT_APP_ID,
  COMETCHAT_AUTH_KEY,
  COMETCHAT_REGION,
} from '@env';

export const AppConstants = {
  appId: COMETCHAT_APP_ID,
  authKey: COMETCHAT_AUTH_KEY,
  region: COMETCHAT_REGION,
  baseUrl: API_BASE_URL,
  subscriptionType: 'ALL_USERS',
  auth: {
    requestOtp: '/auth/request-otp',
    verifyOtpAndRegister: '/auth/verify-otp-register',
    loginWithOtp: '/auth/login-with-otp', // ADDED
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
  },
  contacts: {
    sync: '/users/sync-contacts',
    search: '/users/search',
  },
  storage: {
    userKey: 'user-data-storage',
    authTokenKey: 'auth-token',
    refreshTokenKey: 'refresh-token',
    appCredentialsKey: 'app-credentials-storage',
  },
  tokenType: 'Bearer',
  tokenExpiryBuffer: 300,
} as const;

export const SCREEN_CONSTANTS = {
  // Core Structure
  APP_CRED: 'AppCredentials',
  SAMPLER_USER: 'SampleUser',
  PROFILE_SETUP_SCREEN: 'ProfileSetupScreen', // ADDED
  BOTTOM_TAB_NAVIGATOR: 'BottomTabNavigator',
  ROOT_STACK_NAVIGATOR: 'RootStackNavigator',

  // Tabs (Updated)
  CHATS: 'Chats',
  STATUS: 'Status',
  CALLS: 'Calls',
  SETTINGS_TAB: 'Settings',

  // Screens within Stacks
  CONVERSATION_LIST: 'ConversationListScreen',
  MESSAGES: 'MessageScreen',
  CREATE_CONVERSATION: 'CreateConversationScreen',
  THREAD_VIEW: 'ThreadViewScreen',
  CREATE_GROUP_SCREEN: 'CreateGroupScreen',

  USER_LIST: 'UserListScreen',
  SYNCED_CONTACTS_SCREEN: 'SyncedContactsScreen',
  USER_INFO: 'UserInfoScreen',
  UPDATE_PROFILE: 'UpdateProfileScreen',
  USER_STACK_NAVIGATOR: 'UserStackNavigatorScreen',

  GROUP_LIST: 'GroupListScreen',
  GROUP_INFO: 'GroupInfoScreen',

  CALL_LOG_DETAIL:'CallLogDetailScreen',
  CALL_LOGS: 'CallLogScreen',
  CALL_DETAILS: 'CallDetailsScreen',
  ONGOING_CALL_SCREEN: 'OngoingCallScreen',
  ADD_MEMBERS_SCREEN: 'AddMembersScreen',
  SETTINGS: 'SettingsScreen',
  STATUS_LIST_SCREEN: 'StatusListScreen',
  CREATE_STATUS_SCREEN: 'CreateStatusScreen',
  VIEW_STATUS_SCREEN: 'ViewStatusScreen',
  BLOCKED_USERS_SCREEN: 'BlockedUsersScreen',
  FORWARD_SELECTION_SCREEN: 'ForwardSelectionScreen',
  NOTIFICATION_SETTINGS_SCREEN: 'NotificationSettingsScreen',
  PRIVACY_SETTINGS_SCREEN: 'PrivacySettingScreen',
  DATA_STORAGE_SETTINGS_SCREEN: 'DataStorageSettingsScreen',
  BANNED_MEMBERS_SCREEN: 'BannedMembersScreen',
  EDIT_GROUP_SCREEN: 'EditGroupScreen'
} as const;

export type ScreenConstantValues = typeof SCREEN_CONSTANTS[keyof typeof SCREEN_CONSTANTS];