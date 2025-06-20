// src/components/conversations/screens/MessageScreen/FileAttachment.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '@rneui/themed';
import { CustomColors, customTypography } from '../../../../theme/theme';

interface FileAttachmentProps {
  fileName: string;
  fileUrl: string;
  theme: CustomColors;
  isMyMessage: boolean;
  onPress?: () => void;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({ 
  fileName, 
  fileUrl, 
  theme, 
  isMyMessage,
  onPress 
}) => {
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'picture-as-pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'xls':
      case 'xlsx':
        return 'table-chart';
      case 'ppt':
      case 'pptx':
        return 'slideshow';
      case 'txt':
        return 'text-snippet';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive';
      default:
        return 'insert-drive-file';
    }
  };

  const getFileSize = () => {
    // This would typically come from the file metadata
    // For now, we'll show a placeholder
    return 'Tap to view';
  };

  const fileInfoColor = theme.textPrimary;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.8}>
      <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight + '20' }]}>
        <Icon 
          name={getFileIcon(fileName)} 
          type="material" 
          size={32} 
          color={theme.primary} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text
          numberOfLines={2}
          ellipsizeMode="middle"
          style={[styles.fileName, { color: fileInfoColor }]}
        >
          {fileName}
        </Text>
        <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
          {getFileSize()}
        </Text>
      </View>
      <View style={styles.actionContainer}>
        <Icon 
          name="open-in-new" 
          type="material" 
          size={20} 
          color={theme.textSecondary} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 280,
    padding: 12,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    ...customTypography.body.medium,
    fontSize: 14,
    marginBottom: 2,
  },
  fileSize: {
    ...customTypography.caption1.regular,
    fontSize: 12,
  },
  actionContainer: {
    padding: 4,
  },
});

export default FileAttachment;