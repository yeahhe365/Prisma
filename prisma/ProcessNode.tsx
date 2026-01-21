import React from 'react';
import { Loader2, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';

interface ProcessNodeProps {
  icon: React.ElementType;
  title: string;
  status: 'idle' | 'active' | 'completed';
  children?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

const ProcessNode = ({ 
  icon: Icon, 
  title, 
  status, 
  children, 
  isExpanded, 
  onToggle 
}: ProcessNodeProps) => {
  const isActive = status === 'active';
  const isCompleted = status === 'completed';
  
  return (
    <div className={`relative z-10 rounded-xl border ${isActive ? 'border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-200' : 'border-slate-200 bg-white'} transition-all duration-500 overflow-hidden shadow-sm`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300
            ${isActive ? 'bg-indigo-600 text-white animate-pulse' : ''}
            ${isCompleted ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}
          `}>
            {isActive ? <Loader2 size={16} className="animate-spin" /> : (isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />)}
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isActive ? 'text-indigo-900' : (isCompleted ? 'text-slate-900' : 'text-slate-500')}`}>
              {title}
            </h3>
            {isActive && <p className="text-xs text-indigo-600 font-medium">Processing...</p>}
          </div>
        </div>
        {children && (
          <div className="text-slate-400 hover:text-slate-700">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
      </div>
      
      {isExpanded && children && (
        <div className="border-t border-slate-100 bg-slate-50/30 p-4 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

export default ProcessNode;