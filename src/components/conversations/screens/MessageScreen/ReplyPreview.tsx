import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { Icon } from '@rneui/themed';
import { CustomColors, customTypography } from '../../../../theme/theme';

interface ReplyPreviewProps {
    message: CometChat.BaseMessage;
    onClearReply: () => void;
    theme: CustomColors;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({
    message,
    onClearReply,
    theme,
}) => {
    const getMessageSnippet = (): string => {
        if (message instanceof CometChat.TextMessage && typeof message.getText === 'function') {
            return message.getText() || 'Text Message';
        } else if (message instanceof CometChat.MediaMessage && typeof message.getAttachment === 'function') {
            const attachment = message.getAttachment?.();
            return `Media: ${attachment?.getName?.() || message.getType?.() || 'Media'}`;
        } else if (message instanceof CometChat.CustomMessage && typeof message.getCustomData === 'function') {
            const customData = message.getCustomData() as { text?: string; message?: string; metadata?: any } | undefined;
            return customData?.text || customData?.message || 'Custom Message';
        } else if (message instanceof CometChat.Call && typeof message.getStatus === 'function') {
            return `Call: ${message.getStatus()}`;
        }
        return 'Message';
    };

    const getSenderName = (): string => {
        if ('getSender' in message && typeof (message as any).getSender === 'function') {
            const sender = (message as any).getSender();
            if (sender && typeof sender.getName === 'function') {
                return sender.getName() || 'User';
            }
        }
        return 'User';
    };

    const senderName = getSenderName();
    const messageSnippet = getMessageSnippet();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.background1, // Using background1 for a softer base
                    borderTopColor: theme.borderDefault, // Subtle border
                },
            ]}
        >
            <View
                style={[
                    styles.indicatorLine,
                    { backgroundColor: theme.primary },
                ]}
            />
            <View style={styles.contentContainer}>
                <Text style={[styles.replyToText, { color: theme.textPrimary }]} numberOfLines={1}>
                    Replying to <Text style={[styles.senderName, { color: theme.primary }]}>{senderName}</Text>
                </Text>
                <Text
                    style={[styles.messageSnippet, { color: theme.textSecondary }]}
                    numberOfLines={1}
                >
                    {messageSnippet}
                </Text>
            </View>
            <TouchableOpacity onPress={onClearReply} style={styles.closeButton}>
                <Icon
                    name="close-circle" // Changed to a more distinct close icon
                    type="material-community"
                    color={theme.textTertiary} // More subtle close icon color
                    size={24} // Slightly larger for better touch target
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16, // Increased padding to match typical input area
        paddingVertical: 12, // Increased padding
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    indicatorLine: {
        width: 4,
        borderRadius: 2,
        alignSelf: 'stretch',
        marginRight: 15, // Increased margin for better separation
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    replyToText: {
        ...customTypography.caption1.medium,
        fontSize: 14,
        marginBottom: 2,
    },
    senderName: {
        fontWeight: 'bold',
    },
    messageSnippet: {
        ...customTypography.caption1.regular,
        fontSize: 14,
    },
    closeButton: {
        padding: 8, // Larger touch area
        marginLeft: 10,
    },
});

export default ReplyPreview;