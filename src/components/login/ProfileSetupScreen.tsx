import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Button, Input, Avatar } from '@rneui/themed';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { authService } from '../../services/authService';
import {
  CustomColors,
  customThemeColorsDark,
  customThemeColorsLight,
  customTypography,
} from '../../theme/theme';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';

type ProfileSetupScreenRouteProp = RouteProp<RootStackParamList, 'ProfileSetupScreen'>;

const ProfileSetupScreen: React.FC = () => {
  const route = useRoute<ProfileSetupScreenRouteProp>();
  const navigation = useNavigation();
  // CORRECTED: We only receive the phoneNumber now.
  const { phoneNumber } = route.params;

  const colorScheme = useColorScheme();
  const theme: CustomColors = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);

  // State for fetching the new, final OTP for registration
  const [finalOtp, setFinalOtp] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);

  // This hook runs when the screen loads to get a fresh OTP.
  useEffect(() => {
    const getFreshOtpForRegistration = async () => {
      try {
        console.log(`Requesting a fresh OTP for ${phoneNumber} to complete registration...`);
        const response = await authService.requestOtp(phoneNumber);
        if (response.success && response.data?.developmentOtp) {
          setFinalOtp(response.data.developmentOtp); // Store the new OTP
          console.log(`Fresh OTP received: ${response.data.developmentOtp}`);
        } else {
          throw new Error(response.message || 'Failed to get a fresh OTP.');
        }
      } catch (error: any) {
        Alert.alert(
          'Preparation Failed',
          `Could not prepare your registration. Please go back and try again. Error: ${error.message}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } finally {
        setIsPreparing(false);
      }
    };

    getFreshOtpForRegistration();
  }, [phoneNumber, navigation]);

  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', 'Could not select image. Please try again.');
      } else if (response.assets && response.assets.length > 0) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const handleCompleteProfile = async () => {
    if (!finalOtp) {
      Alert.alert('Error', 'Registration is not ready yet. Please wait a moment.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }
    setIsLoading(true);

    const defaultAvatarUrl = !selectedImage
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random&color=fff&size=128`
      : '';

    const profile = {
      name: name.trim(),
      profilePictureUrl: defaultAvatarUrl,
      about: about.trim() || 'Hey there! I am using this app.',
    };

    try {
      // CORRECTED: Use the new 'finalOtp' from our state for the registration call.
      await authService.verifyOtpAndRegister(phoneNumber, finalOtp, profile, selectedImage || undefined);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a loading indicator while the new OTP is being requested.
  if (isPreparing) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background1 }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[customTypography.body.regular, { color: theme.textSecondary, marginTop: 16 }]}>
          Preparing your registration...
        </Text>
      </View>
    );
  }
  
  const avatarSource = selectedImage?.uri ? { uri: selectedImage.uri } : (name.trim() ? { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}` } : undefined);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background1 }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[customTypography.heading2.bold, styles.header, { color: theme.textPrimary }]}>
          Setup Your Profile
        </Text>
        <Text style={[customTypography.body.regular, styles.subHeader, { color: theme.textSecondary }]}>
          This is how you'll appear to others.
        </Text>

        <TouchableOpacity onPress={handleChoosePhoto} style={styles.avatarContainer}>
          <Avatar
            rounded
            size={120}
            source={avatarSource}
            icon={!avatarSource ? { name: 'person', type: 'material', size: 80 } : undefined}
            containerStyle={{ backgroundColor: theme.primaryLight }}
          >
            <Avatar.Accessory size={24} />
          </Avatar>
        </TouchableOpacity>

        <Input
          label="Your Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          leftIcon={{ type: 'material', name: 'person', color: theme.icon }}
          inputStyle={{ color: theme.textPrimary }}
          labelStyle={[customTypography.caption1.bold, { color: theme.textSecondary, marginBottom: 4 }]}
          inputContainerStyle={{ borderColor: theme.borderDefault }}
          containerStyle={styles.inputContainer}
          autoFocus
        />

        <Input
          label="About (Optional)"
          placeholder="Tell everyone something about you"
          value={about}
          onChangeText={setAbout}
          leftIcon={{ type: 'material', name: 'info-outline', color: theme.icon }}
          inputStyle={{ color: theme.textPrimary }}
          labelStyle={[customTypography.caption1.bold, { color: theme.textSecondary, marginBottom: 4 }]}
          inputContainerStyle={{ borderColor: theme.borderDefault }}
          containerStyle={styles.inputContainer}
        />

        <Button
          title="Complete Setup & Login"
          onPress={handleCompleteProfile}
          loading={isLoading}
          disabled={isLoading || isPreparing}
          buttonStyle={[styles.button, { backgroundColor: theme.primary }]}
          titleStyle={[customTypography.button.medium, { color: theme.staticWhite }]}
          containerStyle={styles.buttonContainer}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subHeader: {
    textAlign: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
  },
});

export default ProfileSetupScreen;