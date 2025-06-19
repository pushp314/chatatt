import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatCalls } from '@cometchat/calls-sdk-react-native';
import { ListItem, Avatar, SearchBar } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  customThemeColorsLight,
  customThemeColorsDark,
  CustomColors,
  customTypography,
} from '../../theme/theme';
import { SCREEN_CONSTANTS } from '../../utils/AppConstants';

// Types
interface CallLogItem {
  callId?: string;
  initiator: { uid: string; name: string; avatar?: string };
  receiver: { uid: string; name: string; avatar?: string };
  callType?: 'audio' | 'video';
  endedAt: number;
  duration?: number;
  status?: 'initiated' | 'ongoing' | 'ended' | 'cancelled' | 'busy';
}

interface CallLogItemProps {
  call: any;
  loggedInUser: any;
  onPress: (userId: string, userName: string) => void;
  theme: CustomColors;
}

// Memoized Call Log Item Component
const CallLogItem: React.FC<CallLogItemProps> = React.memo(({ call, loggedInUser, onPress, theme }) => {
  const isOutgoing = call.initiator?.uid === loggedInUser?.uid;
  const otherUser = isOutgoing ? call.receiver : call.initiator;
  const directionIcon = isOutgoing ? 'call-made' : 'call-received';
  
  // Status color based on call outcome
  const getStatusColor = () => {
    switch (call.status) {
      case 'ended': return theme.success;
      case 'cancelled': return theme.error;
      case 'busy': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const formatTimestamp = (unix: number) => {
    if (!unix) return 'N/A';
    const date = new Date(unix * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <ListItem
      containerStyle={[listItemStyle, { backgroundColor: theme.background1 }]}
      bottomDivider
      onPress={() => onPress(otherUser?.uid, otherUser?.name)}
    >
      <Avatar
        rounded
        source={otherUser?.avatar ? { uri: otherUser.avatar } : undefined}
        title={otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
        size={50}
        containerStyle={[avatarStyle, { backgroundColor: theme.backgroundElevated }]}
        titleStyle={{ color: theme.textPrimary }}
      />
      
      <ListItem.Content>
        <ListItem.Title style={[nameTextStyle, { color: theme.textPrimary }]}>
          {otherUser?.name || 'Unknown User'}
        </ListItem.Title>
        
        <View style={subtitleContainerStyle}>
          <Icon 
            name={directionIcon} 
            color={getStatusColor()} 
            size={16} 
          />
          <Text style={[timestampTextStyle, { color: theme.textSecondary }]}>
            {formatTimestamp(call.endedAt)}
          </Text>
          {call.duration && (
            <Text style={[durationTextStyle, { color: theme.textTertiary }]}>
              • {Math.floor(call.duration / 60)}m {call.duration % 60}s
            </Text>
          )}
        </View>
      </ListItem.Content>
      
      <View style={rightContainerStyle}>
        <TouchableOpacity 
          style={[infoButtonStyle, { backgroundColor: theme.backgroundElevated }]}
          onPress={() => onPress(otherUser?.uid, otherUser?.name)}
        >
          <Icon 
            name="info-outline" 
            color={theme.textSecondary} 
            size={20} 
          />
        </TouchableOpacity>
      </View>
    </ListItem>
  );
});

// Empty State Component
const EmptyState: React.FC<{ theme: CustomColors; onRefresh: () => void }> = ({ theme, onRefresh }) => (
  <View style={emptyContainerStyle}>
    <Icon name="phone" color={theme.iconFaint} size={80} />
    <Text style={[emptyTitleStyle, { color: theme.textPrimary }]}>
      No Call History
    </Text>
    <Text style={[emptySubtitleStyle, { color: theme.textSecondary }]}>
      Your recent calls will appear here
    </Text>
    <TouchableOpacity 
      style={[refreshButtonStyle, { backgroundColor: theme.primary }]}
      onPress={onRefresh}
    >
      <Text style={[refreshButtonTextStyle, { color: theme.staticWhite }]}>
        Refresh
      </Text>
    </TouchableOpacity>
  </View>
);

// Loading Component
const LoadingState: React.FC<{ theme: CustomColors }> = ({ theme }) => (
  <View style={loadingContainerStyle}>
    <ActivityIndicator size="large" color={theme.primary} />
    <Text style={[loadingTextStyle, { color: theme.textSecondary }]}>
      Loading call history...
    </Text>
  </View>
);

// Main Component
const CallLogs: React.FC = () => {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
  const navigation = useNavigation<any>();

  // State
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Focus effect
  useFocusEffect(
    useCallback(() => {
      fetchCallLogs();
    }, [])
  );

  // Fetch call logs
  const fetchCallLogs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const user = await CometChat.getLoggedinUser();
      if (!user) throw new Error('User not logged in');
      setLoggedInUser(user);

      const authToken = user.getAuthToken();
      const callLogRequest = new CometChatCalls.CallLogRequestBuilder()
        .setLimit(50)
        .setAuthToken(authToken)
        .setCallCategory('call')
        .build();

      const fetchedLogs = await callLogRequest.fetchNext();
      setCallLogs(fetchedLogs);
      setFilteredLogs(fetchedLogs);
    } catch (error) {
      console.error('❌ Error fetching call logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchCallLogs(true);
  }, []);

  // Handle navigation
  const handleItemPress = useCallback((userId: string, userName: string) => {
    navigation.navigate(SCREEN_CONSTANTS.CALL_LOG_DETAIL, {
      userId,
      userName,
    });
  }, [navigation]);

  // Search functionality
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredLogs(callLogs);
    } else {
      const filtered = callLogs.filter((call) => {
        const isOutgoing = call.initiator?.uid === loggedInUser?.uid;
        const otherUser = isOutgoing ? call.receiver : call.initiator;
        return otherUser?.name?.toLowerCase().includes(query.toLowerCase());
      });
      setFilteredLogs(filtered);
    }
  }, [callLogs, loggedInUser]);

  // Render item
  const renderItem = useCallback(({ item }: { item: any }) => (
    <CallLogItem
      call={item}
      loggedInUser={loggedInUser}
      onPress={handleItemPress}
      theme={theme}
    />
  ), [loggedInUser, handleItemPress, theme]);

  // Key extractor
  const keyExtractor = useCallback((item: any, index: number) => 
    item.callId || index.toString(), []);

  return (
    <View style={[containerStyle, { backgroundColor: theme.background1 }]}>
      {/* Search Bar */}
      <SearchBar
        placeholder="Search calls..."
        onChangeText={handleSearch}
        value={searchQuery}
        platform="default"
        containerStyle={[searchContainerStyle, { backgroundColor: theme.background1, borderBottomColor: theme.borderDefault }]}
        inputContainerStyle={[searchInputContainerStyle, { backgroundColor: theme.backgroundElevated }]}
        inputStyle={[searchInputStyle, { color: theme.textPrimary }]}
        placeholderTextColor={theme.textSecondary}
        searchIcon={{ color: theme.textSecondary }}
        clearIcon={{ color: theme.textSecondary }}
      />

      {/* Content */}
      {loading && callLogs.length === 0 ? (
        <LoadingState theme={theme} />
      ) : (
        <FlatList
          data={filteredLogs}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={!loading ? 
            <EmptyState theme={theme} onRefresh={handleRefresh} /> : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={filteredLogs.length === 0 ? emptyContentContainerStyle : contentContainerStyle}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
        />
      )}
    </View>
  );
};

// Individual style objects (to avoid the styles reference error)
const containerStyle = {
  flex: 1,
};

const searchContainerStyle = {
  borderTopColor: 'transparent',
  paddingHorizontal: 16,
  paddingVertical: 8,
};

const searchInputContainerStyle = {
  borderRadius: 8,
  minHeight: 40,
};

const searchInputStyle = {
  fontSize: 16,
};

const contentContainerStyle = {
  paddingBottom: 20,
};

const emptyContentContainerStyle = {
  flex: 1,
};

const listItemStyle = {
  paddingVertical: 16,
  paddingHorizontal: 16,
  minHeight: 72,
};

const avatarStyle = {
  marginRight: 12,
};

const nameTextStyle = {
  ...customTypography.title3,
  fontWeight: '600' as const,
  marginBottom: 4,
};

const subtitleContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  flex: 1,
};

const timestampTextStyle = {
  ...customTypography.caption1.medium,
  marginLeft: 6,
};

const durationTextStyle = {
  ...customTypography.caption1.regular,
  marginLeft: 4,
};

const rightContainerStyle = {
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  width: 40,
  height: 60,
};

const infoButtonStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const emptyContainerStyle = {
  flex: 1,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  paddingHorizontal: 40,
};

const emptyTitleStyle = {
  ...customTypography.title2,
  fontWeight: '600' as const,
  marginTop: 24,
  textAlign: 'center' as const,
};

const emptySubtitleStyle = {
  ...customTypography.body.regular,
  marginTop: 8,
  textAlign: 'center' as const,
  lineHeight: 20,
};

const refreshButtonStyle = {
  marginTop: 24,
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
};

const refreshButtonTextStyle = {
  ...customTypography.button.medium,
  fontWeight: '600' as const,
};

const loadingContainerStyle = {
  flex: 1,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const loadingTextStyle = {
  ...customTypography.body.regular,
  marginTop: 16,
};

export default CallLogs;