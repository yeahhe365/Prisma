import React, { useState, useEffect } from 'react';
import { Github, Star } from 'lucide-react';

const GithubSection = ({ isOpen }: { isOpen: boolean }) => {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('https://api.github.com/repos/yeahhe365/Prisma')
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.stargazers_count === 'number') {
            setStars(data.stargazers_count);
          }
        })
        .catch((err) => console.error('Error fetching stars:', err));
    }
  }, [isOpen]);

  return (
    <div className="space-y-4 rounded-xl border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] p-4">
      <a
        href="https://github.com/yeahhe365/Prisma"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-6 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-3.5 transition-colors hover:bg-[var(--theme-bg-tertiary)]/50 max-sm:flex-col max-sm:items-stretch"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-bg-accent)] text-[var(--theme-text-accent)] transition-transform group-hover:scale-105">
            <Github size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--theme-text-primary)]">
              yeahhe365 / Prisma
            </p>
            <p className="text-xs text-[var(--theme-text-tertiary)]">GitHub 开源项目</p>
          </div>
        </div>

        {stars !== null && (
          <div className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] px-2 py-1 shadow-sm max-sm:w-fit">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-[var(--theme-text-secondary)]">
              {stars.toLocaleString()}
            </span>
          </div>
        )}
      </a>
    </div>
  );
};

export default GithubSection;
