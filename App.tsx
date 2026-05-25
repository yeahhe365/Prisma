import React from 'react';
import { useAppLogic } from '@/hooks/useAppLogic';
import { useDarkMode } from '@/hooks/useDarkMode';

import ErrorBoundary from '@/components/ErrorBoundary';
import SettingsModal from '@/components/settings/SettingsModal';
import Header from '@/components/Header';
import ChatInput from '@/components/ChatInput';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';

const CHAT_INPUT_MAX_WIDTH_CLASS = 'max-w-[40.32rem]';

const App = () => {
  const {
    sessions,
    groups,
    currentSessionId,
    messages,
    query,
    setQuery,
    selectedModel,
    setSelectedModel,
    config,
    setConfig,
    effectiveConfig,
    isSidebarOpen,
    setIsSidebarOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    appState,
    managerAnalysis,
    experts,
    finalOutput,
    processStartTime,
    processEndTime,
    handleRun,
    handleNewChat,
    handleSelectSession,
    handleDeleteSession,
    renameSession,
    togglePinSession,
    duplicateSession,
    handleExportSession,
    createGroup,
    deleteGroup,
    renameGroup,
    moveSessionToGroup,
    toggleGroupExpansion,
    stopDeepThink,
    focusTrigger,
    inputError,
    clearInputError,
    handleSetThinkingLevel,
    handleSetRecursiveLoop,
    handleEditMessage,
    handleDeleteMessage,
    handleRetryMessage,
    handleContinueGeneration,
    handleForkMessage,
  } = useAppLogic();

  const { isDark, toggle: toggleDark } = useDarkMode();

  return (
    <ErrorBoundary>
      <div className="theme-transition-colors relative flex h-full overflow-hidden bg-[var(--theme-bg-secondary)] font-sans text-[var(--theme-text-primary)]">
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          setConfig={setConfig}
          effectiveConfig={effectiveConfig}
          model={selectedModel}
          onSetThinkingLevel={handleSetThinkingLevel}
          onSetRecursiveLoop={handleSetRecursiveLoop}
        />

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpen={() => setIsSidebarOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          sessions={sessions}
          groups={groups}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={renameSession}
          onTogglePinSession={togglePinSession}
          onDuplicateSession={duplicateSession}
          onExportSession={handleExportSession}
          onAddNewGroup={createGroup}
          onDeleteGroup={deleteGroup}
          onRenameGroup={renameGroup}
          onMoveSessionToGroup={moveSessionToGroup}
          onToggleGroupExpansion={toggleGroupExpansion}
        />

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--theme-bg-primary)]">
          <Header
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onNewChat={handleNewChat}
            config={config}
            isDark={isDark}
            onToggleDark={toggleDark}
          />

          <ChatArea
            messages={messages}
            appState={appState}
            managerAnalysis={managerAnalysis}
            experts={experts}
            finalOutput={finalOutput}
            processStartTime={processStartTime}
            processEndTime={processEndTime}
            onSuggestionClick={(text) => {
              setQuery(text);
            }}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onRetryMessage={handleRetryMessage}
            onContinueGeneration={handleContinueGeneration}
            onForkMessage={handleForkMessage}
          />

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30">
            <div
              className={`pointer-events-auto mx-auto w-full ${CHAT_INPUT_MAX_WIDTH_CLASS} px-2 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:px-3`}
            >
              <ChatInput
                query={query}
                setQuery={setQuery}
                onRun={handleRun}
                onStop={stopDeepThink}
                appState={appState}
                focusTrigger={focusTrigger}
                inputError={inputError}
                onClearInputError={clearInputError}
              />
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
