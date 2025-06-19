// src/components/groups/TransferOwnershipScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, useColorScheme } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Avatar, ListItem, Button } from '@rneui/themed';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import { customThemeColorsDark, customThemeColorsLight, customTypography } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';

type ScreenRouteProp = RouteProp<ChatStackParamList, 'TransferOwnershipScreen'>;
type ScreenNavigationProp = StackNavigationProp<ChatStackParamList, 'TransferOwnershipScreen'>;

const TransferOwnershipScreen: React.FC = () => {
    const route = useRoute<ScreenRouteProp>();
    const navigation = useNavigation<ScreenNavigationProp>();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
    const { group } = route.params;
    const { currentUser } = useAuthStore();

    const [members, setMembers] = useState<CometChat.GroupMember[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        try {
            const memberRequest = new CometChat.GroupMembersRequestBuilder(group.getGuid()).setLimit(100).build();
            const existingMembers = (await memberRequest.fetchNext()) as CometChat.GroupMember[];
            // Filter out the current owner (logged-in user) from the list
            const otherMembers = existingMembers.filter(m => m.getUid() !== currentUser?.getUid());
            setMembers(otherMembers);
        } catch (error) {
            Alert.alert("Error", "Could not fetch group members.");
        } finally {
            setIsLoading(false);
        }
    }, [group, currentUser]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleTransferAndLeave = async () => {
        if (!selectedMemberId) {
            Alert.alert("No Selection", "Please select a member to transfer ownership to.");
            return;
        }
        setIsProcessing(true);
        try {
            // Step 1: Transfer Ownership
            await CometChat.transferGroupOwnership(group.getGuid(), selectedMemberId);
            
            // Step 2: Leave the group
            await CometChat.leaveGroup(group.getGuid());
            
            Alert.alert("Success", `Ownership transferred and you have left the group.`);
            // Navigate back to the main chat list
            navigation.pop(2); 

        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to transfer ownership and leave.");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderMemberItem = ({ item }: { item: CometChat.GroupMember }) => {
        const isSelected = selectedMemberId === item.getUid();
        return (
            <ListItem bottomDivider onPress={() => setSelectedMemberId(item.getUid())} containerStyle={{ backgroundColor: theme.background1 }}>
                <Avatar rounded source={item.getAvatar() ? { uri: item.getAvatar() } : undefined} icon={{ name: 'person', type: 'material', color: theme.staticWhite }} containerStyle={{ backgroundColor: theme.primaryLight }} />
                <ListItem.Content>
                    <ListItem.Title style={{ color: theme.textPrimary }}>{item.getName()}</ListItem.Title>
                    {/* --- ADDED: Display member's current role --- */}
                    <ListItem.Subtitle style={{ color: theme.textSecondary, textTransform: 'capitalize' }}>
                        {item.getScope()}
                    </ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.CheckBox checked={isSelected} onPress={() => setSelectedMemberId(item.getUid())} iconType="material-community" checkedIcon="radiobox-marked" uncheckedIcon="radiobox-blank" />
            </ListItem>
        );
    };

    if (isLoading) {
        return <View style={[styles.container, { justifyContent: 'center', backgroundColor: theme.background1 }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background1 }]}>
             <Text style={styles.infoText}>You must transfer ownership to another member before you can leave this group.</Text>
            <FlatList
                data={members}
                renderItem={renderMemberItem}
                keyExtractor={item => item.getUid()}
                ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: theme.textSecondary}}>No other members to transfer ownership to.</Text>}
            />
            <Button
                title="Transfer Ownership & Leave"
                onPress={handleTransferAndLeave}
                disabled={!selectedMemberId || isProcessing}
                loading={isProcessing}
                buttonStyle={{ backgroundColor: theme.primary, margin: 10, borderRadius: 8 }}
                titleStyle={{ ...customTypography.button.medium }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    infoText: {
        ...customTypography.body.regular,
        padding: 15,
        textAlign: 'center',
        backgroundColor: '#fce8e6',
        color: '#a50e0e'
    }
});

export default TransferOwnershipScreen;