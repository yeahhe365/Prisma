import React from 'react';
import { useAppLogic } from './hooks/useAppLogic';
import { useDarkMode } from './hooks/useDarkMode';

import ErrorBoundary from './components/ErrorBoundary';
import SettingsModal from './components/settings/SettingsModal';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

const App = () => {
  const {
    sessions,
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
    stopDeepThink,
    focusTrigger,
    inputError,
    clearInputError,
    handleSetThinkingLevel,
    handleSetRecursiveLoop,
  } = useAppLogic();

  const { isDark, toggle: toggleDark } = useDarkMode();

  return (
    <ErrorBoundary>
      <div className="relative flex h-screen overflow-hidden bg-[var(--theme-bg-secondary)] font-sans text-[var(--theme-text-primary)]">
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
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />

        <main className="relative flex min-w-0 flex-1 flex-col bg-[var(--theme-bg-primary)]">
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
          />

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex justify-center bg-[linear-gradient(to_top,var(--theme-bg-primary)_0%,color-mix(in_srgb,var(--theme-bg-primary)_82%,transparent)_68%,transparent_100%)] p-4 pb-6">
            <div className="pointer-events-auto w-full max-w-4xl">
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
