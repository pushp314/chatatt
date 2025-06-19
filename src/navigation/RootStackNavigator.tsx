import React, { useEffect } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme as NavigationThemeType,
} from '@react-navigation/native';
import {
  createStackNavigator,
  StackNavigationOptions,
  TransitionPresets,
} from '@react-navigation/stack';

import { navigationRef, processPendingNavigation } from './NavigationService';
import BottomTabNavigator from './BottomTabNavigator';
import { RootStackParamList } from './types';
import { AppConstants, SCREEN_CONSTANTS } from '../utils/AppConstants';
import SampleUser from '../components/login/SampleUser';
import ProfileSetupScreen from '../components/login/ProfileSetupScreen'; // Import the new screen
import { useAuthStore } from '../store/authStore';
import UserStackNavigator from './stacks/UserStackNavigator';
import { CustomColors, customThemeColorsDark, customThemeColorsLight, getAppStatusBarContent } from '../theme/theme';

import OngoingCallScreen from '../components/calls/screens/OngoingCallScreen';
import IncomingCallView from '../components/calls/screens/IncomingCallView';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatCalls } from '@cometchat/calls-sdk-react-native';
import { useCallStore } from '../store/callStore';

const Stack = createStackNavigator<RootStackParamList>();

const RootStackNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { incomingCall, setIncomingCall, acceptCall, rejectCall } = useCallStore();
  const systemScheme = useColorScheme();

  const currentCustomTheme: CustomColors =
    systemScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
  const statusBarContent = getAppStatusBarContent(systemScheme);

  const reactNavigationTheme: NavigationThemeType = {
    ...(systemScheme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme),
    colors: {
      ...(systemScheme === 'dark'
        ? NavigationDarkTheme.colors
        : NavigationDefaultTheme.colors),
      background: currentCustomTheme.background1,
      card: currentCustomTheme.background1,
      text: currentCustomTheme.textPrimary,
      primary: currentCustomTheme.primary,
      border: currentCustomTheme.borderDefault,
    },
  };

  useEffect(() => {
    const chatAppSettings = new CometChat.AppSettingsBuilder()
      .subscribePresenceForAllUsers()
      .setRegion(AppConstants.region as string)
      .build();

    CometChat.init(AppConstants.appId as string, chatAppSettings).then(
      () => console.log('✅ CometChat (Chat SDK) Initialization completed successfully'),
      error => console.log('❌ CometChat (Chat SDK) initialization failed with error:', error)
    );

    if (!AppConstants.appId || !AppConstants.region) {
      console.error('App ID or Region is not defined');
      return;
    }
    const callAppSettings = new CometChatCalls.CallAppSettingsBuilder()
      .setAppId(AppConstants.appId)
      .setRegion(AppConstants.region)
      .build();

    CometChatCalls.init(callAppSettings).then(
      () => console.log('✅ CometChat (Calls SDK) Initialization completed successfully'),
      (error: any) => console.log('❌ CometChat (Calls SDK) initialization failed with error:', error)
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const listenerID = 'GLOBAL_CALL_LISTENER';
    CometChat.addCallListener(
      listenerID,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          console.log('Incoming call received:', call);
          setIncomingCall(call);
        },
        onIncomingCallCancelled: (call: CometChat.Call) => {
          console.log('Incoming call cancelled:', call);
          setIncomingCall(null);
        },
      })
    );
    return () => CometChat.removeCallListener(listenerID);
  }, [isAuthenticated, setIncomingCall]);


  const defaultStackScreenOptions: StackNavigationOptions = {
    headerShown: false,
    gestureEnabled: true,
    ...(Platform.OS === 'ios'
      ? TransitionPresets.SlideFromRightIOS
      : TransitionPresets.FadeFromBottomAndroid),
  };

  return (
    <>
      <StatusBar
        backgroundColor={currentCustomTheme.background1}
        barStyle={statusBarContent}
        translucent={false}
      />
      <NavigationContainer
        ref={navigationRef as React.RefObject<NavigationContainerRef<RootStackParamList>>}
        onReady={processPendingNavigation}
        theme={reactNavigationTheme}>
        <Stack.Navigator screenOptions={defaultStackScreenOptions}>
          {isAuthenticated ? (
            // Screens for authenticated users
            <>
              <Stack.Screen
                name={SCREEN_CONSTANTS.BOTTOM_TAB_NAVIGATOR}
                component={BottomTabNavigator}
              />
              <Stack.Screen
                name={SCREEN_CONSTANTS.USER_STACK_NAVIGATOR}
                component={UserStackNavigator}
              />
              <Stack.Screen
                name={SCREEN_CONSTANTS.ONGOING_CALL_SCREEN}
                component={OngoingCallScreen}
                options={{ presentation: 'modal', gestureEnabled: false }}
              />
            </>
          ) : (
            // Screens for unauthenticated users
            <>
              <Stack.Screen
                name={SCREEN_CONSTANTS.SAMPLER_USER}
                component={SampleUser}
              />
              <Stack.Screen
                name={SCREEN_CONSTANTS.PROFILE_SETUP_SCREEN}
                component={ProfileSetupScreen}
              />
            </>
          )}
        </Stack.Navigator>
        {incomingCall && (
          <IncomingCallView
            call={incomingCall}
            onAccept={acceptCall}
            onDecline={rejectCall}
          />
        )}
      </NavigationContainer>
    </>
  );
};

export default RootStackNavigator;