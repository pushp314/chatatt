// src/navigation/stacks/ChatStackNavigator.tsx

import React from 'react';
import { useColorScheme, Platform } from 'react-native';
import { createStackNavigator, TransitionPresets, StackNavigationOptions } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { SCREEN_CONSTANTS } from '../../utils/AppConstants';
import { customThemeColorsLight, customThemeColorsDark, CustomColors } from '../../theme/theme';
import { ChatStackParamList } from '../types';

import ConversationListScreen from '../../components/conversations/screens/ConversationListScreen';
import MessagesScreen from '../../components/conversations/screens/MessageScreen/MessageScreen';
import CreateGroupScreen from '../../components/conversations/screens/CreateGroupScreen';
import UserInfoScreen from '../../components/users/screens/UserInfoScreen';
import GroupInfoScreen from '../../components/groups/GroupInfoScreen';
import AddMembersScreen from '../../components/groups/AddMembersScreen';
import ForwardSelectionScreen from '../../components/conversations/screens/ForwardSelectionScreen';
import TransferOwnershipScreen from '../../components/groups/TransferOwnershipScreen';

const Stack = createStackNavigator<ChatStackParamList>();

const ChatStackNavigator: React.FC = () => {
  const scheme = useColorScheme();
  const themeColors: CustomColors = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const messagesScreenOptions = ({
    route,
  }: {
    route: RouteProp<ChatStackParamList, typeof SCREEN_CONSTANTS.MESSAGES>;
  }): StackNavigationOptions => {
    const { user, group } = route.params || {};
    let title = 'Chat';
    if (user && user.name) {
      title = user.name;
    } else if (group && group.name) {
      title = group.name;
    }
    return {
      title,
      headerShown: false,
    };
  };

  const defaultHeaderOptions: StackNavigationOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: themeColors.background1 },
    headerTintColor: themeColors.textPrimary,
    headerTitleStyle: { color: themeColors.textPrimary },
    gestureEnabled: false,
  };

  return (
    <Stack.Navigator
      initialRouteName={SCREEN_CONSTANTS.CONVERSATION_LIST}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true, 
        ...(Platform.OS === 'ios' ? TransitionPresets.SlideFromRightIOS : TransitionPresets.FadeFromBottomAndroid),
        cardStyle: { backgroundColor: themeColors.background1 },
      }}
    >
      <Stack.Screen
        name={SCREEN_CONSTANTS.CONVERSATION_LIST}
        component={ConversationListScreen}
        options={{
          title: SCREEN_CONSTANTS.CHATS,
          ...defaultHeaderOptions,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.MESSAGES}
        component={MessagesScreen}
        options={messagesScreenOptions}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.CREATE_GROUP_SCREEN}
        component={CreateGroupScreen}
        options={{ title: 'Create Group', ...defaultHeaderOptions, headerShown: true }}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.USER_INFO}
        component={UserInfoScreen}
        options={{ title: 'User Info', ...defaultHeaderOptions, headerShown: true }}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.GROUP_INFO}
        component={GroupInfoScreen}
        options={{ title: 'Group Info', ...defaultHeaderOptions, headerShown: true }}
      />
      <Stack.Screen
        name="TransferOwnershipScreen"
        component={TransferOwnershipScreen}
        options={{ title: 'Transfer Ownership', ...defaultHeaderOptions, headerShown: true }}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.ADD_MEMBERS_SCREEN}
        component={AddMembersScreen}
        options={{ title: 'Add Members', ...defaultHeaderOptions, headerShown: true }}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.FORWARD_SELECTION_SCREEN}
        component={ForwardSelectionScreen}
        options={{ title: 'Forward to...', ...defaultHeaderOptions, headerShown: true }}
      />
    </Stack.Navigator>
  );
};

export default ChatStackNavigator;