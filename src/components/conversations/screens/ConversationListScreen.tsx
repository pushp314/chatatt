// src/components/conversations/screens/ConversationListScreen.tsx

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  useColorScheme,
  Alert,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { useNavigation, useFocusEffect, CommonActions, NavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ListItem, Avatar, Text, Badge, Button, Icon } from '@rneui/themed';
import Feather from 'react-native-vector-icons/Feather'; // Using native-vector-icon as per preference

import { ChatStackParamList, MessageScreenUserParam, MessageScreenGroupParam, RootStackParamList } from '../../../navigation/types';
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants';
import { customThemeColorsLight, customThemeColorsDark, CustomColors, customTypography } from '../../../theme/theme';
import { useAuthStore } from '../../../store/authStore'; // Using zustand as per preference

type ConversationListScreenNavigationProp = StackNavigationProp<
  ChatStackParamList,
  typeof SCREEN_CONSTANTS.CONVERSATION_LIST
>;

interface ConversationPreviewCustomData {
  text?: string;
  message?: string;
}

const ConversationListScreen: React.FC = () => {
  const [conversations, setConversations] = useState<CometChat.Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const navigation = useNavigation<ConversationListScreenNavigationProp>();
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();

  const { logout, currentUser: loggedInCometChatUser } = useAuthStore();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [longPressedConversation, setLongPressedConversation] = useState<CometChat.Conversation | null>(null);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);

  const toggleMenu = useCallback(() => setIsMenuVisible(prev => !prev), []);

  const handleLogout = async () => {
    setIsMenuVisible(false);
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel", onPress: () => setIsMenuVisible(false) },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true, onDismiss: () => setIsMenuVisible(false) }
    );
  };

  const navigateToCreateGroup = () => {
    setIsMenuVisible(false);
    navigation.navigate(SCREEN_CONSTANTS.CREATE_GROUP_SCREEN);
  };

  const navigateToUserContacts = () => {
    rootNavigation.dispatch(
      CommonActions.navigate({
        name: SCREEN_CONSTANTS.USER_STACK_NAVIGATOR,
      })
    );
  };

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) {
        setSelectedConversations(new Set());
      }
      return !prev;
    });
  }, []);

  const handleConversationSelect = (conversationId: string) => {
    if (!isSelectionMode) return;
    setSelectedConversations(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(conversationId)) {
        newSelected.delete(conversationId);
      } else {
        newSelected.add(conversationId);
      }
      return newSelected;
    });
  };

  const handleConversationLongPress = (conversation: CometChat.Conversation) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedConversations(new Set([conversation.getConversationId()]));
    }
    setLongPressedConversation(conversation);
    setIsActionMenuVisible(true);
  };

  const closeActionMenu = () => {
    setIsActionMenuVisible(false);
    setLongPressedConversation(null);
  };

  const handleDeleteConversations = async (idsToDelete?: string[]) => {
    const conversationIds = idsToDelete || Array.from(selectedConversations);
    if (conversationIds.length === 0) {
      Alert.alert("No Selection", "Please select conversations to delete.");
      return;
    }
    Alert.alert(
      `Delete ${conversationIds.length} Conversation${conversationIds.length > 1 ? 's' : ''}`,
      "Are you sure? This will delete the conversation(s) for you only.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const deletePromises = conversationIds.map(id => {
                const conv = conversations.find(c => c.getConversationId() === id);
                if (conv) {
                  const conversationWith = conv.getConversationWith();
                  if (conversationWith instanceof CometChat.User) {
                    return CometChat.deleteConversation(conversationWith.getUid(), CometChat.RECEIVER_TYPE.USER);
                  } else if (conversationWith instanceof CometChat.Group) {
                    return CometChat.deleteConversation(conversationWith.getGuid(), CometChat.RECEIVER_TYPE.GROUP);
                  }
                }
                return Promise.resolve();
              });
              await Promise.all(deletePromises);
              Alert.alert("Success", "Conversation(s) deleted.");
              fetchRecentChatsCall(); // Re-fetch to update UI
            } catch (error) {
              console.error("Error deleting conversations:", error);
              Alert.alert("Error", "Could not delete conversation(s).");
            } finally {
              setIsLoading(false);
              setSelectedConversations(new Set());
              setIsSelectionMode(false);
              closeActionMenu();
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async (userToBlock?: CometChat.User) => {
    const user = userToBlock || (longPressedConversation?.getConversationWith() instanceof CometChat.User ? longPressedConversation.getConversationWith() as CometChat.User : null);
    if (!user) {
      Alert.alert("Error", "No user selected or invalid conversation type for blocking.");
      return;
    }
    Alert.alert(
      `Block ${user.getName()}`,
      `Are you sure you want to block ${user.getName()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await CometChat.blockUsers([user.getUid()]);
              Alert.alert("User Blocked", `${user.getName()} has been blocked.`);
              fetchRecentChatsCall(); // Re-fetch to update UI
            } catch (error) {
              console.error("Error blocking user:", error);
              Alert.alert("Error", `Could not block ${user.getName()}.`);
            } finally {
              setIsLoading(false);
              closeActionMenu();
              setIsSelectionMode(false);
              setSelectedConversations(new Set());
            }
          },
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isSelectionMode ? `${selectedConversations.size} selected` : SCREEN_CONSTANTS.CHATS,
      headerRight: () => {
        if (isSelectionMode) {
          return (
            <View style={styles.headerActionsContainer}>
              <TouchableOpacity onPress={() => handleDeleteConversations()} style={styles.headerIconContainer}>
                <Icon name="delete" type="material" color={theme.textPrimary} size={26} />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleSelectionMode} style={styles.headerIconContainer}>
                <Icon name="close" type="material" color={theme.textPrimary} size={26} />
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <TouchableOpacity onPress={toggleMenu} style={styles.headerIconContainer}>
            <Icon name="more-vert" type="material" color={theme.textPrimary} />
          </TouchableOpacity>
        );
      },
      headerLeft: isSelectionMode ? () => null : undefined,
    });
  }, [navigation, theme.textPrimary, toggleMenu, isSelectionMode, selectedConversations.size, handleDeleteConversations, toggleSelectionMode]);

  const fetchRecentChatsCall = useCallback(async () => {
    setIsLoading(true);
    try {
      const conversationsRequest = new CometChat.ConversationsRequestBuilder()
        .setLimit(30)
        .setWithBlockedInfo(true)
        .withUserAndGroupTags(true)
        .build();
      const fetchedConversations: CometChat.Conversation[] = await conversationsRequest.fetchNext();
      setConversations(fetchedConversations);
    } catch (error) {
      console.error("❌ ConversationListScreen: Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecentChatsCall();
      setIsSelectionMode(false);
      setSelectedConversations(new Set());
    }, [fetchRecentChatsCall])
  );

  useEffect(() => {
    const listenerID = `CONVERSATION_LIST_MESSAGE_LISTENER_${Date.now()}`;
    const userListenerId = `CONVERSATION_LIST_USER_LISTENER_${Date.now() + 1}`;

    const messageListener = new CometChat.MessageListener({
      onTextMessageReceived: (_message: CometChat.BaseMessage) => { fetchRecentChatsCall(); },
      onMediaMessageReceived: (_message: CometChat.BaseMessage) => { fetchRecentChatsCall(); },
      onCustomMessageReceived: (_customMessage: CometChat.CustomMessage) => { fetchRecentChatsCall(); },
      onMessagesDelivered: (_messageReceipt: CometChat.MessageReceipt) => { fetchRecentChatsCall(); },
      onMessagesRead: (_messageReceipt: CometChat.MessageReceipt) => { fetchRecentChatsCall(); },
      onMessageEdited: (_message: CometChat.BaseMessage) => { fetchRecentChatsCall(); },
      onMessageDeleted: (_message: CometChat.BaseMessage) => { fetchRecentChatsCall(); },
    });
    CometChat.addMessageListener(listenerID, messageListener);

    const userListener = new CometChat.UserListener({
      onUserOnline: (user: CometChat.User) => console.log("🟡 CLS: User online", user.getName()),
      onUserOffline: (user: CometChat.User) => console.log("🟡 CLS: User offline", user.getName()),
    });
    CometChat.addUserListener(userListenerId, userListener);

    return () => {
      CometChat.removeMessageListener(listenerID);
      CometChat.removeUserListener(userListenerId);
    };
  }, [fetchRecentChatsCall]);

  const navigateToMessages = async (item: CometChat.Conversation) => {
    if (isSelectionMode) {
      handleConversationSelect(item.getConversationId());
      return;
    }
    const conversationWith = item.getConversationWith();
    const lastMessage = item.getLastMessage();

    if (item.getUnreadMessageCount() > 0 && lastMessage && loggedInCometChatUser?.getUid()) {
      try {
        const messageIdToMark = lastMessage.getId();
        const originalMessageSender = lastMessage.getSender();
        const senderId = originalMessageSender?.getUid();

        if (senderId && senderId !== loggedInCometChatUser.getUid()) {
          if (conversationWith instanceof CometChat.User) {
            await CometChat.markAsRead(
              messageIdToMark,
              conversationWith.getUid(),
              CometChat.RECEIVER_TYPE.USER,
              senderId
            );
          } else if (conversationWith instanceof CometChat.Group) {
            await CometChat.markAsRead(
              messageIdToMark,
              conversationWith.getGuid(),
              CometChat.RECEIVER_TYPE.GROUP,
              senderId
            );
          }
          // After marking as read, re-fetch conversations to update the unread count in UI
          fetchRecentChatsCall();
        }
      } catch (error) {
        console.error(`🔴 CLS: Error in markAsRead for ${item.getConversationId()}:`, error);
      }
    }

    if (conversationWith instanceof CometChat.User) {
      const userParam: MessageScreenUserParam = {
        uid: conversationWith.getUid(),
        name: conversationWith.getName(),
        avatar: conversationWith.getAvatar(),
        status: conversationWith.getStatus(),
        blockedByMe: (conversationWith as any).blockedByMe === true,
      };
      navigation.navigate(SCREEN_CONSTANTS.MESSAGES, { user: userParam });
    } else if (conversationWith instanceof CometChat.Group) {
      const groupParam: MessageScreenGroupParam = {
        guid: conversationWith.getGuid(),
        name: conversationWith.getName(),
        icon: conversationWith.getIcon(),
        membersCount: conversationWith.getMembersCount(),
        type: conversationWith.getType(),
        hasJoined: conversationWith.getHasJoined(),
      };
      navigation.navigate(SCREEN_CONSTANTS.MESSAGES, { group: groupParam });
    } else {
      Alert.alert("Error", "Cannot open conversation.");
    }
  };

  const renderConversationItem = ({ item }: { item: CometChat.Conversation }) => {
    const conversationWith = item.getConversationWith();
    const lastMessage = item.getLastMessage();
    let avatarUri: string | undefined | null = null;
    let name = 'N/A';

    if (conversationWith) {
      if (conversationWith instanceof CometChat.User) {
        name = conversationWith.getName() || 'User';
        avatarUri = conversationWith.getAvatar();
      } else if (conversationWith instanceof CometChat.Group) {
        name = conversationWith.getName() || 'Group';
        avatarUri = conversationWith.getIcon();
      }
    }

    let lastMessageText = 'No messages yet';
    if (lastMessage) {
      if (lastMessage instanceof CometChat.TextMessage) {
        lastMessageText = lastMessage.getText() || "Message";
      } else if (lastMessage instanceof CometChat.MediaMessage) {
        lastMessageText = `Media: ${lastMessage.getAttachment()?.getName() || lastMessage.getType()}`;
      } else if (lastMessage instanceof CometChat.Action) {
        lastMessageText = (lastMessage as CometChat.Action).getMessage() || "Action";
      } else if (lastMessage instanceof CometChat.CustomMessage) {
        // Access metadata from the lastMessage, not the conversation item
        const customData = lastMessage.getMetadata() as ConversationPreviewCustomData | undefined;
        lastMessageText = customData?.text || customData?.message || "Custom Message";
      }
    }
    if (lastMessageText.length > 35) lastMessageText = lastMessageText.substring(0, 32) + "...";

    const unreadCount = item.getUnreadMessageCount();
    const finalAvatarSource = (avatarUri && typeof avatarUri === 'string' && avatarUri.trim() !== "") ? { uri: avatarUri } : undefined;
    const isSelected = selectedConversations.has(item.getConversationId());

    return (
      <TouchableOpacity
        onPress={() => navigateToMessages(item)}
        onLongPress={() => handleConversationLongPress(item)}
        delayLongPress={200}
      >
        <ListItem
          bottomDivider
          containerStyle={[
            styles.listItemContainer,
            { backgroundColor: isSelected ? theme.primaryLight : theme.background1 }
          ]}
        >
          <View style={styles.avatarSelectionContainer}>
            {isSelectionMode && (
              <View style={styles.selectionIndicatorContainer}>
                {isSelected ? (
                  <Feather name="check-circle" size={24} color={theme.primary} />
                ) : (
                  <Feather name="circle" size={24} color={theme.textSecondary} />
                )}
              </View>
            )}
            <Avatar
              rounded
              size="medium"
              source={finalAvatarSource}
              icon={!finalAvatarSource ? {
                name: 'person',
                type: 'material',
                color: theme.icon,
                size: 28
              } : undefined}
              avatarStyle={{
                backgroundColor: !finalAvatarSource ? theme.background2 : 'transparent',
              }}
              placeholderStyle={{ backgroundColor: 'transparent' }}
              containerStyle={!isSelectionMode ? styles.avatarContainer : styles.avatarContainerWithSelection}
            />
          </View>

          <ListItem.Content>
            <View style={styles.textualContentContainer}>
              <ListItem.Title
                style={[styles.nameText, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                {name}
              </ListItem.Title>
              <ListItem.Subtitle
                style={[styles.lastMessageText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {lastMessageText}
              </ListItem.Subtitle>
            </View>
          </ListItem.Content>

          {unreadCount > 0 && !isSelectionMode && (
            <Badge
              value={unreadCount > 99 ? "99+" : unreadCount}
              badgeStyle={[styles.badgeStyle, { backgroundColor: theme.primary }]}
              textStyle={styles.unreadText}
            />
          )}
          {!isSelectionMode && (
            <ListItem.Chevron
              containerStyle={styles.chevronContainer}
              color={theme.textSecondary}
              size={24}
            />
          )}
        </ListItem>
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => (
    <View style={[styles.centeredContainer, { backgroundColor: theme.background1 }]}>
      <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
        {isLoading && conversations.length === 0 ? 'Loading conversations...' : 'No conversations found.\nStart a new chat!'}
      </Text>
      {!isLoading && conversations.length === 0 && (
        <Button
          title="Refresh"
          onPress={fetchRecentChatsCall}
          buttonStyle={[styles.refreshButton, { backgroundColor: theme.primary }]}
          titleStyle={[styles.refreshButtonTitle, { color: theme.staticWhite }]}
        />
      )}
    </View>
  );

  const ActionMenu = () => {
    if (!longPressedConversation) return null;
    const convWith = longPressedConversation.getConversationWith();
    const isUserConversation = convWith instanceof CometChat.User;

    return (
      <Modal
        transparent={true}
        visible={isActionMenuVisible}
        onRequestClose={closeActionMenu}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={closeActionMenu}>
          <View style={styles.modalOverlay}>
            <View style={[styles.actionMenuContainer, { backgroundColor: theme.background1 }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  handleDeleteConversations([longPressedConversation.getConversationId()]);
                }}
              >
                <Icon name="delete" type="material" color={theme.textPrimary} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>Delete Conversation</Text>
              </TouchableOpacity>
              {isUserConversation && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    handleBlockUser(convWith as CometChat.User);
                  }}
                >
                  <Icon name="block" type="material" color={theme.textPrimary} style={styles.menuIcon} />
                  <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>
                    Block User
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  if (isLoading && conversations.length === 0) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: theme.background1 }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background2 }]}>
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.getConversationId()}
        ListEmptyComponent={ListEmptyComponent}
        onRefresh={fetchRecentChatsCall}
        refreshing={isLoading && conversations.length > 0}
        contentContainerStyle={conversations.length === 0 ? styles.emptyFlatlistContent : styles.listContent}
        extraData={selectedConversations}
      />
      <ActionMenu />
      <Modal
        transparent={true}
        visible={isMenuVisible}
        onRequestClose={toggleMenu}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={toggleMenu} accessible={false}>
          <View style={styles.modalOverlay}>
            <View style={[styles.menuContainer, { backgroundColor: theme.background1 }]}>
              <TouchableOpacity style={styles.menuItem} onPress={navigateToCreateGroup}>
                <Icon name="group-add" type="material" color={theme.textPrimary} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>New Group</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={navigateToUserContacts}>
                <Icon name="contacts" type="material" color={theme.textPrimary} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>Contacts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Icon name="logout" type="material" color={theme.textPrimary} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {!isSelectionMode && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={navigateToUserContacts}
        >
          <Icon name="chat-plus-outline" type="material-community" color={theme.staticWhite} size={28} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIconContainer: { marginHorizontal: 10, padding: 5 },
  headerActionsContainer: { flexDirection: 'row' },
  listItemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  avatarSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIndicatorContainer: {
    marginRight: 10,
    paddingLeft: 5,
  },
  avatarContainer: {},
  avatarContainerWithSelection: {},
  textualContentContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  nameText: {
    ...customTypography.body.medium,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  lastMessageText: {
    ...customTypography.caption1.regular,
    fontSize: 14,
  },
  badgeStyle: {
    marginRight: 8,
  },
  unreadText: {
    ...customTypography.caption1.medium,
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chevronContainer: {},
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    ...customTypography.body.regular,
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    paddingHorizontal: 20,
  },
  refreshButtonTitle: {
    ...customTypography.button.medium,
  },
  loadingText: {
    marginTop: 10,
    ...customTypography.body.regular,
  },
  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 90 : 100,
  },
  emptyFlatlistContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 15,
    right: 10,
    width: 180,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: 5,
  },
  actionMenuContainer: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: 5,
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    ...customTypography.body.regular,
    fontSize: 16,
    marginLeft: 15,
  },
  menuIcon: {
    // No explicit margin needed if text marginLeft is sufficient
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 15,
    bottom: 15,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default ConversationListScreen;