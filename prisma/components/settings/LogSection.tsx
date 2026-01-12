
import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Activity } from 'lucide-react';
import { logger } from '../../services/logger';

const LogSection = () => {
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    // Initial count
    setLogCount(logger.getLogs().length);
    
    // Simple poller to update count while settings are open
    const interval = setInterval(() => {
      setLogCount(logger.getLogs().length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    logger.download();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all execution logs?')) {
      logger.clear();
      setLogCount(0);
    }
  };

  return (
    <div className="border-t border-slate-100 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Logs</h3>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-start gap-3 mb-4">
           <div className="p-2 bg-slate-200 rounded-lg text-slate-600">
             <Activity size={18} />
           </div>
           <div>
             <h4 className="text-sm font-medium text-slate-800">Debug & Execution Logs</h4>
             <p className="text-xs text-slate-500 mt-1">
               Record of reasoning processes, API calls, and errors. Useful for debugging specific issues.
             </p>
             <p className="text-xs font-mono text-slate-400 mt-2">
               Current entries: <span className="text-slate-700 font-bold">{logCount}</span>
             </p>
           </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={logCount === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Download .txt
          </button>
          
          <button
            onClick={handleClear}
            disabled={logCount === 0}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogSection;
