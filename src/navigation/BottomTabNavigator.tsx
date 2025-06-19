// src/navigation/BottomTabNavigator.tsx

import React from 'react';
import {
  StyleSheet,
  Platform,
  View,
  Text,
  useColorScheme,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { RouteProp, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Icon, Avatar } from '@rneui/themed';

import ChatStackNavigator from './stacks/ChatStackNavigator';
import CallsStackNavigator from './stacks/CallsStackNavigator';
// import GroupStackNavigator from './stacks/GroupStackNavigator'; // REMOVED
// import UserStackNavigator from './stacks/UserStackNavigator'; // REMOVED (now in RootStack)
import StatusStackNavigator from './stacks/StatusStackNavigator'; // NEW
import SettingsStackNavigator from './stacks/SettingsStackNavigator'; // NEW

import { BottomTabParamList } from './types';
import { SCREEN_CONSTANTS } from '../utils/AppConstants';
import { customThemeColorsLight, customThemeColorsDark, CustomColors } from '../theme/theme';
import { useAuthStore } from '../store/authStore';

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Helper component for the Settings Tab Icon
const SettingsTabIconDisplay: React.FC<{ focused: boolean; color: string; size: number }> = ({ focused, color, size }) => {
  const { currentUser } = useAuthStore();
  const theme = useColorScheme() === 'dark' ? customThemeColorsDark : customThemeColorsLight;
  const avatarUrl = currentUser?.getAvatar();

  // Adjust size for avatar to appear similar to icons
  const avatarSize = size - (Platform.OS === 'ios' ? 2 : 4); // Make avatar slightly smaller than icon box

  if (avatarUrl) {
    return (
      <View 
        style={[
            styles.avatarIconWrapper, 
            { width: size, height: size, borderRadius: size / 2}, // Make wrapper circular and match icon size
            focused && { borderColor: theme.primary }
        ]}
      >
        <Avatar
          rounded
          source={{ uri: avatarUrl }}
          size={avatarSize}
        />
      </View>
    );
  } else {
    // Default settings icon if no avatar
    return <Icon name={focused ? "cog" : "cog-outline"} type="material-community" size={size} color={color} />;
  }
};

interface IconDetail {
  name: string;
  type: string;
}

// Updated IconsConfigKeys for the new tab structure
type IconsConfigKeys =
  | typeof SCREEN_CONSTANTS.CHATS
  | typeof SCREEN_CONSTANTS.STATUS
  | typeof SCREEN_CONSTANTS.CALLS;
  // SETTINGS_TAB uses a custom icon component

type IconsConfigType = Record<
  IconsConfigKeys,
  {
    active: IconDetail;
    inactive: IconDetail;
  }
>;

const iconsConfig: IconsConfigType = {
  [SCREEN_CONSTANTS.CHATS]: {
    active: { name: 'chat-bubble', type: 'material-icons' },
    inactive: { name: 'chat-bubble-outline', type: 'material-icons' },
  },
  [SCREEN_CONSTANTS.STATUS]: { // Example icons for Status
    active: { name: 'chart-donut', type: 'material-community' }, // Or 'circle-slice-8'
    inactive: { name: 'circle-outline', type: 'material-community' },
  },
  [SCREEN_CONSTANTS.CALLS]: {
    active: { name: 'phone', type: 'material-icons' }, // Changed from 'call' for consistency
    inactive: { name: 'phone-outline', type: 'material-community' }, // Changed from ionicon for consistency
  },
};

const BottomTabNavigator: React.FC = () => {
  const scheme = useColorScheme();
  const themeColors: CustomColors = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const screenOptions = ({ route }: { route: RouteProp<BottomTabParamList, keyof BottomTabParamList> }): BottomTabNavigationOptions => {
    let tabBarVisible = true;
    const focusedRouteName = getFocusedRouteNameFromRoute(route);

    const screensToHideTabBarFor = [
      SCREEN_CONSTANTS.MESSAGES,
      SCREEN_CONSTANTS.ONGOING_CALL_SCREEN,
      SCREEN_CONSTANTS.UPDATE_PROFILE,
      SCREEN_CONSTANTS.USER_INFO, // If you want UserInfo from ChatStack to be full screen
      SCREEN_CONSTANTS.GROUP_INFO, // If you want GroupInfo from ChatStack to be full screen
    ];

    if (focusedRouteName && screensToHideTabBarFor.includes(focusedRouteName as any)) {
      tabBarVisible = false;
    }

    return {
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        if (route.name === SCREEN_CONSTANTS.SETTINGS_TAB) {
          return <SettingsTabIconDisplay focused={focused} color={color} size={size} />;
        }

        const routeName = route.name as IconsConfigKeys; // Cast to known keys
        const iconSet = iconsConfig[routeName];

        if (!iconSet) { // Fallback for unconfigured icons (should ideally not happen)
            return <Icon name="help-circle" type="material-community" size={size} color={color} />;
        }
        
        const iconDetails = focused ? iconSet.active : iconSet.inactive;
        return <Icon name={iconDetails.name} type={iconDetails.type} size={size} color={color} />;
      },
      tabBarShowLabel: true, // You can set this to false if you only want icons
      tabBarLabel: ({ color }) => ( // Display tab names
        <Text style={[styles.tabLabel, { color: color }]}>
          {route.name}
        </Text>
      ),
      tabBarStyle: {
        ...styles.tabBarBase,
        backgroundColor: themeColors.background1,
        borderTopColor: themeColors.borderLight,
        display: tabBarVisible ? 'flex' : 'none',
      },
      tabBarActiveTintColor: themeColors.primary,
      tabBarInactiveTintColor: themeColors.iconSecondary,
    };
  };

  return (
    <Tab.Navigator
      initialRouteName={SCREEN_CONSTANTS.CHATS} // Default to Chats tab
      screenOptions={screenOptions}
      // New Tab Order: Chats, Status, Calls, Settings
    >
      <Tab.Screen name={SCREEN_CONSTANTS.CHATS} component={ChatStackNavigator} />
      <Tab.Screen name={SCREEN_CONSTANTS.STATUS} component={StatusStackNavigator} />
      <Tab.Screen name={SCREEN_CONSTANTS.CALLS} component={CallsStackNavigator} />
      <Tab.Screen
        name={SCREEN_CONSTANTS.SETTINGS_TAB}
        component={SettingsStackNavigator}
        options={{
            tabBarLabel: SCREEN_CONSTANTS.SETTINGS_TAB, // Ensures the label is "Settings"
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarBase: {
    height: Platform.OS === 'ios' ? 85 : 70,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: Platform.OS === 'ios' ? -5 : 0,
    fontWeight: '500', // Make labels slightly bolder
  },
  avatarIconWrapper: { // Style for avatar icon wrapper to show focus border
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent', // Default
    // borderRadius is set dynamically based on size
  },
});

export default BottomTabNavigator;