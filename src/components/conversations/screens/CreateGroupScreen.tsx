// src/components/conversations/screens/CreateGroupScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useColorScheme,
  PermissionsAndroid,
  Platform,
  Linking, // <-- YEH NAYA IMPORT HAI
} from 'react-native';
import { Avatar, ListItem, Button } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Contacts from 'react-native-contacts';

import { customThemeColorsLight, customThemeColorsDark, customTypography } from '../../../theme/theme';
import { userService } from '../../../services/userService';
import { useAuthStore } from '../../../store/authStore';
import { ChatStackParamList, MessageScreenGroupParam } from '../../../navigation/types';
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants';

type CreateGroupNavigationProp = StackNavigationProp<ChatStackParamList, 'CreateGroupScreen'>;

// Phone Number Normalization Helper
const normalizePhoneNumber = (phoneNumber: string, defaultCountryCodePrefix: string = '91'): string | null => {
  if (!phoneNumber) return null;
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    const numberPart = cleaned.substring(1).replace(/\D/g, '');
    return numberPart.length > 7 ? `+${numberPart}` : null;
  }
  cleaned = cleaned.replace(/\D/g, '');
  if (defaultCountryCodePrefix === '91') {
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 11 && cleaned.startsWith('0')) return `+91${cleaned.substring(1)}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  }
  return null;
};

const CreateGroupScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
  const navigation = useNavigation<CreateGroupNavigationProp>();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [syncedUsers, setSyncedUsers] = useState<CometChat.User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const { currentUser } = useAuthStore();

  const fetchSyncedContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const deviceContacts = await Contacts.getAll();
      const phoneNumbersToSync: string[] = [];
      const seenNumbers = new Set<string>();

      deviceContacts.forEach(contact => {
        contact.phoneNumbers.forEach(phone => {
          if (phone.number) {
            const normalized = normalizePhoneNumber(phone.number);
            if (normalized && !seenNumbers.has(normalized)) {
              phoneNumbersToSync.push(normalized);
              seenNumbers.add(normalized);
            }
          }
        });
      });

      if (phoneNumbersToSync.length === 0) {
        setSyncedUsers([]);
        return;
      }
      
      const response = await userService.syncDeviceContacts(phoneNumbersToSync);
      if (response.success && response.data) {
        const otherUsers = response.data.filter(user => user._id !== currentUser?.getUid());
        const cometChatUsers = otherUsers.map(syncedUser => {
            const user = new CometChat.User(syncedUser._id);
            user.setName(syncedUser.displayName);
            user.setAvatar(syncedUser.profilePictureURL ?? '');
            return user;
        });
        setSyncedUsers(cometChatUsers);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sync contacts.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const requestPermissionAndFetch = async () => {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          await fetchSyncedContacts();
        } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            "Permission Required",
            "To find friends, app needs to access your contacts. Please go to settings and grant permission.",
            [
              { text: "Cancel", style: 'cancel' },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          setIsLoading(false);
        } else {
           Alert.alert("Permission Denied", "Cannot show contacts without permission.");
           setIsLoading(false);
        }
      } else { // For iOS
        await fetchSyncedContacts();
      }
    };
    requestPermissionAndFetch();
  }, [fetchSyncedContacts]);

  const toggleUserSelection = (uid: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(uid)) newSelection.delete(uid);
    else newSelection.add(uid);
    setSelectedUsers(newSelection);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Validation', 'Group name is required.');
      return;
    }
    if (selectedUsers.size === 0) {
      Alert.alert('Validation', 'Select at least one member.');
      return;
    }
    

    setIsCreating(true);
    const guid = `group_${new Date().getTime()}`;
    const group = new CometChat.Group(guid, groupName.trim(), CometChat.GROUP_TYPE.PUBLIC,description,);
    const members = Array.from(selectedUsers).map(uid => new CometChat.GroupMember(uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT));
    
    try {
      const createdGroup = await CometChat.createGroup(group);
      await CometChat.addMembersToGroup(createdGroup.getGuid(), members, []);
      
      Alert.alert('Success', 'Group created successfully!');
      const groupParam: MessageScreenGroupParam = { guid: createdGroup.getGuid(), name: createdGroup.getName(), icon: createdGroup.getIcon(), type: createdGroup.getType() };
      navigation.replace(SCREEN_CONSTANTS.MESSAGES, { group: groupParam });

    } catch (error) {
      Alert.alert('Error', 'Failed to create group.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderUserItem = ({ item }: { item: CometChat.User }) => {
    const isSelected = selectedUsers.has(item.getUid());
    return (
      <ListItem bottomDivider onPress={() => toggleUserSelection(item.getUid())} containerStyle={{ backgroundColor: theme.background1 }}>
        <Avatar rounded source={item.getAvatar() ? { uri: item.getAvatar() } : undefined} icon={{ name: 'person', type: 'material', color: theme.staticWhite }} containerStyle={{ backgroundColor: theme.primaryLight }} />
        <ListItem.Content>
          <ListItem.Title style={{ color: theme.textPrimary }}>{item.getName()}</ListItem.Title>
        </ListItem.Content>
        <ListItem.CheckBox checked={isSelected} onPress={() => toggleUserSelection(item.getUid())} />
      </ListItem>
    );
  };

  if (isLoading) {
    return <View style={[styles.container, { justifyContent: 'center', backgroundColor: theme.background1 }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background1 }]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderDefault, backgroundColor: theme.background2 }]}
          placeholder="Enter Group Name"
          placeholderTextColor={theme.textTertiary}
          value={groupName}
          onChangeText={setGroupName}
        />
        <TextInput
        style={styles.input}
        placeholder="Group Description (optional)"
        value={description}
        onChangeText={setDescription}
      />
      </View>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Select Members (From Contacts)</Text>
      <FlatList
        data={syncedUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.getUid()}
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: theme.textSecondary}}>No contacts found on the app. Make sure you have granted permission.</Text>}
      />
      <Button
        title={`Create Group (${selectedUsers.size})`}
        onPress={handleCreateGroup}
        buttonStyle={{ backgroundColor: theme.primary, margin: 10, borderRadius: 8 }}
        loading={isCreating}
        disabled={selectedUsers.size === 0 || isCreating}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { ...customTypography.heading3.bold, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5 },
  inputContainer: { padding: 15 },
  input: { ...customTypography.body.regular, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12 },
});

export default CreateGroupScreen;