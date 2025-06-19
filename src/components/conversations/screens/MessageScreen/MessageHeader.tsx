import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Avatar, Icon } from '@rneui/themed';
import { ActiveChatParticipant } from '../../../../store/chatStore';
import { CustomColors, customTypography } from '../../../../theme/theme';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../navigation/types';
import { useCallStore } from '../../../../store/callStore';

interface MessageHeaderProps {
    participant: ActiveChatParticipant;
    onBackPress: () => void;
    onMenuPress: () => void;    theme: CustomColors;
    isSelectionMode: boolean;
    selectionCount: number;    onCancelSelection: () => void;
    onDeleteSelected: () => void;
    onForwardSelected: () => void;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({
    participant,
    onBackPress,
    onMenuPress,
    theme,
    isSelectionMode,
    selectionCount,
    onCancelSelection,
    onDeleteSelected,
    onForwardSelected
}) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { initiateCall } = useCallStore();

    const handleInitiateAudioCall = () => {
        if (participant.type === 'group') {
            Alert.alert("Feature Not Available", "Group calling is not supported yet.");
            return;
        }
        initiateCall(participant.id, CometChat.RECEIVER_TYPE.USER);
    };

  

    const getStatusColor = (status?: string) => {
        if (status === CometChat.USER_STATUS.ONLINE) {
            return theme.primary;
        }
        return theme.textTertiary;
    };

    const renderSelectionHeader = () => (
        <View style={[styles.container, { backgroundColor: theme.background1, borderBottomColor: theme.borderLight }]}>
            <TouchableOpacity onPress={onCancelSelection} style={styles.touchable}>
                <Icon name="close" type="material" color={theme.textPrimary} size={28} />
            </TouchableOpacity>
            <Text style={[styles.selectionCount, { color: theme.textPrimary }]}>{selectionCount}</Text>
            <View style={styles.actionIconsContainer}>
                <TouchableOpacity onPress={onForwardSelected} style={styles.touchable}>
                    <Icon name="forward" type="material" color={theme.textPrimary} size={26} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDeleteSelected} style={styles.touchable}>
                    <Icon name="delete" type="material" color={theme.textPrimary} size={26} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onMenuPress} style={styles.touchable}>
                    <Icon name="more-vert" type="material" color={theme.textPrimary} size={26} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderNormalHeader = () => (
        <View style={[styles.container, { backgroundColor: theme.background1, borderBottomColor: theme.borderLight }]}>
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
                <Icon name="arrow-back" type="material" color={theme.textPrimary} size={28} />
            </TouchableOpacity>
            <View style={styles.participantInfoContainer}>
                {participant.avatar ? (
                    <Avatar
                        rounded
                        source={{ uri: participant.avatar }}
                        size={40}
                        containerStyle={styles.avatar}
                    />
                ) : (
                    <Avatar
                        rounded
                        icon={{ name: 'person', type: 'material', color: theme.staticWhite }}
                        size={40}
                        containerStyle={[styles.avatar, { backgroundColor: theme.primaryLight }]}
                    />
                )}
                <View style={styles.nameStatusContainer}>
                    <Text style={[styles.participantName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {String(participant.name) || 'User'}
                    </Text>
                    {participant.type === 'user' && participant.status && (
                        <Text style={[styles.participantStatus, { color: getStatusColor(participant.status) }]}>
                            {participant.status === CometChat.USER_STATUS.ONLINE ? 'Online' : 'Offline'}
                        </Text>
                    )}
                </View>
            </View>
            <View style={styles.actionsContainer}>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleInitiateAudioCall}>
                    <Icon name="call" type="material" color={theme.textPrimary} size={24} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onMenuPress}>
                    <Icon name="more-vert" type="material" color={theme.textPrimary} size={26} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return isSelectionMode ? renderSelectionHeader() : renderNormalHeader();
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: Platform.OS === 'ios' ? 10 : 12,
        height: Platform.OS === 'ios' ? 90 : 70,
        paddingTop: Platform.OS === 'ios' ? 40 : 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    avatar: {
        marginRight: 12,
    },
    participantInfoContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        overflow: 'hidden',
    },
    nameStatusContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    participantName: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    participantStatus: {
        fontSize: 13,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: Platform.OS === 'android' ? 5 : 8,
    },
    // Selection header styles
    touchable: {
        padding: 5,
    },
    selectionCount: {
        flex: 1,
        marginLeft: 20,
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionIconsContainer: {
        flexDirection: 'row',
        gap: 15,
    }
});

export default MessageHeader;




