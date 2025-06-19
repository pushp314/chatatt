import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, Image, TouchableOpacity, useColorScheme, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '@rneui/themed';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { createStatus } from '../../../services/statusService';
import { customThemeColorsLight, customThemeColorsDark, CustomColors, customTypography } from '../../../theme/theme';
import { Picker } from '@react-native-picker/picker'; // Using native picker

const CreateStatusScreen: React.FC = () => {
  const [statusText, setStatusText] = useState('');
  const [mediaAsset, setMediaAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [privacyVisibility, setPrivacyVisibility] = useState<'public' | 'my_contacts' | 'private'>('my_contacts'); // Default to contacts
  const navigation = useNavigation();

  const scheme = useColorScheme();
  const theme: CustomColors = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const handlePickImage = () => {
    // Media type 'mixed' allows both photos and videos
    launchImageLibrary({ mediaType: 'mixed' }, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorCode) {
        console.log('Image picker cancelled or error:', response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setMediaAsset(response.assets[0]);
        // Clear text input if media is selected, as text will act as caption
        // setStatusText(''); // Don't clear, let it be the caption
      }
    });
  };

  const handlePostStatus = async () => {
    if (!statusText && !mediaAsset) {
      Alert.alert("Empty Status", "Please write something or select a photo/video.");
      return;
    }
    setIsLoading(true);

    try {
      if (mediaAsset?.uri && mediaAsset.type && mediaAsset.fileName) {
        let fileType: 'image' | 'video' | 'gif';
        if (mediaAsset.type.startsWith('video')) {
            fileType = 'video';
        } else if (mediaAsset.type.startsWith('image/gif')) { // Check for GIF specifically
            fileType = 'gif';
        } else {
            fileType = 'image';
        }

        await createStatus(
          fileType,
          statusText || undefined, // Use text as content/caption, or undefined if empty
          { uri: mediaAsset.uri, type: mediaAsset.type, name: mediaAsset.fileName },
          { visibility: privacyVisibility } // Pass privacy settings
        );
      } else if (statusText) {
        await createStatus('text', statusText, undefined, { visibility: privacyVisibility });
      }
      
      Alert.alert("Success", "Your status has been posted.");
      if (navigation.canGoBack()) {
        navigation.goBack();
      }

    } catch (error) {
      console.error("Error posting status:", error);
      Alert.alert("Error", "Could not post your status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background1 }]}>
      <TextInput
        style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.borderLight }]}
        placeholder="What's on your mind? (Optional for media)"
        placeholderTextColor={theme.textTertiary}
        multiline
        value={statusText}
        onChangeText={setStatusText}
        // editable={!mediaAsset} // Removed this restriction, text can be caption
      />

      {mediaAsset && (
        <View style={styles.mediaPreviewContainer}>
          {mediaAsset.type?.startsWith('video') ? (
            <Icon name="video-outline" type="material-community" size={100} color={theme.iconSecondary} />
          ) : (
            <Image source={{ uri: mediaAsset.uri }} style={styles.mediaPreview} />
          )}
          <TouchableOpacity style={styles.removeMediaButton} onPress={() => setMediaAsset(null)}>
            <Icon name="close" color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Privacy Settings */}
      <View style={[styles.privacyContainer, { borderColor: theme.borderLight }]}>
        <Text style={[styles.privacyLabel, { color: theme.textSecondary }]}>Who can see this status?</Text>
        <Picker
          selectedValue={privacyVisibility}
          onValueChange={(itemValue: 'public' | 'my_contacts' | 'private') => setPrivacyVisibility(itemValue)} // Explicitly typed itemValue
          style={[styles.picker, { color: theme.textPrimary }]}
          dropdownIconColor={theme.icon}
        >
          <Picker.Item label="My Contacts" value="my_contacts" />
          <Picker.Item label="Public" value="public" />
          <Picker.Item label="Private" value="private" />
        </Picker>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handlePickImage} disabled={isLoading}>
          <Icon name="photo-library" type="material" color={isLoading ? theme.textTertiary : theme.primary} size={30} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.postButton, {backgroundColor: theme.primary}]} onPress={handlePostStatus} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={theme.staticWhite} />
          ) : (
            <Text style={[styles.postButtonText, {color: theme.staticWhite}]}>Post Status</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    textInput: { height: 120, textAlignVertical: 'top', borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 15 },
    mediaPreviewContainer: { marginTop: 0, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderRadius: 8, borderColor: '#eee', overflow: 'hidden' },
    mediaPreview: { width: '100%', height: 250, },
    removeMediaButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, padding: 2, zIndex: 1 },
    privacyContainer: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, marginBottom: 20 },
    privacyLabel: { ...customTypography.caption1.medium, marginTop: 10, marginBottom: 5 },
    picker: { height: 50, width: '100%', },
    bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    postButton: { paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20 },
    postButtonText: { fontWeight: 'bold', fontSize: 16 }
});

export default CreateStatusScreen;