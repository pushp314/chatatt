// src/components/conversations/screens/MessageScreen/MessageInput.tsx
import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Keyboard } from 'react-native';
import { Icon } from '@rneui/themed';
import { CustomColors, customTypography } from '../../../../theme/theme'; // Adjust path
import VoiceRecorderButton from '../VoiceRecorder/VoiceRecorderButton'; // Import the new component
import Attachment from '../../../../assets/icons/Attachment'; // Import the new attachment icon

export interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendAudio: (path: string, duration: number, mimeType: string) => void;
  theme: CustomColors;
  onTyping: (isTyping: boolean) => void;
  isBlocked?: boolean;
  onAttachmentPress: () => void; // New prop to open the picker
  isAdminOnlyMessageMode: boolean; // New prop
  isCurrentUserAdmin: boolean; // New prop
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendText,
  onSendAudio,
  theme,
  onTyping,
  isBlocked,
  onAttachmentPress,
  isAdminOnlyMessageMode, // Destructure new prop
  isCurrentUserAdmin, // Destructure new prop
}) => {
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(Platform.OS === 'ios' ? 40 : 38);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Determine if messaging is disabled
  const isMessagingDisabled = isBlocked || (isAdminOnlyMessageMode && !isCurrentUserAdmin);

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (isMessagingDisabled) return;
    if (isBlocked) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (text.length > 0) {
      onTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    } else {
      onTyping(false);
    }
  };

  const handleSendText = () => {
    if (isMessagingDisabled) return; // Use isMessagingDisabled
    if (isBlocked) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping(false);

    const trimmedText = inputText.trim();
    if (trimmedText) {
      onSendText(trimmedText);
      setInputText('');
      setInputHeight(Platform.OS === 'ios' ? 40 : 38); // Reset height
      Keyboard.dismiss();
    }
  };

  const showSendButton = inputText.trim().length > 0;
  const placeholderText = isMessagingDisabled // Dynamic placeholder text
    ? (isAdminOnlyMessageMode ? "Only admins can send messages" : "Messaging disabled")
    : "Type a message...";

  return (
    <View style={[styles.container, { backgroundColor: theme.background2, borderTopColor: theme.borderLight }]}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onAttachmentPress} // Use the new prop
        
        //disabled={isBlocked}
        disabled={isMessagingDisabled} // Disable if messaging is disabled
      >
        <Attachment height={26} width={26} color={isBlocked ? theme.textTertiary : theme.iconSecondary} />
      </TouchableOpacity>
      <TextInput
        style={[
          styles.textInput,
          customTypography.body.regular,
          {
            color: isMessagingDisabled ? theme.textTertiary : theme.textPrimary, // Change color if disabled
            borderColor: theme.borderDefault,
            backgroundColor: isMessagingDisabled ? theme.background2 : theme.background1, // Change background if disabled
            height: Math.min(100, Math.max(Platform.OS === 'ios' ? 40 : 38, inputHeight)), // Dynamic height
            
          },
        ]}
        value={inputText}
        onChangeText={handleTextChange}
        placeholder={isBlocked ? "Messaging disabled" : "Type a message..."}
        placeholderTextColor={theme.textTertiary}
        multiline
        
        editable={!isMessagingDisabled} // Make editable based on isMessagingDisabled
        onContentSizeChange={(event) => {
          if (!isMessagingDisabled) { // Only adjust height if not disabled
            setInputHeight(event.nativeEvent.contentSize.height);
          }
        }}
      />
       
      {showSendButton && !isMessagingDisabled ? (
        <TouchableOpacity
          style={[
            styles.actionButtonContainer, // Use a general container for circle buttons
            { backgroundColor: theme.primary },
          ]}
          onPress={handleSendText}
        >
          <Icon name="send" type="material" color={theme.staticWhite} size={22} />
        </TouchableOpacity>
      ) : (
        // VoiceRecorderButton replaces send button when text input is empty
        <View style={styles.actionButtonContainer}>
             <VoiceRecorderButton
                theme={theme}
                onSendAudio={onSendAudio}
                isBlocked={isBlocked}
            />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align items to the bottom for multiline input
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    marginBottom: Platform.OS === 'android' ? 3 : 2, // Align with text input bottom
    justifyContent: 'center',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 40 : 38,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    marginHorizontal: 6,
    fontSize: 16,
    lineHeight: 20,
  },
  actionButtonContainer: { // Renamed from sendButton for general use (send/mic)
    width: Platform.OS === 'ios' ? 40 : 38,
    height: Platform.OS === 'ios' ? 40 : 38,
    borderRadius: Platform.OS === 'ios' ? 20 : 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5, // Adjusted margin
    marginBottom: Platform.OS === 'android' ? 2 : 0,
  },
});

export default MessageInput;