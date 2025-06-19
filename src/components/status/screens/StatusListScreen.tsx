import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, FlatList, Alert, Dimensions, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Icon, Avatar, ListItem } from '@rneui/themed';
import { StatusStackParamList } from '../../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants';
import { customThemeColorsLight, customThemeColorsDark, CustomColors, customTypography } from '../../../theme/theme';
import { useAuthStore } from '../../../store/authStore';
import { getMyStatuses, getStatusFeed, ApiStatus, UserStatusGroup } from '../../../services/statusService'; // Import new functions and types
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type StatusScreenNavigationProp = StackNavigationProp<StatusStackParamList>;

const StatusListScreen: React.FC = () => {
  const navigation = useNavigation<StatusScreenNavigationProp>();
  const { currentUser } = useAuthStore();
  const scheme = useColorScheme();
  const theme: CustomColors = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const [myStatuses, setMyStatuses] = useState<ApiStatus[]>([]);
  const [statusFeed, setStatusFeed] = useState<UserStatusGroup[]>([]); // New state for friends' statuses
  const [isLoadingMyStatuses, setIsLoadingMyStatuses] = useState(true);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  const fetchAllStatuses = useCallback(async () => {
    setIsLoadingMyStatuses(true);
    setIsLoadingFeed(true);
    try {
      const [myStats, feed] = await Promise.all([
        getMyStatuses(),
        getStatusFeed(),
      ]);
      setMyStatuses(myStats);
      setStatusFeed(feed);
    } catch (error) {
      console.error("Error fetching all statuses:", error);
      Alert.alert("Error", "Could not load statuses.");
    } finally {
      setIsLoadingMyStatuses(false);
      setIsLoadingFeed(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllStatuses();
    }, [fetchAllStatuses])
  );

  const handleMyStatusPress = () => {
    if (myStatuses.length > 0) {
      const myUserGroup: UserStatusGroup = {
        user: {
          _id: currentUser?.getUid() || '',
          displayName: currentUser?.getName() || 'Me',
          profilePictureURL: currentUser?.getAvatar() || undefined,
        },
        statuses: myStatuses,
      };
      // Navigate to ViewStatusScreen to see own statuses
      navigation.navigate(SCREEN_CONSTANTS.VIEW_STATUS_SCREEN, {
        initialIndex: 0,
        userStatuses: [myUserGroup], // Wrap in array as ViewStatusScreen expects UserStatusGroup[]
        currentUserId: currentUser?.getUid() || '',
      });
    } else {
      // Navigate to CreateStatusScreen to add a new status
      navigation.navigate(SCREEN_CONSTANTS.CREATE_STATUS_SCREEN);
    }
  };

  const handleContactStatusPress = (userStatusGroup: UserStatusGroup, initialStatusIndex: number) => {
    // Navigate to ViewStatusScreen for selected contact's statuses
    const feedWithCurrentUserRemoved = statusFeed.filter(group => group.user._id !== currentUser?.getUid());
    
    // Find the index of the selected userStatusGroup within the filtered feed
    const selectedUserIndexInFeed = feedWithCurrentUserRemoved.findIndex(
      (group) => group.user._id === userStatusGroup.user._id
    );

    navigation.navigate(SCREEN_CONSTANTS.VIEW_STATUS_SCREEN, {
      initialIndex: initialStatusIndex,
      userStatuses: feedWithCurrentUserRemoved, // Pass all friend statuses
      currentUserId: userStatusGroup.user._id,
      selectedUserIndex: selectedUserIndexInFeed, // Pass the index of the current user in the feed
    });
  };

  const renderMyStatus = () => {
    const latestStatus = myStatuses[0];
    const hasAnyStatus = myStatuses.length > 0;
    const showBorder = hasAnyStatus && myStatuses.some(s => !s.viewedByMe); // Indicate unviewed
    
    return (
      <ListItem bottomDivider containerStyle={{ backgroundColor: theme.background1 }} onPress={handleMyStatusPress}>
        <Avatar
          rounded
          size="medium"
          source={currentUser?.getAvatar() ? { uri: currentUser.getAvatar() } : undefined}
          containerStyle={[styles.avatar, { borderColor: showBorder ? theme.primary : 'transparent', borderWidth: showBorder ? 3 : 0 }]}
          icon={!currentUser?.getAvatar() ? { name: 'person', type: 'material', color: theme.staticWhite } : undefined}
          avatarStyle={!currentUser?.getAvatar() ? { backgroundColor: theme.primaryLight } : {}}
        >
        </Avatar>

        <ListItem.Content>
          <ListItem.Title style={{ color: theme.textPrimary, ...customTypography.body.bold }}>
            My Status
          </ListItem.Title>
          <ListItem.Subtitle style={{ color: theme.textSecondary }}>
            {hasAnyStatus ? `Last updated ${dayjs(latestStatus.createdAt).fromNow()}` : "Tap to add status update"}
          </ListItem.Subtitle>
        </ListItem.Content>
        <ListItem.Chevron color={theme.iconFaint} />
      </ListItem>
    );
  };

  const renderContactStatusItem = ({ item }: { item: UserStatusGroup }) => {
    const hasUnviewedStatuses = item.statuses.some(status => !status.viewedByMe);
    const latestStatus = item.statuses[0]; // Assuming statuses are sorted by newest first

    return (
      <ListItem bottomDivider containerStyle={{ backgroundColor: theme.background1 }} onPress={() => handleContactStatusPress(item, 0)}>
        <Avatar
          rounded
          size="medium"
          source={item.user.profilePictureURL ? { uri: item.user.profilePictureURL } : undefined}
          containerStyle={[styles.avatar, { borderColor: hasUnviewedStatuses ? theme.primary : theme.borderLight, borderWidth: 2 }]}
          icon={!item.user.profilePictureURL ? { name: 'person', type: 'material', color: theme.staticWhite } : undefined}
          avatarStyle={!item.user.profilePictureURL ? { backgroundColor: theme.primaryLight } : {}}
        />
        <ListItem.Content>
          <ListItem.Title style={{ color: theme.textPrimary, ...customTypography.body.bold }}>
            {item.user.displayName}
          </ListItem.Title>
          <ListItem.Subtitle style={{ color: theme.textSecondary }}>
            {latestStatus ? `${dayjs(latestStatus.createdAt).fromNow()}` : "No statuses"}
          </ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background2 }]}>
      <FlatList
        ListHeaderComponent={
          <>
            {isLoadingMyStatuses ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={{ color: theme.textSecondary, marginLeft: 10 }}>Loading your status...</Text>
                </View>
            ) : (
                renderMyStatus()
            )}
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Recent Updates</Text>
          </>
        }
        data={statusFeed}
        renderItem={renderContactStatusItem}
        keyExtractor={item => item.user._id}
        ListEmptyComponent={
            isLoadingFeed ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={{ color: theme.textSecondary, marginLeft: 10 }}>Loading feed...</Text>
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={{color: theme.textSecondary}}>No recent updates from your contacts.</Text>
                </View>
            )
        }
        // FIX: The contentContainerStyle prop is adjusted to ensure the empty component can fill the space.
        contentContainerStyle={statusFeed.length === 0 && !isLoadingFeed ? styles.emptyFlatlistContent : {paddingBottom: 80}}
      />
      
      <TouchableOpacity
        style={[styles.fabText, { backgroundColor: 'rgba(187, 134, 252, 0.2)' }]} // A lighter, more subtle background for the pencil
        onPress={() => navigation.navigate(SCREEN_CONSTANTS.CREATE_STATUS_SCREEN)}
      >
        <Icon name="pencil" type="material-community" color={theme.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate(SCREEN_CONSTANTS.CREATE_STATUS_SCREEN)}
      >
        <Icon name="camera" type="material" color={theme.staticWhite} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatar: {
    // padding: 3, // Removed padding directly, handled by borderWidth
  },
  sectionHeader: {
    ...customTypography.caption1.bold,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  // FIX: This style is updated to correctly center the empty message
  emptyContainer: {
    flex: 1, // Allows the container to grow
    justifyContent: 'center', // Centers vertically
    alignItems: 'center', // Centers horizontally
    paddingTop: 50, // Some padding from the header
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  // FIX: This ensures that when the list is empty, its container can grow and apply the centering styles.
  emptyFlatlistContent: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // FIX: Adjusted styling for better visual hierarchy between the two FABs
  fabText: {
    position: 'absolute',
    bottom: 100,
    right: 32,
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  }
});

export default StatusListScreen;