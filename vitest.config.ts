import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
    setupFiles: ['./tests/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'api.ts',
        'config.ts',
        'utils.ts',
        'services/storage.ts',
        'services/utils/retry.ts',
        'services/deepThink/contentBuilder.ts',
        'services/deepThink/orchestrator.ts',
        'hooks/useDeepThinkState.ts',
        'hooks/useChatSessions.ts',
        'hooks/useAppLogic.ts',
        'hooks/useDeepThink.ts',
        'components/settings/AddModelForm.tsx',
        'components/ChatInput.tsx',
        'components/Sidebar.tsx',
      ],
      exclude: ['**/*.d.ts'],
      thresholds: {
        statements: 85,
        branches: 65,
        functions: 85,
        lines: 85,
      },
    },
  },
});
