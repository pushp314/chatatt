// src/components/viewers/ImageViewer.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Icon } from '@rneui/themed';
import ImageViewing from 'react-native-image-viewing';
import RNFS from 'react-native-fs';
import { CustomColors } from '../../theme/theme';

interface ImageViewerProps {
  isVisible: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
  theme: CustomColors;
  images?: Array<{ uri: string; title?: string }>;
  initialIndex?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageViewer: React.FC<ImageViewerProps> = ({
  isVisible,
  onClose,
  imageUrl,
  imageName = 'Image',
  theme,
  images = [],
  initialIndex = 0,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // If no images array provided, create one with the single image
  const imageList = images.length > 0 ? images : [{ uri: imageUrl, title: imageName }];

  const handleShare = async () => {
    try {
      await Share.share({
        url: imageUrl,
        title: imageName,
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const timestamp = Date.now();
      const fileExtension = imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${imageName.replace(/\.[^/.]+$/, '')}_${timestamp}.${fileExtension}`;
      
      let downloadPath: string;
      
      if (Platform.OS === 'ios') {
        downloadPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      } else {
        // For Android, use Pictures directory
        downloadPath = `${RNFS.PicturesDirectoryPath}/${fileName}`;
      }

      const downloadResult = await RNFS.downloadFile({
        fromUrl: imageUrl,
        toFile: downloadPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        Alert.alert(
          'Success', 
          Platform.OS === 'ios' 
            ? 'Image saved to Files app'
            : 'Image saved to Pictures folder'
        );
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const HeaderComponent = ({ imageIndex }: { imageIndex: number }) => (
    <View style={[styles.header, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
      <TouchableOpacity onPress={onClose} style={styles.headerButton}>
        <Icon name="close" type="material" color="#ffffff" size={24} />
      </TouchableOpacity>
      
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {imageList[imageIndex]?.title || imageName}
        </Text>
        {imageList.length > 1 && (
          <Text style={styles.headerSubtitle}>
            {imageIndex + 1} of {imageList.length}
          </Text>
        )}
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Icon name="share" type="material" color="#ffffff" size={24} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleDownload} 
          style={styles.headerButton}
          disabled={isDownloading}
        >
          <Icon 
            name={isDownloading ? "hourglass-empty" : "download"} 
            type="material" 
            color="#ffffff" 
            size={24} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const FooterComponent = ({ imageIndex }: { imageIndex: number }) => (
    <View style={[styles.footer, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
      <Text style={styles.footerText}>
        Pinch to zoom • Swipe to navigate
      </Text>
    </View>
  );

  return (
    <ImageViewing
      images={imageList}
      imageIndex={initialIndex}
      visible={isVisible}
      onRequestClose={onClose}
      HeaderComponent={HeaderComponent}
      FooterComponent={FooterComponent}
      backgroundColor="rgba(0, 0, 0, 0.9)"
      swipeToCloseEnabled={true}
      doubleTapToZoomEnabled={true}
      presentationStyle="overFullScreen"
    />
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  footerText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default ImageViewer;