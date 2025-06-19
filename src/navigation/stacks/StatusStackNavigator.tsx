// src/navigation/stacks/StatusStackNavigator.tsx
import React from 'react';
import { useColorScheme, Platform } from 'react-native';
import { createStackNavigator, TransitionPresets, StackNavigationOptions } from '@react-navigation/stack';
import { StatusStackParamList } from '../types';
import { SCREEN_CONSTANTS } from '../../utils/AppConstants';
import { customThemeColorsLight, customThemeColorsDark, CustomColors, customTypography } from '../../theme/theme';
import CreateStatusScreen from '../../components/status/screens/CreateStatusScreen';
import StatusListScreen from '../../components/status/screens/StatusListScreen';
import ViewStatusScreen from '../../components/status/screens/ViewStatusScreen';

const Stack = createStackNavigator<StatusStackParamList>();

const StatusStackNavigator: React.FC = () => {
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
      initialRouteName={SCREEN_CONSTANTS.STATUS_LIST_SCREEN}
      screenOptions={{ ...defaultHeaderOptions, cardStyle: { backgroundColor: themeColors.background1 } }}
    >
      <Stack.Screen
        name={SCREEN_CONSTANTS.STATUS_LIST_SCREEN}
        component={StatusListScreen}
        options={{ title: SCREEN_CONSTANTS.STATUS }}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.CREATE_STATUS_SCREEN}
        component={CreateStatusScreen}
        options={{ title: 'Create Status', presentation: 'modal' }}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.VIEW_STATUS_SCREEN}
        component={ViewStatusScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: () => ({
            cardStyle: {
              opacity: 1, // This makes the screen appear instantly with no animation
            },
          }),
        }}
      />
    </Stack.Navigator>
  );
};

export default StatusStackNavigator;