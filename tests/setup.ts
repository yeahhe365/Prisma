import 'fake-indexeddb/auto';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

const createStorageMock = () => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } satisfies Storage;
};

beforeEach(() => {
  const localStorageMock = createStorageMock();
  const sessionStorageMock = createStorageMock();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: localStorageMock,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: sessionStorageMock,
  });
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorageMock,
  });
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: sessionStorageMock,
  });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(async () => {
  cleanup();
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
