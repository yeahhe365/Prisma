import OpenAI from "openai";
import { ModelOption } from '../../types';
import { withRetry } from '../utils/retry';
import { getReasoningEffort } from '../../config';

export interface OpenAIStreamChunk {
  text: string;
  thought?: string;
}

export interface OpenAIConfig {
  model: ModelOption;
  systemInstruction?: string;
  content: string | Array<Record<string, string>>;
  temperature?: number;
  responseFormat?: 'text' | 'json_object';
  thinkingConfig?: {
    includeThoughts: boolean;
    thinkingBudget: number;
    thinkingLevel?: string;
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

export const generateContent = async (
  ai: OpenAI,
  config: OpenAIConfig
): Promise<{ text: string; thought?: string }> => {
  const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

  if (config.systemInstruction) {
    messages.push({
      role: 'system',
      content: config.systemInstruction
    });
  }

  messages.push({
    role: 'user',
    content: config.content as string | OpenAI.Chat.ChatCompletionContentPart[]
  });

  const requestOptions: OpenAI.Chat.CompletionCreateParamsNonStreaming = {
    model: config.model,
    messages,
    temperature: config.temperature,
  };

  if (config.responseFormat === 'json_object') {
    (requestOptions as Record<string, unknown>).response_format = { type: 'json_object' };
  }

  // Pass reasoning_effort for models that support it (o1/o3/o4 series)
  if (supportsReasoningEffort(config.model) && config.thinkingConfig?.thinkingLevel) {
    (requestOptions as Record<string, unknown>).reasoning_effort = config.thinkingConfig.thinkingLevel;
  }

  try {
    const response = await withRetry(() => ai.chat.completions.create(requestOptions));
    const message = response.choices[0]?.message;
    const content = message?.content || '';

    if (config.thinkingConfig?.includeThoughts) {
      // Check for reasoning_content field (DeepSeek-R1, GLM-thinking, etc.)
      const reasoningContent = (message as OpenAI.Chat.ChatCompletionMessage & { reasoning_content?: string }).reasoning_content || '';
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
  ai: OpenAI,
  config: OpenAIConfig
): AsyncGenerator<OpenAIStreamChunk, void, unknown> {
  const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

  if (config.systemInstruction) {
    messages.push({
      role: 'system',
      content: config.systemInstruction
    });
  }

  messages.push({
    role: 'user',
    content: config.content as string | OpenAI.Chat.ChatCompletionContentPart[]
  });

  const requestOptions: OpenAI.Chat.CompletionCreateParamsStreaming = {
    model: config.model,
    messages,
    temperature: config.temperature,
    stream: true,
  };

  // Pass reasoning_effort for models that support it
  if (supportsReasoningEffort(config.model) && config.thinkingConfig?.thinkingLevel) {
    (requestOptions as Record<string, unknown>).reasoning_effort = config.thinkingConfig.thinkingLevel;
  }

  const stream = await withRetry(() => ai.chat.completions.create(requestOptions));

  let accumulatedText = '';
  let inThinking = false;
  let currentThought = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    // Handle reasoning_content (DeepSeek-R1, GLM-thinking, etc.)
    if (config.thinkingConfig?.includeThoughts && delta?.reasoning_content) {
      yield { text: '', thought: delta.reasoning_content };
    }

    const content = delta?.content || '';
    if (!content) continue;

    accumulatedText += content;

    if (config.thinkingConfig?.includeThoughts) {
      if (content.includes('<thinking>')) {
        inThinking = true;
        continue;
      }

      if (inThinking) {
        if (content.includes('</thinking>')) {
          inThinking = false;
          const parts = content.split('</thinking>', 2);
          currentThought += parts[0];

          if (currentThought.trim()) {
            yield { text: '', thought: currentThought };
            currentThought = '';
          }

          if (parts[1]) {
            yield { text: parts[1], thought: '' };
          }
        } else {
          currentThought += content;
          if (currentThought.length > 100) {
            yield { text: '', thought: currentThought };
            currentThought = '';
          }
        }
      } else {
        yield { text: content, thought: '' };
      }
    } else {
      yield { text: content, thought: '' };
    }
  }

  if (currentThought.trim()) {
    yield { text: '', thought: currentThought };
  }
}
