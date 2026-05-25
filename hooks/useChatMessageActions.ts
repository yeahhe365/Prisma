import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { AppConfig, ChatMessage, ModelOption } from '@/types';

type RunDeepThink = (
  query: string,
  history: ChatMessage[],
  model: ModelOption,
  config: AppConfig,
) => void | Promise<void>;

type UseChatMessageActionsParams = {
  selectedModel: ModelOption | null;
  effectiveConfig: AppConfig;
  messagesRef: MutableRefObject<ChatMessage[]>;
  syncMessagesToActiveSession: (nextMessages: ChatMessage[]) => void;
  setInputError: Dispatch<SetStateAction<string | null>>;
  setQuery: Dispatch<SetStateAction<string>>;
  setFocusTrigger: Dispatch<SetStateAction<number>>;
  stopDeepThink: () => void;
  resetDeepThink: () => void;
  runDynamicDeepThink: RunDeepThink;
};

export const useChatMessageActions = ({
  selectedModel,
  effectiveConfig,
  messagesRef,
  syncMessagesToActiveSession,
  setInputError,
  setQuery,
  setFocusTrigger,
  stopDeepThink,
  resetDeepThink,
  runDynamicDeepThink,
}: UseChatMessageActionsParams) => {
  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      const nextMessages = messagesRef.current.filter((message) => message.id !== messageId);
      if (nextMessages.length === messagesRef.current.length) return;

      setInputError(null);
      syncMessagesToActiveSession(nextMessages);
    },
    [messagesRef, setInputError, syncMessagesToActiveSession],
  );

  const handleEditMessage = useCallback(
    (messageId: string, mode: 'update' | 'resend') => {
      const currentMessages = messagesRef.current;
      const messageIndex = currentMessages.findIndex((message) => message.id === messageId);
      const message = currentMessages[messageIndex];
      if (!message?.content) return;

      stopDeepThink();
      resetDeepThink();
      setInputError(null);
      setQuery(message.content);
      setFocusTrigger((prev) => prev + 1);

      if (mode === 'resend') {
        syncMessagesToActiveSession(currentMessages.slice(0, messageIndex));
      }
    },
    [
      messagesRef,
      resetDeepThink,
      setFocusTrigger,
      setInputError,
      setQuery,
      stopDeepThink,
      syncMessagesToActiveSession,
    ],
  );

  const handleRetryMessage = useCallback(
    (messageId: string) => {
      if (!selectedModel) {
        setInputError('请先在设置中添加并选择一个模型。');
        return;
      }

      const currentMessages = messagesRef.current;
      const messageIndex = currentMessages.findIndex((message) => message.id === messageId);
      const message = currentMessages[messageIndex];
      if (!message || message.role !== 'model') return;

      const previousUserMessage = [...currentMessages.slice(0, messageIndex)]
        .reverse()
        .find((entry) => entry.role === 'user');
      if (
        !previousUserMessage ||
        (!previousUserMessage.content.trim() && !previousUserMessage.attachments?.length)
      ) {
        return;
      }

      const retryHistory = currentMessages.slice(0, messageIndex);
      stopDeepThink();
      resetDeepThink();
      setInputError(null);
      syncMessagesToActiveSession(retryHistory);
      runDynamicDeepThink(
        previousUserMessage.content,
        retryHistory,
        selectedModel,
        effectiveConfig,
      );
    },
    [
      effectiveConfig,
      messagesRef,
      resetDeepThink,
      runDynamicDeepThink,
      selectedModel,
      setInputError,
      stopDeepThink,
      syncMessagesToActiveSession,
    ],
  );

  const handleContinueGeneration = useCallback(
    (messageId: string) => {
      if (!selectedModel) {
        setInputError('请先在设置中添加并选择一个模型。');
        return;
      }

      const currentMessages = messagesRef.current;
      const messageIndex = currentMessages.findIndex((message) => message.id === messageId);
      const message = currentMessages[messageIndex];
      if (!message || message.role !== 'model') return;

      const continuationPrompt = '继续';
      const continuationMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: continuationPrompt,
      };
      const continuationHistory = [
        ...currentMessages.slice(0, messageIndex + 1),
        continuationMessage,
      ];

      stopDeepThink();
      resetDeepThink();
      setInputError(null);
      setQuery('');
      syncMessagesToActiveSession(continuationHistory);
      runDynamicDeepThink(continuationPrompt, continuationHistory, selectedModel, effectiveConfig);
    },
    [
      effectiveConfig,
      messagesRef,
      resetDeepThink,
      runDynamicDeepThink,
      selectedModel,
      setInputError,
      setQuery,
      stopDeepThink,
      syncMessagesToActiveSession,
    ],
  );

  const handleForkMessage = useCallback(
    (messageId: string) => {
      const currentMessages = messagesRef.current;
      const messageIndex = currentMessages.findIndex((message) => message.id === messageId);
      if (messageIndex === -1) return;

      stopDeepThink();
      resetDeepThink();
      setInputError(null);
      syncMessagesToActiveSession(currentMessages.slice(0, messageIndex + 1));
      setFocusTrigger((prev) => prev + 1);
    },
    [
      messagesRef,
      resetDeepThink,
      setFocusTrigger,
      setInputError,
      stopDeepThink,
      syncMessagesToActiveSession,
    ],
  );

  return {
    handleDeleteMessage,
    handleEditMessage,
    handleRetryMessage,
    handleContinueGeneration,
    handleForkMessage,
  };
};
