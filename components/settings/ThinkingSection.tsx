import React from 'react';
import { RefreshCw } from 'lucide-react';
import { AppConfig, ModelOption, ThinkingLevel } from '../../types';
import { getValidThinkingLevels, getAllModels } from '../../config';
import LevelSelect from './LevelSelect';

interface ThinkingSectionProps {
  config: AppConfig;
  globalConfig: AppConfig;
  model: ModelOption;
  onSetThinkingLevel: (
    key: 'planningLevel' | 'expertLevel' | 'synthesisLevel',
    value: ThinkingLevel,
  ) => void;
  onSetRecursiveLoop: (value: boolean) => void;
}

const ThinkingSection = ({
  config,
  globalConfig,
  model,
  onSetThinkingLevel,
  onSetRecursiveLoop,
}: ThinkingSectionProps) => {
  const validLevels = getValidThinkingLevels(model);

  // Find display name for the current model
  const allModels = getAllModels(globalConfig);
  const modelInfo = allModels.find((m) => m.value === model);
  const modelLabel = modelInfo?.label || model;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">思考过程</h3>
        <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {modelLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-6 rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900 max-sm:flex-col max-sm:items-stretch">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
            <RefreshCw size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              递归优化
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              循环生成专家输出直到满意为止。
            </p>
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center self-center max-sm:self-start">
          <input
            type="checkbox"
            checked={config.enableRecursiveLoop ?? false}
            onChange={(e) => onSetRecursiveLoop(e.target.checked)}
            className="sr-only peer"
          />
          <div className="h-5 w-9 rounded-full bg-slate-300 peer peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700"></div>
        </label>
      </div>

      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-3.5 dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
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
    </div>
  );
};

export default ThinkingSection;
