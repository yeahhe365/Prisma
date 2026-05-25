import OpenAI from 'openai';
import type { ModelOption, OpenAIClient, ThinkingLevel } from '@/types';
import { withRetry } from '@/services/utils/retry';
import { getReasoningEffort } from '@/config';

export interface OpenAIStreamChunk {
  text: string;
  thought?: string;
}

export interface OpenAIConfig {
  model: ModelOption;
  systemInstruction?: string;
  content: string | OpenAI.Chat.ChatCompletionContentPart[];
  temperature?: number;
  responseFormat?: 'text' | 'json_object';
  thinkingConfig?: {
    includeThoughts: boolean;
    thinkingBudget: number;
    thinkingLevel?: ThinkingLevel;
  };
}

/** Models that support the reasoning_effort parameter */
const REASONING_EFFORT_MODELS = /^(o[134]-)/;

const supportsReasoningEffort = (model: string): boolean => {
  return REASONING_EFFORT_MODELS.test(model);
};

const parseThinkingTokens = (text: string): { thought: string; text: string } => {
  const thinkPattern = /<thinking>([\s\S]*?)<\/thinking>/g;
  let thought = '';
  let cleanText = text;

  const matches = text.matchAll(thinkPattern);
  for (const match of matches) {
    thought += match[1];
  }

  cleanText = text.replace(thinkPattern, '');

  return { thought: thought.trim(), text: cleanText.trim() };
};

const THINKING_OPEN_TAG = '<thinking>';
const THINKING_CLOSE_TAG = '</thinking>';

type ThinkingStreamState = {
  inThinking: boolean;
  buffer: string;
};

const getPartialTagSuffixLength = (value: string, tag: string): number => {
  for (let length = Math.min(value.length, tag.length - 1); length > 0; length--) {
    if (tag.startsWith(value.slice(-length))) return length;
  }

  return 0;
};

const consumeThinkingContent = (
  state: ThinkingStreamState,
  content: string,
  flush = false,
): { text: string; thought: string } => {
  state.buffer += content;

  let text = '';
  let thought = '';

  while (state.buffer) {
    const tag = state.inThinking ? THINKING_CLOSE_TAG : THINKING_OPEN_TAG;
    const tagIndex = state.buffer.indexOf(tag);

    if (tagIndex !== -1) {
      const beforeTag = state.buffer.slice(0, tagIndex);
      if (state.inThinking) {
        thought += beforeTag;
      } else {
        text += beforeTag;
      }

      state.buffer = state.buffer.slice(tagIndex + tag.length);
      state.inThinking = !state.inThinking;
      continue;
    }

    const keepLength = flush ? 0 : getPartialTagSuffixLength(state.buffer, tag);
    const emitLength = state.buffer.length - keepLength;

    if (emitLength > 0) {
      const emitValue = state.buffer.slice(0, emitLength);
      if (state.inThinking) {
        thought += emitValue;
      } else {
        text += emitValue;
      }
      state.buffer = state.buffer.slice(emitLength);
    }

    break;
  }

  return { text, thought };
};

const getOpenAIReasoningEffort = (
  model: ModelOption,
  thinkingLevel?: ThinkingLevel,
): OpenAI.Chat.ChatCompletionReasoningEffort | undefined => {
  if (!thinkingLevel || !supportsReasoningEffort(model)) return undefined;
  return getReasoningEffort(thinkingLevel) as OpenAI.Chat.ChatCompletionReasoningEffort | undefined;
};

export const generateContent = async (
  ai: OpenAIClient,
  config: OpenAIConfig,
): Promise<{ text: string; thought?: string }> => {
  const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

  if (config.systemInstruction) {
    messages.push({
      role: 'system',
      content: config.systemInstruction,
    });
  }

  messages.push({
    role: 'user',
    content: config.content,
  });

  const requestOptions: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model: config.model,
    messages,
    temperature: config.temperature,
  };

  if (config.responseFormat === 'json_object') {
    (
      requestOptions as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming & {
        response_format?: { type: 'json_object' };
      }
    ).response_format = { type: 'json_object' };
  }

  // Pass reasoning_effort for models that support it (o1/o3/o4 series)
  const reasoningEffort = getOpenAIReasoningEffort(
    config.model,
    config.thinkingConfig?.thinkingLevel,
  );
  if (reasoningEffort) {
    requestOptions.reasoning_effort = reasoningEffort;
  }

  try {
    const response = await withRetry(() => ai.chat.completions.create(requestOptions));
    const message = response.choices[0]?.message;
    const content = message?.content || '';

    if (config.thinkingConfig?.includeThoughts) {
      // Check for reasoning_content field (DeepSeek-R1, GLM-thinking, etc.)
      const reasoningContent =
        (
          message as
            | (OpenAI.Chat.ChatCompletionMessage & { reasoning_content?: string })
            | undefined
        )?.reasoning_content || '';
      if (reasoningContent) {
        return { text: content, thought: reasoningContent };
      }
      const { thought, text } = parseThinkingTokens(content);
      return { text, thought };
    }

    return { text: content };
  } catch (error) {
    console.error('OpenAI generateContent error:', error);
    throw error;
  }
};

export async function* generateContentStream(
  ai: OpenAIClient,
  config: OpenAIConfig,
): AsyncGenerator<OpenAIStreamChunk, void, unknown> {
  const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

  if (config.systemInstruction) {
    messages.push({
      role: 'system',
      content: config.systemInstruction,
    });
  }

  messages.push({
    role: 'user',
    content: config.content,
  });

  const requestOptions: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
    model: config.model,
    messages,
    temperature: config.temperature,
    stream: true,
  };

  // Pass reasoning_effort for models that support it
  const reasoningEffort = getOpenAIReasoningEffort(
    config.model,
    config.thinkingConfig?.thinkingLevel,
  );
  if (reasoningEffort) {
    requestOptions.reasoning_effort = reasoningEffort;
  }

  const stream = await withRetry(() => ai.chat.completions.create(requestOptions));

  const thinkingStreamState: ThinkingStreamState = {
    inThinking: false,
    buffer: '',
  };

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta as
      | { content?: string | null; reasoning_content?: string }
      | undefined;

    // Handle reasoning_content (DeepSeek-R1, GLM-thinking, etc.)
    if (config.thinkingConfig?.includeThoughts && delta?.reasoning_content) {
      yield { text: '', thought: delta.reasoning_content };
    }

    const content = delta?.content || '';
    if (!content) continue;

    if (config.thinkingConfig?.includeThoughts) {
      const parsed = consumeThinkingContent(thinkingStreamState, content);
      if (parsed.text || parsed.thought) yield parsed;
    } else {
      yield { text: content, thought: '' };
    }
  }

  if (config.thinkingConfig?.includeThoughts) {
    const parsed = consumeThinkingContent(thinkingStreamState, '', true);
    if (parsed.text || parsed.thought) yield parsed;
  }
}
