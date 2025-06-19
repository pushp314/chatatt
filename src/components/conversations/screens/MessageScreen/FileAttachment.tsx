import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Icon } from '@rneui/themed';
import { CustomColors, customTypography } from '../../../../theme/theme';

interface FileAttachmentProps {
  fileName: string;
  fileUrl: string;
  theme: CustomColors;
  isMyMessage: boolean; // Keep this prop for potential future styling differences
}

const FileAttachment: React.FC<FileAttachmentProps> = ({ fileName, fileUrl, theme, isMyMessage }) => {
  const handlePress = async () => {
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert("Error", `Don't know how to open this URL: ${fileUrl}`);
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while trying to open the file.");
      console.error("File open error:", error);
    }
  };

  // CORRECTED: Use the primary text color, as the background for media messages
  // is theme.background2 for both you and the other user.
  const fileInfoColor = theme.textPrimary;

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: theme.borderLight }]}>
        <Icon name="insert-drive-file" type="material" size={28} color={theme.iconSecondary} />
      </View>
      <View style={styles.textContainer}>
        <Text
          numberOfLines={2}
          ellipsizeMode="middle"
          style={[styles.fileName, { color: fileInfoColor }]}
        >
          {fileName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 250,
    padding: 10,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  fileName: {
    ...customTypography.body.regular,
  },
});

export default FileAttachment;