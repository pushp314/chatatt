import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ListItem, Switch } from '@rneui/themed';
import {
  customThemeColorsLight,
  customThemeColorsDark,
  CustomColors,
  customTypography,
} from '../../../theme/theme';
import {
  userService,
  MediaAutoDownloadSettings, // NEW: Import MediaAutoDownloadSettings
} from '../../../services/userService';
import debounce from 'lodash.debounce';

const DataStorageSettingsScreen: React.FC = () => {
  const scheme = useColorScheme();
  const theme: CustomColors = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  const [settings, setSettings] = useState<MediaAutoDownloadSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getDataStorageSettings(); // NEW: Call getDataStorageSettings
      if (response.success && response.data?.mediaAutoDownload) {
        setSettings(response.data.mediaAutoDownload);
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
    debounce(async (updatedSettings: MediaAutoDownloadSettings) => { // NEW: Use MediaAutoDownloadSettings
      setIsSaving(true);
      try {
        const response = await userService.updateDataStorageSettings({ mediaAutoDownload: updatedSettings }); // NEW: Call updateDataStorageSettings
        if (response.success && response.data?.mediaAutoDownload) {
          setSettings(response.data.mediaAutoDownload); // Sync state with server response
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

  const handleSettingsChange = (newSettings: MediaAutoDownloadSettings) => { // NEW: Use MediaAutoDownloadSettings
    setSettings(newSettings); // Optimistic UI update
    debouncedUpdate(newSettings); // Trigger debounced API call
  };

  const toggleSetting = (mediaType: 'images' | 'audio' | 'videos' | 'documents', connectionType: 'mobile' | 'wifi' | 'roaming') => {
    if (!settings) return;

    const key: keyof MediaAutoDownloadSettings = `${mediaType}_${connectionType}` as keyof MediaAutoDownloadSettings;
    const updatedSettings = { ...settings, [key]: !settings[key] };
    handleSettingsChange(updatedSettings);
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
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Media Auto-Download</Text>

        {/* When using Mobile Data */}
        <Text style={[styles.subsectionHeader, { color: theme.textSecondary }]}>When using mobile data</Text>
        <View style={styles.listContainer}>
          <ToggleListItem
            title="Photos"
            value={settings.images_mobile}
            onToggle={() => toggleSetting('images', 'mobile')}
            theme={theme}
            disabled={isSaving}
          />
          <ToggleListItem
            title="Audio"
            value={settings.audio_mobile}
            onToggle={() => toggleSetting('audio', 'mobile')}
            theme={theme}
            disabled={isSaving}
          />
          <ToggleListItem
            title="Videos"
            value={settings.videos_mobile}
            onToggle={() => toggleSetting('videos', 'mobile')}
            theme={theme}
            disabled={isSaving}
          />
          <ToggleListItem
            title="Documents"
            value={settings.documents_mobile}
            onToggle={() => toggleSetting('documents', 'mobile')}
            theme={theme}
            disabled={isSaving}
            isLast={true}
          />
        </View>

        {/* When connected on Wi-Fi */}
        <Text style={[styles.subsectionHeader, { color: theme.textSecondary }]}>When connected on Wi-Fi</Text>
        <View style={styles.listContainer}>
          <ToggleListItem
            title="Photos"
            value={settings.images_wifi}
            onToggle={() => toggleSetting('images', 'wifi')}
            theme={theme}
            disabled={isSaving}
          />
          <ToggleListItem
            title="Audio"
            value={settings.audio_wifi}
            onToggle={() => toggleSetting('audio', 'wifi')}
            theme={theme}
            disabled={isSaving}
          />
          <ToggleListItem
            title="Videos"
            value={settings.videos_wifi}
            onToggle={() => toggleSetting('videos', 'wifi')}
            theme={theme}
            disabled={isSaving}
          />
          <ToggleListItem
            title="Documents"
            value={settings.documents_wifi}
            onToggle={() => toggleSetting('documents', 'wifi')}
            theme={theme}
            disabled={isSaving}
            isLast={true}
          />
        </View>

        {/* When roaming */}
        <Text style={[styles.subsectionHeader, { color: theme.textSecondary }]}>When roaming</Text>
        <View style={styles.listContainer}>
          <ToggleListItem
            title="Photos"
            value={settings.images_roaming}
            onToggle={() => toggleSetting('images', 'roaming')}
            theme={theme}
            disabled={isSaving}
          />
          <ToggleListItem
            title="Audio"
            value={settings.audio_roaming}
            onToggle={() => toggleSetting('audio', 'roaming')}
            theme={theme}
            disabled={isSaving}
          />
          <ToggleListItem
            title="Videos"
            value={settings.videos_roaming}
            onToggle={() => toggleSetting('videos', 'roaming')}
            theme={theme}
            disabled={isSaving}
          />
          <ToggleListItem
            title="Documents"
            value={settings.documents_roaming}
            onToggle={() => toggleSetting('documents', 'roaming')}
            theme={theme}
            disabled={isSaving}
            isLast={true}
          />
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

// --- Helper Component for Toggle List Items ---
const ToggleListItem: React.FC<{
  title: string;
  value: boolean;
  onToggle: () => void;
  theme: CustomColors;
  disabled: boolean;
  isLast?: boolean;
}> = ({ title, value, onToggle, theme, disabled, isLast = false }) => (
  <ListItem bottomDivider={!isLast} containerStyle={{ backgroundColor: theme.background1, opacity: disabled ? 0.5 : 1 }}>
    <ListItem.Content>
      <ListItem.Title style={{ color: theme.textPrimary, ...customTypography.body.regular }}>{title}</ListItem.Title>
    </ListItem.Content>
    <Switch
      value={value}
      onValueChange={onToggle}
      color={theme.primary}
      disabled={disabled}
    />
  </ListItem>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { ...customTypography.caption1.bold, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, textTransform: 'uppercase' },
  subsectionHeader: { ...customTypography.caption1.regular, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 5, textTransform: 'uppercase' },
  listContainer: { marginBottom: 10 },
  savingOverlay: {
    position: 'absolute',
    top: 10,
    right: 15,
    padding: 5,
    zIndex: 10,
  },
});

export default DataStorageSettingsScreen;