// src/components/conversations/screens/MessageScreen/MessageList.tsx
import React, { useRef } from 'react';
import { FlatList, View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import MessageItem from './MessageItem';
import { CustomColors, customTypography } from '../../../../theme/theme';

export interface MessageListProps {
    messages: CometChat.BaseMessage[];
    currentUser: CometChat.User;
    selectedMessages: Set<string>; // **FIX:** Changed from Set<number> to Set<string>
    onLoadMore: () => void;
    isLoading: boolean;
    hasMore: boolean;
    theme: CustomColors;
    onPressMessage: (message: CometChat.BaseMessage) => void;
    onLongPressMessage: (message: CometChat.BaseMessage) => void;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    currentUser,
    selectedMessages,
    onLoadMore,
    isLoading,
    hasMore,
    theme,
    onPressMessage,
    onLongPressMessage,
}) => {
    const flatListRef = useRef<FlatList>(null);

    const renderMessageItem = ({ item }: { item: CometChat.BaseMessage }) => {
        const isMyMessage = item.getSender()?.getUid() === currentUser.getUid();
        // **FIX:** Check selection using string ID
        const isSelected = selectedMessages.has(item.getId().toString());
        return (
            <MessageItem
                message={item}
                isMyMessage={isMyMessage}
                currentUser={currentUser}
                theme={theme}
                isSelected={isSelected}
                onPress={onPressMessage}
                onLongPress={onLongPressMessage}
            />
        );
    };

    const ListHeader = () => {
        if (!hasMore) {
            return (
                <View style={styles.noMoreMessagesContainer}>
                    <Text style={[styles.noMoreMessagesText, { color: theme.textTertiary }]}>
                        This is the beginning of your conversation.
                    </Text>
                </View>
            );
        }
        if (isLoading) {
            return (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                </View>
            );
        }
        return null;
    };

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={item => String(item.getId())}
            inverted={messages.length > 0}
            onEndReached={hasMore && !isLoading ? onLoadMore : null}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={() => (
                !isLoading && (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            No messages yet. Start the conversation!
                        </Text>
                    </View>
                )
            )}
            style={styles.list}
            contentContainerStyle={messages.length === 0 ? styles.emptyListContainer : styles.listContentContainer}
            extraData={selectedMessages}
        />
    );
};

const styles = StyleSheet.create({
    list: {
        flex: 1,
        paddingHorizontal: Platform.OS === 'android' ? 0 : 4,
    },
    listContentContainer: {
        paddingVertical: 10,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderContainer: {
        padding: 20,
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        ...customTypography.body.regular,
        textAlign: 'center',
    },
    noMoreMessagesContainer: {
        padding: 20,
        alignItems: 'center',
    },
    noMoreMessagesText: {
        ...customTypography.caption1.regular,
        fontStyle: 'italic',
    },
});

export default MessageList;