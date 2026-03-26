import { AIClient, ModelOption, ExpertResult, MessageAttachment } from '../../types';
import { getExpertSystemInstruction, getExpertUserPrompt } from './prompts';
import { generateContentStream as generateOpenAIStream } from './openaiClient';
import { buildGoogleContents, buildOpenAIContent } from './contentBuilder';

import { isGoogleProvider } from '../../api';

export const streamExpertResponse = async (
  ai: AIClient,
  model: ModelOption,
  expert: ExpertResult,
  context: string,
  attachments: MessageAttachment[],
  budget: number,
  thinkingLevel: string,
  signal: AbortSignal,
  onChunk: (text: string, thought: string) => void
): Promise<void> => {
  const isGoogle = isGoogleProvider(ai);

  if (isGoogle) {
    const contents = buildGoogleContents(getExpertUserPrompt(expert.prompt, context), attachments);

    const streamResult = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        systemInstruction: getExpertSystemInstruction(expert.role, expert.description),
        temperature: expert.temperature,
        thinkingConfig: {
          thinkingBudget: budget,
          includeThoughts: true
        }
      }
    });

    try {
      for await (const chunk of streamResult) {
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
      console.error(`Stream interrupted for expert ${expert.role}:`, streamError);
      throw streamError;
    }
  } else {
    const contentPayload = buildOpenAIContent(getExpertUserPrompt(expert.prompt, context), attachments) as string | Array<Record<string, string>>;

    const stream = generateOpenAIStream(ai, {
      model,
      systemInstruction: getExpertSystemInstruction(expert.role, expert.description),
      content: contentPayload,
      temperature: expert.temperature,
      thinkingConfig: {
        thinkingBudget: budget,
        thinkingLevel,
        includeThoughts: true
      }
    });

    try {
      for await (const chunk of stream) {
        if (signal.aborted) break;

        onChunk(chunk.text, chunk.thought || '');
      }
    } catch (streamError) {
      console.error(`Stream interrupted for expert ${expert.role}:`, streamError);
      throw streamError;
    }
  }
};
