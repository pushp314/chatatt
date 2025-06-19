import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import {
  createStackNavigator,
  TransitionPresets,
  StackNavigationOptions,
} from '@react-navigation/stack';

import { UserStackParamList } from '../types'; // Ensure this path is correct
import { SCREEN_CONSTANTS } from '../../utils/AppConstants'; // Ensure this path is correct
import {
  customThemeColorsLight,
  customThemeColorsDark,
  CustomColors,
} from '../../theme/theme'; // Ensure this path is correct

// Import your new screen
import SyncedContactsScreen from '../../components/users/screens/SyncedContactsScreen'; // Adjust path if needed
// Import MessagesScreen if you intend to navigate to it from here (already part of ChatStack, but direct nav might be needed)
import MessagesScreen from '../../components/conversations/screens/MessageScreen/MessageScreen'; // Adjust path
import UserInfoScreen from '../../components/users/screens/UserInfoScreen'; // Assuming you have this or will create it

const Stack = createStackNavigator<UserStackParamList>();

// Placeholder for UserInfoScreen - Create this screen similar to SettingsScreen/UpdateProfileScreen
// const UserInfoScreen = () => {
//     const theme = useColorScheme() === 'dark' ? customThemeColorsDark : customThemeColorsLight;
//     return (<View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: theme.background1}}><Text style={{color: theme.textPrimary}}>User Info Screen</Text></View>)
// }


const UserStackNavigator: React.FC = () => {
  const scheme = useColorScheme();
  const themeColors: CustomColors =
    scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const defaultScreenOptions: StackNavigationOptions = {
    headerShown: true,
    headerStyle: {
      backgroundColor: themeColors.background1,
      elevation: 0, // Remove shadow on Android
      shadowOpacity: 0, // Remove shadow on iOS
    },
    headerTintColor: themeColors.textPrimary,
    headerTitleStyle: {
      color: themeColors.textPrimary,
    },
    gestureEnabled: true,
    ...(Platform.OS === 'ios'
      ? TransitionPresets.SlideFromRightIOS
      : TransitionPresets.FadeFromBottomAndroid),
    cardStyle: { backgroundColor: themeColors.background1 },
  };

  return (
    <Stack.Navigator
      initialRouteName={SCREEN_CONSTANTS.SYNCED_CONTACTS_SCREEN} // Start with synced contacts
      screenOptions={defaultScreenOptions}
    >
      <Stack.Screen
        name={SCREEN_CONSTANTS.SYNCED_CONTACTS_SCREEN}
        component={SyncedContactsScreen}
        options={{ title: 'Contacts on App' }}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.MESSAGES} // For navigating to a chat
        component={MessagesScreen}
        options={({ route }: any) => ({ // Type 'any' for route for simplicity here, or define properly
          title: route.params?.user?.name || route.params?.group?.name || 'Chat',
          headerShown: false, // MessageScreen has its own header
        })}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.USER_INFO}
        component={UserInfoScreen} // You'll need to create/import UserInfoScreen
        options={{ title: 'Contact Info' }}
      />
      {/* Add other user-related screens here if needed, e.g., UserProfile */}
    </Stack.Navigator>
  );
};

export default UserStackNavigator;