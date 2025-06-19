// --- THIS IS THE CORRECTED PART ---
// We explicitly separate value imports from type imports to resolve the error.
import { Platform, PermissionsAndroid } from 'react-native';
import type { Permission, ImageSourcePropType } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
// --- END OF CORRECTION ---

// Local image assets for sampleData - ensure paths are correct from this file's location
// If helper.js is in 'src/utils/', and assets in 'src/assets/', then '../assets/...' is correct.
import Ironman from '../assets/icons/ironman.png';
import Captainamerica from '../assets/icons/captainamerica.png';
import Wolverine from '../assets/icons/wolverine.png';
import Spiderman from '../assets/icons/spiderman.png';
import Cyclops from '../assets/icons/cyclops.png';

import {
  NavigationContainerRef,
  ParamListBase,
  StackActions,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SCREEN_CONSTANTS } from './AppConstants'; // Import SCREEN_CONSTANTS



interface Translations {
  lastSeen: string;
  minutesAgo: (minutes: number) => string;
  hoursAgo: (hours: number) => string;
}

interface NotifeeData {
  receiverType?: 'user' | 'group';
  conversationId?: string;
  sender?: string;
  [key: string]: any;
}

export async function requestAndroidPermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const permissionsToRequest: Permission[] = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ];

    if (Platform.Version >= 33) {
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    // Note: The new requestStoragePermission function handles storage permissions separately
    // You might not need to request them here unless it's for a different purpose.
    if (Platform.Version < 29) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    }

    const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);

    if (Platform.Version >= 33) {
        if (granted[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Notification permission granted');
        } else {
            console.log('Notification permission denied');
        }
    }

  } catch (err) {
    console.warn('Android permissions error:', err);
  }
}

/**
 * Requests camera permission on Android.
 * Always returns true on iOS as permission is handled via Info.plist.
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  }
  // For iOS, permissions are handled in Info.plist, so we assume it's granted here.
  return true;
};

/**
 * --- THIS IS THE UPDATED FUNCTION ---
 * Requests permission to access the gallery (photos and videos).
 * Handles the complexity of new Android versions (API 33+).
 */
export const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS permissions are handled in Info.plist
    }
  
    const apiLevel = Platform.Version as number;
    let permissionsToRequest: Permission[] = [];
  
    if (apiLevel >= 33) {
      // For Android 13 and above, request granular media permissions
      permissionsToRequest = [
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      ];
    } else {
      // For Android 12 and below, request legacy storage permission
      permissionsToRequest = [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];
    }
  
    try {
      const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);
  
      // Check if all requested permissions were granted
      const allGranted = Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );
  
      if (allGranted) {
        console.log('Storage permissions granted');
        return true;
      } else {
        console.log('Some or all storage permissions denied');
        return false;
      }
    } catch (err) {
      console.warn('Requesting storage permission failed', err);
      return false;
    }
  };


export function getLastSeenTime(
  timestamp: number | null,
  translations: Translations = { // Default basic translations
    lastSeen: "Last seen",
    minutesAgo: (min) => `${min}m ago`,
    hoursAgo: (hr) => `${hr}h ago`,
  },
): string {
  if (timestamp === null || timestamp === 0) {
    return `${translations.lastSeen} Unknown`;
  }

  let tsInMillis = timestamp;
  if (String(timestamp).length === 10) {
    tsInMillis = timestamp * 1000;
  }

  const now = new Date();
  const lastSeenDate = new Date(tsInMillis);

  if (isNaN(lastSeenDate.getTime())) {
      return `${translations.lastSeen} Unknown`;
  }

  const diffInMillis = now.getTime() - lastSeenDate.getTime();
  const diffInMinutes = Math.floor(diffInMillis / (1000 * 60));
  const diffInHours = Math.floor(diffInMillis / (1000 * 60 * 60));

  if (diffInMinutes < 1) {
    return `${translations.lastSeen} just now`;
  }
  if (diffInMinutes < 60) {
    return `${translations.lastSeen} ${translations.minutesAgo(diffInMinutes)}`;
  }
  if (diffInHours < 24) {
    return `${translations.lastSeen} ${translations.hoursAgo(diffInHours)}`;
  }

  const isSameYear = lastSeenDate.getFullYear() === now.getFullYear();
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    ...(isSameYear ? {} : {year: 'numeric'}),
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  const formattedDate = lastSeenDate.toLocaleDateString(undefined, dateOptions);
  const formattedTime = lastSeenDate.toLocaleTimeString(undefined, timeOptions);

  if (formattedDate === 'Invalid Date' || formattedTime === 'Invalid Date') {
    return `${translations.lastSeen} Unknown`;
  }

  return `${translations.lastSeen} ${formattedDate} at ${formattedTime}`;
}

export const unblock = async (
  uid: string,
  setBlocked: React.Dispatch<React.SetStateAction<boolean>>,
  setUserObj?: React.Dispatch<React.SetStateAction<CometChat.User | null>>,
): Promise<void> => {
  try {
    await CometChat.unblockUsers([uid]);
    const unBlockedUser = await CometChat.getUser(uid);

    console.log('[Helper] ccUserUnBlocked:', { user: unBlockedUser });
    setBlocked(false);
    if (setUserObj && unBlockedUser) {
      setUserObj(unBlockedUser);
    }
  } catch (error) {
    console.error('Error unblocking user:', error);
  }
};

export const blockUser = async (
  uid: string,
  setBlocked: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<void> => {
  try {
    await CometChat.blockUsers([uid]);
    console.log('[Helper] ccUserBlocked:', { uid });
    setBlocked(true);
  } catch (error) {
    console.error('Error blocking user:', error);
  }
};

export const leaveGroup = async (
  group: CometChat.Group,
  navigation: StackNavigationProp<ParamListBase>,
  popCount: number,
): Promise<void> => {
  if (!group) {
    console.log('Group is not defined for leaveGroup');
    return;
  }

  const groupID = group.getGuid();
  try {
    await CometChat.leaveGroup(groupID);
    console.log(`Successfully left group: ${groupID}`);

    const loggedInUser = await CometChat.getLoggedinUser();
    const messageText = `${loggedInUser?.getName() || 'Someone'} has left`;

    // To send a custom notification, we create a CustomMessage.
    const customMessage = new CometChat.CustomMessage(
      groupID,
      CometChat.RECEIVER_TYPE.GROUP,
      CometChat.MESSAGE_TYPE.CUSTOM,
      { message: messageText }
    );

    // We set the category to 'action' to mimic an action message.
    customMessage.setCategory(CometChat.MessageCategory.ACTION);
    // You can also add metadata if needed for rendering differently
    customMessage.setMetadata({ "action": "left" });

    try {
      // Send the custom message to the group
      await CometChat.sendMessage(customMessage);
      console.log('Leave group custom message sent successfully.');
    } catch (sendMessageError) {
      console.log('Failed to send leave group custom message:', sendMessageError);
    }

    console.log('[Helper] ccGroupLeft:', {
      messageText,
      leftUser: loggedInUser,
      leftGroup: group,
    });

    navigation.pop(popCount);
  } catch (error) {
    console.log('Group leaving failed with error:', error);
    // re-throw the error so the UI can handle it
    throw error;
  }
};

export async function navigateToConversation(
  navigationServiceRef: React.RefObject<NavigationContainerRef<ParamListBase>>,
  data?: NotifeeData,
): Promise<void> {
  if (!data || !navigationServiceRef.current) {
    console.log('navigateToConversation: Navigation data or ref missing.', {data, hasRef: !!navigationServiceRef.current});
    return;
  }

  try {
    const routeName = SCREEN_CONSTANTS.MESSAGES;
    let routeParams: object | undefined = undefined;

    if (data.receiverType === 'group' && data.conversationId) {
      const group = await CometChat.getGroup(data.conversationId);
      routeParams = {group};
    } else if (data.receiverType === 'user' && data.sender) {
      const user = await CometChat.getUser(data.sender);
      routeParams = {user};
    } else {
      console.log('navigateToConversation: Invalid data for navigation.', data);
      return;
    }

    if (routeParams) {
      navigationServiceRef.current.dispatch(
        StackActions.push(routeName, routeParams),
      );
    }
  } catch (error) {
    console.log('Error in navigateToConversation:', error);
  }
}