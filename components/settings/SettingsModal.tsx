import React, { useState } from 'react';
import { Bot, BrainCircuit, Info, Settings, X } from 'lucide-react';
import { AppConfig, ModelOption, ThinkingLevel } from '../../types';
import ModelSection from './ModelSection';
import ThinkingSection from './ThinkingSection';
import GithubSection from './GithubSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  effectiveConfig: AppConfig;
  model: ModelOption;
  onSetThinkingLevel: (
    key: 'planningLevel' | 'expertLevel' | 'synthesisLevel',
    value: ThinkingLevel,
  ) => void;
  onSetRecursiveLoop: (value: boolean) => void;
}

type SettingsTabId = 'models' | 'thinking' | 'about';

const SETTINGS_TABS = [
  {
    id: 'models',
    label: '模型管理',
    kicker: 'Connection',
    title: '模型管理',
    Icon: Bot,
  },
  {
    id: 'thinking',
    label: '推理设置',
    kicker: 'Reasoning',
    title: '推理设置',
    Icon: BrainCircuit,
  },
  {
    id: 'about',
    label: '关于',
    kicker: 'Project',
    title: '关于 Prisma',
    Icon: Info,
  },
] satisfies Array<{
  id: SettingsTabId;
  label: string;
  kicker: string;
  title: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}>;

const SettingsModal = ({
  isOpen,
  onClose,
  config,
  setConfig,
  effectiveConfig,
  model,
  onSetThinkingLevel,
  onSetRecursiveLoop,
}: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('models');

  if (!isOpen) return null;

  const activeTabConfig = SETTINGS_TABS.find((tab) => tab.id === activeTab) ?? SETTINGS_TABS[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="设置"
        className="flex h-[min(85vh,800px)] min-h-[560px] w-full max-w-[1120px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-700 dark:bg-slate-900 max-md:h-[92vh] max-md:min-h-0 max-md:flex-col"
      >
        <aside className="flex w-64 shrink-0 flex-col bg-slate-50 dark:bg-slate-950/60 max-md:w-full max-md:border-b max-md:border-slate-200 max-md:dark:border-slate-800">
          <div className="flex min-h-[68px] shrink-0 items-center justify-between px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭设置"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 md:hidden">
              <Settings size={17} className="text-blue-600" />
              <span>设置</span>
            </div>
            <span className="h-9 w-9 md:hidden" aria-hidden="true" />
            <span className="sr-only md:not-sr-only md:block md:text-sm md:font-semibold md:text-slate-500 md:dark:text-slate-400">
              设置
            </span>
          </div>

          <nav
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 custom-scrollbar max-md:flex-none max-md:overflow-x-auto max-md:overflow-y-hidden"
            role="tablist"
            aria-label="设置分类"
          >
            <div className="flex flex-col gap-1.5 max-md:flex-row max-md:pb-1">
              {SETTINGS_TABS.map(({ id, label, Icon }) => {
                const isActive = id === activeTab;

                return (
                  <button
                    key={id}
                    id={`settings-tab-${id}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`settings-panel-${id}`}
                    onClick={() => setActiveTab(id)}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors max-md:w-auto max-md:shrink-0 ${
                      isActive
                        ? 'bg-white font-semibold text-slate-950 shadow-sm dark:bg-slate-800 dark:text-slate-50'
                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon
                      size={19}
                      className={isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}
                    />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-slate-900">
          <div className="min-h-0 flex-1 overflow-y-auto px-9 py-8 custom-scrollbar max-md:px-5 max-md:py-6">
            <section
              id={`settings-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`settings-tab-${activeTab}`}
              className="mx-auto flex w-full max-w-3xl animate-in fade-in slide-in-from-top-1 flex-col gap-5 duration-200"
            >
              <div className="flex flex-col gap-1.5 pb-0.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {activeTabConfig.kicker}
                </div>
                <h2 className="text-xl font-semibold tracking-normal text-slate-950 dark:text-slate-50">
                  {activeTabConfig.title}
                </h2>
              </div>

              {activeTab === 'models' && <ModelSection config={config} setConfig={setConfig} />}

              {activeTab === 'thinking' && (
                <ThinkingSection
                  config={effectiveConfig}
                  globalConfig={config}
                  model={model}
                  onSetThinkingLevel={onSetThinkingLevel}
                  onSetRecursiveLoop={onSetRecursiveLoop}
                />
              )}

              {activeTab === 'about' && <GithubSection isOpen={isOpen} />}
            </section>
          </div>

          <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
            >
              完成
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsModal;
