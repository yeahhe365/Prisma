
import { ModelOption, ExpertResult, MessageAttachment } from '../../types';
import { getExpertSystemInstruction, getExpertUserPrompt } from './prompts';
import { generateContentStream as generateOpenAIStream } from './openaiClient';
import { buildGoogleContents, buildOpenAIContent } from './contentBuilder';

import { isGoogleProvider } from '../../api';

export const streamExpertResponse = async (
  ai: any,
  model: ModelOption,
  expert: ExpertResult,
  context: string,
  attachments: MessageAttachment[],
  budget: number,
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
      for await (const chunk of (streamResult as any)) {
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
    let contentPayload: any = buildOpenAIContent(getExpertUserPrompt(expert.prompt, context), attachments);

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
      console.error(`Stream interrupted for expert ${expert.role}:`, streamError);
      throw streamError;
    }
  }
};
