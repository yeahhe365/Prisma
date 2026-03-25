
import React from 'react';
import { useAppLogic } from './hooks/useAppLogic';
import { useDarkMode } from './hooks/useDarkMode';

import ErrorBoundary from './components/ErrorBoundary';
import SettingsModal from './SettingsModal';
import Header from './components/Header';
import ChatInput from './components/InputSection';
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
    focusTrigger
  } = useAppLogic();

  const { isDark, toggle: toggleDark } = useDarkMode();

  return (
    <ErrorBoundary>
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        setConfig={setConfig}
        model={selectedModel}
      />

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

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 relative">
          <ChatArea 
            messages={messages}
            appState={appState}
            managerAnalysis={managerAnalysis}
            experts={experts}
            finalOutput={finalOutput}
            processStartTime={processStartTime}
            processEndTime={processEndTime}
            onSuggestionClick={(text) => { setQuery(text); }}
          />

          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none p-4 pb-6 flex justify-center bg-gradient-to-t from-white dark:from-slate-950 via-white/80 dark:via-slate-950/80 to-transparent">
            <div className="pointer-events-auto w-full max-w-4xl">
              <ChatInput 
                query={query} 
                setQuery={setQuery} 
                onRun={handleRun} 
                onStop={stopDeepThink}
                appState={appState} 
                focusTrigger={focusTrigger}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default App;
