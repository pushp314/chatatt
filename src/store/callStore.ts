
import { create } from 'zustand';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatCalls } from '@cometchat/calls-sdk-react-native';
import { navigationRef } from '../navigation/NavigationService';
import { SCREEN_CONSTANTS } from '../utils/AppConstants';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

// Simple object types for navigation to avoid non-serializable issues
interface CallParticipantInfo {
    name: string;
    avatar?: string;
}

interface ActiveCallInfo {
    sessionId: string;
    participant: CallParticipantInfo;
    status: 'ringing' | 'connecting' | 'connected' | 'ended';
    type: 'incoming' | 'outgoing';
}

interface CallState {
    incomingCall: CometChat.Call | null;
    activeCall: ActiveCallInfo | null;
    setIncomingCall: (call: CometChat.Call | null) => void;
    initiateCall: (receiverId: string, receiverType: string) => void;
    acceptCall: (callToAccept: CometChat.Call) => void;
    rejectCall: (callToReject: CometChat.Call) => void;
    endCall: () => void;
    clearCallState: () => void;
    _setActiveCall: (callInfo: ActiveCallInfo | null) => void;
}

// Helper to request audio permission
async function requestAudioPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Microphone Permission',
                    message: 'We need access to your microphone for audio calls.',
                    buttonPositive: 'OK',
                }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission Denied', 'Microphone permission is required for audio calls.');
                return false;
            }
            return true;
        } catch (err) {
            console.warn(err);
            return false;
        }
    }
    return true;
}

export const useCallStore = create<CallState>((set, get) => ({
    incomingCall: null,
    activeCall: null,

    setIncomingCall: (call) => set({ incomingCall: call }),

    _setActiveCall: (callInfo) => set({ activeCall: callInfo }),

    initiateCall: async (receiverId, receiverType) => {
        const hasPermission = await requestAudioPermission();
        if (!hasPermission) return;
        // End any existing call session before starting a new one
        if (CometChat.getActiveCall && CometChat.getActiveCall()) {
            try {
                const activeCall = CometChat.getActiveCall();
                if (activeCall && activeCall.getSessionId) {
                    await CometChat.endCall(activeCall.getSessionId());
                }
                if (CometChatCalls.endSession) await CometChatCalls.endSession();
            } catch (e) {
                console.warn('Failed to end previous call session:', e);
            }
        }
        const callType = CometChat.CALL_TYPE.AUDIO;
        const call = new CometChat.Call(receiverId, callType, receiverType);

        CometChat.initiateCall(call).then(
            (outgoingCall) => {
                const receiver = outgoingCall.getCallReceiver() as CometChat.User;
                const callInfo: ActiveCallInfo = {
                    sessionId: outgoingCall.getSessionId(),
                    participant: {
                        name: receiver.getName(),
                        avatar: receiver.getAvatar(),
                    },
                    status: 'ringing',
                    type: 'outgoing',
                };
                get()._setActiveCall(callInfo);
                
                navigationRef.navigate(SCREEN_CONSTANTS.ONGOING_CALL_SCREEN, {
                    sessionId: callInfo.sessionId,
                    receiverName: callInfo.participant.name,
                    receiverAvatar: callInfo.participant.avatar,
                    initialStatus: 'ringing',
                });
            },
            (error) => {
                Alert.alert("Call Error", "Failed to initiate call.");
                console.error("Call initiation failed:", error);
            }
        );
    },

    acceptCall: async (callToAccept) => {
        const hasPermission = await requestAudioPermission();
        if (!hasPermission) return;
        // End any existing call session before accepting a new one
        if (CometChat.getActiveCall && CometChat.getActiveCall()) {
            try {
                const activeCall = CometChat.getActiveCall();
                if (activeCall && activeCall.getSessionId) {
                    await CometChat.endCall(activeCall.getSessionId());
                }
                if (CometChatCalls.endSession) await CometChatCalls.endSession();
            } catch (e) {
                console.warn('Failed to end previous call session:', e);
            }
        }
        CometChat.acceptCall(callToAccept.getSessionId()).then(
            (acceptedCall) => {
                get().setIncomingCall(null);
                const caller = acceptedCall.getCallInitiator();
                 const callInfo: ActiveCallInfo = {
                    sessionId: acceptedCall.getSessionId(),
                    participant: {
                        name: caller.getName(),
                        avatar: caller.getAvatar(),
                    },
                    status: 'connected',
                    type: 'incoming',
                };
                get()._setActiveCall(callInfo);

                navigationRef.navigate(SCREEN_CONSTANTS.ONGOING_CALL_SCREEN, {
                    sessionId: callInfo.sessionId,
                    receiverName: callInfo.participant.name,
                    receiverAvatar: callInfo.participant.avatar,
                    initialStatus: 'connected',
                });
            },
            (error) => {
                Alert.alert("Call Error", "Could not accept the call.");
                console.error("Call acceptance failed:", error);
                get().setIncomingCall(null);
            }
        );
    },

    rejectCall: (callToReject) => {
        const sessionId = callToReject.getSessionId();
        CometChat.rejectCall(sessionId, CometChat.CALL_STATUS.REJECTED).then(
            () => {
                console.log("Call rejected successfully");
                if (get().incomingCall?.getSessionId() === sessionId) {
                    get().setIncomingCall(null);
                }
                if(get().activeCall?.sessionId === sessionId){
                    get().clearCallState();
                }
            },
            (error) => {
                console.error("Call rejection failed:", error);
                if (get().incomingCall?.getSessionId() === sessionId) {
                    get().setIncomingCall(null);
                }
            }
        );
    },
    
  endCall: async () => {
        const activeCallSessionId = get().activeCall?.sessionId;
        if (activeCallSessionId) {
            try {
                // This is the correct method to end the UI session for the current user.
                // It will trigger onCallEnded for other participants.
                await CometChatCalls.endSession();
                console.log("Call ended successfully from store");
            } catch (error) {
                 console.error("Ending call failed from store:", error);
            } finally {
                // Always clear the state, regardless of success or failure.
                 get().clearCallState();
            }
        }
    },

    clearCallState: () => set({ activeCall: null, incomingCall: null }),
}));








