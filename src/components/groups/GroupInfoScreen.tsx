import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useColorScheme,
  TouchableOpacity,
  Platform, // Platform is needed for handling file URI
  Switch, // Add Switch for toggling admin-only messages
} from 'react-native';
import { Avatar, ListItem, Button, Icon } from '@rneui/themed';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';

import { ChatStackParamList } from '../../navigation/types';
import { customThemeColorsLight, customThemeColorsDark, customTypography } from '../../theme/theme';
import { leaveGroup,requestStoragePermission } from '../../utils/helper';
import { SCREEN_CONSTANTS } from '../../utils/AppConstants';
import { useAuthStore } from '../../store/authStore';

import EditGroupDescriptionModal from './EditGroupDescriptionModal';
import api from '../../services/api'; // Import the configured api instance

type GroupInfoRouteProp = RouteProp<ChatStackParamList, 'GroupInfoScreen'>;
type GroupInfoNavigationProp = StackNavigationProp<ChatStackParamList, 'GroupInfoScreen'>;


type EditMode = 'name' | 'description' | null;


const GroupInfoScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
  const navigation = useNavigation<GroupInfoNavigationProp>();
  const route = useRoute<GroupInfoRouteProp>();
  const { group: groupParam } = route.params;

  const [group, setGroup] = useState<CometChat.Group | null>(null);
  const [members, setMembers] = useState<CometChat.GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const { currentUser } = useAuthStore();


  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [adminOnlyMessageMode, setAdminOnlyMessageMode] = useState<boolean>(false); // New state for admin-only messages


  const fetchGroupDetails = useCallback(async () => {
    try {
      const fetchedGroup = await CometChat.getGroup(groupParam.guid);
      setGroup(fetchedGroup);

      // Initialize adminOnlyMessageMode from group metadata
      const metadata = fetchedGroup.getMetadata() as { adminOnlyMessageMode?: boolean } | null;
      if (metadata && typeof metadata.adminOnlyMessageMode === 'boolean') {
        setAdminOnlyMessageMode(metadata.adminOnlyMessageMode);
      } else {
        setAdminOnlyMessageMode(false); // Default to false if not set
      }

      const groupMembersRequest = new CometChat.GroupMembersRequestBuilder(fetchedGroup.getGuid())
        .setLimit(100)
        .build();
      const groupMembers = await groupMembersRequest.fetchNext();
      setMembers(groupMembers as CometChat.GroupMember[]);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch group details.');
    } finally {
      setIsLoading(false);
    }
  }, [groupParam.guid]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchGroupDetails();
    }, [fetchGroupDetails]),
  );


  const canEditGroup = useMemo(() => {
    if (!group) return false;
    const scope = group.getScope();
    return scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN || scope === 'owner';
  }, [group]);

   const handleToggleAdminOnlyMessage = async (value: boolean) => { // New handler for the switch
    if (!group) return;
    setIsProcessing(true);
    try {
      const newMetadata = {
        ...group.getMetadata(),
        adminOnlyMessageMode: value,
      };
      const groupToUpdate = new CometChat.Group(
        group.getGuid(),
        group.getName(),
        group.getType(),
        group.getPassword()
      );
      groupToUpdate.setMetadata(newMetadata);

      const updatedGroup = await CometChat.updateGroup(groupToUpdate);
      setGroup(updatedGroup);
      setAdminOnlyMessageMode(value); // Update local state
      Alert.alert('Success', `Admin-only messages ${value ? 'enabled' : 'disabled'} successfully.`);
    } catch (error: any) {
      console.error("Error updating adminOnlyMessageMode:", error);
      Alert.alert('Error', error.message || 'Failed to update admin-only message setting.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveChanges = async (newValue: string) => {
    if (!group || !editMode) return;

    setIsProcessing(true);
    setEditModalVisible(false);

    try {
        const groupToUpdate = new CometChat.Group(group.getGuid(), group.getName(), group.getType(), group.getPassword());

        if (editMode === 'name') {
            if (!newValue.trim()) {
                Alert.alert("Validation Error", "Group name cannot be empty.");
                return;
            }
            groupToUpdate.setName(newValue.trim());
        } else if (editMode === 'description') {
            groupToUpdate.setDescription(newValue);
        }

        const updatedGroup = await CometChat.updateGroup(groupToUpdate);
        setGroup(updatedGroup);
        Alert.alert('Success', `Group ${editMode} updated successfully.`);
    } catch (error: any) {
        Alert.alert('Error', error.message || `Failed to update group ${editMode}.`);
    } finally {
        setIsProcessing(false);
        setEditMode(null);
    }
};



  const handlePickImage = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert("Permission Denied", "Storage permission is required to select an image.");
      return;
    }

    launchImageLibrary({ mediaType: 'photo' }, (response: ImagePickerResponse) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to pick image.');
        return;
      }
      if (response.assets && response.assets[0]) {
        handleUpdateGroupIcon(response.assets[0]);
      }
    });
  };

  const handleUpdateGroupIcon = async (asset: Asset) => {
    if (!group || !asset.uri || !asset.fileName || !asset.type) {
      Alert.alert("Error", "Invalid image file selected.");
      return;
    }

    setIsUploadingIcon(true);
    const formData = new FormData();
    formData.append('groupIcons', {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        type: asset.type,
        name: asset.fileName,
    } as any);

    try {
        const groupId = group.getGuid();
        // Step 1: Upload the photo to your backend API
        const response = await api.put(`/chats/group/${groupId}/photo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.data && response.data.success) {
            const newIconUrl = response.data.data.avatarURL;

            // Step 2: If backend upload is successful, update CometChat with the new URL
            try {
                const groupToUpdate = new CometChat.Group(
                    group.getGuid(),
                    group.getName(),
                    group.getType(),
                    group.getPassword()
                );
                groupToUpdate.setIcon(newIconUrl); // Set the URL from your backend response

                const updatedCometChatGroup = await CometChat.updateGroup(groupToUpdate);
                setGroup(updatedCometChatGroup); // Update state with the final group object from CometChat

                Alert.alert('Success', 'Group photo updated successfully.');

            } catch (cometChatError: any) {
                console.error("Failed to sync new group photo with CometChat:", cometChatError);
                Alert.alert(
                    'Update Incomplete',
                    'The photo was uploaded but failed to sync with the chat service. Others may not see the change immediately.'
                );
            }
        } else {
            throw new Error(response.data.message || 'Failed to upload photo to the server.');
        }
    } catch (error: any) {
        console.error("Error updating group icon:", error);
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
        Alert.alert('Error', errorMessage);
    } finally {
        setIsUploadingIcon(false);
    }
  };

  const handleMemberAction = (member: CometChat.GroupMember) => {
    const isUserTheOwner = group?.getOwner() === currentUser?.getUid();

    if (!isUserTheOwner || !group || member.getUid() === currentUser?.getUid()) {
      return;
    }

    const currentScope = member.getScope();
    const isMemberAdmin = currentScope === CometChat.GROUP_MEMBER_SCOPE.ADMIN;

    const newScope = isMemberAdmin
      ? CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT
      : CometChat.GROUP_MEMBER_SCOPE.ADMIN;

    const actionText = isMemberAdmin ? 'Demote to Participant' : 'Promote to Admin';

    Alert.alert(
      `Manage ${member.getName()}`,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          onPress: async () => {
            setIsProcessing(true);
            try {
              await CometChat.updateGroupMemberScope(
                group.getGuid(),
                member.getUid(),
                newScope as CometChat.GroupMemberScope
              );
              Alert.alert('Success', `${member.getName()} is now a ${newScope}.`);
              await fetchGroupDetails();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update member role.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
        {
          text: 'Remove from Group',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Removal',
              `Are you sure you want to remove ${member.getName()}? This action cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: async () => {
                    setIsProcessing(true);
                    try {
                      await CometChat.kickGroupMember(group.getGuid(), member.getUid());
                      Alert.alert('Success', `${member.getName()} has been removed.`);
                      setMembers(prevMembers => prevMembers.filter(m => m.getUid() !== member.getUid()));
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to remove member.');
                    } finally {
                      setIsProcessing(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };


  const handleLeaveOrDeleteGroup = () => {
    if (!group) return;
    const isOwner = group.getOwner() === currentUser?.getUid();
    if (isOwner) {
      if (group.getMembersCount() > 1) {
        Alert.alert(
          'Ownership Transfer Required',
          'You are the group owner. You must transfer ownership to another member before you can leave.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Transfer Ownership',
              onPress: () => navigation.navigate('TransferOwnershipScreen', { group }),
            },
          ]
        );
      } else {
        Alert.alert(
          'Delete Group',
          `You are the last member. Do you want to delete "${group.getName()}" permanently?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                setIsProcessing(true);
                try {
                  await CometChat.deleteGroup(group.getGuid());
                  Alert.alert('Success', 'Group has been deleted.');
                  navigation.pop(2);
                } catch (error: any) {
                  Alert.alert('Error', error.message || 'Failed to delete the group.');
                } finally {
                  setIsProcessing(false);
                }
              },
            },
          ]
        );
      }
    } else {
      Alert.alert(
        'Leave Group',
        `Are you sure you want to leave "${group.getName()}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              setIsProcessing(true);
              try {
                await leaveGroup(group, navigation, 2);
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Could not leave the group.');
              } finally {
                setIsProcessing(false);
              }
            },
          },
        ],
      );
    }
  };

  const handleAddMembers = () => {
    if (group) {
      navigation.navigate(SCREEN_CONSTANTS.ADD_MEMBERS_SCREEN, { group });
    }
  };

  const renderMemberItem = ({ item }: { item: CometChat.GroupMember }) => {
    const isOwner = group?.getOwner() === currentUser?.getUid();
    return (
        <ListItem
            bottomDivider
            containerStyle={{ backgroundColor: theme.background1 }}
            onPress={() => handleMemberAction(item)}
            disabled={!isOwner || item.getUid() === currentUser?.getUid() || isProcessing}
        >
            <Avatar
              rounded
              source={item.getAvatar() ? { uri: item.getAvatar() } : undefined}
              icon={!item.getAvatar() ? { name: 'person', type: 'material', color: theme.staticWhite } : undefined}
              containerStyle={{ backgroundColor: theme.primaryLight }}
            />
            <ListItem.Content>
            <ListItem.Title style={{ color: theme.textPrimary }}>{item.getName()}</ListItem.Title>
            <ListItem.Subtitle style={{ color: theme.textSecondary, textTransform: 'capitalize', fontWeight: item.getScope() !== 'participant' ? 'bold' : 'normal' }}>
                {item.getScope()}
            </ListItem.Subtitle>
            </ListItem.Content>
            {isOwner && item.getUid() !== currentUser?.getUid() && (
            <Icon name="more-vert" type="material" color={theme.textSecondary} />
            )}
        </ListItem>
    );
  };

  if (isLoading || !group) {
    return <View style={[styles.container, styles.centered, { backgroundColor: theme.background1 }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  const isOwner = group.getOwner() === currentUser?.getUid();
  const buttonTitle = isOwner && group.getMembersCount() === 1 ? 'Delete Group' : 'Leave Group';

  return (
    <View style={[styles.container, { backgroundColor: theme.background2 }]}>
        <View style={[styles.header, { backgroundColor: theme.background1, borderBottomColor: theme.borderLight }]}>
            <Avatar
                rounded
                size="xlarge"
                source={group.getIcon() ? { uri: group.getIcon() } : undefined}
                icon={{ name: 'groups', type: 'material', size: 80, color: theme.staticWhite }}
                containerStyle={[styles.avatar, { backgroundColor: theme.primaryLight }]}
            />
                 {isUploadingIcon && (
                    <View style={styles.uploadingOverlay}>
                        <ActivityIndicator color="#FFF" />
                    </View>
                  )}
                  {canEditGroup && !isUploadingIcon && (
                    <TouchableOpacity style={[styles.cameraIcon, { backgroundColor: theme.primary }]} onPress={handlePickImage}>
                        <Icon name="camera-alt" type="material" color={theme.staticWhite} size={20} />
                    </TouchableOpacity>
                )}

            <View style={styles.groupNameContainer}>
                <Text style={[styles.groupName, { color: theme.textPrimary }]}>{group.getName()}</Text>
                {canEditGroup && (
                    <TouchableOpacity onPress={() => { setEditMode('name'); setEditModalVisible(true); }} style={styles.editIcon}>
                        <Icon name="edit" type="material" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={[styles.memberCount, { color: theme.textSecondary }]}>{`${members.length} Members`}</Text>
        </View>


        <View style={[styles.descriptionSection, { backgroundColor: theme.background1, borderBottomColor: theme.borderLight }]}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.descriptionTitle, { color: theme.textPrimary }]}>Description</Text>
                {group.getDescription() ? (
                    <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>{group.getDescription()}</Text>
                ) : (
                    <Text style={[styles.descriptionPlaceholder, { color: theme.textSecondary }]}>Add a group description</Text>
                )}
            </View>
            {canEditGroup && (
                <TouchableOpacity onPress={() => { setEditMode('description'); setEditModalVisible(true); }} disabled={isProcessing}>
                    <Icon name="edit" type="material" color={theme.primary} />
                </TouchableOpacity>
            )}
        </View>
          {canEditGroup && (
          <ListItem
            bottomDivider
            containerStyle={{ backgroundColor: theme.background1 }}
            disabled={isProcessing}
          >
            <ListItem.Content>
              <ListItem.Title style={{ color: theme.textPrimary }}>Admin-Only Messages</ListItem.Title>
              <ListItem.Subtitle style={{ color: theme.textSecondary }}>
                Only admins can send messages in this group.
              </ListItem.Subtitle>
            </ListItem.Content>
            <Switch
              value={adminOnlyMessageMode}
              onValueChange={handleToggleAdminOnlyMessage}
              trackColor={{ false: theme.borderLight, true: theme.primary }}
              thumbColor={adminOnlyMessageMode ? theme.primary : theme.borderLight}
              disabled={isProcessing}
            />
          </ListItem>
        )}
       
        <Button
            title="Add Members"
            type="clear"
            onPress={handleAddMembers}
            icon={<Icon name="group-add" type="material" color={theme.primary} />}
            titleStyle={{ color: theme.primary, marginLeft: 10 }}
            containerStyle={{ backgroundColor: theme.background1, borderBottomWidth: 1, borderBottomColor: theme.borderLight }}
        />

        <Text style={[styles.listHeader, { color: theme.textSecondary }]}>Members</Text>
        <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={item => item.getUid()}
            style={{ flex: 1, backgroundColor: theme.background1 }}
        />

        <View style={[styles.footer, { backgroundColor: theme.background1, borderTopColor: theme.borderLight }]}>
            <Button
            title={buttonTitle}
            onPress={handleLeaveOrDeleteGroup}
            buttonStyle={{ backgroundColor: theme.errorBackground }}
            icon={{ name: 'logout', type: 'material', color: 'white' }}
            loading={isProcessing}
            disabled={isProcessing}
            />
        </View>


        <EditGroupDescriptionModal
            visible={isEditModalVisible}
            onClose={() => { setEditModalVisible(false); setEditMode(null); }}
            onSave={handleSaveChanges}
            initialValue={editMode === 'name' ? group.getName() : group.getDescription() || ''}
            mode={editMode}
        />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  avatar: {
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },

  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    ...customTypography.heading2.bold,
  },
  editIcon: {
    marginLeft: 10,
    padding: 5,
  },

  memberCount: {
    ...customTypography.body.regular,
    marginTop: 4,
  },
  descriptionSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descriptionTitle: {
    ...customTypography.body.bold,
    marginBottom: 4,
  },
  descriptionText: {
    ...customTypography.body.regular,
  },
  descriptionPlaceholder: {
    ...customTypography.body.regular,
    fontStyle: 'italic',
  },
  listHeader: {
    ...customTypography.caption1.bold,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: 'uppercase',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
  },
});

export default GroupInfoScreen;