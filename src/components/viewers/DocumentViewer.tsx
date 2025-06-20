// src/components/viewers/DocumentViewer.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Modal,
  SafeAreaView,
  Share,
} from 'react-native';
import { Icon } from '@rneui/themed';
import Pdf from 'react-native-pdf';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import { CustomColors, customTypography } from '../../theme/theme';

interface DocumentViewerProps {
  isVisible: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  theme: CustomColors;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isVisible,
  onClose,
  fileUrl,
  fileName,
  theme,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localFilePath, setLocalFilePath] = useState<string>(''); // Changed from null to empty string
  const [viewMode, setViewMode] = useState<'built-in' | 'external' | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const isPDF = fileExtension === 'pdf';

  useEffect(() => {
    if (isVisible && !localFilePath) {
      downloadFile();
    }
  }, [isVisible, fileUrl]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isVisible) {
      setLocalFilePath('');
      setViewMode(null);
      setDownloadProgress(0);
      setDownloadError(null);
      setIsLoading(false);
    }
  }, [isVisible]);

  const downloadFile = async () => {
    setIsLoading(true);
    setDownloadError(null);
    
    try {
      // Create a safe filename
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const finalFileName = `${timestamp}_${sanitizedFileName}`;
      
      const downloadDest = `${RNFS.DocumentDirectoryPath}/${finalFileName}`;
      
      // Check if file already exists
      const fileExists = await RNFS.exists(downloadDest);
      if (fileExists) {
        setLocalFilePath(downloadDest);
        setIsLoading(false);
        return;
      }

      const downloadOptions = {
        fromUrl: fileUrl,
        toFile: downloadDest,
        progress: (res: any) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          setDownloadProgress(Math.round(progress));
        },
      };

      const downloadResult = await RNFS.downloadFile(downloadOptions).promise;
      
      if (downloadResult.statusCode === 200) {
        // Verify file exists after download
        const fileExists = await RNFS.exists(downloadDest);
        if (fileExists) {
          setLocalFilePath(downloadDest);
        } else {
          throw new Error('File download completed but file not found');
        }
      } else {
        throw new Error(`Download failed with status code: ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown download error';
      setDownloadError(errorMessage);
      Alert.alert('Download Error', `Failed to download file: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewerSelection = (mode: 'built-in' | 'external') => {
    if (!localFilePath) {
      Alert.alert('Error', 'File not available. Please try downloading again.');
      return;
    }
    
    setViewMode(mode);
    if (mode === 'external') {
      openWithExternalApp();
    }
  };

  const openWithExternalApp = async () => {
    if (!localFilePath) {
      Alert.alert('Error', 'File not available');
      return;
    }

    try {
      await FileViewer.open(localFilePath, {
        showOpenWithDialog: true,
        showAppsSuggestions: true,
      });
    } catch (error) {
      console.error('External viewer error:', error);
      Alert.alert(
        'Error', 
        'No app available to open this file type. Please install a compatible app.'
      );
    }
  };

  const handleShare = async () => {
    if (!localFilePath) {
      Alert.alert('Error', 'File not available for sharing');
      return;
    }

    try {
      const shareOptions = Platform.OS === 'ios' 
        ? { url: `file://${localFilePath}`, title: fileName }
        : { url: `file://${localFilePath}`, title: fileName, type: 'application/*' };
        
      await Share.share(shareOptions);
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const handleRetryDownload = () => {
    setDownloadError(null);
    setLocalFilePath('');
    downloadFile();
  };

  const renderViewerSelection = () => (
    <View style={[styles.selectionContainer, { backgroundColor: theme.background1 }]}>
      <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" type="material" color={theme.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Choose Viewer
        </Text>
        <TouchableOpacity 
          onPress={handleShare} 
          style={styles.shareButton}
          disabled={!localFilePath}
        >
          <Icon 
            name="share" 
            type="material" 
            color={localFilePath ? theme.primary : theme.disabled} 
            size={24} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.fileInfo}>
        <Icon 
          name={isPDF ? "picture-as-pdf" : "insert-drive-file"} 
          type="material" 
          color={theme.primary} 
          size={48} 
        />
        <Text style={[styles.fileName, { color: theme.textPrimary }]}>
          {fileName}
        </Text>
        <Text style={[styles.fileType, { color: theme.textSecondary }]}>
          {fileExtension.toUpperCase()} Document
        </Text>
      </View>

      {downloadError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {downloadError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={handleRetryDownload}
          >
            <Text style={[styles.retryButtonText, { color: theme.staticWhite }]}>
              Retry Download
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          {isPDF && localFilePath && (
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: theme.primary }]}
              onPress={() => handleViewerSelection('built-in')}
            >
              <Icon name="visibility" type="material" color={theme.staticWhite} size={24} />
              <Text style={[styles.optionText, { color: theme.staticWhite }]}>
                Built-in Viewer
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.optionButton, 
              { 
                backgroundColor: theme.background2, 
                borderColor: theme.primary, 
                borderWidth: 1,
                opacity: localFilePath ? 1 : 0.5
              }
            ]}
            onPress={() => handleViewerSelection('external')}
            disabled={!localFilePath}
          >
            <Icon name="open-in-new" type="material" color={theme.primary} size={24} />
            <Text style={[styles.optionText, { color: theme.primary }]}>
              External App
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderBuiltInPDFViewer = () => {
    if (!localFilePath) {
      return (
        <View style={[styles.errorContainer, { backgroundColor: theme.background1 }]}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            File not available for viewing
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => setViewMode(null)}
          >
            <Text style={[styles.retryButtonText, { color: theme.staticWhite }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.pdfContainer, { backgroundColor: theme.background1 }]}>
        <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
          <TouchableOpacity onPress={() => setViewMode(null)} style={styles.closeButton}>
            <Icon name="arrow-back" type="material" color={theme.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {fileName}
          </Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Icon name="share" type="material" color={theme.primary} size={24} />
          </TouchableOpacity>
        </View>

        <Pdf
          source={{ uri: localFilePath }} // Now guaranteed to be string, not null
          style={styles.pdf}
          onLoadComplete={(numberOfPages) => {
            console.log(`PDF loaded with ${numberOfPages} pages`);
          }}
          onPageChanged={(page, numberOfPages) => {
            console.log(`Current page: ${page}/${numberOfPages}`);
          }}
          onError={(error) => {
            console.error('PDF Error:', error);
            Alert.alert('PDF Error', 'Failed to load PDF. The file might be corrupted.');
            setViewMode(null);
          }}
          onPressLink={(uri) => {
            Linking.openURL(uri);
          }}
          spacing={0}
          enablePaging={true}
          horizontal={false}
          fitPolicy={0} // Fit width
          scale={1.0}
          minScale={0.5}
          maxScale={3.0}
          enableDoubleTapZoom={true}
          enableAnnotationRendering={true}
        />
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={[styles.loadingContainer, { backgroundColor: theme.background1 }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
        Downloading file...
      </Text>
      <View style={[styles.progressBar, { backgroundColor: theme.background3 }]}>
        <View 
          style={[
            styles.progressFill, 
            { backgroundColor: theme.primary, width: `${downloadProgress}%` }
          ]} 
        />
      </View>
      <Text style={[styles.progressText, { color: theme.textSecondary }]}>
        {downloadProgress}%
      </Text>
      
      {/* Cancel button */}
      <TouchableOpacity
        style={[styles.cancelButton, { borderColor: theme.borderDefault }]}
        onPress={onClose}
      >
        <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background1 }]}>
        {isLoading ? renderLoadingState() : 
         viewMode === 'built-in' && isPDF ? renderBuiltInPDFViewer() : 
         renderViewerSelection()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectionContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  shareButton: {
    padding: 8,
  },
  fileInfo: {
    alignItems: 'center',
    marginVertical: 40,
  },
  fileName: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fileType: {
    fontSize: 14,
    marginTop: 4,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  progressBar: {
    width: '80%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DocumentViewer;