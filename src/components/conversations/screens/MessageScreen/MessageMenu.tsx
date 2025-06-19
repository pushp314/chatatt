// src/components/conversations/screens/MessageScreen/MessageMenu.tsx

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Platform, Text } from 'react-native';
import { Icon, ListItem } from '@rneui/themed';
import { CustomColors } from '../../../../theme/theme';
import { ActiveChatParticipant } from '../../../../store/chatStore';

export interface MessageMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onSearch: () => void;
  onBlockUser?: () => void; // Made optional
  theme: CustomColors;
  participant?: ActiveChatParticipant | null; // Pass the whole participant
  isBlocked?: boolean;
}

const MessageMenu: React.FC<MessageMenuProps> = ({
  isVisible,
  onClose,
  onViewProfile,
  onSearch,
  onBlockUser,
  theme,
  participant,
  isBlocked,
}) => {
  const isUserChat = participant?.type === 'user';
  const participantName = participant?.name || 'Participant';

  const menuOptions = [
    { title: `View ${isUserChat ? 'Contact' : 'Info'}`, iconName: isUserChat ? 'person-outline' : 'info-outline', iconType: 'material', action: onViewProfile },
    { title: 'Search Messages', iconName: 'search', iconType: 'material', action: onSearch },
  ];

  // "Block User" ka option sirf user chat mein dikhega
  if (isUserChat && onBlockUser) {
    menuOptions.push({
      title: isBlocked ? `Unblock ${participantName}` : `Block ${participantName}`,
      iconName: 'block',
      iconType: 'material',
      action: onBlockUser,
    });
  }

  const approxHeaderHeight = Platform.OS === 'ios' ? 90 : 70;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View
          style={[
            styles.menuContainer,
            {
              backgroundColor: theme.background1,
              borderColor: theme.borderLight,
              top: approxHeaderHeight - 15,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {menuOptions.map((option, index) => (
            <ListItem
              key={index}
              containerStyle={{ backgroundColor: 'transparent', paddingVertical: 14 }}
              onPress={() => {
                option.action();
                onClose();
              }}
              bottomDivider={index < menuOptions.length - 1}
            >
              <Icon name={option.iconName} type={option.iconType} color={theme.textPrimary} size={24} />
              <ListItem.Content>
                <ListItem.Title style={{ color: theme.textPrimary, fontSize: 16 }}>
                  {option.title}
                </ListItem.Title>
              </ListItem.Content>
            </ListItem>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    position: 'absolute',
    right: 10,
    width: 260,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});

export default MessageMenu;