// Component for selecting media/docs
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Icon } from '@rneui/themed';
import { CustomColors, customTypography } from '../../../../theme/theme';

export interface AttachmentOption {
  key: 'camera' | 'gallery' | 'document' | 'audio' | 'contact' | 'poll';
  title: string;
  icon: string;
  type: 'material' | 'material-community' | 'ionicon';
  color: string;
}

export interface AttachmentPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (type: AttachmentOption['key']) => void;
  theme: CustomColors;
}

const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  isVisible,
  onClose,
  onSelect,
  theme,
}) => {
  const options: AttachmentOption[] = [
    { key: 'gallery', title: 'Gallery', icon: 'photo-library', type: 'material', color: '#7E57C2' },
    { key: 'camera', title: 'Camera', icon: 'camera-alt', type: 'material', color: '#EF5350' },
    { key: 'document', title: 'Document', icon: 'insert-drive-file', type: 'material', color: '#42A5F5' },
    { key: 'audio', title: 'Audio', icon: 'headset', type: 'material', color: '#FF7043' },
    { key: 'contact', title: 'Contact', icon: 'contacts', type: 'material', color: '#66BB6A' },
    { key: 'poll', title: 'Poll', icon: 'poll', type: 'material', color: '#26A69A' },
  ];

  const renderItem = ({ item }: { item: AttachmentOption }) => (
    <TouchableOpacity style={styles.optionButton} onPress={() => onSelect(item.key)}>
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Icon name={item.icon} type={item.type} color="#fff" size={28} />
      </View>
      <Text style={[styles.optionText, { color: theme.textPrimary }]}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: theme.background1 }]} onStartShouldSetResponder={() => true}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Share Content</Text>
          <FlatList
            data={options}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            numColumns={3}
            contentContainerStyle={styles.grid}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    ...customTypography.heading3.bold,
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  optionButton: {
    alignItems: 'center',
    margin: 15,
    width: 80,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    ...customTypography.caption1.regular,
  },
});

export default AttachmentPicker;