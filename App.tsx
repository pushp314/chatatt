import 'react-native-gesture-handler'; // 👈 Must be at the very top
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
  Text, // Added Text in case it's needed by conditional rendering of error/loading
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // 👈 Import GestureHandlerRootView
import {
  CustomColors,
  customThemeColorsDark,
  customThemeColorsLight,
  getAppStatusBarContent,
} from './src/theme/theme'; // Assuming this path is correct

import { AppConstants } from './src/utils/AppConstants'; // Assuming this path is correct
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import RootStackNavigator from './src/navigation/RootStackNavigator'; // Assuming this path is correct
import { requestAndroidPermissions } from './src/utils/helper'; // Assuming this path is correct
import { useAuthStore } from './src/store/authStore'; // Assuming this path is correct

interface AppCredentialsData {
  appId: string;
  authKey: string | null;
  region: string;
}

const App: React.FC = () => {
  const {
    isInitialized,
    hasValidCredentials,
    initialize,
    setHasValidCredentials,
    setError,
  } = useAuthStore();

  const systemScheme = useColorScheme();
  const currentTheme: CustomColors =
    systemScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
  const statusBarContent = getAppStatusBarContent(systemScheme);

  useEffect(() => {
    const initializeApp = async () => {
      let effectiveAppId: string | null = null;
      let effectiveRegion: string | null = null;
      console.log('[App.js] Initializing app...');

      try {
        if (Platform.OS === 'android') {
          await requestAndroidPermissions();
        }

        const credentialsStr = await AsyncStorage.getItem('appCredentials');
        if (credentialsStr) {
          const storedCredentials = JSON.parse(credentialsStr) as AppCredentialsData;
          if (storedCredentials?.appId && storedCredentials?.region) {
            effectiveAppId = storedCredentials.appId;
            effectiveRegion = storedCredentials.region;
            console.log('[App.js] Using stored credentials');
          }
        }

        if (!effectiveAppId || !effectiveRegion) {
          if (
            AppConstants.appId &&
            AppConstants.appId !== 'YOUR_COMETCHAT_APP_ID' &&
            AppConstants.region &&
            AppConstants.region !== 'YOUR_COMETCHAT_REGION'
          ) {
            effectiveAppId = AppConstants.appId;
            effectiveRegion = AppConstants.region;
            console.log(`[App.js] Using AppConstants credentials: ${effectiveAppId}, ${effectiveRegion}, ${AppConstants.authKey}`);

            const credentialsToSave: AppCredentialsData = {
              appId: effectiveAppId,
              region: effectiveRegion,
              authKey: AppConstants.authKey ?? null,
            };
            await AsyncStorage.setItem(
              'appCredentials',
              JSON.stringify(credentialsToSave),
            );
          }
        }

        if (effectiveAppId && effectiveRegion) {
          const appSettings = new CometChat.AppSettingsBuilder()
            .subscribePresenceForAllUsers()
            .setRegion(effectiveRegion)
            .build();

          // Check if CometChat is already initialized to prevent re-initialization error
          const isCometChatInitialized = await CometChat.isInitialized();
          if (!isCometChatInitialized) {
            await CometChat.init(effectiveAppId, appSettings);
            console.log('[App.js] CometChat SDK Initialized');
          } else {
            console.log('[App.js] CometChat SDK was already initialized.');
          }
          setHasValidCredentials(true);
          await initialize(); // This is from useAuthStore
        } else {
          setError('Missing CometChat credentials');
          setHasValidCredentials(false);
          Alert.alert(
            'Configuration Error',
            'CometChat credentials are missing or invalid.',
          );
        }
      } catch (error) {
        console.error('[App.js] Initialization error:', error);
        setError('Failed to initialize app');
        Alert.alert('Error', 'Failed to initialize the application');
      }
    };

    initializeApp();
  }, [initialize, setHasValidCredentials, setError]); // Dependencies for initializeApp


  const renderContent = () => {
    if (!isInitialized) {
      return (
        <View
          style={[styles.loadingContainer, { backgroundColor: currentTheme.background2 }]}
        >
          <ActivityIndicator size="large" color={currentTheme.primary} />
        </View>
      );
    }

    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: currentTheme.background1 }]}
      >
        <StatusBar
          barStyle={statusBarContent}
          backgroundColor={currentTheme.background1}
          translucent={false}
        />
        <RootStackNavigator hasValidAppCredentials={hasValidCredentials} />
      </SafeAreaView>
    );
  };

  return (
    // 👇 Wrap the entire app content with GestureHandlerRootView
    <GestureHandlerRootView style={{ flex: 1 }}>
      {renderContent()}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;