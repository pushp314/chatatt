
import { NavigatorScreenParams, RouteProp } from '@react-navigation/native';
import { StackNavigationOptions } from '@react-navigation/stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { SCREEN_CONSTANTS } from '../utils/AppConstants';
import { SyncedCometChatUser } from '../services/userService';
import { ApiStatus, UserStatusGroup } from '../services/statusService'; // NEW: Import ApiStatus and UserStatusGroup

export interface MessageScreenUserParam {
  uid: string;
  name: string;
  avatar?: string;
  status?: string;
  blockedByMe?: boolean;
}

export interface MessageScreenGroupParam {
  guid: string;
  name: string;
  icon?: string;
  membersCount?: number;
  type?: string;
  hasJoined?: boolean;
  metadata?: any;
}



// --- Stack Param Lists ---
export type ChatStackParamList = {
  [SCREEN_CONSTANTS.CONVERSATION_LIST]: undefined;
  [SCREEN_CONSTANTS.MESSAGES]: {
    user?: MessageScreenUserParam;
    group?: MessageScreenGroupParam;
  };
  [SCREEN_CONSTANTS.CREATE_CONVERSATION]: undefined;
  [SCREEN_CONSTANTS.THREAD_VIEW]: {
    parentMessage: CometChat.BaseMessage;
    conversationWith: CometChat.User | CometChat.Group;
    conversationType: string;
  };
  [SCREEN_CONSTANTS.USER_INFO]: { user: MessageScreenUserParam };
  [SCREEN_CONSTANTS.GROUP_INFO]: { group: MessageScreenGroupParam };
  [SCREEN_CONSTANTS.CREATE_GROUP_SCREEN]: undefined;
  [SCREEN_CONSTANTS.ADD_MEMBERS_SCREEN]: { group: CometChat.Group };
  // SETTINGS and UPDATE_PROFILE are moved
  [SCREEN_CONSTANTS.FORWARD_SELECTION_SCREEN]: undefined;
  [SCREEN_CONSTANTS.BANNED_MEMBERS_SCREEN]: { group: CometChat.Group };
  [SCREEN_CONSTANTS.EDIT_GROUP_SCREEN]: { group: MessageScreenGroupParam };
  
  
  // --- ADDED ---
  TransferOwnershipScreen: { group: CometChat.Group }; 
  // --- END ADDED ---
  [SCREEN_CONSTANTS.FORWARD_SELECTION_SCREEN]: undefined;
};

export type StatusStackParamList = {
  [SCREEN_CONSTANTS.STATUS_LIST_SCREEN]: undefined;
  [SCREEN_CONSTANTS.CREATE_STATUS_SCREEN]: undefined;
  [SCREEN_CONSTANTS.VIEW_STATUS_SCREEN]: { // NEW: For viewing statuses
    initialIndex: number;
    userStatuses: UserStatusGroup[]; // Pass the whole feed structure
    currentUserId: string; // The ID of the user whose status is currently being viewed
    selectedUserIndex?: number; // NEW: Add selectedUserIndex as optional
  };
};

export type UserStackParamList = {
  [SCREEN_CONSTANTS.SYNCED_CONTACTS_SCREEN]: undefined;
  [SCREEN_CONSTANTS.MESSAGES]: { user: MessageScreenUserParam; group?: never };
  [SCREEN_CONSTANTS.USER_INFO]: { user: MessageScreenUserParam | SyncedCometChatUser };
  [SCREEN_CONSTANTS.USER_LIST]: undefined;
};

export type CallStackParamList = {
  [SCREEN_CONSTANTS.CALL_LOGS]: undefined;
  [SCREEN_CONSTANTS.CALL_DETAILS]: { call: CometChat.Call };
   [SCREEN_CONSTANTS.CALL_LOG_DETAIL]: {
    userId: string;
    userName: string;
  };

};

export type SettingsStackParamList = {
  [SCREEN_CONSTANTS.SETTINGS]: undefined;
  [SCREEN_CONSTANTS.UPDATE_PROFILE]: undefined;
  [SCREEN_CONSTANTS.BLOCKED_USERS_SCREEN]: undefined;
  [SCREEN_CONSTANTS.NOTIFICATION_SETTINGS_SCREEN]: undefined;
  [SCREEN_CONSTANTS.DATA_STORAGE_SETTINGS_SCREEN]: undefined;
  [SCREEN_CONSTANTS.PRIVACY_SETTINGS_SCREEN]: undefined; // NEW: Added Privacy Settings
}
// --- BottomTab Param List (Updated) ---
export type BottomTabParamList = {
  [SCREEN_CONSTANTS.CHATS]: NavigatorScreenParams<ChatStackParamList>;
  [SCREEN_CONSTANTS.STATUS]: NavigatorScreenParams<StatusStackParamList>;
  [SCREEN_CONSTANTS.CALLS]: NavigatorScreenParams<CallStackParamList>;
  [SCREEN_CONSTANTS.SETTINGS_TAB]: NavigatorScreenParams<SettingsStackParamList>;
};

// --- RootStack Param List (Updated) ---
export type RootStackParamList = {
  [SCREEN_CONSTANTS.APP_CRED]: undefined;
  [SCREEN_CONSTANTS.SAMPLER_USER]: undefined;
  // ADDED PROFILE_SETUP_SCREEN
  [SCREEN_CONSTANTS.PROFILE_SETUP_SCREEN]: {
    phoneNumber: string;
  };
  [SCREEN_CONSTANTS.BOTTOM_TAB_NAVIGATOR]: NavigatorScreenParams<BottomTabParamList>;
  [SCREEN_CONSTANTS.ONGOING_CALL_SCREEN]: {  sessionId: string; receiverName: string;  receiverAvatar?: string; initialStatus: 'ringing' | 'connected'; };
  [SCREEN_CONSTANTS.USER_STACK_NAVIGATOR]: NavigatorScreenParams<UserStackParamList>;
};

export type ChatScreenRouteProp = RouteProp<ChatStackParamList, typeof SCREEN_CONSTANTS.MESSAGES>;
export type UserInfoScreenRouteProp =
  | RouteProp<UserStackParamList, typeof SCREEN_CONSTANTS.USER_INFO>
  | RouteProp<ChatStackParamList, typeof SCREEN_CONSTANTS.USER_INFO>;

export type GenericScreenOptions = StackNavigationOptions;

