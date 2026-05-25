import { beforeEach, describe, expect, it, vi } from 'vitest';

const { openAiConstructor, googleConstructor } = vi.hoisted(() => ({
  openAiConstructor: vi.fn(),
  googleConstructor: vi.fn(),
}));

vi.mock('openai', () => ({
  default: openAiConstructor,
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: googleConstructor,
}));

import {
  findCustomModel,
  getAI,
  getAIProvider,
  isGoogleProvider,
  resolveApiKey,
  resolveApiProxyMode,
  resolveModelApiConfig,
} from '@/api';
import type { CustomModel } from '@/types';

describe('api helpers', () => {
  beforeEach(() => {
    openAiConstructor.mockReset();
    googleConstructor.mockReset();
    openAiConstructor.mockImplementation(function (
      this: { chat: object; options: unknown },
      options,
    ) {
      this.chat = {};
      this.options = options;
    });
    googleConstructor.mockImplementation(function (
      this: { models: object; options: unknown },
      options,
    ) {
      this.models = {};
      this.options = options;
    });
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(window, 'fetch', {
      writable: true,
      value: globalThis.fetch,
    });
  });

  it('finds matching custom model by name', () => {
    const models: CustomModel[] = [
      { id: '1', name: 'glm-4', displayName: 'GLM 4', provider: 'openai' },
      { id: '2', name: 'gemini-custom', displayName: 'Gemini Custom', provider: 'google' },
    ];

    expect(findCustomModel('glm-4', models)).toEqual(models[0]);
    expect(findCustomModel('missing', models)).toBeUndefined();
  });

  it('resolves provider from model prefixes', () => {
    expect(getAIProvider('gpt-4o')).toBe('openai');
    expect(getAIProvider('glm-5-turbo')).toBe('openai');
    expect(getAIProvider('gemini-3.5-flash')).toBe('google');
  });

  it('resolves API config from custom models', () => {
    expect(
      resolveModelApiConfig('glm-5-turbo', {
        customModels: [
          {
            id: 'custom-glm',
            name: 'glm-5-turbo',
            displayName: 'GLM',
            provider: 'openai',
            apiKey: 'custom-key',
            baseUrl: 'https://custom.example.com/v1',
          },
        ],
      }),
    ).toEqual({
      provider: 'openai',
      apiKey: 'custom-key',
      baseUrl: 'https://custom.example.com/v1',
    });
  });

  it('uses provider inference when no custom model config exists', () => {
    expect(
      resolveModelApiConfig('gemini-3.5-flash', {
        customModels: [],
      }),
    ).toEqual({
      provider: 'google',
    });
  });

  it('uses only explicit per-model keys', () => {
    expect(resolveApiKey('explicit', { VITE_API_KEY: 'vite', GEMINI_API_KEY: 'gemini' })).toBe(
      'explicit',
    );
    expect(
      resolveApiKey(undefined, { VITE_API_KEY: 'vite', GEMINI_API_KEY: 'gemini' }),
    ).toBeUndefined();
    expect(resolveApiKey(undefined, { GEMINI_API_KEY: 'gemini' })).toBeUndefined();
  });

  it('keeps direct browser API requests as the default proxy mode', () => {
    expect(resolveApiProxyMode({})).toBe('direct');
    expect(resolveApiProxyMode({ VITE_API_PROXY_MODE: 'local' })).toBe('local');
    expect(resolveApiProxyMode({ VITE_API_PROXY_MODE: 'unknown' })).toBe('direct');
  });

  it('creates an OpenAI client with the expected browser-safe options', () => {
    getAI({
      provider: 'openai',
      apiKey: 'test-key',
      baseUrl: 'https://proxy.example.com/v1',
    });

    expect(openAiConstructor).toHaveBeenCalledTimes(1);
    expect(openAiConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        dangerouslyAllowBrowser: true,
        baseURL: 'https://proxy.example.com/v1',
        fetch: expect.any(Function),
      }),
    );
  });

  it('uses the official OpenAI base url when no custom endpoint is provided', () => {
    getAI({
      provider: 'openai',
      apiKey: 'test-key',
    });

    expect(openAiConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.openai.com/v1',
      }),
    );
  });

  it('creates a Google client and strips duplicated api version suffixes from custom base urls', () => {
    getAI({
      provider: 'google',
      apiKey: 'google-key',
      baseUrl: 'https://gateway.example.com/v1beta',
    });

    expect(googleConstructor).toHaveBeenCalledTimes(1);
    expect(googleConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'google-key',
        fetch: expect.any(Function),
        httpOptions: { baseUrl: 'https://gateway.example.com' },
      }),
    );
  });

  it('keeps custom fetch scoped to the configured host and deduplicates repeated api version segments', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL) => new Response(JSON.stringify({ ok: true })),
    );
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(window, 'fetch', {
      writable: true,
      value: fetchMock,
    });

    getAI({
      provider: 'google',
      apiKey: 'google-key',
      baseUrl: 'https://gateway.example.com/v1beta',
    });

    const options = (googleConstructor.mock.instances[0] as { options: { fetch: typeof fetch } })
      .options;
    await options.fetch('https://gateway.example.com/v1beta/v1beta/models');

    expect(fetchMock).toHaveBeenCalledWith('https://gateway.example.com/v1beta/models', undefined);
  });

  it('preserves Request init data when deduplicating repeated api version segments', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL) => new Response(JSON.stringify({ ok: true })),
    );
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(window, 'fetch', {
      writable: true,
      value: fetchMock,
    });

    getAI({
      provider: 'google',
      apiKey: 'google-key',
      baseUrl: 'https://gateway.example.com/v1beta',
    });

    const options = (googleConstructor.mock.instances[0] as { options: { fetch: typeof fetch } })
      .options;
    const request = new Request('https://gateway.example.com/v1beta/v1beta/models', {
      method: 'POST',
      headers: { Authorization: 'Bearer google-key' },
      body: JSON.stringify({ prompt: 'hello' }),
    });

    await options.fetch(request);

    const forwardedRequest = fetchMock.mock.calls[0][0];
    expect(forwardedRequest).toBeInstanceOf(Request);
    expect((forwardedRequest as Request).url).toBe('https://gateway.example.com/v1beta/models');
    expect((forwardedRequest as Request).method).toBe('POST');
    expect((forwardedRequest as Request).headers.get('authorization')).toBe('Bearer google-key');
    await expect((forwardedRequest as Request).text()).resolves.toBe(
      JSON.stringify({ prompt: 'hello' }),
    );
  });

  it('passes through URL objects without rewriting unrelated hosts', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL) => new Response(JSON.stringify({ ok: true })),
    );
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(window, 'fetch', {
      writable: true,
      value: fetchMock,
    });

    getAI({
      provider: 'google',
      apiKey: 'google-key',
      baseUrl: 'https://gateway.example.com/v1beta',
    });

    const options = (googleConstructor.mock.instances[0] as { options: { fetch: typeof fetch } })
      .options;
    const requestUrl = new URL('https://example.com/v1beta/v1beta/models');
    await options.fetch(requestUrl);

    expect(fetchMock).toHaveBeenCalledWith(requestUrl, undefined);
  });

  it('routes external API requests through the local proxy when enabled', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(window, 'fetch', {
      writable: true,
      value: fetchMock,
    });

    getAI({
      provider: 'openai',
      apiKey: 'test-key',
      proxyMode: 'local',
    });

    const options = (openAiConstructor.mock.instances[0] as { options: { fetch: typeof fetch } })
      .options;
    await options.fetch('https://api.openai.com/v1/chat/completions?stream=true', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [] }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();

    const [url, init] = call;
    const headers = new Headers(init?.headers);

    expect(url).toBe('/custom-api/v1/chat/completions?stream=true');
    expect(init).toEqual(
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ messages: [] }),
      }),
    );
    expect(headers.get('x-target-url')).toBe('https://api.openai.com');
    expect(headers.get('authorization')).toBe('Bearer test-key');
  });

  it('identifies google-style clients by their models interface', () => {
    expect(isGoogleProvider({ models: { generateContent: vi.fn() } })).toBe(true);
    expect(isGoogleProvider({ chat: {} })).toBe(false);
    expect(isGoogleProvider(null)).toBe(false);
  });
});
