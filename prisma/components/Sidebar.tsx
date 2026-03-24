import React, { useState, useMemo } from 'react';
import { Plus, MessageSquare, Trash2, X, History, Search, Sparkles } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

const Sidebar = ({ 
  isOpen, 
  onClose, 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.messages.some(m => m.content.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  const getLastMessage = (session: ChatSession) => {
    const lastMsg = session.messages[session.messages.length - 1];
    if (!lastMsg) return null;
    return lastMsg.role === 'user' ? lastMsg.content : lastMsg.content?.slice(0, 60);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-[280px] bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:overflow-hidden'}
        flex flex-col h-full
      `}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <History size={18} />
            <span>History</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 pb-2 shrink-0">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 px-4 rounded-lg transition-all shadow-sm font-medium text-sm hover:shadow-md active:shadow-sm"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* Search */}
        {sessions.length > 0 && (
          <div className="px-4 pb-3 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Session List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-10">
              <Sparkles size={28} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-400 text-sm font-medium">No chat history yet</p>
              <p className="text-slate-300 text-xs mt-1">Start a conversation to see it here</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-10">
              <Search size={28} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-400 text-sm">No results found</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                  ${currentSessionId === session.id 
                    ? 'bg-white shadow-sm border border-slate-200 text-slate-900' 
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'}
                `}
              >
                <MessageSquare size={16} className={`shrink-0 mt-0.5 ${currentSessionId === session.id ? 'text-blue-500' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate pr-6">{session.title}</h4>
                  {getLastMessage(session) && (
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 leading-relaxed">
                      {getLastMessage(session)}
                    </p>
                  )}
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 text-slate-400 transition-all"
                  title="Delete Chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
