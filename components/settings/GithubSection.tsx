import React, { useState, useEffect } from 'react';
import { ExternalLink, Github, Star } from 'lucide-react';
import Logo from '@/components/Logo';
import { APP_VERSION } from '@/appVersion';

const REPO_URL = 'https://github.com/yeahhe365/Prisma';
const RELEASES_URL = `${REPO_URL}/releases`;
const STARGAZERS_URL = `${REPO_URL}/stargazers`;

const compareVersions = (v1: string, v2: string) => {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number);
  const parts2 = v2.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i += 1) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
};

const GithubSection = ({ isOpen }: { isOpen: boolean }) => {
  const [stars, setStars] = useState<number | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasReleaseData, setHasReleaseData] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let isCancelled = false;
    setIsLoading(true);

    const fetchAboutInfo = async () => {
      try {
        const [repoRes, releaseRes] = await Promise.allSettled([
          fetch('https://api.github.com/repos/yeahhe365/Prisma'),
          fetch('https://api.github.com/repos/yeahhe365/Prisma/releases/latest'),
        ]);

        if (isCancelled) {
          return;
        }

        if (repoRes.status === 'fulfilled' && repoRes.value.ok) {
          const data = await repoRes.value.json();
          if (typeof data.stargazers_count === 'number') {
            setStars(data.stargazers_count);
          } else {
            setStars(null);
          }
        } else {
          setStars(null);
        }

        if (releaseRes.status === 'fulfilled' && releaseRes.value.ok) {
          const data = await releaseRes.value.json();
          if (typeof data.tag_name === 'string' && data.tag_name.length > 0) {
            setLatestVersion(data.tag_name);
            setHasReleaseData(true);
          } else {
            setLatestVersion(null);
            setHasReleaseData(false);
          }
        } else {
          setLatestVersion(null);
          setHasReleaseData(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error fetching about info:', err);
          setStars(null);
          setLatestVersion(null);
          setHasReleaseData(false);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAboutInfo();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  const comparison = latestVersion ? compareVersions(latestVersion, APP_VERSION) : 0;
  const isUpdateAvailable = comparison === 1;
  const isBeta = comparison === -1;
  const isReleaseUnavailable = !isLoading && !hasReleaseData;
  const versionTooltip =
    isUpdateAvailable && latestVersion ? `有新版本：${latestVersion}` : undefined;

  const statusColor = (() => {
    if (isLoading) return 'bg-sky-500';
    if (isUpdateAvailable) return 'bg-amber-500';
    if (isBeta) return 'bg-purple-500';
    if (isReleaseUnavailable) return 'bg-slate-400';
    return 'bg-emerald-500';
  })();

  const statusText = (() => {
    if (isLoading) return '检查版本中';
    if (isUpdateAvailable) return '有新版本';
    if (isBeta) return '测试版';
    if (isReleaseUnavailable) return '不可用';
    return '已是最新';
  })();

  return (
    <div
      data-testid="settings-about-section"
      className="flex min-h-full flex-col items-center px-4 py-3 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 sm:py-4 md:py-5"
    >
      <div className="relative">
        <Logo
          aria-label="Prisma 标志"
          className="relative h-auto w-40 text-[var(--theme-text-primary)] drop-shadow-2xl sm:w-48 md:w-56"
        />
      </div>

      <div className="mt-3 flex max-w-lg flex-col items-center space-y-4 sm:mt-4 sm:space-y-5">
        <a
          href={RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={versionTooltip}
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1px] transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)] focus:ring-offset-2 focus:ring-offset-[var(--theme-bg-primary)]"
        >
          <span
            className={`absolute inset-0 transition-all duration-300 ${
              isUpdateAvailable
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500'
                : isBeta
                  ? 'bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-500'
                  : isReleaseUnavailable
                    ? 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500'
                    : isLoading
                      ? 'bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-500'
                      : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500'
            } opacity-70 group-hover:opacity-100`}
          />

          <span className="relative flex items-center gap-3 rounded-full bg-[var(--theme-bg-primary)] px-4 py-1.5 transition-all duration-75 ease-in group-hover:bg-opacity-[0.96] sm:px-5">
            <span className="font-mono text-sm font-bold text-[var(--theme-text-primary)]">
              v{APP_VERSION}
            </span>
            <span className="h-3.5 w-px bg-[var(--theme-border-secondary)] opacity-50" />
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isUpdateAvailable ? `motion-safe:animate-ping ${statusColor}` : statusColor
                  }`}
                />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${statusColor}`} />
              </span>
              <span
                className={`text-xs font-medium ${
                  isUpdateAvailable ? 'text-amber-500' : 'text-[var(--theme-text-secondary)]'
                }`}
              >
                {statusText}
                {isUpdateAvailable && latestVersion && (
                  <span className="ml-1 opacity-80">({latestVersion})</span>
                )}
              </span>
            </span>
            <ExternalLink
              size={12}
              className="ml-0.5 text-[var(--theme-text-tertiary)] opacity-70 transition-colors group-hover:text-[var(--theme-text-primary)] group-hover:opacity-100"
            />
          </span>
        </a>

        <p className="max-w-md text-sm leading-6 text-[var(--theme-text-secondary)]">
          多智能体深度推理，专家协同协作。
        </p>
      </div>

      <div className="mt-4 flex w-full flex-col items-stretch justify-center gap-2.5 sm:mt-5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#24292F] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#24292F]/90 hover:shadow-xl active:translate-y-0 dark:bg-white dark:text-black dark:hover:bg-gray-200 sm:w-auto sm:min-w-[10.5rem]"
        >
          <Github size={20} />
          <span>在 GitHub 上查看</span>
        </a>

        <a
          href={STARGAZERS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] px-5 py-2.5 text-sm font-medium text-[var(--theme-text-primary)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--theme-border-focus)] hover:bg-[var(--theme-bg-tertiary)] hover:shadow-md active:translate-y-0 sm:w-auto sm:min-w-[10.5rem]"
        >
          <Star
            size={20}
            className="fill-yellow-500 text-yellow-500 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="tabular-nums">{stars !== null ? stars.toLocaleString() : '—'}</span>
          <span className="text-[var(--theme-text-tertiary)]">星标</span>
          {stars === null && (
            <span className="text-[var(--theme-text-tertiary)]">
              {isLoading ? '加载中' : '不可用'}
            </span>
          )}
        </a>
      </div>
    </div>
  );
};

export default GithubSection;
