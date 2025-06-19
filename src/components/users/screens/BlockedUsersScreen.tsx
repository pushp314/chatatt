import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, useColorScheme } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar, ListItem } from '@rneui/themed';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { userService } from '../../../services/userService';
import { customThemeColorsLight, customThemeColorsDark, customTypography } from '../../../theme/theme';

const BlockedUsersScreen: React.FC = () => {
    const [blockedUsers, setBlockedUsers] = useState<CometChat.User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

    const fetchBlockedUsers = async () => {
        setIsLoading(true);
        try {
            const users = await userService.getBlockedUsers();
            setBlockedUsers(users);
        } catch (error) {
            console.error("Failed to fetch blocked users:", error);
            Alert.alert("Error", "Could not load blocked users.");
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBlockedUsers();
        }, [])
    );

    // --- THIS IS THE UPDATED UNBLOCK HANDLER ---
    const handleUnblock = async (userToUnblock: CometChat.User) => {
        const userId = userToUnblock.getUid();
        try {
            // Show a loading state specifically for the unblock action
            setIsLoading(true);

            // Step 1: Tell CometChat to unblock the user
            await CometChat.unblockUsers([userId]);
            
            // Step 2: Tell your backend server to unblock the user
            await userService.unblockUserAPI(userId);

            // If both are successful, show an alert
            Alert.alert("User Unblocked", `${userToUnblock.getName()} has been unblocked.`);
            
            // Step 3: Finally, refetch the list from the server to update the UI.
            // The user will now be gone permanently from the list.
            await fetchBlockedUsers();

        } catch (error) {
            console.error("Error during unblock process:", error);
            Alert.alert("Error", "Could not unblock the user. Please try again.");
            // If there was an error, stop the loading indicator
            setIsLoading(false);
        }
    };

    const renderUserItem = ({ item }: { item: CometChat.User }) => (
        <ListItem bottomDivider containerStyle={{ backgroundColor: theme.background1 }}>
            <Avatar rounded source={item.getAvatar() ? { uri: item.getAvatar() } : undefined} title={item.getName()?.charAt(0)} />
            <ListItem.Content>
                <ListItem.Title style={{ color: theme.textPrimary, ...customTypography.body.bold }}>
                    {item.getName()}
                </ListItem.Title>
            </ListItem.Content>
            <TouchableOpacity 
                style={[styles.unblockButton, { borderColor: theme.primary }]} 
                onPress={() => handleUnblock(item)}
            >
                <Text style={[styles.unblockButtonText, { color: theme.primary }]}>Unblock</Text>
            </TouchableOpacity>
        </ListItem>
    );

    if (isLoading) {
        return (
            <View style={[styles.centeredContainer, { backgroundColor: theme.background1 }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }
    
    return (
        <View style={[styles.container, { backgroundColor: theme.background2 }]}>
            <FlatList
                data={blockedUsers}
                keyExtractor={(item) => item.getUid()}
                renderItem={renderUserItem}
                ListEmptyComponent={
                    <View style={styles.centeredContainer}>
                        <Text style={{ color: theme.textSecondary }}>You haven't blocked anyone.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    unblockButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
    unblockButtonText: { ...customTypography.button.medium, fontSize: 14 },
});

export default BlockedUsersScreen;