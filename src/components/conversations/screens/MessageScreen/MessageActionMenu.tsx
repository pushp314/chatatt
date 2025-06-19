// src/components/conversations/screens/MessageScreen/MessageActionMenu.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Icon, ListItem } from '@rneui/themed';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CustomColors } from '../../../../theme/theme';

interface MessageActionMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
  theme: CustomColors;
  selectedMessage: CometChat.BaseMessage | null;
  isMyMessage: boolean;
}

const MessageActionMenu: React.FC<MessageActionMenuProps> = ({
  isVisible,
  onClose,
  onReply,
  onForward,
  onDelete,
  theme,
  selectedMessage,
  isMyMessage,
}) => {
  if (!selectedMessage) return null;

  const menuOptions = [
    { title: 'Reply', icon: 'reply', action: onReply, show: true },
    { title: 'Forward', icon: 'forward', action: onForward, show: true },
    { title: 'Delete', icon: 'delete', action: onDelete, show: isMyMessage },
  ];

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={[styles.container, { backgroundColor: theme.background1 }]} onStartShouldSetResponder={() => true}>
          {menuOptions.map((option, index) => (
            option.show && (
              <ListItem
                key={index}
                containerStyle={{ backgroundColor: 'transparent' }}
                onPress={() => {
                  option.action();
                  onClose();
                }}
              >
                <Icon name={option.icon} type="material" color={theme.textPrimary} />
                <ListItem.Content>
                  <ListItem.Title style={{ color: theme.textPrimary }}>{option.title}</ListItem.Title>
                </ListItem.Content>
              </ListItem>
            )
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '70%',
    maxWidth: 280,
    borderRadius: 10,
    paddingVertical: 5,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default MessageActionMenu;