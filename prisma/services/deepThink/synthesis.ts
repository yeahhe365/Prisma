
import { ModelOption, ExpertResult, MessageAttachment } from '../../types';
import { getSynthesisPrompt } from './prompts';
import { withRetry } from '../utils/retry';
import { generateContentStream as generateOpenAIStream } from './openaiClient';
import { logger } from '../logger';

const isGoogleProvider = (ai: any): boolean => {
  return ai?.models?.generateContentStream !== undefined;
};

export const streamSynthesisResponse = async (
  ai: any,
  model: ModelOption,
  query: string,
  historyContext: string,
  expertResults: ExpertResult[],
  attachments: MessageAttachment[],
  budget: number,
  signal: AbortSignal,
  onChunk: (text: string, thought: string) => void
): Promise<void> => {
  const prompt = getSynthesisPrompt(historyContext, query, expertResults);
  const isGoogle = isGoogleProvider(ai);

  if (isGoogle) {
    const contents: any = {
      role: 'user',
      parts: [{ text: prompt }]
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

    const synthesisStream = await withRetry(() => ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        thinkingConfig: {
          thinkingBudget: budget,
          includeThoughts: true
        }
      }
    }));

    try {
      for await (const chunk of (synthesisStream as any)) {
        if (signal.aborted) break;

        let chunkText = "";
        let chunkThought = "";

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
    } catch (streamError) {
      logger.error("Synthesis", "Stream interrupted", streamError);
      throw streamError;
    }
  } else {
    let contentPayload: any = prompt;

    if (attachments.length > 0) {
      contentPayload = [
        { type: 'text', text: prompt }
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
      systemInstruction: undefined,
      content: contentPayload,
      temperature: 0.7,
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
      logger.error("Synthesis", "Stream interrupted (OpenAI)", streamError);
      throw streamError;
    }
  }
};
