import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Avatar, ListItem, Icon, Button } from '@rneui/themed';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';

import { UserStackParamList, MessageScreenUserParam } from '../../../navigation/types'; // Adjust path
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants'; // Adjust path
import {
  customThemeColorsLight,
  customThemeColorsDark,
  CustomColors,
  customTypography,
} from '../../../theme/theme'; // Adjust path
import { useAuthStore } from '../../../store/authStore';
import { useChatStore } from '../../../store/chatStore';
import { SyncedCometChatUser } from '../../../services/userService'; // Ensure this is imported

// Define the expected route prop for UserInfoScreen
type UserInfoScreenRouteProp = RouteProp<UserStackParamList, typeof SCREEN_CONSTANTS.USER_INFO>;

const UserInfoScreen: React.FC = () => {
  const route = useRoute<UserInfoScreenRouteProp>();
  const navigation = useNavigation<StackNavigationProp<UserStackParamList>>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  // The participant can be one of two types from the route params
  const { user: participantFromRoute } = route.params;

  const { currentUser: loggedInUser } = useAuthStore();
  // const { setActiveChatInfo } = useChatStore(); // setActiveChatInfo might not be needed here unless updating global active chat

  if (!participantFromRoute) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background1 }]}>
        <Text style={{ color: theme.textPrimary }}>User data not found.</Text>
      </View>
    );
  }

  // Declare variables to hold normalized participant data
  let pName: string;
  let pAvatar: string | undefined;
  let pUID: string;
  let pStatus: string | undefined = CometChat.USER_STATUS.OFFLINE; // Default status
  let pBlockedByMe: boolean = false; // Default blocked status
  let pPhoneNumber: string | undefined;

  // Type guard to differentiate and assign properties
  // We use a property that is definitively in one type and not the other (e.g., 'uid' vs '_id')
  if ('uid' in participantFromRoute && !('_id' in participantFromRoute)) {
    // It's MessageScreenUserParam
    const participant = participantFromRoute as MessageScreenUserParam;
    pName = participant.name;
    pAvatar = participant.avatar;
    pUID = participant.uid;
    pStatus = participant.status || CometChat.USER_STATUS.OFFLINE;
    pBlockedByMe = participant.blockedByMe || false;
    // phoneNumber is not in MessageScreenUserParam
  } else {
    // It's SyncedCometChatUser (or has _id property)
    const participant = participantFromRoute as SyncedCometChatUser;
    pName = participant.displayName;
    pAvatar = participant.profilePictureURL;
    pUID = participant._id;
    pStatus = participant.status || CometChat.USER_STATUS.OFFLINE;
    pBlockedByMe = participant.blockedByMe || false;
    pPhoneNumber = participant.phoneNumber;
  }


  const handleSendMessage = () => {
    const userParamForMessageScreen: MessageScreenUserParam = {
      uid: pUID,
      name: pName,
      avatar: pAvatar,
      status: pStatus,
      blockedByMe: pBlockedByMe,
    };
    navigation.navigate(SCREEN_CONSTANTS.MESSAGES, { user: userParamForMessageScreen });
  };

  const handleBlockUser = () => {
    Alert.alert("Block User", `Block functionality for ${pName} to be implemented here.`);
     // TODO: Implement actual block/unblock logic using CometChat.blockUsers([pUID])
     // and update isBlockedByMe state and potentially the backend/CometChat user object.
  };


  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background2 }]}>
      <View style={[styles.profileSection, { backgroundColor: theme.background1, borderBottomColor: theme.borderLight }]}>
        <Avatar
          rounded
          size={100}
          source={pAvatar ? { uri: pAvatar } : undefined}
          icon={!pAvatar ? { name: 'person', type: 'material', color: theme.staticWhite, size: 60 } : undefined}
          containerStyle={[styles.avatar, !pAvatar && { backgroundColor: theme.primaryLight }]}
        />
        <Text style={[styles.userName, { color: theme.textPrimary }]}>{pName}</Text>
        <Text style={[styles.userUid, { color: theme.textSecondary }]}>UID: {pUID}</Text>
        {/* Display status if available and desired */}
        {pStatus && (
           <Text style={[styles.userStatus, { color: pStatus === CometChat.USER_STATUS.ONLINE ? theme.primary : theme.textTertiary }]}>
             {pStatus.charAt(0).toUpperCase() + pStatus.slice(1)}
           </Text>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <Button
            title="Send Message"
            onPress={handleSendMessage}
            icon={<Icon name="send" type="material" color={theme.staticWhite} style={{marginRight: 8}}/>}
            buttonStyle={[styles.actionButton, {backgroundColor: theme.primary}]}
            titleStyle={{color: theme.staticWhite, ...customTypography.button.medium}}
        />
         <Button
            title={pBlockedByMe ? "Unblock User" : "Block User"}
            onPress={handleBlockUser}
            icon={<Icon name="block" type="material" color={pBlockedByMe ? theme.textSecondary : theme.textPrimary} style={{marginRight: 8}}/>}
            buttonStyle={[styles.actionButton, {backgroundColor: theme.backgroundElevated, marginTop: 10, borderWidth:1, borderColor: theme.borderLight}]}
            titleStyle={{color: theme.textPrimary, ...customTypography.button.medium}}
        />
      </View>

      <View style={styles.detailsSection}>
        <ListItem bottomDivider containerStyle={{backgroundColor: theme.background1}}>
            <Icon name="phone" type="material" color={theme.icon} />
            <ListItem.Content>
                <ListItem.Title style={{color: theme.textSecondary, ...customTypography.caption1.regular}}>Phone</ListItem.Title>
                <ListItem.Subtitle style={{color: theme.textPrimary, ...customTypography.body.regular}}>
                    {pPhoneNumber || 'Not available'}
                </ListItem.Subtitle>
            </ListItem.Content>
        </ListItem>
      </View>
       <View style={{height: 30}}/>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  userName: {
    ...customTypography.heading2.bold,
    marginBottom: 4,
  },
  userUid: {
    ...customTypography.body.regular,
    fontSize: 14,
    marginBottom: 4,
  },
  userStatus: { // Added style for status
    ...customTypography.caption1.medium,
    fontSize: 14,
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
  },
  detailsSection: {
    marginTop: 10,
  },
});

export default UserInfoScreen;