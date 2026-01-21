
import { ModelOption, ExpertResult, MessageAttachment } from '../../types';
import { getExpertSystemInstruction } from './prompts';
import { withRetry } from '../utils/retry';
import { generateContentStream as generateOpenAIStream } from './openaiClient';
import { logger } from '../logger';

const isGoogleProvider = (ai: any): boolean => {
  return ai?.models?.generateContentStream !== undefined;
};

export const streamExpertResponse = async (
  ai: any,
  model: ModelOption,
  expert: ExpertResult,
  context: string,
  attachments: MessageAttachment[],
  budget: number,
  enableWebSearch: boolean,
  signal: AbortSignal,
  onChunk: (text: string, thought: string) => void
): Promise<void> => {
  const isGoogle = isGoogleProvider(ai);

  if (isGoogle) {
    const tools = enableWebSearch ? [{ googleSearch: {} }] : undefined;
    const sourceMap = new Map<string, string | undefined>();

    const addSources = (resp: any) => {
      const chunks = resp?.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (!Array.isArray(chunks)) return;
      for (const chunk of chunks) {
        const uri = chunk?.web?.uri;
        const title = chunk?.web?.title;
        if (typeof uri === 'string' && uri.trim() && !sourceMap.has(uri)) {
          sourceMap.set(uri, typeof title === 'string' && title.trim() ? title : undefined);
        }
      }
    };

    const contents: any = {
      role: 'user',
      parts: [{ text: expert.prompt }]
    };

    if (attachments.length > 0) {
      attachments.forEach(att => {
        contents.parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }

    let streamResult: any;
    if (tools) {
      try {
        streamResult = await withRetry(() => ai.models.generateContentStream({
          model: model,
          contents: contents,
          config: { systemInstruction: getExpertSystemInstruction(expert.role, expert.description, context), temperature: expert.temperature, tools, thinkingConfig: { thinkingBudget: budget, includeThoughts: true } }
        }));
      } catch (e) {
        logger.warn("Expert", `Web search tool failed for expert ${expert.role}; retrying without it`, e);
      }
    }

    streamResult = streamResult || await withRetry(() => ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        systemInstruction: getExpertSystemInstruction(expert.role, expert.description, context),
        temperature: expert.temperature,
        thinkingConfig: {
          thinkingBudget: budget,
          includeThoughts: true
        }
      }
    }));

    try {
      for await (const chunk of (streamResult as any)) {
        if (signal.aborted) break;

        let chunkText = "";
        let chunkThought = "";

        if (enableWebSearch) addSources(chunk);

        if (chunk.candidates?.[0]?.content?.parts) {
          for (const part of chunk.candidates[0].content.parts) {
            if (part.thought) {
              chunkThought += (part.text || "");
            } else if (part.text) {
              chunkText += part.text;
            }
          }
          onChunk(chunkText, chunkThought);
        }
      }

      if (!signal.aborted && enableWebSearch && sourceMap.size > 0) {
        const sourcesMd = Array.from(sourceMap.entries()).map(([uri, title]) => (title ? `- [${title}](${uri})` : `- ${uri}`)).join('\n');
        onChunk(`\n\n---\n\n**Sources**\n${sourcesMd}\n`, '');
      }
    } catch (streamError) {
      logger.error("Expert", `Stream interrupted for expert ${expert.role}`, streamError);
      throw streamError;
    }
  } else {
    let contentPayload: any = expert.prompt;

    if (attachments.length > 0) {
      contentPayload = [
        { type: 'text', text: expert.prompt }
      ];
      attachments.forEach(att => {
        contentPayload.push({
          type: 'image_url',
          image_url: {
            url: `data:${att.mimeType};base64,${att.data}`
          }
        });
      });
    }

    const stream = generateOpenAIStream(ai, {
      model,
      systemInstruction: getExpertSystemInstruction(expert.role, expert.description, context),
      content: contentPayload,
      temperature: expert.temperature,
      thinkingConfig: {
        thinkingBudget: budget,
        includeThoughts: true
      }
    });

    try {
      for await (const chunk of (stream as any)) {
        if (signal.aborted) break;

        onChunk(chunk.text, chunk.thought || '');
      }
    } catch (streamError) {
      logger.error("Expert", `Stream interrupted for expert ${expert.role} (OpenAI)`, streamError);
      throw streamError;
    }
  }
};
