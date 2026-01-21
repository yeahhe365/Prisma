import React from 'react';
import { Plus, MessageSquare, Trash2, X, History, MessageSquareText } from 'lucide-react';
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
        w-[280px] bg-slate-50/80 backdrop-blur-xl border-r border-slate-200/60 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:overflow-hidden'}
        flex flex-col h-full
      `}>
        
        {/* Header */}
        <div className="h-16 px-5 border-b border-slate-200/60 flex items-center justify-between shrink-0 bg-slate-50/50 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 text-slate-500 font-bold tracking-wider text-xs uppercase">
            <History size={14} className="text-indigo-600" strokeWidth={2.5} />
            <span>Chat History</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 shrink-0">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md font-semibold text-sm group border border-slate-800"
          >
            <Plus size={18} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>New Thread</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-1.5">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-3 opacity-60">
              <div className="p-3 bg-slate-100 rounded-2xl">
                <MessageSquareText size={24} strokeWidth={1.5} />
              </div>
              <p className="font-medium">No chat history yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border
                  ${currentSessionId === session.id 
                    ? 'bg-white shadow-sm border-slate-200 text-slate-900 z-10 ring-1 ring-slate-100' 
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 border-transparent hover:border-slate-100 hover:shadow-sm'}
                `}
              >
                <div className={`
                  shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                  ${currentSessionId === session.id 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' 
                    : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-500'}
                `}>
                  <MessageSquare size={16} strokeWidth={2} />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <h4 className={`text-sm font-medium truncate pr-6 ${currentSessionId === session.id ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                    {session.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 text-slate-300 transition-all scale-90 hover:scale-100 hover:shadow-sm"
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