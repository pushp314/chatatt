// src/components/conversations/screens/MessageScreen/VoiceRecorderButton.tsx
import React, { useState, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform, AppState } from 'react-native';
import { Icon } from '@rneui/themed';
import AudioRecorderPlayer, {
    AudioSet,
    AudioEncoderAndroidType,
    AudioSourceAndroidType,
    AVEncoderAudioQualityIOSType,
    // AVNumberOfChannelsIOS, // Removed, will use direct number for channels
    AVEncodingOption, // Still needed for AVFormatIDKeyIOS
} from 'react-native-audio-recorder-player';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { CustomColors } from '../../../../theme/theme'; // Adjust path

interface VoiceRecorderButtonProps {
    theme: CustomColors;
    onSendAudio: (path: string, duration: number, mimeType: string) => void;
    isBlocked?: boolean;
}

const audioRecorderPlayer = new AudioRecorderPlayer();

// Define a type for the expected return from stopRecorder if it's an object
interface StopRecorderResult {
    uri: string;
    duration: number; // Duration in milliseconds
    // Other properties might exist, but these are the ones we care about
}


const audioSet: AudioSet = {
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AudioSourceAndroid: AudioSourceAndroidType.MIC,
    AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
    AVNumberOfChannelsKeyIOS: 2, // Changed to a direct number for 2 channels
    AVFormatIDKeyIOS: AVEncodingOption.aac, // Sticking to AAC as 'm4a' might not be a valid enum member
};

const VoiceRecorderButton: React.FC<VoiceRecorderButtonProps> = ({
    theme,
    onSendAudio,
    isBlocked,
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordSecs, setRecordSecs] = useState(0);
    const [recordTime, setRecordTime] = useState('00:00:00');
    const pathRef = useRef<string | undefined>();
    const durationRef = useRef<number>(0); // To store the actual duration from the listener


    const requestMicrophonePermission = async (): Promise<boolean> => {
        const permission = Platform.select({
            ios: PERMISSIONS.IOS.MICROPHONE,
            android: PERMISSIONS.ANDROID.RECORD_AUDIO,
        });

        if (!permission) return false;

        let status = await check(permission);

        if (status === RESULTS.DENIED) {
            status = await request(permission);
        }

        if (status === RESULTS.GRANTED) {
            return true;
        } else {
            Alert.alert(
                'Permission Denied',
                'Microphone permission is required to record voice messages. Please enable it in settings.',
            );
            return false;
        }
    };

    const onStartRecord = async () => {
        if (isBlocked) return;
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) return;

        setIsRecording(true);

        try {
            audioRecorderPlayer.removeRecordBackListener();

            const uri = await audioRecorderPlayer.startRecorder(undefined, audioSet);
            console.log('Recording URI:', uri);

            audioRecorderPlayer.addRecordBackListener(e => {
                setRecordSecs(e.currentPosition);
                setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition / 1000)));
                durationRef.current = e.currentPosition; // Store current position as potential duration
                return;
            });
            pathRef.current = uri; // Store the actual path returned
        } catch (err) {
            console.error('Failed to start recording', err);
            setIsRecording(false);
            Alert.alert("Recording Error", "Could not start recording.");
        }
    };

    const onStopRecord = async () => {
        if (!isRecording) return;

        try {
            const result = await audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
            setIsRecording(false);
            setRecordSecs(0);
            setRecordTime('00:00:00'); // Reset UI

            // Explicitly cast result to a known type or 'any' to resolve 'never' issue
            const stopResult = result as string | StopRecorderResult; 

            let resultUri: string | undefined;
            let finalDurationMs: number = 0;

            if (typeof stopResult === 'string') {
                resultUri = stopResult;
                finalDurationMs = durationRef.current; // Fallback to listener duration
            } else if (stopResult && typeof stopResult === 'object' && 'uri' in stopResult) {
                // Ensure 'uri' and 'duration' exist on the object
                resultUri = stopResult.uri;
                finalDurationMs = stopResult.duration || durationRef.current; // Prefer result.duration
            }

            if (resultUri && finalDurationMs > 0) {
                console.log(`Recording stopped, file saved at: ${resultUri}`);
                
                let mimeType: string;
                if (Platform.OS === 'ios') {
                    // Check if audioSet.AVFormatIDKeyIOS is 'aac' or similar
                    // The library might produce .m4a files even if the format ID is 'aac'
                    // For typical AAC/M4A recordings on iOS, audio/mp4 is common.
                    mimeType = 'audio/mp4'; 
                } else { // Android
                    // Android often saves AAC/AMR to MP4 container as well.
                    mimeType = 'audio/mp4'; 
                }

                onSendAudio(resultUri, Math.floor(finalDurationMs / 1000), mimeType);
            } else {
                console.warn("No valid path or duration after stopping recording", resultUri, finalDurationMs);
                Alert.alert("Recording Issue", "Audio recording was not saved correctly or has no duration.");
            }
        } catch (err) {
            console.error('Failed to stop recording', err);
            setIsRecording(false);
            Alert.alert("Recording Error", "Could not stop recording properly.");
        }
        pathRef.current = undefined; // Reset path
        durationRef.current = 0; // Reset duration
    };

    const handlePress = () => {
        if (isRecording) {
            onStopRecord();
        } else {
            onStartRecord();
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: isRecording ? theme.errorBackground : theme.primary }]}
            onPress={handlePress}
            disabled={isBlocked}
        >
            <Icon name={isRecording ? "stop-circle" : "mic"} type="material-icons" color={theme.staticWhite} size={24} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 10,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        marginRight: 8,
        width: 46,
        height: 46,
    },
});

export default VoiceRecorderButton;