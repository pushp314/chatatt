// To play voice messages
// Component for voice message recording UI & logic// src/components/conversations/screens/MessageScreen/VoiceMessagePlayer.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert // <--- IMPORT ALERT HERE
} from 'react-native';
import { Icon } from '@rneui/themed';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Slider from '@react-native-community/slider';
import { CustomColors, customTypography } from '../../../../theme/theme'; // Adjust path

interface VoiceMessagePlayerProps {
    uri:string
    audioUrl: string;
    theme: CustomColors;
    isMyMessage: boolean;
    messageId: number | string; // For unique player instances
    duration?: number; // Optional: if duration is known beforehand from metadata
}

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
    audioUrl,
    theme,
    isMyMessage,
    messageId,
    // duration: knownDuration,
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [duration, setDuration] = useState('00:00');
    const [currentTime, setCurrentTime] = useState('00:00');
    const [playSecs, setPlaySecs] = useState(0);
    const [durationSecs, setDurationSecs] = useState(0);

    // Each player instance needs its own AudioRecorderPlayer
    const playerRef = useRef(new AudioRecorderPlayer());
    playerRef.current.setSubscriptionDuration(0.1); // Update progress frequently

    useEffect(() => {
        // Cleanup listener on unmount
        return () => {
            playerRef.current.removePlayBackListener();
            playerRef.current.stopPlayer().catch(err => console.log("Error stopping player on unmount:", err));
        };
    }, []);

    const onStartPlay = async () => {
        if (!audioUrl) {
            Alert.alert("Error", "Audio file not available.");
            return;
        }
        setIsLoading(true);
        try {
            // Stop any previous playback from this instance
            await playerRef.current.stopPlayer();
            playerRef.current.removePlayBackListener(); // Remove old listener

            console.log(`Playing audio from: ${audioUrl}`);
            const msg = await playerRef.current.startPlayer(audioUrl);
            setIsLoading(false);
            setIsPlaying(true);
            // The duration is returned in msg in ms
            const totalDurationSec = msg ? Math.floor(Number(msg) / 1000) : 0;
            setDurationSecs(totalDurationSec);
            setDuration(playerRef.current.mmss(totalDurationSec));

            playerRef.current.addPlayBackListener(e => {
                if (e.currentPosition === e.duration) { // Playback finished
                    setIsPlaying(false);
                    playerRef.current.stopPlayer(); // Ensure player stops
                    playerRef.current.removePlayBackListener();
                    setCurrentTime(playerRef.current.mmss(Math.floor(e.duration / 1000)));
                    setPlaySecs(Math.floor(e.duration / 1000));
                } else {
                    setCurrentTime(playerRef.current.mmss(Math.floor(e.currentPosition / 1000)));
                    setPlaySecs(Math.floor(e.currentPosition / 1000));
                }
                return;
            });
        } catch (err) {
            console.error('Failed to start player', err);
            setIsLoading(false);
            setIsPlaying(false);
            Alert.alert("Playback Error", "Could not play audio message.");
        }
    };

    const onPausePlay = async () => {
        try {
            await playerRef.current.pausePlayer();
            setIsPlaying(false);
        } catch (err) {
            console.error('Failed to pause player', err);
        }
    };

    const onStopPlay = async () => { // For explicit stop or when seeking
        try {
            await playerRef.current.stopPlayer();
            playerRef.current.removePlayBackListener();
            setIsPlaying(false);
            setCurrentTime('00:00');
            setPlaySecs(0);
        } catch (err) {
            console.error('Failed to stop player', err);
        }
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            onPausePlay();
        } else {
            // If was paused and current time is not 0, resume, else start from beginning
            // The library's startPlayer usually resumes if called again after pause.
            // Or there might be a resumePlayer method. Let's assume startPlayer handles resume.
            onStartPlay();
        }
    };

    const onSliderValueChange = async (value: number) => {
        if (durationSecs > 0) { // Ensure duration is loaded
            try {
                if (isPlaying) await playerRef.current.pausePlayer(); // Pause before seeking
                await playerRef.current.seekToPlayer(value * 1000); // Seek to position in ms
                setPlaySecs(value);
                setCurrentTime(playerRef.current.mmss(value));
                if (isPlaying) await playerRef.current.startPlayer(audioUrl); // Resume if it was playing
            } catch (error) {
                console.error("Error seeking audio:", error);
            }
        }
    };

    const iconColor = isMyMessage ? theme.staticWhite : theme.textPrimary;

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handlePlayPause} disabled={isLoading} style={styles.playButton}>
                {isLoading ? (
                    <ActivityIndicator size="small" color={iconColor} />
                ) : (
                    <Icon name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'} type="material" size={36} color={iconColor} />
                )}
            </TouchableOpacity>
            <View style={styles.progressContainer}>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={durationSecs > 0 ? durationSecs : 1} // Ensure max is not 0
                    value={playSecs}
                    minimumTrackTintColor={isMyMessage ? theme.staticWhite : theme.primary}
                    maximumTrackTintColor={isMyMessage ? theme.borderLight : theme.textTertiary}
                    thumbTintColor={isMyMessage ? theme.staticWhite : theme.primary}
                    onSlidingComplete={onSliderValueChange} // Or onValueChange for live seek
                    disabled={isLoading || durationSecs === 0}
                />
                <View style={styles.timeContainer}>
                    <Text style={[styles.timeText, { color: iconColor, opacity: 0.8 }]}>{currentTime}</Text>
                    <Text style={[styles.timeText, { color: iconColor, opacity: 0.8 }]}>/</Text>
                    <Text style={[styles.timeText, { color: iconColor, opacity: 0.8 }]}>{duration}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        // maxWidth: '70%', // Let MessageItem bubble handle width
    },
    playButton: {
        marginRight: 10,
    },
    progressContainer: {
        flex: 1,
    },
    slider: {
        width: '100%',
        height: 30, // Smaller height for slider within bubble
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5, // Small padding for time text
    },
    timeText: {
        fontSize: 11,
        ...customTypography.caption1.regular,
    },
});

export default VoiceMessagePlayer;