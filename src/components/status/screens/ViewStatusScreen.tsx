import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Icon, Avatar } from '@rneui/themed';
import { StatusStackParamList } from '../../../navigation/types';
import { customThemeColorsLight, customThemeColorsDark, CustomColors, customTypography } from '../../../theme/theme';
import { ApiStatus, UserStatusGroup, viewStatus, deleteStatus } from '../../../services/statusService';
import { useAuthStore } from '../../../store/authStore';
import Video from 'react-native-video';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type ViewStatusScreenRouteProp = RouteProp<StatusStackParamList, 'ViewStatusScreen'>;

const { width, height } = Dimensions.get('window');

const STATUS_VIEW_DURATION_MS = 5000; // 5 seconds per status item

const ViewStatusScreen: React.FC = () => {
  const route = useRoute<ViewStatusScreenRouteProp>();
  const navigation = useNavigation();
  const { currentUser } = useAuthStore();
  const scheme = useColorScheme();
  const theme: CustomColors = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const { userStatuses, initialIndex, currentUserId } = route.params;

  const [currentGroupIndex, setCurrentGroupIndex] = useState(() => {
    return userStatuses.findIndex(group => group.user._id === currentUserId);
  });
  const [currentStatusIndex, setCurrentStatusIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [progressBarProgress, setProgressBarProgress] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoPlayerRef = useRef<React.ElementRef<typeof Video> | null>(null);
  const isMounted = useRef(true); // Ref to track if the component is mounted

  const currentStatusGroup = userStatuses[currentGroupIndex];
  const currentStatus = currentStatusGroup?.statuses[currentStatusIndex];
  const isMyOwnStatus = currentStatusGroup?.user._id === currentUser?.getUid();

  // Effect to manage isMounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []); // Runs once on mount, cleanup on unmount

  const advanceStatus = useCallback(() => {
    if (!isMounted.current || paused) return;

    if (currentStatusIndex < currentStatusGroup.statuses.length - 1) {
      setCurrentStatusIndex(prevIndex => prevIndex + 1);
    } else {
      if (currentGroupIndex < userStatuses.length - 1) {
        setCurrentGroupIndex(prevGroupIndex => prevGroupIndex + 1);
        setCurrentStatusIndex(0);
      } else {
        navigation.goBack();
      }
    }
  }, [currentStatusIndex, currentGroupIndex, userStatuses, navigation, currentStatusGroup?.statuses?.length, paused]);

  // Main effect to manage status advancement and progress bar timers
  useEffect(() => {
    // Clear any existing intervals whenever dependencies change
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressBarIntervalRef.current) clearInterval(progressBarIntervalRef.current);

    if (!paused && currentStatus) {
      // Start the main status advancement timer
      intervalRef.current = setInterval(advanceStatus, STATUS_VIEW_DURATION_MS);

      // Reset and start the progress bar animation for the current status
      setProgressBarProgress(0); // Reset progress for the new status
      let progress = 0;
      const progressTickInterval = setInterval(() => {
        if (isMounted.current) { // Only update if component is mounted
          progress += (1000 / STATUS_VIEW_DURATION_MS) * 0.05; // Increment every 50ms
          if (progress > 1) progress = 1;
          setProgressBarProgress(progress);
        } else {
          // If component unmounted, stop this interval
          clearInterval(progressTickInterval);
        }
      }, 50);
      progressBarIntervalRef.current = progressTickInterval;
    }

    // Cleanup function for this specific effect
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressBarIntervalRef.current) clearInterval(progressBarIntervalRef.current);
    };
  }, [currentStatus, paused, advanceStatus]); // Dependencies: currentStatus (to react to index changes), paused state, and advanceStatus callback

  // Mark status as viewed when it first appears
  useEffect(() => {
    if (currentStatus && !currentStatus.viewedByMe && !isMyOwnStatus) {
      viewStatus(currentStatus._id).catch(err => console.error("Failed to mark status as viewed:", err));
    }
  }, [currentStatus, isMyOwnStatus]);


  const handlePress = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    if (x < width / 3) {
      // Tap left: Go to previous status
      if (currentStatusIndex > 0) {
        setCurrentStatusIndex(prevIndex => prevIndex - 1);
      } else if (currentGroupIndex > 0) {
        setCurrentGroupIndex(prevGroupIndex => prevGroupIndex - 1);
        setCurrentStatusIndex(userStatuses[currentGroupIndex - 1].statuses.length - 1);
      } else {
        navigation.goBack(); // No previous status/group, go back
      }
    } else {
      // Tap right: Go to next status
      advanceStatus();
    }
  };

  const handleLongPress = () => {
    setPaused(true);
  };

  const handlePressOut = () => {
    setPaused(false);
  };

  const handleDeleteStatus = () => {
    if (!currentStatus || !isMyOwnStatus) return;
    Alert.alert(
      "Delete Status",
      "Are you sure you want to delete this status?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteStatus(currentStatus._id);
              Alert.alert("Success", "Status deleted.");
              // For simplicity after deletion, go back to the list screen and refetch.
              // More complex logic would involve updating the local status list.
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting status:", error);
              Alert.alert("Error", "Could not delete status.");
            }
          },
        },
      ]
    );
  };

  if (!currentStatusGroup || !currentStatus) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background1 }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textPrimary, marginTop: 10 }}>Loading status...</Text>
      </View>
    );
  }

  const isVideo = currentStatus.type === 'video' || currentStatus.type === 'gif';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background1 }]}>
      <TouchableOpacity
        style={styles.fullScreenTouch}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.statusBarContainer}>
          {currentStatusGroup.statuses.map((_, index) => (
            <View key={index} style={styles.statusBarSegment}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: theme.staticWhite + '80',
                    width: index < currentStatusIndex ? '100%' : (index === currentStatusIndex ? `${progressBarProgress * 100}%` : '0%'),
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" type="material" color={theme.staticWhite} size={24} />
          </TouchableOpacity>
          <Avatar
            rounded
            size="small"
            source={currentStatusGroup.user.profilePictureURL ? { uri: currentStatusGroup.user.profilePictureURL } : undefined}
            icon={!currentStatusGroup.user.profilePictureURL ? { name: 'person', type: 'material', color: theme.staticWhite } : undefined}
            containerStyle={!currentStatusGroup.user.profilePictureURL ? { backgroundColor: theme.primary } : {}}
          />
          <Text style={[styles.userName, { color: theme.staticWhite }]}>{currentStatusGroup.user.displayName}</Text>
          <Text style={[styles.timeAgo, { color: theme.staticWhite }]}>{dayjs(currentStatus.createdAt).fromNow()}</Text>
          {isMyOwnStatus && (
            <TouchableOpacity onPress={handleDeleteStatus} style={styles.deleteButton}>
              <Icon name="delete" type="material" color={theme.staticWhite} size={24} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.contentContainer}>
          {currentStatus.type === 'image' || currentStatus.type === 'gif' ? (
            <Image source={{ uri: currentStatus.mediaURL }} style={styles.media} resizeMode="contain" />
          ) : isVideo && currentStatus.mediaURL ? (
            <Video
              ref={videoPlayerRef}
              source={{ uri: currentStatus.mediaURL }}
              style={styles.media}
              resizeMode="contain"
              repeat={false}
              paused={paused}
              onEnd={advanceStatus}
              onError={(error) => console.error('Video error:', error)}
              onLoadStart={() => console.log('Video loading start')}
              onLoad={(data) => console.log('Video loaded:', data)}
            />
          ) : (
            <Text style={[styles.statusText, { color: theme.staticWhite, backgroundColor: currentStatus.backgroundColor || 'transparent' }]}>
              {currentStatus.content}
            </Text>
          )}
        </View>

        {currentStatus.content && (currentStatus.type === 'image' || isVideo || currentStatus.type === 'gif') && (
            <View style={styles.captionContainer}>
                <Text style={[styles.captionText, { color: theme.staticWhite }]}>
                    {currentStatus.content}
                </Text>
            </View>
        )}

      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullScreenTouch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: Platform.OS === 'android' ? 10 : 0,
    width: '95%',
    height: 3,
    zIndex: 1,
  },
  statusBarSegment: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    zIndex: 1,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  userName: {
    ...customTypography.body.bold,
    marginLeft: 10,
  },
  timeAgo: {
    ...customTypography.caption1.regular,
    marginLeft: 10,
    opacity: 0.8,
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingBottom: Platform.OS === 'android' ? 40 : 60,
  },
  media: {
    width: width,
    height: '100%',
  },
  statusText: {
    ...customTypography.heading2.bold,
    fontSize: 28,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  captionContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 20 : 40,
    width: '90%',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captionText: {
    ...customTypography.body.regular,
    textAlign: 'center',
  },
});

export default ViewStatusScreen;