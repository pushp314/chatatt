
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Avatar, Icon } from '@rneui/themed';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { customThemeColorsDark, customThemeColorsLight } from '../../../theme/theme';

interface IncomingCallViewProps {
    call: CometChat.Call;
    onAccept: (call: CometChat.Call) => void;
    onDecline: (call: CometChat.Call) => void;
}

const IncomingCallView: React.FC<IncomingCallViewProps> = ({ call, onAccept, onDecline }) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

    const caller = call.getCallInitiator();
    const callerName = caller.getName();
    const callerAvatar = caller.getAvatar();

    return (
        <View style={styles.overlay}>
            <View style={[styles.container, { backgroundColor: theme.backgroundElevated }]}>
                <Text style={[styles.title, { color: theme.textSecondary }]}>Incoming Audio Call</Text>
                <Avatar
                    rounded
                    size={100}
                    source={callerAvatar ? { uri: callerAvatar } : undefined}
                    icon={!callerAvatar ? { name: 'person', type: 'material', color: theme.staticWhite, size: 60 } : undefined}
                    containerStyle={[styles.avatar, !callerAvatar && { backgroundColor: theme.primaryLight }]}
                />
                <Text style={[styles.callerName, { color: theme.textPrimary }]}>{callerName}</Text>
                
                <View style={styles.controlsContainer}>
                    <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: '#e74c3c' }]}
                        onPress={() => onDecline(call)}
                    >
                        <Icon name="call-end" type="material" color="white" size={30} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: '#2ecc71' }]}
                        onPress={() => onAccept(call)}
                    >
                        <Icon name="call" type="material" color="white" size={30} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
    },
    container: {
        width: '85%',
        maxWidth: 350,
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    title: {
        fontSize: 16,
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    avatar: {
        marginBottom: 15,
    },
    callerName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default IncomingCallView;






