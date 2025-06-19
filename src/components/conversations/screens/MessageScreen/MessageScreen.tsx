import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    useColorScheme,
    ColorValue,
} from 'react-native';
import { useRoute, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';

import { ChatStackParamList } from '../../../../navigation/types';
import { SCREEN_CONSTANTS } from '../../../../utils/AppConstants';
import { useChatStore, ActiveChatParticipant } from '../../../../store/chatStore';
import { requestCameraPermission, requestStoragePermission } from '../../../../utils/helper';

import MessageHeader from './MessageHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ReplyPreview from './ReplyPreview';
import TypingIndicator from './TypingIndicator';
import MessageMenu from './MessageMenu';
import AttachmentPicker from '../AttachmentPicker/AttachmentPicker';

import { customThemeColorsDark, customThemeColorsLight } from '../../../../theme/theme';

type MessageScreenRouteProp = RouteProp<ChatStackParamList, typeof SCREEN_CONSTANTS.MESSAGES>;
type MessageScreenNavigationProp = StackNavigationProp<ChatStackParamList, typeof SCREEN_CONSTANTS.MESSAGES>;

const MessageScreen: React.FC = () => {
    const route = useRoute<MessageScreenRouteProp>();
    const navigation = useNavigation<MessageScreenNavigationProp>();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

    const { user: routeUserParam, group: routeGroupParam } = route.params || {};

    const {
        messages,
        activeChatInfo,
        loggedInUser: chatStoreLoggedInUser,
        replyMessage,
        isLoadingMessages,
        setActiveChatInfo,
        addMessage,
        updateFullMessage,
        setIsLoadingMessages,
        setHasMoreMessages,
        clearMessages,
        setMessages: setStoreMessages,
        setReplyMessage,
        setMessagesToForward,
    } = useChatStore();

    const [isTyping, setIsTyping] = useState(false);
    const [typingUserName, setTypingUserName] = useState<string | undefined>(undefined);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [isAttachmentPickerVisible, setIsAttachmentPickerVisible] = useState(false);
    const [isBlockedByMe, setIsBlockedByMe] = useState(routeUserParam?.blockedByMe || false);

    // Start Update: New state variables for admin-only message mode and current user's admin status
    const [isAdminOnlyMessageMode, setIsAdminOnlyMessageMode] = useState<boolean>(false);
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean>(false);
    // End Update

    // --- New Selection State --- 
    const [isSelectionMode, setIsSelectionMode] = useState(false); 
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set()); 

    const isGroupChat = !!routeGroupParam;
    const chatParticipant = routeUserParam || routeGroupParam;
    const receiverId = routeUserParam?.uid || routeGroupParam?.guid;
    const receiverType = isGroupChat ? CometChat.RECEIVER_TYPE.GROUP : CometChat.RECEIVER_TYPE.USER;

    const messagesRequestRef = useRef<CometChat.MessagesRequest | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listenerIdSuffix = useMemo(() => Date.now().toString(), []);

    // --- Selection Logic --- 
    const exitSelectionMode = () => { 
        setIsSelectionMode(false); 
        setSelectedMessages(new Set()); 
    }; 

    const handleMessagePress = (message: CometChat.BaseMessage) => { 
        if (isSelectionMode) { 
            const messageId = message.getId().toString(); 
            const newSelectedMessages = new Set(selectedMessages); 
            if (newSelectedMessages.has(messageId)) { 
                newSelectedMessages.delete(messageId); 
            } else { 
                newSelectedMessages.add(messageId); 
            } 

            if (newSelectedMessages.size === 0) { 
                exitSelectionMode(); 
            } else { 
                setSelectedMessages(newSelectedMessages); 
            } 
        } 
    }; 

    const handleMessageLongPress = (message: CometChat.BaseMessage) => { 
        if (!isSelectionMode) { 
            setIsSelectionMode(true); 
            setSelectedMessages(new Set([message.getId().toString()])); 
        } 
    }; 
     
    const handleDeleteSelected = () => { 
        Alert.alert( 
            `Delete ${selectedMessages.size} Message(s)?`, 
            "This action cannot be undone.", 
            [ 
                { text: "Cancel", style: "cancel" }, 
                { 
                    text: "Delete for Everyone", style: "destructive", 
                    onPress: async () => { 
                        const deletePromises = Array.from(selectedMessages).map(id => CometChat.deleteMessage(id)); 
                        try { 
                            await Promise.all(deletePromises); 
                            Alert.alert("Success", "Messages deleted."); 
                        } catch (error) { 
                            console.error("Error deleting messages: ", error); 
                            Alert.alert("Error", "Could not delete all selected messages."); 
                        } finally { 
                            exitSelectionMode(); 
                        } 
                    }, 
                }, 
            ] 
        ); 
    }; 

    const handleForwardSelected = () => { 
        const messagesToForward = messages.filter(msg => selectedMessages.has(msg.getId().toString())); 
        if (messagesToForward.length > 0) { 
            setMessagesToForward(messagesToForward.reverse()); 
            exitSelectionMode(); 
            navigation.navigate(SCREEN_CONSTANTS.FORWARD_SELECTION_SCREEN); 
        } 
    }; 
    // --- End Selection Logic --- 

    const clearTypingTimeout = useCallback(() => { 
        if (typingTimeoutRef.current) { 
            clearTimeout(typingTimeoutRef.current); 
            typingTimeoutRef.current = null; 
        } 
    }, []); 

    const fetchMessages = useCallback(async (initialFetch = false) => { 
        if (!receiverId) return; 
        if (useChatStore.getState().isLoadingMessages && !initialFetch) return; 
        setIsLoadingMessages(true); 

        if (initialFetch || !messagesRequestRef.current) { 
            const builder = new CometChat.MessagesRequestBuilder() 
                .setLimit(30) 
                .setCategories([CometChat.CATEGORY_MESSAGE, CometChat.CATEGORY_CUSTOM, CometChat.CATEGORY_ACTION]) 
                .setTypes([ 
                    CometChat.MESSAGE_TYPE.TEXT, CometChat.MESSAGE_TYPE.IMAGE, CometChat.MESSAGE_TYPE.VIDEO, 
                    CometChat.MESSAGE_TYPE.AUDIO, CometChat.MESSAGE_TYPE.FILE, CometChat.MESSAGE_TYPE.CUSTOM, 
                ]) 
                .hideMessagesFromBlockedUsers(true); 

            if (isGroupChat) { 
                builder.setGUID(receiverId); 
            } else { 
                builder.setUID(receiverId); 
            } 
            messagesRequestRef.current = builder.build(); 
        } 
         
        try { 
            const fetchedMsgs = await messagesRequestRef.current.fetchPrevious(); 
            const newMsgs = fetchedMsgs ? fetchedMsgs.reverse() : []; 
             
            if (initialFetch) { 
                setStoreMessages(newMsgs); 
            } else { 
                setStoreMessages([...newMsgs, ...useChatStore.getState().messages]); 
            } 
            setHasMoreMessages(newMsgs.length >= 30); 
        } catch (error) { 
            console.error("Error fetching messages:", error); 
            Alert.alert("Error", "Could not fetch messages."); 
        } finally { 
            setIsLoadingMessages(false); 
        } 
    }, [receiverId, isGroupChat, setHasMoreMessages, setIsLoadingMessages, setStoreMessages]); 

    // Start Update: New function to fetch latest group details and update states
    const fetchLatestGroupDetails = useCallback(async () => {
        if (!isGroupChat || !receiverId || !chatStoreLoggedInUser) {
            setIsAdminOnlyMessageMode(false);
            setIsCurrentUserAdmin(false);
            return;
        }
        try {
            const fetchedGroup = await CometChat.getGroup(receiverId);
            const metadata = fetchedGroup.getMetadata() as { adminOnlyMessageMode?: boolean } | null;
            setIsAdminOnlyMessageMode(metadata?.adminOnlyMessageMode || false);

            const currentUserScope = fetchedGroup.getScope(); // Get current user's scope directly from fetched group
            setIsCurrentUserAdmin(
                currentUserScope === CometChat.GROUP_MEMBER_SCOPE.ADMIN ||
                currentUserScope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR
            );
        } catch (error) {
            console.error("Error fetching latest group details:", error);
            setIsAdminOnlyMessageMode(false);
            setIsCurrentUserAdmin(false);
        }
    }, [isGroupChat, receiverId, chatStoreLoggedInUser]);
    // End Update

    useEffect(() => { 
        if (chatParticipant && receiverId) { 
            const participantInfo: ActiveChatParticipant = { 
                id: receiverId, 
                type: isGroupChat ? 'group' : 'user', 
                name: chatParticipant.name, 
                avatar: isGroupChat ? routeGroupParam?.icon : routeUserParam?.avatar, 
                status: isGroupChat ? undefined : routeUserParam?.status, 
                isBlockedByMe: isGroupChat ? false : routeUserParam?.blockedByMe, 
            }; 
            setActiveChatInfo(participantInfo); 
            if (!isGroupChat) setIsBlockedByMe(routeUserParam?.blockedByMe || false); 

            // Start Update: Call the new function to fetch latest group details here
            fetchLatestGroupDetails();
            // End Update

            clearMessages(); 
            fetchMessages(true); 
        } 
        return () => { 
            setActiveChatInfo(null); 
            clearMessages(); 
            clearTypingTimeout(); 
        }; 
    // Start Update: Add fetchLatestGroupDetails to dependencies to re-run when group details might be needed
    }, [chatParticipant?.name, receiverId, isGroupChat, routeGroupParam, routeUserParam, chatStoreLoggedInUser, fetchLatestGroupDetails]);
    // End Update

    const isMessageForCurrentChat = useCallback((message: CometChat.BaseMessage): boolean => {
        const messageReceiverId = message.getReceiverId();
        const messageSenderId = message.getSender()?.getUid();
        const loggedInUserId = chatStoreLoggedInUser?.getUid();

        if (message.getReceiverType() === 'group') {
            return messageReceiverId === receiverId;
        } else {
            return (messageSenderId === receiverId && messageReceiverId === loggedInUserId) || (messageSenderId === loggedInUserId && messageReceiverId === receiverId);
        }
    }, [receiverId, chatStoreLoggedInUser]);

    useEffect(() => {
        if (!receiverId) return;

        const listenerID = `MSG_LISTENER_${receiverId}_${listenerIdSuffix}`;
        const messageListener = new CometChat.MessageListener({
            onTextMessageReceived: (msg: CometChat.TextMessage) => { if (isMessageForCurrentChat(msg)) addMessage(msg); },
            onMediaMessageReceived: (msg: CometChat.MediaMessage) => { if (isMessageForCurrentChat(msg)) addMessage(msg); },
            onCustomMessageReceived: (msg: CometChat.CustomMessage) => { if (isMessageForCurrentChat(msg)) addMessage(msg); },
            onMessageEdited: (msg: CometChat.BaseMessage) => { if (isMessageForCurrentChat(msg)) updateFullMessage(msg); },
            onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => {
                if (isMessageForCurrentChat(deletedMessage)) {
                    updateFullMessage(deletedMessage);
                }
            },
            onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
                if (isMessageForCurrentChat(typingIndicator as any)) {
                    setTypingUserName(typingIndicator.getSender().getName());
                    setIsTyping(true);
                    clearTypingTimeout();
                    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
                }
            },
            onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
                if (isMessageForCurrentChat(typingIndicator as any)) {
                    setIsTyping(false);
                    clearTypingTimeout();
                }
            },
        });
        CometChat.addMessageListener(listenerID, messageListener);

        return () => {
            CometChat.removeMessageListener(listenerID);
            clearTypingTimeout();
        };
    }, 
    [
        receiverId,
        listenerIdSuffix,
        isMessageForCurrentChat,
        addMessage,
        updateFullMessage,
        clearTypingTimeout,
        setIsTyping,
        setTypingUserName
    ]); 
     
    useFocusEffect( 
        useCallback(() => { 
            const lastMessage = messages[0]; 
            if (receiverId && lastMessage?.getReadAt && !lastMessage.getReadAt()) { 
                CometChat.markAsRead(lastMessage); 
            } 
            // Start Update: Refetch group details on focus as well, in case settings changed outside this screen
            fetchLatestGroupDetails();
            // End Update
        // Start Update: Add fetchLatestGroupDetails to dependencies
        }, [receiverId, messages, fetchLatestGroupDetails])
        // End Update
    ); 

    const handleSendTextMessage = async (text: string) => { 
        if (!text.trim() || !receiverId) return; 
        if (!isGroupChat && isBlockedByMe) { 
            Alert.alert("Cannot Send", "This user is blocked."); 
            return; 
        } 
        // Start Update: Prevent sending messages if admin-only mode is active and user is not admin
        if (isGroupChat && isAdminOnlyMessageMode && !isCurrentUserAdmin) {
            Alert.alert("Cannot Send", "Only admins can send messages in this group.");
            return;
        }
        // End Update

        const messageObject = new CometChat.TextMessage(receiverId, text.trim(), receiverType); 
        if (replyMessage) { 
            messageObject.setMetadata({ replyTo: replyMessage.getId() }); 
            setReplyMessage(null); 
        } 
        try { 
            const sentMessage = await CometChat.sendMessage(messageObject); 
            addMessage(sentMessage); 
        } catch (error) { 
            console.error("Error sending text message:", error); 
            Alert.alert("Error", "Could not send message."); 
        } 
    }; 

    const handleSendAudio = async (path: string, duration: number, mimeType: string) => { 
        if (!receiverId) return; 
        // Start Update: Prevent sending messages if admin-only mode is active and user is not admin
        if (isGroupChat && isAdminOnlyMessageMode && !isCurrentUserAdmin) {
            Alert.alert("Cannot Send", "Only admins can send messages in this group.");
            return;
        }
        // End Update
        const file = { uri: path, name: `audio_${Date.now()}.mp3`, type: mimeType }; 
        const audioMessage = new CometChat.MediaMessage(receiverId, file as any, CometChat.MESSAGE_TYPE.AUDIO, receiverType); 
        audioMessage.setMetadata({ duration }); 
        try { 
            const sentMessage = await CometChat.sendMessage(audioMessage); 
            addMessage(sentMessage); 
        } catch (error) { 
            console.error("Error sending audio:", error); 
        } 
    }; 
     
    const handleTypingNotification = (isCurrentlyTyping: boolean) => { 
        if (!receiverId || (!isGroupChat && isBlockedByMe)) return; 
        // Start Update: Prevent typing if admin-only mode is active and user is not admin
        if (isGroupChat && isAdminOnlyMessageMode && !isCurrentUserAdmin) {
            return;
        }
        // End Update

        const typingIndicator = new CometChat.TypingIndicator(receiverId, receiverType); 
        if (isCurrentlyTyping) { 
            CometChat.startTyping(typingIndicator); 
        } else { 
            CometChat.endTyping(typingIndicator); 
        } 
    }; 

    const handleSendMediaMessage = async (fileUri: string, fileType: string, messageType: "image" | "video" | "file") => { 
        if (!receiverId) return; 

        // Start Update: Prevent sending messages if admin-only mode is active and user is not admin
        if (isGroupChat && isAdminOnlyMessageMode && !isCurrentUserAdmin) {
            Alert.alert("Cannot Send", "Only admins can send messages in this group.");
            return;
        }
        // End Update
        const cometChatMessageType = { 
            image: CometChat.MESSAGE_TYPE.IMAGE, 
            video: CometChat.MESSAGE_TYPE.VIDEO, 
            file: CometChat.MESSAGE_TYPE.FILE, 
        }[messageType]; 
        const mediaMessage = new CometChat.MediaMessage( 
            receiverId, { uri: fileUri, type: fileType, name: fileUri.split('/').pop() || `file-${Date.now()}` } as any, 
            cometChatMessageType, receiverType 
        ); 
        try { 
            const sentMessage = await CometChat.sendMessage(mediaMessage); 
            addMessage(sentMessage); 
        } catch (error) { 
            console.error(`Error sending ${messageType}:`, error); 
            Alert.alert('Send Error', `Could not send the ${messageType}.`); 
        } 
    }; 

    const handleAttachmentPress = async () => { 
        // Start Update: Prevent attachment picker if admin-only mode is active and user is not admin
        if (isGroupChat && isAdminOnlyMessageMode && !isCurrentUserAdmin) {
            Alert.alert("Cannot Attach", "Only admins can send messages in this group.");
            return;
        }
        // End Update
        await requestCameraPermission(); 
        await requestStoragePermission(); 
        setIsAttachmentPickerVisible(true); 
    }; 

    const launchGalleryPicker = () => launchImageLibrary({ mediaType: 'photo' }, onImagePickerResponse); 
    const launchCameraPicker = () => launchCamera({ mediaType: 'photo', saveToPhotos: true }, onImagePickerResponse); 
    const onImagePickerResponse = (response: ImagePickerResponse) => { 
        if (response.didCancel) return; 
        if (response.errorCode) return Alert.alert("Error", `Picker Error: ${response.errorMessage}`); 
        if (response.assets && response.assets.length > 0) { 
            const asset = response.assets[0]; 
            if (asset.uri && asset.type) handleSendMediaMessage(asset.uri, asset.type, 'image'); 
        } 
    }; 

    const launchDocumentPicker = async () => { 
        try { 
            const result: DocumentPickerResponse = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.allFiles] }); 
            if (result.uri && result.type) handleSendMediaMessage(result.uri, result.type, 'file'); 
        } catch (err) { 
            if (!DocumentPicker.isCancel(err)) console.error('Document picker error:', err); 
        } 
    }; 

    // Updated handleAttachmentSelect to accept all expected types from AttachmentPicker 
    const handleAttachmentSelect = (type: 'camera' | 'gallery' | 'document' | 'audio' | 'contact' | 'poll') => { 
        setIsAttachmentPickerVisible(false); 
        if (type === 'gallery') { 
            launchGalleryPicker(); 
        } else if (type === 'camera') { 
            launchCameraPicker(); 
        } else if (type === 'document') { 
            launchDocumentPicker(); 
        } else { 
            // Placeholder for other types if AttachmentPicker offers them 
            // You'll need to implement actual sending logic for these 
            Alert.alert("Feature Not Implemented", `Sending ${type} is not yet supported.`); 
        } 
    }; 

    const handleViewProfile = () => { 
        setIsMenuVisible(false); 
        if (isGroupChat && routeGroupParam) navigation.navigate(SCREEN_CONSTANTS.GROUP_INFO, { group: routeGroupParam }); 
        else if (!isGroupChat && routeUserParam) navigation.navigate(SCREEN_CONSTANTS.USER_INFO, { user: routeUserParam }); 
    }; 
     
    const handleBlockUser = async () => { 
        if (isGroupChat || !routeUserParam) return; 
        setIsMenuVisible(false); 
        const action = isBlockedByMe ? CometChat.unblockUsers : CometChat.blockUsers; 
        const alertMsg = isBlockedByMe ? "User Unblocked" : "User Blocked"; 
        try { 
            await action([routeUserParam.uid]); 
            Alert.alert("Success", alertMsg); 
            setIsBlockedByMe(!isBlockedByMe); 
            if (activeChatInfo) setActiveChatInfo({ ...activeChatInfo, isBlockedByMe: !isBlockedByMe }); 
        } catch (error) { 
            Alert.alert("Error", "Could not update block status."); 
        } 
    }; 

    if (!activeChatInfo || !chatStoreLoggedInUser) { 
        return ( 
            <View style={[styles.centeredContainer, { backgroundColor: theme.background1 }]}> 
                <ActivityIndicator size="large" color={theme.primary} /> 
            </View> 
        ); 
    } 

    // Start Update: Conditional rendering for MessageInput based on admin-only mode
    const shouldShowMessageInput = !(isGroupChat && isAdminOnlyMessageMode && !isCurrentUserAdmin);
    // End Update

    return ( 
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}> 
            <View style={[styles.innerContainer, { backgroundColor: theme.background1 }]}> 
                <MessageHeader 
                    participant={activeChatInfo} 
                    onBackPress={isSelectionMode ? exitSelectionMode : navigation.goBack} 
                    onMenuPress={() => setIsMenuVisible(true)} 
                    theme={theme} 
                    isSelectionMode={isSelectionMode} 
                    selectionCount={selectedMessages.size} 
                    onCancelSelection={exitSelectionMode} 
                    onDeleteSelected={handleDeleteSelected} 
                    onForwardSelected={handleForwardSelected} 
                /> 
                 
                {!isSelectionMode && isTyping && <TypingIndicator isTyping={isTyping} userName={isGroupChat ? typingUserName : undefined} theme={theme} />} 

                <MessageList 
                    messages={messages} 
                    currentUser={chatStoreLoggedInUser} 
                    selectedMessages={selectedMessages} 
                    onLoadMore={() => fetchMessages(false)} 
                    isLoading={isLoadingMessages && messages.length === 0} 
                    hasMore={useChatStore.getState().hasMoreMessages} 
                    theme={theme} 
                    onPressMessage={handleMessagePress} 
                    onLongPressMessage={handleMessageLongPress} 
                /> 

                {/* Start Update: Conditionally render MessageInput */}
                {!isSelectionMode && shouldShowMessageInput && (
                    <> 
                        {replyMessage && <ReplyPreview message={replyMessage} onClearReply={() => setReplyMessage(null)} theme={theme} />} 
                        <MessageInput 
                            onSendText={handleSendTextMessage} 
                            onSendAudio={handleSendAudio} 
                            theme={theme} 
                            onTyping={handleTypingNotification} 
                            isBlocked={!isGroupChat && isBlockedByMe} 
                            onAttachmentPress={handleAttachmentPress} 
                            isAdminOnlyMessageMode={isGroupChat ? isAdminOnlyMessageMode : false}
                            isCurrentUserAdmin={isCurrentUserAdmin}
                        /> 
                    </> 
                )}
                {/* End Update: Conditionally render MessageInput */}

                <MessageMenu 
                    isVisible={isMenuVisible} 
                    onClose={() => setIsMenuVisible(false)} 
                    onViewProfile={handleViewProfile} 
                    onSearch={() => Alert.alert("Search", "To be implemented")} 
                    onBlockUser={isGroupChat ? undefined : handleBlockUser} 
                    theme={theme} 
                    participant={activeChatInfo} 
                    isBlocked={!isGroupChat && isBlockedByMe} 
                /> 
                <AttachmentPicker 
                    isVisible={isAttachmentPickerVisible} 
                    onClose={() => setIsAttachmentPickerVisible(false)} 
                    onSelect={handleAttachmentSelect} // This now matches the broader expected type 
                    theme={theme} 
                /> 
            </View> 
        </KeyboardAvoidingView> 
    ); 
}; 

const styles = StyleSheet.create({ 
    container: { flex: 1 }, 
    innerContainer: { flex: 1 }, 
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }, 
}); 

export default MessageScreen;