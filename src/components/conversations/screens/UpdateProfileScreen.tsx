import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Text,
  Button,
  Platform,
  AlertButton,
} from 'react-native';
import { Avatar, Icon, ListItem } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  Asset,
  ImageLibraryOptions,
  CameraOptions,
} from 'react-native-image-picker';
import { useAuthStore } from '../../../store/authStore';
import { userService } from '../../../services/userService';
import { customThemeColorsLight, customThemeColorsDark, CustomColors, customTypography } from '../../../theme/theme';

const createStyles = (theme: CustomColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background2,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
        paddingVertical: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        backgroundColor: theme.backgroundElevated,
        borderWidth: 2,
        borderColor: theme.borderDefault,
    },
    section: {
        marginBottom: 20,
    },
    inputListItem: {
      backgroundColor: theme.background1,
      paddingVertical: 8,
      marginHorizontal: 16,
      borderRadius: 10,
    },
    input: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 16,
      paddingVertical: 8,
    },
    infoText: {
        color: theme.textSecondary,
        fontSize: 12,
        marginTop: 8,
        marginHorizontal: 25,
    },
    listItem: {
        backgroundColor: theme.background1,
        marginHorizontal: 16,
        borderRadius: 10,
    }
});

const UpdateProfileScreen = () => {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
  const styles = createStyles(theme);

  const { updateCurrentUserInfo } = useAuthStore();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Original values for comparison
  const [originalName, setOriginalName] = useState('');
  const [originalAbout, setOriginalAbout] = useState('');
  const [originalPicture, setOriginalPicture] = useState<string | null>(null);

  // Current form values
  const [displayName, setDisplayName] = useState('');
  const [aboutStatus, setAboutStatus] = useState('');
  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(null);
  const [selectedNewImage, setSelectedNewImage] = useState<Asset | null>(null);

  // Track if there are any changes
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Fetch user profile data on component mount
   */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await userService.getMyProfile();
        
        // Set current values
        setDisplayName(profile.displayName);
        setAboutStatus(profile.aboutStatus || '');
        setProfilePictureUri(profile.profilePictureURL || null);
        
        // Set original values for comparison
        setOriginalName(profile.displayName);
        setOriginalAbout(profile.aboutStatus || '');
        setOriginalPicture(profile.profilePictureURL || null);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch your profile. Please try again.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigation]);

  /**
   * Check if there are any changes to enable/disable save button
   */
  useEffect(() => {
    const wasImageRemoved = originalPicture !== null && profilePictureUri === null && !selectedNewImage;
    const wasImageAddedOrChanged = selectedNewImage !== null;
    const textChanged = displayName !== originalName || aboutStatus !== originalAbout;
    setHasChanges(wasImageRemoved || wasImageAddedOrChanged || textChanged);
  }, [displayName, aboutStatus, profilePictureUri, originalName, originalAbout, originalPicture, selectedNewImage]);

  /**
   * Handle profile save with proper logic for different scenarios
   */
  const handleSaveProfile = useCallback(async () => {
    // Validation
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Your name cannot be empty.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      let updatedUser;

      // Scenario 1: New image was selected - use multipart upload
      if (selectedNewImage) {
        console.log('Updating profile with new image using multipart/form-data');
        updatedUser = await userService.updateProfileWithImage({
          displayName: displayName.trim(),
          aboutStatus: aboutStatus.trim(),
        }, selectedNewImage);
      } 
      // Scenario 2: Image was removed - remove it first, then update profile
      else if (originalPicture && !profilePictureUri) {
        console.log('Removing profile picture and updating profile');
        await userService.removeMyProfilePicture();
        updatedUser = await userService.updateMyProfile({
          displayName: displayName.trim(),
          aboutStatus: aboutStatus.trim(),
          profilePictureUrl: null,
        });
      }
      // Scenario 3: No image changes - regular JSON update
      else {
        console.log('Updating profile data only using JSON');
        updatedUser = await userService.updateMyProfile({
          displayName: displayName.trim(),
          aboutStatus: aboutStatus.trim(),
          profilePictureUrl: profilePictureUri,
        });
      }
      
      // Update local store with new user info
      updateCurrentUserInfo({
        displayName: updatedUser.displayName,
        aboutStatus: updatedUser.aboutStatus,
        profilePictureURL: updatedUser.profilePictureURL,
      });

      Alert.alert('Success', 'Your profile has been updated.');
      navigation.goBack();
      
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      Alert.alert('Error', `Failed to update profile: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [displayName, aboutStatus, profilePictureUri, selectedNewImage, originalPicture, navigation, updateCurrentUserInfo]);

  /**
   * Set up header with save button
   */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        isSaving ? (
          <ActivityIndicator color={theme.primary} style={{ marginRight: 15 }} />
        ) : (
          <Button
            onPress={handleSaveProfile}
            title="Save"
            disabled={!hasChanges || isSaving}
            color={Platform.OS === 'ios' ? theme.primary : undefined}
          />
        )
      ),
    });
  }, [navigation, isSaving, hasChanges, handleSaveProfile, theme.primary]);

  /**
   * Handle image picker response
   */
  const handleImagePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) return;
    
    if (response.errorCode) {
      Alert.alert('Error', `Image Picker Error: ${response.errorMessage}`);
      return;
    }
    
    if (response.assets && response.assets.length > 0) {
      const asset: Asset = response.assets[0];
      console.log('New image selected:', asset.fileName);
      setSelectedNewImage(asset); 
      setProfilePictureUri(asset.uri || null);
    }
  };

  /**
   * Choose image from gallery or camera
   */
  const chooseImage = (source: 'gallery' | 'camera') => {
    const options: ImageLibraryOptions | CameraOptions = { 
      mediaType: 'photo', 
      quality: 0.7,
      maxWidth: 800,
      maxHeight: 800,
    };
    
    if (source === 'gallery') {
      launchImageLibrary(options, handleImagePickerResponse);
    } else {
      launchCamera(options, handleImagePickerResponse);
    }
  };

  /**
   * Handle profile picture removal
   */
  const handleRemovePicture = () => {
    Alert.alert(
      "Remove Profile Picture",
      "Are you sure you want to remove your picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            console.log('User chose to remove profile picture');
            setProfilePictureUri(null);
            setSelectedNewImage(null);
          },
        },
      ]
    );
  };

  /**
   * Show image picker options
   */
  const showImagePickerOptions = () => {
    const options: AlertButton[] = [
      { text: 'Choose from Gallery', onPress: () => chooseImage('gallery') },
      { text: 'Take Photo', onPress: () => chooseImage('camera') },
    ];

    if (profilePictureUri) {
      options.push({ text: 'Remove Photo', onPress: handleRemovePicture, style: 'destructive' });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Update Profile Picture', 'Choose an option', options, { cancelable: true });
  };
  
  /**
   * Show loading screen while fetching profile
   */
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer} 
      keyboardShouldPersistTaps="handled"
    >
      {/* Profile Picture Section */}
      <View style={styles.avatarContainer}>
        <Avatar
          rounded
          size={120}
          source={profilePictureUri ? { uri: profilePictureUri } : undefined}
          icon={!profilePictureUri ? { 
            name: 'person', 
            type: 'material', 
            size: 80, 
            color: theme.textSecondary 
          } : undefined}
          containerStyle={styles.avatar}
        >
          <Avatar.Accessory 
            size={30} 
            onPress={showImagePickerOptions}
            iconProps={{
              name: 'camera-alt',
              color: theme.background1,
            }}
            style={{
              backgroundColor: theme.primary,
            }}
          />
        </Avatar>
      </View>
      
      {/* Display Name Section */}
      <View style={styles.section}>
        <ListItem containerStyle={styles.inputListItem}>
            <Icon name="person-outline" type="material" color={theme.icon} />
            <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
                maxLength={50}
                autoCapitalize="words"
                returnKeyType="next"
            />
        </ListItem>
        <Text style={styles.infoText}>
          This is not your username or pin. This name will be visible to your contacts.
        </Text>
      </View>

      {/* About Status Section */}
      <View style={styles.section}>
        <ListItem containerStyle={styles.inputListItem}>
            <Icon name="information-outline" type="material-community" color={theme.icon} />
            <TextInput
                style={styles.input}
                value={aboutStatus}
                onChangeText={setAboutStatus}
                placeholder="About"
                placeholderTextColor={theme.textSecondary}
                maxLength={140}
                multiline
                returnKeyType="done"
            />
        </ListItem>
        <Text style={styles.infoText}>
          {aboutStatus.length}/140 characters
        </Text>
      </View>
      
      {/* Privacy Settings Link */}
      <ListItem 
        containerStyle={styles.listItem}
        onPress={() => Alert.alert("Coming Soon!", "Privacy settings will be available in a future update.")}
        bottomDivider
      >
        <Icon name="lock-outline" type="material" color={theme.icon} />
        <ListItem.Content>
            <ListItem.Title style={{ color: theme.textPrimary }}>Privacy</ListItem.Title>
            <ListItem.Subtitle style={{ color: theme.textSecondary }}>
              Manage your privacy settings
            </ListItem.Subtitle>
        </ListItem.Content>
        <ListItem.Chevron color={theme.iconFaint}/>
      </ListItem>
    </ScrollView>
  );
};

export default UpdateProfileScreen;