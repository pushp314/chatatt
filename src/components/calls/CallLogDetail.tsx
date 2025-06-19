import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatCalls } from '@cometchat/calls-sdk-react-native';
import { customThemeColorsDark, customThemeColorsLight } from '../../theme/theme';
import { useCallStore } from '../../store/callStore'; 

const CallLogDetailScreen: React.FC = () => {
  const { initiateCall } = useCallStore();

  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { userId, userName } = route.params;

  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const [userCallLogs, setUserCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const fetchUserCallLogs = async () => {
    setLoading(true);
    try {
      const user = await CometChat.getLoggedinUser();
      setLoggedInUser(user);

      if (!user) {
        throw new Error('No logged in user found');
      }

      const authToken = user.getAuthToken();
      const callLogRequest = new CometChatCalls.CallLogRequestBuilder()
        .setLimit(50)
        .setAuthToken(authToken)
        .setCallCategory('call')
        .build();

      const allLogs = await callLogRequest.fetchNext();

      const filteredLogs = allLogs.filter(
        (call: any) =>
          call.initiator?.uid === userId || call.receiver?.uid === userId
      );

      setUserCallLogs(filteredLogs);
    } catch (error) {
      console.error('❌ Error fetching user call logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCallLogs();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (unix: number) => {
    if (!unix) return 'N/A';
    const date = new Date(unix * 1000);
    return date.toLocaleString();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background1 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
        <Text style={styles.buttonText}>⬅ Back</Text>
      </TouchableOpacity>

      <TouchableOpacity
  onPress={() => initiateCall(userId, CometChat.RECEIVER_TYPE.USER)}
  style={{
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  }}
>
  <Text style={{ color: 'white', fontWeight: 'bold' }}>Call</Text>
</TouchableOpacity>

      <Text style={[styles.headerText, { color: theme.textPrimary }]}>
        📞 Call Details for {userName}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={theme.textPrimary} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {userCallLogs.map((call, index) => {
            const isOutgoing = call.initiator?.uid === loggedInUser?.uid;
            return (
              <View key={index} style={[styles.callItem, { backgroundColor: theme.background2 }]}>
                <Text style={[styles.detailsText, { color: theme.textPrimary }]}>
                  {isOutgoing ? '➡️ Outgoing' : '⬅️ Incoming'} |{' '}
                  {call.callType === 'audio' ? '🎤 Audio' : '🎥 Video'}
                </Text>
                <Text style={[styles.detailsText, { color: theme.textSecondary }]}>
                  Duration: {formatDuration(call.totalDurationInMinutes * 60)}
                </Text>
                <Text style={[styles.detailsText, { color: theme.textSecondary }]}>
                  Time: {formatTimestamp(call.endedAt)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  callItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  detailsText: {
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CallLogDetailScreen;
