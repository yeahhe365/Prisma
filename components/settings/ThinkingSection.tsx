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
    <div className="space-y-4 rounded-xl border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">思考过程</h3>
        <span className="rounded border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] px-2 py-0.5 text-[10px] font-medium text-[var(--theme-text-secondary)]">
          {modelLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-6 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-3.5 max-sm:flex-col max-sm:items-stretch">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)]">
            <RefreshCw size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--theme-text-primary)]">
              递归优化
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-tertiary)]">
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
          <div className="peer h-5 w-9 rounded-full bg-[var(--theme-border-secondary)] after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-[var(--theme-border-secondary)] after:bg-[var(--theme-bg-input)] after:transition-all after:content-[''] peer-checked:bg-[var(--theme-bg-accent)] peer-checked:after:translate-x-full peer-checked:after:border-[var(--theme-bg-input)] peer-focus:outline-none"></div>
        </label>
      </div>

      <div className="divide-y divide-[var(--theme-border-primary)] rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] px-3.5">
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
