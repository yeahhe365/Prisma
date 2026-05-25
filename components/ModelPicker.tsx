import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import type { ApiProvider, ModelCatalogItem, ModelOption } from '@/types';
import { getModelIcon } from '@/components/ModelIcon';

type ModelPickerEntry = ModelCatalogItem & {
  id: ModelOption;
};

type ModelPickerSection = {
  key: ApiProvider;
  label: string;
  entries: ModelPickerEntry[];
};

interface ModelPickerProps {
  models: ModelCatalogItem[];
  selectedId: ModelOption | null;
  onSelect: (modelId: ModelOption) => void;
  renderTrigger: (props: {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    selectedModel: ModelCatalogItem | undefined;
    ref: React.RefObject<HTMLDivElement | null>;
    listboxId: string;
    activeDescendantId: string | undefined;
  }) => React.ReactNode;
  dropdownClassName?: string;
}

const PROVIDER_ORDER: ApiProvider[] = ['google', 'openai'];
const PROVIDER_LABELS: Record<ApiProvider, string> = {
  google: 'Gemini',
  openai: 'OpenAI 兼容',
};

const buildEntries = (models: ModelCatalogItem[]): ModelPickerEntry[] =>
  models.map((model) => ({
    ...model,
    id: model.value,
  }));

const buildSections = (entries: ModelPickerEntry[]): ModelPickerSection[] =>
  PROVIDER_ORDER.flatMap((provider) => {
    const providerEntries = entries.filter((entry) => entry.provider === provider);

    if (providerEntries.length === 0) {
      return [];
    }

    return [
      {
        key: provider,
        label: PROVIDER_LABELS[provider],
        entries: providerEntries,
      },
    ];
  });

const getOptionId = (id: ModelOption) =>
  `model-picker-option-${String(id).replace(/[^a-zA-Z0-9_-]+/g, '-')}`;

const useClickOutside = (
  ref: React.RefObject<HTMLElement | null>,
  isEnabled: boolean,
  onClickOutside: () => void,
) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;

      if (target instanceof Node && ref.current && !ref.current.contains(target)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isEnabled, onClickOutside, ref]);
};

const ModelPicker = ({
  models,
  selectedId,
  onSelect,
  renderTrigger,
  dropdownClassName,
}: ModelPickerProps) => {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const isOpenRef = useRef(false);
  const activeIndexRef = useRef(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => buildEntries(models), [models]);
  const sections = useMemo(() => buildSections(entries), [entries]);
  const visibleEntries = useMemo(() => sections.flatMap((section) => section.entries), [sections]);
  const selectedModel = models.find((model) => model.value === selectedId);
  const selectedIndex = visibleEntries.findIndex((entry) => entry.id === selectedId);

  const getInitialActiveIndex = () =>
    selectedIndex >= 0 ? selectedIndex : visibleEntries.length > 0 ? 0 : -1;

  const setOpenState = (nextIsOpen: boolean) => {
    isOpenRef.current = nextIsOpen;
    setIsOpen(nextIsOpen);
  };

  const setActiveEntryIndex = (nextIndex: number) => {
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
  };

  const setPickerOpen = (nextIsOpen: boolean) => {
    if (nextIsOpen) {
      setActiveEntryIndex(getInitialActiveIndex());
    }

    setOpenState(nextIsOpen);
  };

  useClickOutside(containerRef, isOpen, () => setPickerOpen(false));

  const activeEntry = activeIndex >= 0 ? visibleEntries[activeIndex] : undefined;
  const activeDescendantId = activeEntry ? getOptionId(activeEntry.id) : undefined;

  const handleSelectModel = (modelId: ModelOption) => {
    onSelect(modelId);
    setPickerOpen(false);
  };

  const moveActiveEntry = (directionStep: 1 | -1) => {
    if (visibleEntries.length === 0) {
      setActiveEntryIndex(-1);
      return;
    }

    const currentIndex =
      activeIndexRef.current >= 0 ? activeIndexRef.current : getInitialActiveIndex();
    const nextIndex =
      (currentIndex + directionStep + visibleEntries.length) % visibleEntries.length;
    setActiveEntryIndex(nextIndex);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpenRef.current) {
        setPickerOpen(true);
        return;
      }
      moveActiveEntry(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpenRef.current) {
        setPickerOpen(true);
        return;
      }
      moveActiveEntry(-1);
      return;
    }

    if (event.key === 'Home' && isOpenRef.current) {
      event.preventDefault();
      setActiveEntryIndex(visibleEntries.length > 0 ? 0 : -1);
      return;
    }

    if (event.key === 'End' && isOpenRef.current) {
      event.preventDefault();
      setActiveEntryIndex(visibleEntries.length - 1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpenRef.current) {
        setPickerOpen(true);
        return;
      }

      const entry = visibleEntries[activeIndexRef.current];
      if (entry) {
        handleSelectModel(entry.id);
      }
      return;
    }

    if (event.key === 'Escape' && isOpenRef.current) {
      event.preventDefault();
      setPickerOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      {renderTrigger({
        isOpen,
        setIsOpen: setPickerOpen,
        selectedModel,
        ref: containerRef,
        listboxId,
        activeDescendantId,
      })}

      {isOpen && (
        <div
          className={`absolute left-0 top-full z-50 mt-1 flex max-h-96 w-[calc(100vw-2rem)] max-w-[320px] flex-col overflow-hidden rounded-xl border border-[var(--theme-border-primary)] bg-[var(--theme-bg-secondary)] shadow-xl animate-in fade-in slide-in-from-top-1 sm:w-[320px] sm:max-w-none ${
            dropdownClassName || ''
          }`}
        >
          {!models.length ? (
            <div className="p-4 text-center text-xs text-[var(--theme-text-tertiary)]">
              暂无可用模型
            </div>
          ) : (
            <div
              id={listboxId}
              className="custom-scrollbar flex-grow space-y-2 overflow-y-auto p-1.5"
              role="listbox"
              aria-activedescendant={activeDescendantId}
            >
              {sections.map((section) => (
                <div key={section.key} className="space-y-1" data-provider-section={section.key}>
                  <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-tertiary)]">
                    {section.label}
                  </div>

                  {section.entries.map((entry) => {
                    const isSelected = entry.id === selectedId;
                    const isActive = visibleEntries[activeIndex]?.id === entry.id;

                    return (
                      <button
                        key={entry.id}
                        id={getOptionId(entry.id)}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectModel(entry.id)}
                        className={`group flex w-full cursor-pointer items-start justify-between rounded-xl border px-3 py-2.5 text-left text-sm outline-none transition-colors ${
                          isSelected
                            ? 'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-tertiary)]/60'
                            : 'border-transparent bg-transparent hover:border-[var(--theme-border-secondary)] hover:bg-[var(--theme-bg-tertiary)]'
                        } ${
                          isActive && !isSelected
                            ? 'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-tertiary)]'
                            : ''
                        }`}
                      >
                        <div className="flex min-w-0 flex-grow items-start gap-2.5 overflow-hidden">
                          <div className="mt-0.5 flex-shrink-0">{getModelIcon(entry)}</div>
                          <div className="min-w-0 flex-grow">
                            <div className="flex items-center gap-2">
                              <span
                                className={`truncate ${
                                  isSelected
                                    ? 'font-semibold text-[var(--theme-text-link)]'
                                    : 'text-[var(--theme-text-primary)]'
                                }`}
                                title={entry.label}
                              >
                                {entry.label}
                              </span>
                            </div>
                            <div className="mt-1 truncate font-mono text-[10px] text-[var(--theme-text-tertiary)]">
                              {entry.value}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-1 pl-3 pt-0.5">
                          {isSelected && (
                            <Check
                              size={14}
                              className="text-[var(--theme-text-link)]"
                              strokeWidth={1.5}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelPicker;
