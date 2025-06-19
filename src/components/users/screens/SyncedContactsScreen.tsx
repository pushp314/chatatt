import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Contacts from 'react-native-contacts';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Avatar, ListItem, Icon, Button } from '@rneui/themed';
import { useColorScheme } from 'react-native';

import { userService, SyncedCometChatUser } from '../../../services/userService'; // Adjust path
import {
  CustomColors,
  customThemeColorsDark,
  customThemeColorsLight,
  customTypography,
} from '../../../theme/theme'; // Adjust path
import { UserStackParamList, MessageScreenUserParam } from '../../../navigation/types'; // Adjust path
import { SCREEN_CONSTANTS, AppConstants } from '../../../utils/AppConstants'; // Adjust path, import AppConstants
import { useAuthStore } from '../../../store/authStore'; // For loggedInUser details if needed

type SyncedContactsNavigationProp = StackNavigationProp<
  UserStackParamList,
  typeof SCREEN_CONSTANTS.SYNCED_CONTACTS_SCREEN
>;

// Phone Number Normalization Helper
const normalizePhoneNumber = (phoneNumber: string, defaultCountryCodePrefix: string = '91'): string | null => {
  if (!phoneNumber) return null;
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    const numberPart = cleaned.substring(1).replace(/\D/g, '');
    if (numberPart.length >= 7) {
      return `+${numberPart}`;
    }
    return null;
  }
  
  cleaned = cleaned.replace(/\D/g, '');

  if (defaultCountryCodePrefix === '91') {
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return `+91${cleaned.substring(1)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
  } else {
    if (cleaned.length >= 7 && cleaned.length <= 15) {
      return `+${defaultCountryCodePrefix}${cleaned}`;
    }
  }
  return null;
};


const SyncedContactsScreen: React.FC = () => {
  const navigation = useNavigation<SyncedContactsNavigationProp>();
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const [syncedUsers, setSyncedUsers] = useState<SyncedCometChatUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { currentUser: loggedInCometChatUser } = useAuthStore();

  const requestContactsPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts to find friends.',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionGranted(true);
          return true;
        } else {
          Alert.alert('Permission Denied', 'Cannot sync contacts without permission.');
          setPermissionGranted(false);
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else if (Platform.OS === 'ios') {
      const authStatus = await Contacts.checkPermission();
      if (authStatus === 'authorized') {
        setPermissionGranted(true);
        return true;
      }
      if (authStatus === 'denied') {
        Alert.alert('Permission Denied', 'Contacts permission is denied. Please enable it in Settings.');
        setPermissionGranted(false);
        return false;
      }
      if (authStatus === 'undefined') {
        const requestedStatus = await Contacts.requestPermission();
        if (requestedStatus === 'authorized') {
          setPermissionGranted(true);
          return true;
        } else {
          Alert.alert('Permission Denied', 'Contacts permission was not granted.');
          setPermissionGranted(false);
          return false;
        }
      }
    }
    return false;
  }, []);

  const fetchAndSyncContacts = useCallback(async () => {
    if (!permissionGranted) {
      const granted = await requestContactsPermission();
      if (!granted) {
        setIsLoading(false);
        setIsSyncing(false);
        return;
      }
    }

    setIsLoading(true);
    setIsSyncing(true);
    
    try {
      const deviceContacts = await Contacts.getAll();
      const phoneNumbersToSync: string[] = [];
      const seenNormalizedNumbers = new Set<string>();

      // FIXED: Provide a fallback empty string for baseUrl to prevent the 'possibly 'undefined'' error.
      const baseUrl = AppConstants.baseUrl || '';
      const defaultCountryCodeForNormalization = baseUrl.includes('ap-south-1') ? '91' : '1';

      deviceContacts.forEach(contact => {
        contact.phoneNumbers.forEach(phone => {
          if (phone.number) {
            const normalized = normalizePhoneNumber(phone.number, defaultCountryCodeForNormalization);
            if (normalized && !seenNormalizedNumbers.has(normalized)) {
              phoneNumbersToSync.push(normalized);
              seenNormalizedNumbers.add(normalized);
            }
          }
        });
      });

      if (phoneNumbersToSync.length === 0) {
        Alert.alert('No Valid Contacts', 'No phone numbers suitable for syncing were found in your contacts.');
        setSyncedUsers([]);
        return;
      }

      console.log(`[SYNC_CONTACTS] Attempting to sync ${phoneNumbersToSync.length} unique numbers.`);
      const response = await userService.syncDeviceContacts(phoneNumbersToSync);

      if (response.success && response.data) {
        const filteredUsers = response.data.filter(user => user._id !== loggedInCometChatUser?.getUid());
        setSyncedUsers(filteredUsers);
        if(filteredUsers.length === 0){
           Alert.alert('No Matches', 'None of your contacts are on the app yet.');
        }
      } else {
        Alert.alert('Sync Failed', response.message || 'Could not sync contacts with the server.');
      }
    } catch (error: any) {
      console.error(`[SYNC_CONTACTS] Error syncing contacts:`, error);
      const errorMessage = error.message || 'An unexpected error occurred.';
      Alert.alert('Sync Error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [permissionGranted, requestContactsPermission, loggedInCometChatUser]);

  useEffect(() => {
    const checkAndFetchOnMount = async () => {
      setIsLoading(true);
      const hasPermission = await requestContactsPermission();
      if (hasPermission) {
        await fetchAndSyncContacts();
      }
      setIsLoading(false);
    };
    checkAndFetchOnMount();
  }, [requestContactsPermission]); // Note: fetchAndSyncContacts was removed from deps to prevent re-triggering, requestContactsPermission is stable.

  const navigateToMessages = (contactUser: SyncedCometChatUser) => {
    const userParam: MessageScreenUserParam = {
      uid: contactUser._id,
      name: contactUser.displayName,
      avatar: contactUser.profilePictureURL,
      status: contactUser.status || 'offline',
      blockedByMe: contactUser.blockedByMe || false,
    };
    navigation.navigate(SCREEN_CONSTANTS.MESSAGES, { user: userParam });
  };

  const renderUserItem = ({ item }: { item: SyncedCometChatUser }) => (
    <ListItem
      bottomDivider
      containerStyle={{ backgroundColor: theme.background1 }}
      onPress={() => navigateToMessages(item)}
    >
      <Avatar
        rounded
        source={item.profilePictureURL ? { uri: item.profilePictureURL } : undefined}
        icon={!item.profilePictureURL ? { name: 'person', type: 'material', color: theme.staticWhite } : undefined}
        avatarStyle={!item.profilePictureURL ? { backgroundColor: theme.primaryLight } : {}}
        size="medium"
      />
      <ListItem.Content>
        <ListItem.Title style={[{ color: theme.textPrimary }, customTypography.body.medium]}>
          {item.displayName}
        </ListItem.Title>
        <ListItem.Subtitle style={[{ color: theme.textSecondary }, customTypography.caption1.regular]}>
          {item.phoneNumber}
        </ListItem.Subtitle>
      </ListItem.Content>
      <ListItem.Chevron color={theme.iconFaint} />
    </ListItem>
  );

  const ListEmpty = () => {
    if (isLoading) {
       return (
         <View style={styles.centeredMessage}>
           <ActivityIndicator size="large" color={theme.primary} />
           <Text style={[styles.statusText, { color: theme.textSecondary }]}>Loading contacts...</Text>
         </View>
       );
    }
    if (!permissionGranted) {
      return (
        <View style={styles.centeredMessage}>
          <Icon name="contacts" type="material-community" size={50} color={theme.textTertiary} />
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            Contact permission is required to find your friends.
          </Text>
          <Button
            title="Grant Permission"
            onPress={async () => {
              const granted = await requestContactsPermission();
              if (granted) fetchAndSyncContacts();
            }}
            buttonStyle={{ backgroundColor: theme.primary, marginTop: 15 }}
            titleStyle={{color: theme.staticWhite}}
          />
        </View>
      );
    }
    if (syncedUsers.length === 0) {
      return (
        <View style={styles.centeredMessage}>
          <Icon name="account-search-outline" type="material-community" size={50} color={theme.textTertiary} />
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            No contacts found on the app. Pull down to sync again.
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background2 }]}>
      <FlatList
        data={syncedUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item._id.toString()}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={syncedUsers.length === 0 ? styles.emptyContentContainer : {paddingBottom: 80}}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={fetchAndSyncContacts}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      />
      {permissionGranted && (
        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: theme.primary }]}
          onPress={fetchAndSyncContacts}
          disabled={isSyncing || isLoading}
        >
          {isSyncing ? (
            <ActivityIndicator color={theme.staticWhite} />
          ) : (
            <Icon name="sync" type="material-community" color={theme.staticWhite} size={26} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusText: {
    marginTop: 15,
    textAlign: 'center',
    ...customTypography.body.regular,
  },
  emptyContentContainer: {
     flexGrow: 1,
     justifyContent: 'center',
     alignItems: 'center',
  },
  syncButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default SyncedContactsScreen;