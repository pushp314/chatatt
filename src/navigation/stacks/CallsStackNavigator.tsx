import React from 'react';
import { Platform, useColorScheme } from 'react-native'; // View removed as it's not used
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native'; // <<< IMPORT ADDED HERE

import Calls from '../../components/calls/CallLogs';
import CallDetails from '../../components/calls/CallDetails';
import CallLogDetail from '../../components/calls/CallLogDetail';
import { CallStackParamList } from '../types';
import { SCREEN_CONSTANTS } from '../../utils/AppConstants';
import { customThemeColorsLight, customThemeColorsDark, CustomColors } from '../../theme/theme';

const Stack = createStackNavigator<CallStackParamList>();

const CallsStackNavigator: React.FC = () => {
  const scheme = useColorScheme();
  const themeColors: CustomColors = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  return (
    <Stack.Navigator
      initialRouteName={SCREEN_CONSTANTS.CALL_LOGS}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        ...(Platform.OS === 'ios' ? TransitionPresets.SlideFromRightIOS : TransitionPresets.FadeFromBottomAndroid),
        cardStyle: { backgroundColor: themeColors.background1 }
      }}>
      <Stack.Screen
        name={SCREEN_CONSTANTS.CALL_LOGS}
        component={Calls}
      />
      <Stack.Screen
        name={SCREEN_CONSTANTS.CALL_DETAILS}
        component={CallDetails}
        // If you were to use RouteProp here, it would be in options:
        // options={({ route }: { route: RouteProp<CallStackParamList, typeof SCREEN_CONSTANTS.CALL_DETAILS> }) => ({
        //   title: `Details for ${route.params.call.getSessionId()}`,
        //   headerShown: true,
        // })}
      />

      <Stack.Screen
  name={SCREEN_CONSTANTS.CALL_LOG_DETAIL}
  component={CallLogDetail}
/>


    </Stack.Navigator>
  );
};

export default CallsStackNavigator;