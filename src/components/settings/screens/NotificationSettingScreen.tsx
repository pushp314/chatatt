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
  NotificationSettings,
} from '../../../services/userService';
import debounce from 'lodash.debounce';

// --- Picker Options ---
const toneOptions = [
    { label: 'Default', value: 'default' },
    { label: 'Silent', value: 'silent' },
    { label: 'Short Beep', value: 'custom_short_beep' },
    { label: 'Chime', value: 'chime' },
];

const vibrationOptions = [
    { label: 'Default', value: 'default' },
    { label: 'Short Buzz', value: 'short_buzz' },
    { label: 'Long Buzz', value: 'long_buzz' },
    { label: 'None', value: 'none' },
];


// --- Main Component ---
const NotificationSettingsScreen: React.FC = () => {
  const scheme = useColorScheme();
  const theme: CustomColors = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getNotificationSettings();
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
    debounce(async (updatedSettings: NotificationSettings) => {
      setIsSaving(true);
      try {
        const response = await userService.updateNotificationSettings(updatedSettings);
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

  const handleSettingsChange = (newSettings: NotificationSettings) => {
    setSettings(newSettings); // Optimistic UI update
    debouncedUpdate(newSettings); // Trigger debounced API call
  };

  const updateSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    if (!settings) return;
    handleSettingsChange({ ...settings, [key]: value });
  };

  const updateOsChannelSetting = (key: 'new_messages' | 'calls', value: boolean) => {
    if (!settings) return;
    handleSettingsChange({
      ...settings,
      osNotificationChannelsConfig: {
        ...(settings.osNotificationChannelsConfig || {}),
        [key]: value,
      },
    });
  };

  if (isLoading && !settings) {
    return <View style={[styles.centered, { backgroundColor: theme.background1 }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  if (!settings) {
    return <View style={[styles.centered, { backgroundColor: theme.background1 }]}><Text style={{ color: theme.textSecondary }}>Could not load settings.</Text></View>;
  }

  return (
    <View style={styles.container}>
      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}
      <ScrollView style={[{ backgroundColor: theme.background2 }]}>
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>System Notifications</Text>
        <View style={styles.listContainer}>
          <ListItem bottomDivider containerStyle={{ backgroundColor: theme.background1 }}>
            <ListItem.Content>
              <ListItem.Title style={{ color: theme.textPrimary }}>New Messages</ListItem.Title>
            </ListItem.Content>
            <Switch
              value={settings.osNotificationChannelsConfig?.new_messages ?? false}
              onValueChange={(value) => updateOsChannelSetting('new_messages', value)}
              color={theme.primary}
              disabled={isSaving}
            />
          </ListItem>
          <ListItem containerStyle={{ backgroundColor: theme.background1 }}>
            <ListItem.Content>
              <ListItem.Title style={{ color: theme.textPrimary }}>Incoming Calls</ListItem.Title>
            </ListItem.Content>
            <Switch
              value={settings.osNotificationChannelsConfig?.calls ?? false}
              onValueChange={(value) => updateOsChannelSetting('calls', value)}
              color={theme.primary}
              disabled={isSaving}
            />
          </ListItem>
        </View>

        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>In-App Tones</Text>
        <View style={styles.listContainer}>
          <ListItem bottomDivider containerStyle={{ backgroundColor: theme.background1 }}>
            <ListItem.Content>
              <ListItem.Title style={{ color: theme.textPrimary }}>Conversation Tones</ListItem.Title>
              <ListItem.Subtitle style={{ color: theme.textSecondary }}>Play sounds for messages</ListItem.Subtitle>
            </ListItem.Content>
            <Switch
              value={settings.conversationTonesEnabled}
              onValueChange={(value) => updateSetting('conversationTonesEnabled', value)}
              color={theme.primary}
              disabled={isSaving}
            />
          </ListItem>
          <PickerItem setting="Message Tone" options={toneOptions} selectedValue={settings.messageTone} onValueChange={(value) => updateSetting('messageTone', value)} theme={theme} disabled={isSaving} />
          <PickerItem setting="Group Tone" options={toneOptions} selectedValue={settings.groupTone} onValueChange={(value) => updateSetting('groupTone', value)} theme={theme} disabled={isSaving} />
          <PickerItem setting="Call Tone" options={toneOptions} selectedValue={settings.callTone} onValueChange={(value) => updateSetting('callTone', value)} theme={theme} disabled={isSaving} />
        </View>

        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Vibration</Text>
        <View style={styles.listContainer}>
          <PickerItem setting="Vibration Pattern" options={vibrationOptions} selectedValue={settings.vibrationPattern} onValueChange={(value) => updateSetting('vibrationPattern', value)} theme={theme} disabled={isSaving} />
        </View>
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
  <ListItem containerStyle={{ backgroundColor: theme.background1, flexDirection: 'column', alignItems: 'flex-start', opacity: disabled ? 0.5 : 1 }}>
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

export default NotificationSettingsScreen;