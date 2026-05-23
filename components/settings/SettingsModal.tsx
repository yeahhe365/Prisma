import React, { useState } from 'react';
import { BrainCircuit, Info, SlidersHorizontal, X } from 'lucide-react';
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
    title: '模型管理',
    Icon: SlidersHorizontal,
  },
  {
    id: 'thinking',
    label: '推理设置',
    title: '推理设置',
    Icon: BrainCircuit,
  },
  {
    id: 'about',
    label: '关于',
    title: '关于 Prisma',
    Icon: Info,
  },
] satisfies Array<{
  id: SettingsTabId;
  label: string;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="设置"
        className="flex h-[min(85vh,800px)] min-h-[560px] w-full max-w-[1120px] overflow-hidden rounded-xl border border-[var(--theme-border-primary)] bg-[var(--theme-bg-primary)] shadow-2xl animate-in zoom-in-95 duration-200 max-md:h-[92vh] max-md:min-h-0 max-md:flex-col"
      >
        <aside className="flex w-64 shrink-0 flex-col border-[var(--theme-border-primary)] bg-[var(--theme-bg-secondary)] max-md:w-full max-md:border-b md:border-r">
          <div className="flex min-h-[68px] shrink-0 items-center justify-between px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭设置"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
            >
              <X size={20} />
            </button>
            <span className="h-9 w-9" aria-hidden="true" />
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
                    className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors outline-none max-md:w-auto max-md:shrink-0 ${
                      isActive
                        ? 'bg-[var(--theme-bg-tertiary)] font-semibold text-[var(--theme-text-primary)]'
                        : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]/50 hover:text-[var(--theme-text-primary)]'
                    }`}
                  >
                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2 : 1.5}
                      className={isActive ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-tertiary)]'}
                    />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--theme-bg-primary)]">
          <div className="min-h-0 flex-1 overflow-y-auto px-9 py-8 custom-scrollbar max-md:px-5 max-md:py-6">
            <section
              id={`settings-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`settings-tab-${activeTab}`}
              className="mx-auto flex w-full max-w-3xl animate-in fade-in slide-in-from-top-1 flex-col gap-5 duration-200"
            >
              <div className="flex flex-col gap-1.5 pb-0.5">
                <h2 className="text-xl font-semibold tracking-normal text-[var(--theme-text-primary)]">
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

        </main>
      </div>
    </div>
  );
};

export default SettingsModal;
