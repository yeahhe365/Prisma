import React from 'react';
import { RefreshCw } from 'lucide-react';
import { AppConfig, ModelOption, ThinkingLevel } from '../../types';
import { getValidThinkingLevels, getAllModels } from '../../config';
import LevelSelect from './LevelSelect';

interface ThinkingSectionProps {
  config: AppConfig;
  globalConfig: AppConfig;
  model: ModelOption;
  onSetThinkingLevel: (key: 'planningLevel' | 'expertLevel' | 'synthesisLevel', value: ThinkingLevel) => void;
  onSetRecursiveLoop: (value: boolean) => void;
}

const ThinkingSection = ({ config, globalConfig, model, onSetThinkingLevel, onSetRecursiveLoop }: ThinkingSectionProps) => {
  const validLevels = getValidThinkingLevels(model);

  // Find display name for the current model
  const allModels = getAllModels(globalConfig);
  const modelInfo = allModels.find(m => m.value === model);
  const modelLabel = modelInfo?.label || model;

  return (
    <div className="border-t border-slate-100 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">思考过程</h3>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
          {modelLabel}
        </span>
      </div>
       
       <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
             <RefreshCw size={16} className="text-indigo-600" />
             <div>
                <p className="text-sm font-medium text-indigo-900">递归优化</p>
                <p className="text-[10px] text-indigo-600/80">循环生成专家输出直到满意为止。</p>
             </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={config.enableRecursiveLoop ?? false} 
              onChange={(e) => onSetRecursiveLoop(e.target.checked)} 
              className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
       </div>

      <LevelSelect 
        label="管理者：规划策略"
        value={config.planningLevel}
        validLevels={validLevels}
        onChange={(v) => onSetThinkingLevel('planningLevel', v)}
        desc="控制初始查询分析和专家委派的深度。"
      />
      
      <LevelSelect 
        label="专家：执行深度"
        value={config.expertLevel}
        validLevels={validLevels}
        onChange={(v) => onSetThinkingLevel('expertLevel', v)}
        desc="决定每个专家角色对其特定任务的思考深度。"
      />
      
      <LevelSelect 
        label="管理者：最终综合"
        value={config.synthesisLevel}
        validLevels={validLevels}
        onChange={(v) => onSetThinkingLevel('synthesisLevel', v)}
        desc="控制将结果汇总为最终答案的推理力度。"
      />
    </div>
  );
};

export default ThinkingSection;
