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
  const [retryCount, setRetryCount] = useState(0);
  const [preparationError, setPreparationError] = useState<string | null>(null);

  // This hook runs when the screen loads to get a fresh OTP.
  useEffect(() => {
    const getFreshOtpForRegistration = async () => {
      try {
        setPreparationError(null);
        console.log(`Requesting a fresh OTP for ${phoneNumber} to complete registration... (Attempt ${retryCount + 1})`);
        
        // Add a small delay to ensure backend is ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await authService.requestOtp(phoneNumber);
        if (response.success && response.data?.developmentOtp) {
          setFinalOtp(response.data.developmentOtp);
          console.log(`Fresh OTP received: ${response.data.developmentOtp}`);
          setRetryCount(0); // Reset retry count on success
        } else {
          throw new Error(response.message || 'Failed to get a fresh OTP.');
        }
      } catch (error: any) {
        console.error('OTP preparation error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to prepare registration';
        setPreparationError(errorMessage);
        
        // Auto-retry up to 3 times with increasing delays
        if (retryCount < 3) {
          const retryDelay = (retryCount + 1) * 2000; // 2s, 4s, 6s
          console.log(`Retrying OTP request in ${retryDelay}ms...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryDelay);
        }
      } finally {
        setIsPreparing(false);
      }
    };

    getFreshOtpForRegistration();
  }, [phoneNumber, retryCount]);

  const handleChoosePhoto = () => {
    launchImageLibrary(
      { 
        mediaType: 'photo', 
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
      }, 
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.error('Image picker error:', response.errorMessage);
          Alert.alert('Error', 'Could not select image. Please try again.');
        } else if (response.assets && response.assets.length > 0) {
          setSelectedImage(response.assets[0]);
        }
      }
    );
  };

  const handleCompleteProfile = async () => {
    if (!finalOtp) {
      Alert.alert(
        'Registration Not Ready', 
        'Please wait for the system to prepare your registration, or try refreshing.'
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters long.');
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
      console.log('Attempting registration with:', {
        phoneNumber,
        otpLength: finalOtp.length,
        profileName: profile.name,
        hasImage: !!selectedImage,
      });

      await authService.verifyOtpAndRegister(phoneNumber, finalOtp, profile, selectedImage || undefined);
      
      // If we reach here, registration was successful
      console.log('Registration completed successfully');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'An unexpected error occurred during registration.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle specific error cases
      if (errorMessage.includes('Invalid phone number or OTP')) {
        Alert.alert(
          'Registration Failed',
          'The verification code has expired or is invalid. Please request a new verification code.',
          [
            { text: 'Go Back', onPress: () => navigation.goBack() },
            { 
              text: 'Retry', 
              onPress: () => {
                setFinalOtp(null);
                setIsPreparing(true);
                setRetryCount(0);
              }
            }
          ]
        );
      } else if (errorMessage.includes('phone number already exists')) {
        Alert.alert(
          'Account Exists',
          'An account with this phone number already exists. Please try logging in instead.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'Registration Failed',
          errorMessage,
          [
            { text: 'Go Back', onPress: () => navigation.goBack() },
            { text: 'Retry', onPress: () => handleCompleteProfile() }
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryPreparation = () => {
    setPreparationError(null);
    setIsPreparing(true);
    setRetryCount(0);
    setFinalOtp(null);
  };

  // Show a loading indicator while the new OTP is being requested.
  if (isPreparing) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background1 }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[customTypography.body.regular, { color: theme.textPrimary, marginTop: 16, textAlign: 'center' }]}>
          Preparing your registration...
        </Text>
        {retryCount > 0 && (
          <Text style={[customTypography.caption1.regular, { color: theme.textSecondary, marginTop: 8, textAlign: 'center' }]}>
            Attempt {retryCount + 1} of 4
          </Text>
        )}
      </View>
    );
  }

  // Show error state if preparation failed
  if (preparationError && !finalOtp) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background1 }]}>
        <Text style={[customTypography.heading3.bold, { color: theme.textPrimary, marginBottom: 16, textAlign: 'center' }]}>
          Registration Preparation Failed
        </Text>
        <Text style={[customTypography.body.regular, { color: theme.textSecondary, marginBottom: 24, textAlign: 'center', paddingHorizontal: 20 }]}>
          {preparationError}
        </Text>
        <Button
          title="Retry"
          onPress={handleRetryPreparation}
          buttonStyle={[styles.button, { backgroundColor: theme.primary }]}
          titleStyle={[customTypography.button.medium, { color: theme.staticWhite }]}
        />
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          type="outline"
          buttonStyle={[styles.button, { borderColor: theme.borderDefault, marginTop: 12 }]}
          titleStyle={[customTypography.button.medium, { color: theme.textPrimary }]}
        />
      </View>
    );
  }
  
  const avatarSource = selectedImage?.uri 
    ? { uri: selectedImage.uri } 
    : (name.trim() ? { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random&color=fff` } : undefined);

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
          maxLength={50}
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
          multiline
          maxLength={150}
        />

        {finalOtp && (
          <View style={[styles.debugContainer, { backgroundColor: theme.background2, borderColor: theme.borderLight }]}>
            <Text style={[customTypography.caption1.medium, { color: theme.textSecondary }]}>
              Debug Info: OTP Ready ({finalOtp})
            </Text>
          </View>
        )}

        <Button
          title="Complete Setup & Login"
          onPress={handleCompleteProfile}
          loading={isLoading}
          disabled={isLoading || !finalOtp || !name.trim()}
          buttonStyle={[styles.button, { backgroundColor: theme.primary, opacity: (!finalOtp || !name.trim()) ? 0.6 : 1 }]}
          titleStyle={[customTypography.button.medium, { color: theme.staticWhite }]}
          containerStyle={styles.buttonContainer}
        />

        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={isLoading}
        >
          <Text style={[customTypography.body.medium, { color: theme.textSecondary }]}>
            Go Back to Login
          </Text>
        </TouchableOpacity>
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
    padding: 20,
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
  backButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  debugContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
});

export default ProfileSetupScreen;