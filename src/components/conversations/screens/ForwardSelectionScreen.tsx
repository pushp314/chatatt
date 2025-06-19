// src/components/conversations/screens/ForwardSelectionScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, ListItem, Button, Icon } from '@rneui/themed';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { useChatStore } from '../../../store/chatStore';
import { customThemeColorsLight, customThemeColorsDark } from '../../../theme/theme';

const ForwardSelectionScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
  const navigation = useNavigation();

  const { messagesToForward, setMessagesToForward } = useChatStore();

  const [conversations, setConversations] = useState<CometChat.Conversation[]>([]);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isForwarding, setIsForwarding] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    const conversationsRequest = new CometChat.ConversationsRequestBuilder().setLimit(50).build();
    try {
      const convs = await conversationsRequest.fetchNext();
      setConversations(convs);
    } catch (error) {
      Alert.alert('Error', 'Could not load conversations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const toggleSelection = (conversationId: string) => {
    const newSelection = new Set(selectedConversations);
    if (newSelection.has(conversationId)) newSelection.delete(conversationId);
    else newSelection.add(conversationId);
    setSelectedConversations(newSelection);
  };

  const handleForward = async () => {
    if (messagesToForward.length === 0 || selectedConversations.size === 0) {
      return Alert.alert("Error", "No message or destination selected for forwarding.");
    }

    setIsForwarding(true);
    const forwardPromises: Promise<CometChat.BaseMessage>[] = [];

    try {
      for (const messageToForward of messagesToForward) {
        let metadata = {};
        if (messageToForward instanceof CometChat.TextMessage || messageToForward instanceof CometChat.MediaMessage) {
            metadata = { ...(messageToForward.getMetadata() || {}), forwarded: true };
        }

        for (const convId of selectedConversations) {
          const conversation = conversations.find(c => c.getConversationId() === convId);
          if (!conversation) continue;

          const receiver = conversation.getConversationWith();
          let receiverId: string;
          // **FIX:** This is the corrected type usage. We use the uppercase `RECEIVER_TYPE`.
          let receiverType: (typeof CometChat.RECEIVER_TYPE.USER) | (typeof CometChat.RECEIVER_TYPE.GROUP);

          if (receiver instanceof CometChat.User) {
            receiverId = receiver.getUid();
            receiverType = CometChat.RECEIVER_TYPE.USER;
          } else if (receiver instanceof CometChat.Group) {
            receiverId = receiver.getGuid();
            receiverType = CometChat.RECEIVER_TYPE.GROUP;
          } else {
            // Skip this conversation if the receiver is neither a user nor a group
            continue;
          }

          let newMessage: CometChat.TextMessage | CometChat.MediaMessage | null = null;
          
          if (messageToForward instanceof CometChat.TextMessage) {
            newMessage = new CometChat.TextMessage(receiverId, messageToForward.getText(), receiverType);
            newMessage.setMetadata(metadata);
          } else if (messageToForward instanceof CometChat.MediaMessage) {
            const attachment = messageToForward.getAttachment();
            const fileData = {
              uri: attachment.getUrl(),
              name: attachment.getName(),
              type: attachment.getMimeType(),
            };
            newMessage = new CometChat.MediaMessage(receiverId, fileData as any, messageToForward.getType() as any, receiverType);
            newMessage.setMetadata(metadata);
          }
          
          if (newMessage) {
            forwardPromises.push(CometChat.sendMessage(newMessage));
          }
        }
      }

      if (forwardPromises.length === 0) {
        throw new Error("Message type is not supported for forwarding.");
      }

      await Promise.all(forwardPromises);
      Alert.alert('Success', `Message(s) forwarded to ${selectedConversations.size} chat(s).`);
      setMessagesToForward([]);
      navigation.goBack();

    } catch (error: any) {
      console.error("Forwarding error:", error);
      Alert.alert('Error', error.message || 'Failed to forward message(s).');
    } finally {
      setIsForwarding(false);
    }
  };


  const renderItem = ({ item }: { item: CometChat.Conversation }) => {
    const convWith = item.getConversationWith();
    let name = 'N/A';
    let avatar: string | undefined = '';
    if (convWith instanceof CometChat.User) {
      name = convWith.getName();
      avatar = convWith.getAvatar();
    } else if (convWith instanceof CometChat.Group) {
      name = convWith.getName();
      avatar = convWith.getIcon();
    }
    const isSelected = selectedConversations.has(item.getConversationId());

    return (
      <ListItem
        bottomDivider
        onPress={() => toggleSelection(item.getConversationId())}
        containerStyle={{ backgroundColor: isSelected ? theme.primaryLight : theme.background1 }}
      >
        <Avatar rounded source={avatar ? { uri: avatar } : undefined} />
        <ListItem.Content>
          <ListItem.Title style={{ color: theme.textPrimary }}>{name}</ListItem.Title>
        </ListItem.Content>
        <ListItem.CheckBox checked={isSelected} onPress={() => toggleSelection(item.getConversationId())} />
      </ListItem>
    );
  };

  if (isLoading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background2 }]}>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.getConversationId()}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: theme.textSecondary }}>No chats to forward to.</Text>}
      />
      {selectedConversations.size > 0 && (
        <View style={styles.fabContainer}>
            <Button
                icon={<Icon name="send" type="material" color={theme.staticWhite} />}
                buttonStyle={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={handleForward}
                loading={isForwarding}
                disabled={isForwarding}
            />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  fabContainer: { position: 'absolute', bottom: 30, right: 30 },
  fab: { width: 60, height: 60, borderRadius: 30, elevation: 6 }
});

export default ForwardSelectionScreen;