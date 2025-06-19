// src/store/chatStore.ts

import { create } from 'zustand';
import { CometChat } from '@cometchat/chat-sdk-react-native';

export interface ActiveChatParticipant {
  id: string;
  type: 'user' | 'group';
  name?: string;
  avatar?: string;
  status?: string;
  isBlockedByMe?: boolean;
}

interface ChatState {
  loggedInUser: CometChat.User | null;
  messages: CometChat.BaseMessage[];
  activeChatInfo: ActiveChatParticipant | null;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  replyMessage: CometChat.BaseMessage | null;
  messagesToForward: CometChat.BaseMessage[];

  setLoggedInUser: (user: CometChat.User | null) => void;
  setMessages: (messages: CometChat.BaseMessage[]) => void;
  addMessage: (message: CometChat.BaseMessage) => void;
  updateMessageData: (messageId: number, dataToUpdate: Partial<CometChat.BaseMessage>) => void;
  updateFullMessage: (updatedMessage: CometChat.BaseMessage) => void;
  removeMessage: (messageId: number | string) => void;
  setActiveChatInfo: (info: ActiveChatParticipant | null) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  setHasMoreMessages: (hasMore: boolean) => void;
  setReplyMessage: (message: CometChat.BaseMessage | null) => void;
  setMessagesToForward: (messages: CometChat.BaseMessage[]) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  loggedInUser: null,
  messages: [],
  activeChatInfo: null,
  isLoadingMessages: false,
  hasMoreMessages: true,
  replyMessage: null,
  messagesToForward: [],

  setLoggedInUser: (user) => set({ loggedInUser: user }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => {
    set((state) => {
      if (state.messages.some(m => m.getId() === message.getId())) {
        return state;
      }
      return { messages: [message, ...state.messages.filter(m => m.getId() !== message.getId())] };
    });
  },
  updateMessageData: (messageId: number, dataToUpdate: Partial<CometChat.BaseMessage>) =>
    set((state) => ({
      messages: state.messages.map((msg: CometChat.BaseMessage): CometChat.BaseMessage =>
        msg.getId() === messageId
          ? ({ ...msg, ...dataToUpdate } as CometChat.BaseMessage)
          : msg
      ),
    })),
  updateFullMessage: (updatedMessage: CometChat.BaseMessage) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.getId() === updatedMessage.getId() ? updatedMessage : msg
      ),
    })),
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => String(msg.getId()) !== String(messageId)),
    })),
  setActiveChatInfo: (info) => set({ activeChatInfo: info }),
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  setHasMoreMessages: (hasMore) => set({ hasMoreMessages: hasMore }),
  setReplyMessage: (message) => set({ replyMessage: message }),
  setMessagesToForward: (messages) => set({ messagesToForward: messages }),
  clearMessages: () => set({
    messages: [],
    isLoadingMessages: false,
    hasMoreMessages: true,
    replyMessage: null,
  }),
}));