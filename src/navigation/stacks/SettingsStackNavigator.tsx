// src/navigation/stacks/SettingsStackNavigator.tsx
import React from 'react';
import { useColorScheme, Platform } from 'react-native';
import { createStackNavigator, TransitionPresets, StackNavigationOptions } from '@react-navigation/stack';
import { SettingsStackParamList } from '../types';
import { SCREEN_CONSTANTS } from '../../utils/AppConstants';
import { customThemeColorsLight, customThemeColorsDark, CustomColors, customTypography } from '../../theme/theme';
import BlockedUsersScreen from '../../components/users/screens/BlockedUsersScreen';
import NotificationSettingsScreen from '../../components/settings/screens/NotificationSettingScreen';
import PrivacySettingScreen from '../../components/settings/screens/PrivacySettingScreen';
import DataStorageSettingsScreen from '../../components/settings/screens/DataStorageSettingsScreen'; // NEW: Import the new screen

// Assuming SettingsScreen and UpdateProfileScreen are now structured for this stack
// Consider moving them to a `components/settings/screens` folder for organization
import SettingsScreen from '../../components/conversations/screens/SettingsScreen';
import UpdateProfileScreen from '../../components/conversations/screens/UpdateProfileScreen';

const Stack = createStackNavigator<SettingsStackParamList>();

const SettingsStackNavigator: React.FC = () => {
  const scheme = useColorScheme();
  const themeColors: CustomColors = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const defaultHeaderOptions: StackNavigationOptions = {
    headerStyle: {
      backgroundColor: themeColors.background1,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTintColor: themeColors.textPrimary,
    headerTitleStyle: {
      color: themeColors.textPrimary,
      ...customTypography.heading3.bold,
    },
    gestureEnabled: true,
    ...(Platform.OS === 'ios' ? TransitionPresets.SlideFromRightIOS : TransitionPresets.FadeFromBottomAndroid),
  };

  return (
    <Stack.Navigator
      initialRouteName={SCREEN_CONSTANTS.SETTINGS}
      screenOptions={{ ...defaultHeaderOptions, cardStyle: { backgroundColor: themeColors.background1 } }}
    >
      <Stack.Screen
        name={SCREEN_CONSTANTS.SETTINGS}
        component={SettingsScreen}
        options={{ title: SCREEN_CONSTANTS.SETTINGS_TAB }} // Use the tab name for the header
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.UPDATE_PROFILE}
        component={UpdateProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.BLOCKED_USERS_SCREEN}
        component={BlockedUsersScreen}
        options={{ title: 'Blocked Users' }}
      />
      {/* Add other settings sub-screens here */}
      <Stack.Screen
      name={SCREEN_CONSTANTS.NOTIFICATION_SETTINGS_SCREEN}
      component={NotificationSettingsScreen}
      options={{ title: 'Notifications' }}
    />
     <Stack.Screen
        name={SCREEN_CONSTANTS.PRIVACY_SETTINGS_SCREEN} // Use the new constant here
        component={PrivacySettingScreen}
        options={{ title: 'Privacy' }}
      />
      <Stack.Screen // NEW: Add Data Storage Settings Screen
        name={SCREEN_CONSTANTS.DATA_STORAGE_SETTINGS_SCREEN}
        component={DataStorageSettingsScreen}
        options={{ title: 'Data and Storage' }}
      />
    </Stack.Navigator>
  );
};

export default SettingsStackNavigator;