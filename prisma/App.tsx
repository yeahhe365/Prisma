
import React from 'react';
import { useAppLogic } from './hooks/useAppLogic';

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

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      
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
      />

      <div className="flex flex-1 overflow-hidden relative isolate">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />

        <main className="flex-1 flex flex-col min-w-0 relative z-0">
          <ChatArea 
            messages={messages}
            appState={appState}
            managerAnalysis={managerAnalysis}
            experts={experts}
            finalOutput={finalOutput}
            processStartTime={processStartTime}
            processEndTime={processEndTime}
          />

          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none p-6 pb-8 flex justify-center bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent">
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
  );
};

export default App;
