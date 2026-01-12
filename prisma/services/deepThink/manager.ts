
import { Type } from "@google/genai";
import { ModelOption, AnalysisResult, ExpertResult, ReviewResult, MessageAttachment } from '../../types';
import { cleanJsonString } from '../../utils';
import { MANAGER_SYSTEM_PROMPT, MANAGER_REVIEW_SYSTEM_PROMPT } from './prompts';
import { withRetry } from '../utils/retry';
import { generateContent as generateOpenAIContent } from './openaiClient';
import { logger } from '../logger';

const isGoogleProvider = (ai: any): boolean => {
  return ai?.models?.generateContent !== undefined;
};

export const executeManagerAnalysis = async (
  ai: any,
  model: ModelOption,
  query: string,
  context: string,
  attachments: MessageAttachment[],
  budget: number
): Promise<AnalysisResult> => {
  const isGoogle = isGoogleProvider(ai);
  const textPrompt = `Context:\n${context}\n\nCurrent Query: "${query}"`;

  if (isGoogle) {
    const managerSchema = {
      type: Type.OBJECT,
      properties: {
        thought_process: { type: Type.STRING, description: "Brief explanation of why these supplementary experts were chosen." },
        experts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              description: { type: Type.STRING },
              temperature: { type: Type.NUMBER },
              prompt: { type: Type.STRING }
            },
            required: ["role", "description", "temperature", "prompt"]
          }
        }
      },
      required: ["thought_process", "experts"]
    };

    const contents: any = {
      role: 'user',
      parts: [{ text: textPrompt }]
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

    try {
      const analysisResp = await withRetry(() => ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          systemInstruction: MANAGER_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: managerSchema,
          thinkingConfig: {
           includeThoughts: true,
           thinkingBudget: budget
        }
        }
      }));

      const rawText = (analysisResp as any).text || '{}';
      const cleanText = cleanJsonString(rawText);

      const analysisJson = JSON.parse(cleanText) as AnalysisResult;
      if (!analysisJson.experts || !Array.isArray(analysisJson.experts)) {
        throw new Error("Invalid schema structure");
      }
      return analysisJson;
    } catch (e) {
      logger.error("Manager", "Analysis generation failed", e);
      return {
        thought_process: "Direct processing fallback due to analysis error.",
        experts: []
      };
    }
  } else {
    try {
      let contentPayload: any = textPrompt;

      if (attachments.length > 0) {
        contentPayload = [
          { type: 'text', text: textPrompt }
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

      // Append formatting instruction to prompt if needed (OpenAI sometimes needs this explicit in text)
      // but usually responseFormat: json_object + system prompt is enough.
      // We append it to the text part or the string.
      const jsonInstruction = `\n\nReturn a JSON response with this structure:\n{\n  "thought_process": "...",\n  "experts": [\n    { "role": "...", "description": "...", "temperature": number, "prompt": "..." }\n  ]\n}`;
      
      if (Array.isArray(contentPayload)) {
         contentPayload[0].text += jsonInstruction;
      } else {
         contentPayload += jsonInstruction;
      }

      const response = await generateOpenAIContent(ai, {
        model,
        systemInstruction: MANAGER_SYSTEM_PROMPT,
        content: contentPayload,
        temperature: 0.7,
        responseFormat: 'json_object',
        thinkingConfig: {
          includeThoughts: true,
          thinkingBudget: budget
        }
      });

      const analysisJson = JSON.parse(response.text) as AnalysisResult;
      if (!analysisJson.experts || !Array.isArray(analysisJson.experts)) {
        throw new Error("Invalid schema structure");
      }
      return analysisJson;
    } catch (e) {
      logger.error("Manager", "Analysis generation failed (OpenAI)", e);
      return {
        thought_process: "Direct processing fallback due to analysis error.",
        experts: []
      };
    }
  }
};

export const executeManagerReview = async (
  ai: any,
  model: ModelOption,
  query: string,
  currentExperts: ExpertResult[],
  budget: number
): Promise<ReviewResult> => {
  const isGoogle = isGoogleProvider(ai);
  const expertOutputs = currentExperts.map(e =>
    `--- [Round ${e.round}] Expert: ${e.role} ---\nOutput: ${e.content?.slice(0, 2000)}...`
  ).join('\n\n');

  const content = `User Query: "${query}"\n\nCurrent Expert Outputs:\n${expertOutputs}`;

  if (isGoogle) {
    const reviewSchema = {
      type: Type.OBJECT,
      properties: {
        satisfied: { type: Type.BOOLEAN, description: "True if the experts have fully answered the query with high quality." },
        critique: { type: Type.STRING, description: "If not satisfied, explain why and what is missing." },
        next_round_strategy: { type: Type.STRING, description: "Plan for the next iteration." },
        refined_experts: {
          type: Type.ARRAY,
          description: "The list of experts for the next round. Can be the same roles or new ones.",
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              description: { type: Type.STRING },
              temperature: { type: Type.NUMBER },
              prompt: { type: Type.STRING }
            },
            required: ["role", "description", "temperature", "prompt"]
          }
        }
      },
      required: ["satisfied", "critique"]
    };

    try {
      const resp = await withRetry(() => ai.models.generateContent({
        model: model,
        contents: content,
        config: {
          systemInstruction: MANAGER_REVIEW_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: reviewSchema,
          thinkingConfig: {
           includeThoughts: true,
           thinkingBudget: budget
        }
        }
      }));

      const rawText = (resp as any).text || '{}';
      const cleanText = cleanJsonString(rawText);
      return JSON.parse(cleanText) as ReviewResult;
    } catch (e) {
      logger.error("Manager", "Review generation failed", e);
      return { satisfied: true, critique: "Processing Error, proceeding to synthesis." };
    }
  } else {
    try {
      const response = await generateOpenAIContent(ai, {
        model,
        systemInstruction: MANAGER_REVIEW_SYSTEM_PROMPT,
        content: `${content}\n\nReturn a JSON response with this structure:\n{\n  "satisfied": boolean,\n  "critique": "...",\n  "next_round_strategy": "...",\n  "refined_experts": [...]\n}`,
        temperature: 0.7,
        responseFormat: 'json_object',
        thinkingConfig: {
          includeThoughts: true,
          thinkingBudget: budget
        }
      });

      return JSON.parse(response.text) as ReviewResult;
    } catch (e) {
      logger.error("Manager", "Review generation failed (OpenAI)", e);
      return { satisfied: true, critique: "Processing Error, proceeding to synthesis." };
    }
  }
};
