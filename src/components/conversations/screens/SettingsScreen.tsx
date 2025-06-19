import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Avatar, ListItem, Icon } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '../../../store/authStore';
import { SettingsStackParamList } from '../../../navigation/types';
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants';
import { useColorScheme } from 'react-native';
import { customThemeColorsLight, customThemeColorsDark, CustomColors, customTypography } from '../../../theme/theme';

type SettingsScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  typeof SCREEN_CONSTANTS.SETTINGS
>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { currentUser } = useAuthStore();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  if (!currentUser) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background1 }]}>
        <Text style={{ color: theme.textPrimary }}>User not found. Please login again.</Text>
      </View>
    );
  }

  const profileOptions = [
    {
      title: 'Edit Profile',
      icon: 'edit',
      type: 'material',
      action: () => navigation.navigate(SCREEN_CONSTANTS.UPDATE_PROFILE),
    },
  ];

  // --- THIS IS THE MODIFIED PART ---
  // I have added "Blocked Contacts" to this array, right after "Privacy".
  const appSettingsOptions = [
    { title: 'Notifications', icon: 'notifications-outline', type: 'ionicon', action: () => navigation.navigate(SCREEN_CONSTANTS.NOTIFICATION_SETTINGS_SCREEN) },
{ // NEW: Added Privacy Settings navigation
      title: 'Privacy',
      icon: 'shield-checkmark-outline',
      type: 'ionicon',
      action: () => navigation.navigate(SCREEN_CONSTANTS.PRIVACY_SETTINGS_SCREEN),
    },
    {
      title: 'Blocked Contacts',
      icon: 'block',
      type: 'material',
      action: () => navigation.navigate(SCREEN_CONSTANTS.BLOCKED_USERS_SCREEN),
    },
     { // NEW: Added Data and Storage navigation
      title: 'Data and Storage',
      icon: 'folder-open-outline',
      type: 'ionicon',
      action: () => navigation.navigate(SCREEN_CONSTANTS.DATA_STORAGE_SETTINGS_SCREEN),
    },
  ];

  const supportOptions = [
    { title: 'Help & Support', icon: 'help-circle-outline', type: 'ionicon', action: () => Alert.alert("UI Only", "Help UI (not implemented).") },
    { title: 'About', icon: 'information-circle-outline', type: 'ionicon', action: () => Alert.alert("UI Only", "App info UI (not implemented).") },
  ];

  // The rest of the file remains the same. The code below will automatically
  // render the new option because we added it to the array above.
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background2 }]}>
      <View style={[styles.profileSection, { backgroundColor: theme.background1, borderBottomColor: theme.borderLight }]}>
        <Avatar
          rounded
          size="large"
          source={currentUser.getAvatar() ? { uri: currentUser.getAvatar() } : undefined}
          icon={!currentUser.getAvatar() ? { name: 'person', type: 'material', color: theme.staticWhite } : undefined}
          containerStyle={[styles.avatar, !currentUser.getAvatar() && { backgroundColor: theme.primaryLight }]}
        />
        <Text style={[styles.userName, { color: theme.textPrimary }]}>{currentUser.getName() || 'User'}</Text>
      </View>

      <View style={styles.listContainer}>
        {profileOptions.map((item, i) => (
          <ListItem key={i} bottomDivider onPress={item.action} containerStyle={{backgroundColor: theme.background1}}>
            <Icon name={item.icon} type={item.type} color={theme.icon}/>
            <ListItem.Content>
              <ListItem.Title style={{color: theme.textPrimary, ...customTypography.body.regular}}>{item.title}</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron color={theme.iconFaint} />
          </ListItem>
        ))}
      </View>

      <Text style={[styles.sectionHeader, {color: theme.textSecondary}]}>App Settings</Text>
      <View style={styles.listContainer}>
        {appSettingsOptions.map((item, i) => (
          <ListItem key={i} bottomDivider={i < appSettingsOptions.length -1} onPress={item.action} containerStyle={{backgroundColor: theme.background1}}>
            <Icon name={item.icon} type={item.type} color={theme.icon}/>
            <ListItem.Content>
              <ListItem.Title style={{color: theme.textPrimary, ...customTypography.body.regular}}>{item.title}</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron color={theme.iconFaint} />
          </ListItem>
        ))}
      </View>

      <Text style={[styles.sectionHeader, {color: theme.textSecondary}]}>Support</Text>
        <View style={styles.listContainer}>
        {supportOptions.map((item, i) => (
          <ListItem key={i} bottomDivider={i < supportOptions.length -1} onPress={item.action} containerStyle={{backgroundColor: theme.background1}}>
            <Icon name={item.icon} type={item.type} color={theme.icon}/>
            <ListItem.Content>
              <ListItem.Title style={{color: theme.textPrimary, ...customTypography.body.regular}}>{item.title}</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron color={theme.iconFaint} />
          </ListItem>
        ))}
      </View>
      <View style={{height: 30}}/>
    </ScrollView>
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  userName: {
    ...customTypography.heading3.bold,
    marginBottom: 4,
  },
  userUid: {
    ...customTypography.caption1.regular,
    fontSize: 14,
  },
  listContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    ...customTypography.caption1.bold,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
});

export default SettingsScreen;