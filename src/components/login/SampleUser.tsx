// src/components/login/SampleUser.tsx

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import {
  CustomColors,
  customThemeColorsDark,
  customThemeColorsLight,
  customTypography,
} from '../../theme/theme';
import { authService } from '../../services/authService';
import { SCREEN_CONSTANTS } from '../../utils/AppConstants';

const PHONE_COUNTRY_CODE = '+91';
type LoadingStep = null | 'requestingOtp' | 'verifying';
type NavigationProps = StackNavigationProp<RootStackParamList, 'SampleUser'>;

const SampleUser: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [developmentOtp, setDevelopmentOtp] = useState<string | null>(null);

  const navigation = useNavigation<NavigationProps>();
  const colorScheme = useColorScheme();
  const theme: CustomColors = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;
  const { width } = Dimensions.get('window');

  const handleRequestOtp = async () => {
    const tenDigitNumber = phoneNumber.trim();
    if (tenDigitNumber.length !== 10 || !/^\d{10}$/.test(tenDigitNumber)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setLoadingStep('requestingOtp');
    try {
      const fullPhoneNumber = authService.getFullPhoneNumber(tenDigitNumber);
      const response = await authService.requestOtp(fullPhoneNumber);
      if (response.success && response.data?.developmentOtp) {
        Alert.alert('OTP Sent', 'An OTP has been sent (check console/response for dev).');
        setDevelopmentOtp(response.data.developmentOtp);
        setIsOtpSent(true);
      } else {
        Alert.alert('Error', response.message || 'Failed to request OTP.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    } finally {
      setLoadingStep(null);
    }
  };

  const handleOtpSubmit = async () => {
    const tenDigitNumber = phoneNumber.trim();
    const currentOtp = otp.trim();

    if (currentOtp.length !== 6 || !/^\d{6}$/.test(currentOtp)) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }
    setLoadingStep('verifying');
    const fullPhoneNumber = authService.getFullPhoneNumber(tenDigitNumber);
    try {
      // Try to log in directly. If successful, the authService handles navigation.
      await authService.loginWithOtp(fullPhoneNumber, currentOtp);
    } catch (error: any) {
      // If login fails because the user is not found (404), navigate to profile setup.
      if (error.status === 404) {
        Alert.alert(
          'Welcome!',
          'Your phone number is verified. Let’s set up your profile.'
        );
        navigation.navigate(SCREEN_CONSTANTS.PROFILE_SETUP_SCREEN, {
          phoneNumber: fullPhoneNumber,
          // We don't pass the used OTP anymore. The next screen will get a new one.
        });
      } else {
        // Handle other errors (e.g., incorrect OTP, server error)
        Alert.alert('Login Failed', error.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoadingStep(null);
    }
  };

  const isLoading = loadingStep !== null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background2 }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Image
              source={colorScheme === 'dark' ? require('../../assets/icons/Dark.png') : require('../../assets/icons/Light.png')}
              style={[styles.logoImage, { width: width * 0.25, height: width * 0.25 }]}
            />
          </View>
          <Text style={[customTypography.heading2.bold, styles.logInTitle, { color: theme.textPrimary }]}>
            Log In or Sign Up
          </Text>

          {!isOtpSent ? (
            <>
              <Text style={[customTypography.caption1.medium, styles.uidLabel, { color: theme.textPrimary }]}>
                Enter Phone Number
              </Text>
              <View style={[styles.phoneInputContainer, { borderColor: theme.borderLight, backgroundColor: theme.background1 }]}>
                <View style={[styles.phonePrefixContainer, { borderRightColor: theme.borderLight }]}>
                  <Text style={[customTypography.body.regular, styles.phonePrefixText, { color: theme.textPrimary }]}>
                    {PHONE_COUNTRY_CODE}
                  </Text>
                </View>
                <TextInput
                  placeholder="10-digit number"
                  placeholderTextColor={theme.textTertiary}
                  style={[customTypography.body.regular, styles.phoneInput, { color: theme.textPrimary }]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="number-pad"
                  maxLength={10}
                  editable={!isLoading}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={[customTypography.caption1.medium, styles.uidLabel, { color: theme.textPrimary }]}>
                Enter OTP sent to {authService.getFullPhoneNumber(phoneNumber)}
              </Text>
              {developmentOtp && (
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  (For Dev: {developmentOtp})
                </Text>
              )}
              <TextInput
                placeholder="6-digit OTP"
                placeholderTextColor={theme.textTertiary}
                style={[customTypography.body.regular, styles.inputField, { borderColor: theme.borderLight, color: theme.textPrimary, backgroundColor: theme.background1 }]}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => { if (isLoading) return; setIsOtpSent(false); setOtp(''); }}
                style={{ alignSelf: 'flex-end', paddingVertical: 8 }}
                disabled={isLoading}
              >
                <Text style={{ color: theme.primary, ...customTypography.caption1.medium }}>
                  Change Phone Number?
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        <View style={[styles.bottomContainer, { backgroundColor: theme.background2, borderTopColor: theme.borderLight }]}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: theme.primaryButtonBackground }, isLoading && styles.disabledButton]}
            onPress={!isOtpSent ? handleRequestOtp : handleOtpSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.staticWhite} />
            ) : (
              <Text style={[customTypography.button.medium, styles.continueButtonText, { color: theme.staticWhite }]}>
                {!isOtpSent ? 'Request OTP' : 'Verify & Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
// Styles are identical to the previous version and are omitted for brevity
const styles = StyleSheet.create({ container: { flex: 1 }, keyboardAvoidingContainer: { flex: 1 }, scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20 }, logoContainer: { alignItems: 'center', marginVertical: 30 }, logoImage: { resizeMode: 'contain' }, logInTitle: { marginBottom: 24, textAlign: 'center' }, inputField: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }, phoneInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, marginBottom: 16 }, phonePrefixContainer: { paddingHorizontal: 12, paddingVertical: 12, borderRightWidth: 1 }, phonePrefixText: {}, phoneInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 }, uidLabel: { paddingBottom: 8, textAlign: 'left' }, infoText: { textAlign: 'center', fontSize: 12, marginBottom: 10, marginTop: -5 }, bottomContainer: { paddingBottom: 30, paddingHorizontal: 24, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth }, continueButton: { paddingVertical: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 50 }, disabledButton: { opacity: 0.6 }, continueButtonText: { textAlign: 'center', fontWeight: '600' } });

export default SampleUser;