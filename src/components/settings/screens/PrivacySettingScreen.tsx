import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ListItem, Switch } from '@rneui/themed';
import { Picker } from '@react-native-picker/picker';
import {
  customThemeColorsLight,
  customThemeColorsDark,
  CustomColors,
  customTypography,
} from '../../../theme/theme';
import {
  userService,
  PrivacySettings, // NEW: Import PrivacySettings
} from '../../../services/userService';
import debounce from 'lodash.debounce';

// --- Picker Options ---
const visibilityOptions = [
  { label: 'Everyone', value: 'everyone' },
  { label: 'My Contacts', value: 'my_contacts' },
  { label: 'Nobody', value: 'nobody' },
];

const groupAddOptions = [
  { label: 'Everyone', value: 'everyone' },
  { label: 'My Contacts', value: 'my_contacts' },
];

// --- Main Component ---
const PrivacySettingScreen: React.FC = () => {
  const scheme = useColorScheme();
  const theme: CustomColors = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getPrivacySettings(); // NEW: Call getPrivacySettings
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        Alert.alert('Error', response.message || 'Could not fetch settings.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [fetchSettings])
  );

  const debouncedUpdate = useRef(
    debounce(async (updatedSettings: PrivacySettings) => { // NEW: Use PrivacySettings type
      setIsSaving(true);
      try {
        const response = await userService.updatePrivacySettings(updatedSettings); // NEW: Call updatePrivacySettings
        if (response.success && response.data) {
          setSettings(response.data); // Sync state with server response
        } else {
          Alert.alert('Update Failed', response.message || 'Could not save settings.');
          fetchSettings(); // Revert on failure
        }
      } catch (error: any) {
        Alert.alert('Update Error', error.message || 'An unexpected error occurred.');
        fetchSettings(); // Revert on failure
      } finally {
        setIsSaving(false);
      }
    }, 1000) // 1-second delay before sending API call
  ).current;

  const handleSettingsChange = (newSettings: PrivacySettings) => { // NEW: Use PrivacySettings type
    setSettings(newSettings); // Optimistic UI update
    debouncedUpdate(newSettings); // Trigger debounced API call
  };

  const updateSetting = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => { // NEW: Use PrivacySettings type
    if (!settings) return;
    handleSettingsChange({ ...settings, [key]: value });
  };

  if (isLoading && !settings) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background1 }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background1 }]}>
        <Text style={{ color: theme.textSecondary }}>Could not load settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}
      <ScrollView style={[{ backgroundColor: theme.background2 }]}>
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Visibility</Text>
        <View style={styles.listContainer}>
          <PickerItem
            setting="Last seen and online"
            options={visibilityOptions}
            selectedValue={settings.lastSeenAndOnline}
            onValueChange={(value) => updateSetting('lastSeenAndOnline', value as PrivacySettings['lastSeenAndOnline'])}
            theme={theme}
            disabled={isSaving}
          />
          <PickerItem
            setting="Profile Photo"
            options={visibilityOptions}
            selectedValue={settings.profilePhotoVisibility}
            onValueChange={(value) => updateSetting('profilePhotoVisibility', value as PrivacySettings['profilePhotoVisibility'])}
            theme={theme}
            disabled={isSaving}
          />
          <PickerItem
            setting="About"
            options={visibilityOptions}
            selectedValue={settings.aboutVisibility}
            onValueChange={(value) => updateSetting('aboutVisibility', value as PrivacySettings['aboutVisibility'])}
            theme={theme}
            disabled={isSaving}
          />
        </View>

        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Messaging</Text>
        <View style={styles.listContainer}>
          <PickerItem
            setting="Who can add me to groups"
            options={groupAddOptions}
            selectedValue={settings.groupAddPermissions}
            onValueChange={(value) => updateSetting('groupAddPermissions', value as PrivacySettings['groupAddPermissions'])}
            theme={theme}
            disabled={isSaving}
          />
          <ListItem bottomDivider containerStyle={{ backgroundColor: theme.background1 }}>
            <ListItem.Content>
              <ListItem.Title style={{ color: theme.textPrimary }}>Read Receipts</ListItem.Title>
              <ListItem.Subtitle style={{ color: theme.textSecondary }}>If disabled, you won't send or receive read receipts.</ListItem.Subtitle>
            </ListItem.Content>
            <Switch
              value={settings.readReceiptsEnabled}
              onValueChange={(value) => updateSetting('readReceiptsEnabled', value)}
              color={theme.primary}
              disabled={isSaving}
            />
          </ListItem>
        </View>

        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Security</Text>
        <View style={styles.listContainer}>
          <ListItem containerStyle={{ backgroundColor: theme.background1 }}>
            <ListItem.Content>
              <ListItem.Title style={{ color: theme.textPrimary }}>Security Notifications</ListItem.Title>
              <ListItem.Subtitle style={{ color: theme.textSecondary }}>Get notified when your security code changes.</ListItem.Subtitle>
            </ListItem.Content>
            <Switch
              value={settings.securityNotificationsEnabled}
              onValueChange={(value) => updateSetting('securityNotificationsEnabled', value)}
              color={theme.primary}
              disabled={isSaving}
            />
          </ListItem>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

// --- Helper Component for Pickers ---
const PickerItem: React.FC<{
  setting: string;
  options: { label: string; value: string }[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  theme: CustomColors;
  disabled: boolean;
}> = ({ setting, options, selectedValue, onValueChange, theme, disabled }) => (
  <ListItem bottomDivider containerStyle={{ backgroundColor: theme.background1, flexDirection: 'column', alignItems: 'flex-start', opacity: disabled ? 0.5 : 1 }}>
    <Text style={[styles.pickerLabel, { color: theme.textPrimary }]}>{setting}</Text>
    <Picker
      selectedValue={selectedValue}
      onValueChange={onValueChange}
      style={[styles.picker, Platform.OS === 'android' && { color: theme.textPrimary, backgroundColor: theme.background1 }]}
      itemStyle={Platform.OS === 'ios' ? { color: theme.textPrimary } : {}}
      dropdownIconColor={theme.icon}
      enabled={!disabled}
    >
      {options.map(opt => (
        <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
      ))}
    </Picker>
  </ListItem>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { ...customTypography.caption1.bold, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, textTransform: 'uppercase' },
  listContainer: { marginBottom: 10 },
  pickerLabel: { ...customTypography.body.regular, marginLeft: 15, marginTop: 10, marginBottom: Platform.OS === 'ios' ? -10 : 0, fontWeight: 'bold' },
  picker: { width: '100%', height: Platform.OS === 'ios' ? 120 : 60, },
  savingOverlay: {
    position: 'absolute',
    top: 10,
    right: 15,
    padding: 5,
    zIndex: 10,
  },
});

export default PrivacySettingScreen;