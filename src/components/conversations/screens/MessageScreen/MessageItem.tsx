// src/components/conversations/screens/MessageScreen/MessageItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { Icon } from '@rneui/themed';
import { CustomColors, customTypography } from '../../../../theme/theme';

import VoiceMessagePlayer from '../VoiceRecorder/VoiceMessagePlayer';
import FileAttachment from './FileAttachment';

interface ReplyMetadata {
    replyTo?: string | number;
    repliedMessageText?: string;
    repliedMessageSender?: string;
    originalSenderUID?: string;
    originalMessageType?: string;
}
interface CustomMessagePayload {
    text?: string;
    message?: string;
    metadata?: ReplyMetadata;
}
export interface MessageItemProps {
    message: CometChat.BaseMessage;
    isMyMessage: boolean;
    currentUser: CometChat.User;
    theme: CustomColors;
    isSelected: boolean; // NEW
    onPress: (message: CometChat.BaseMessage) => void; // NEW
    onLongPress: (message: CometChat.BaseMessage) => void; // NEW
}

const MessageItem: React.FC<MessageItemProps> = ({
    message,
    isMyMessage,
    theme,
    isSelected,
    onPress,
    onLongPress,
}) => {
    const formatTime = (timestamp: number): string => {
        if (!timestamp) return '';
        return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const handlePress = () => onPress(message);
    const handleLongPress = () => onLongPress(message);
    
    const renderDeletedMessage = () => (
        <View style={[ styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble, styles.deletedBubble, { backgroundColor: isMyMessage ? theme.primaryLight : theme.background2, borderColor: theme.borderDefault } ]}>
            <Icon name="not-interested" type="material" size={16} color={theme.textTertiary} style={styles.deletedIcon} />
            <Text style={[styles.deletedText, { color: theme.textTertiary }]}>This message was deleted</Text>
            <Text style={[styles.timestamp, styles.deletedTimestampInfo, { color: theme.textTertiary }]}>{formatTime(message.getSentAt())}</Text>
        </View>
    );

    const renderReceipts = () => {
        if (!isMyMessage) return null;
        let iconName = 'check';
        let iconColor = theme.textTertiary;
        if (message.getReadAt()) {
            iconName = 'done-all';
            iconColor = theme.primary;
        } else if (message.getDeliveredAt()) {
            iconName = 'done-all';
        }
        return <Icon name={iconName} type="material" size={15} color={iconColor} containerStyle={styles.receiptIcon} />;
    };

    const renderContent = () => {
        let mainMessageContent: React.ReactNode = null;
        const messageTextColor = isMyMessage ? theme.staticWhite : theme.textPrimary;

        if (message instanceof CometChat.TextMessage) {
            mainMessageContent = <Text style={[styles.messageText, { color: messageTextColor }]}>{message.getText()}</Text>;
        
        } else if (message instanceof CometChat.MediaMessage) {
            const mediaType = message.getType();
            const mediaUrl = message.getAttachment()?.getUrl();
            const fileName = message.getAttachment()?.getName() || 'File';
            
            if (mediaType === 'image' && mediaUrl) {
                mainMessageContent = <Image source={{ uri: mediaUrl }} style={styles.imageAttachment} resizeMode="cover" />;
            } else if (mediaType === 'audio' && mediaUrl) {
                mainMessageContent = <VoiceMessagePlayer uri={mediaUrl} audioUrl={mediaUrl} messageId={message.getId()} isMyMessage={isMyMessage} theme={theme} />;
            } else if (mediaType === 'file' && mediaUrl) {
                mainMessageContent = <FileAttachment fileName={fileName} fileUrl={mediaUrl} theme={theme} isMyMessage={isMyMessage} />;
            } else {
                mainMessageContent = <Text style={[styles.messageText, { color: messageTextColor }]}>{`Unsupported Media: ${fileName}`}</Text>;
            }
        
        } else if (message instanceof CometChat.CustomMessage) {
            const customPayload = message.getCustomData() as CustomMessagePayload | undefined;
            const messageText = customPayload?.text || customPayload?.message || "Custom Message";
            mainMessageContent = <Text style={[styles.messageText, { color: messageTextColor }]}>{messageText}</Text>;
            
        } else if (message.getCategory() === CometChat.CATEGORY_ACTION) {
            const actionMessage = (message as CometChat.Action).getMessage();
            return (
                <View style={[styles.actionMessageContainer, { backgroundColor: theme.background2 }]}>
                    <Text style={[styles.actionText, { color: theme.textSecondary }]}>{actionMessage}</Text>
                </View>
            );
        }

        return mainMessageContent;
    };

    if (message.getDeletedAt()) return renderDeletedMessage();
    if (message.getCategory() === CometChat.CATEGORY_ACTION) return renderContent();

    const isMedia = message instanceof CometChat.MediaMessage;
    const isOnlyText = message instanceof CometChat.TextMessage;
    
    return (
        <TouchableOpacity activeOpacity={0.8} onPress={handlePress} onLongPress={handleLongPress} style={[styles.messageBubbleContainer, isMyMessage ? styles.myMessageBubbleContainer : styles.theirMessageBubbleContainer]}>
            <View style={[ styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble, { backgroundColor: isMyMessage && isOnlyText ? theme.primary : theme.background2 }, isMedia && styles.mediaBubble, Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, }, android: { elevation: 1, }, }), ]}>
                {renderContent()}
                <View style={styles.footerContainer}>
                    {message.getEditedAt() && (<Text style={[styles.editedText, { color: isMyMessage ? theme.primaryLight : theme.textTertiary }]}>(edited)</Text>)}
                    <Text style={[styles.timestamp, { color: isMyMessage ? (isOnlyText ? theme.primaryLight : theme.textTertiary) : theme.textTertiary }]}>{formatTime(message.getSentAt())}</Text>
                    {renderReceipts()}
                </View>
            </View>
            {isSelected && <View style={[StyleSheet.absoluteFill, styles.selectionOverlay, { backgroundColor: theme.selection }]} />}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    messageBubbleContainer: { marginVertical: 2, marginHorizontal: 10, maxWidth: '80%', },
    myMessageBubbleContainer: { alignSelf: 'flex-end', },
    theirMessageBubbleContainer: { alignSelf: 'flex-start', },
    messageBubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, minWidth: 80, },
    myMessageBubble: { borderBottomRightRadius: 6, },
    theirMessageBubble: { borderBottomLeftRadius: 6, },
    mediaBubble: { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden', },
    imageAttachment: { width: 250, height: 250, },
    deletedBubble: { flexDirection: 'row', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderRadius: 18, minWidth: 150, },
    deletedIcon: { marginRight: 5, },
    deletedText: { ...customTypography.body.regular, fontStyle: 'italic', fontSize: 14, },
    deletedTimestampInfo: { marginLeft: 'auto', fontSize: 11, },
    messageText: { ...customTypography.body.regular, fontSize: 15, lineHeight: 22, },
    footerContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4, },
    timestamp: { fontSize: 11, marginRight: 5, },
    editedText: { fontSize: 11, fontStyle: 'italic', marginRight: 5, },
    receiptIcon: { },
    actionMessageContainer: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, marginVertical: 8, },
    actionText: { ...customTypography.caption1.regular, fontStyle: 'italic', textAlign: 'center', fontSize: 13, },
    selectionOverlay: { borderRadius: 18, }
});

export default React.memo(MessageItem);