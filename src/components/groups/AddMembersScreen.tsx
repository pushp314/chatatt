// src/components/groups/AddMembersScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useColorScheme,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Avatar, ListItem, Button } from '@rneui/themed';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Contacts from 'react-native-contacts';
import { ChatStackParamList } from '../../navigation/types';
import { userService } from '../../services/userService';
import { customThemeColorsDark, customThemeColorsLight, customTypography } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';

type AddMembersRouteProp = RouteProp<ChatStackParamList, 'AddMembersScreen'>;

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

const AddMembersScreen: React.FC = () => {
    const route = useRoute<AddMembersRouteProp>();
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
    const { group } = route.params;
    const { currentUser } = useAuthStore();

    const [filteredUsers, setFilteredUsers] = useState<CometChat.User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const fetchUsersAndFilter = useCallback(async () => {
        setIsLoading(true);
        try {
            // Step 1: Get contacts from phone
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
                setFilteredUsers([]);
                return;
            }

            // Step 2: Sync contacts with backend to get registered users
            const response = await userService.syncDeviceContacts(phoneNumbersToSync);
            
            if (response.success && response.data) {
                // Step 3: Filter out users who are already in the group
                const memberRequest = new CometChat.GroupMembersRequestBuilder(group.getGuid()).setLimit(100).build();
                const existingMembers = await memberRequest.fetchNext() as CometChat.GroupMember[];
                const existingMemberIds = new Set(existingMembers.map(m => m.getUid()));

                const availableUsers = response.data.filter(user => !existingMemberIds.has(user._id));
                
                const cometChatUsers = availableUsers.map(syncedUser => {
                    const user = new CometChat.User(syncedUser._id);
                    user.setName(syncedUser.displayName);
                    user.setAvatar(syncedUser.profilePictureURL ?? '');
                    return user;
                });
                setFilteredUsers(cometChatUsers);
            }
        } catch (error) {
            Alert.alert("Error", "Could not fetch users to add.");
        } finally {
            setIsLoading(false);
        }
    }, [group, currentUser]);

    useEffect(() => {
        const requestPermissionAndFetch = async () => {
            if (Platform.OS === 'android') {
                const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
                if (result !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert("Permission Denied", "Cannot show contacts without permission.");
                    setIsLoading(false);
                    return;
                }
            }
            await fetchUsersAndFilter();
        };
        requestPermissionAndFetch();
    }, [fetchUsersAndFilter]);

    const toggleUserSelection = (uid: string) => {
        const newSelection = new Set(selectedUsers);
        if (newSelection.has(uid)) newSelection.delete(uid);
        else newSelection.add(uid);
        setSelectedUsers(newSelection);
    };

    const handleAddMembersToGroup = async () => {
        if (selectedUsers.size === 0) {
            Alert.alert("No Selection", "Please select at least one user to add.");
            return;
        }
        setIsAdding(true);
        const membersToAdd = Array.from(selectedUsers).map(uid => new CometChat.GroupMember(uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT));
        
        try {
            await CometChat.addMembersToGroup(group.getGuid(), membersToAdd, []);
            Alert.alert("Success", "Members added successfully!");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Failed to add members to the group.");
        } finally {
            setIsAdding(false);
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
            <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={item => item.getUid()}
                ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: theme.textSecondary}}>No new users from your contacts to add.</Text>}
            />
            <Button
                title={`Add ${selectedUsers.size > 0 ? `(${selectedUsers.size})` : ''} Members`}
                onPress={handleAddMembersToGroup}
                disabled={selectedUsers.size === 0 || isAdding}
                loading={isAdding}
                buttonStyle={{ backgroundColor: theme.primary, margin: 10, borderRadius: 8 }}
                titleStyle={{ ...customTypography.button.medium }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default AddMembersScreen;