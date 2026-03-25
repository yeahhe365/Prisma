
import { ModelOption, ExpertResult, MessageAttachment } from '../../types';
import { getSynthesisPrompt } from './prompts';
import { generateContentStream as generateOpenAIStream } from './openaiClient';
import { buildGoogleContents, buildOpenAIContent } from './contentBuilder';

import { isGoogleProvider } from '../../api';

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
    const contents = buildGoogleContents(prompt, attachments);

    const synthesisStream = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        thinkingConfig: {
          thinkingBudget: budget,
          includeThoughts: true
        }
      }
    });

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
      console.error("Synthesis stream interrupted:", streamError);
      throw streamError;
    }
  } else {
    let contentPayload: any = buildOpenAIContent(prompt, attachments);

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
      console.error("Synthesis stream interrupted:", streamError);
      throw streamError;
    }
  }
};
