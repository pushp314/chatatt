
import React, { useState, useEffect } from 'react';
import { View, Text,TouchableOpacity, Alert, useColorScheme, Platform } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatCalls } from "@cometchat/calls-sdk-react-native";
import { RootStackParamList } from '../../../navigation/types';
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants';
import { customThemeColorsDark, customThemeColorsLight } from '../../../theme/theme';
import { useAuthStore } from '../../../store/authStore'; // Correct store for auth tokenƒ
import { useCallStore } from '../../../store/callStore'; // To clear state on end

type OngoingCallScreenRouteProp = RouteProp<RootStackParamList, typeof SCREEN_CONSTANTS.ONGOING_CALL_SCREEN>;

const OngoingCallScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<OngoingCallScreenRouteProp>();
  const { sessionId, callType = 'audio' } = route.params as { sessionId: string, callType?: 'audio' | 'video' };


  // Get the logged-in user directly from the authStore
  const loggedInUser = useAuthStore(state => state.currentUser);
  const { clearCallState } = useCallStore(); // Get the state clearing function

  const [callToken, setCallToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Setup Call Token
  useEffect(() => {
    let isMounted = true;
    async function setupCallToken() {
      if (!sessionId) {
        setError("Session ID is missing.");
        setLoading(false);
        return;
      }

      // The auth token is available from the logged-in CometChat user object.
      const cometchatAuthToken = loggedInUser?.getAuthToken();

      if (!cometchatAuthToken) {
        setError("CometChat Auth Token not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const tokenResponse = await CometChatCalls.generateToken(sessionId, cometchatAuthToken);
        if (isMounted) {
          setCallToken(tokenResponse.token);
        }
      } catch (err: any) {
        console.error("Error generating call token:", err);
        if (isMounted) {
          setError(err.message || 'Failed to generate call token.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    setupCallToken();

    return () => {
      isMounted = false;
    };
  }, [sessionId, loggedInUser]);

  // 2. Setup Call Event Listeners
  useEffect(() => {
    const listenerID = `ONGOING_CALL_LISTENER_${sessionId}`;
    const callListener = new CometChatCalls.OngoingCallListener({
      onUserJoined: user => console.log('✅ User joined:', user?.name),
      onUserLeft: user => console.log('❌ User left:', user?.name),
      onCallEnded: () => {
        console.log("📞 Call ended event received.");
        clearCallState(); // Clean up global state
        if (navigation.canGoBack()) navigation.goBack();
      },
      onError: (error: any) => {
    console.error('📞 Call Error:', error);
    let message = error.message || 'An unknown error occurred.';
    // Detect abnormal closure
    if (message.includes('1006') || message.toLowerCase().includes('channel closed')) {
        message = 'Connection lost. The call was disconnected due to network issues.';
    }
    Alert.alert('Call Error', message);
    clearCallState();
    if (navigation.canGoBack()) navigation.goBack();
},
      // This is triggered when the local user presses the hangup button in the UI Kit
      onCallEndButtonPressed: () => {
        console.log("📞 End Call button pressed by local user.");
        clearCallState(); // Clean up global state
        // The UI Kit handles navigation automatically, but we ensure state is clean.
      },
       onUserListUpdated: userList => console.log("👥 User list updated:", userList),
    });

    CometChatCalls.addCallEventListener(listenerID, callListener);

    return () => {
    try {
      CometChatCalls.removeCallEventListener(listenerID);
    } catch (e) {
      console.warn('Failed to remove call event listener', e);
    }
  };
  }, [sessionId, navigation, clearCallState]);


  // 3. Render Component
  const callSettings = new CometChatCalls.CallSettingsBuilder()
    .enableDefaultLayout(true)
    .setIsAudioOnlyCall(callType === 'audio') // Assuming audio-only for now
    .build();

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Setting up call...</Text></View>;
  }

  // ...existing code...
if (error || !callToken) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Error: {error || "Could not retrieve call token."}</Text>
      <TouchableOpacity
        style={{ marginTop: 20, padding: 10, backgroundColor: '#2196F3', borderRadius: 5 }}
        onPress={() => {
          setError(null);
          setLoading(true);
          setCallToken(null);
        }}
      >
        <Text style={{ color: '#fff' }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}
// ...existing code...

  return (
    <View style={{ flex: 1 }}>
      <CometChatCalls.Component callSettings={callSettings} callToken={callToken} />
    </View>
  );
};

export default OngoingCallScreen;



