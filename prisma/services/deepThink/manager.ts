import { Type } from "@google/genai";
import { ModelOption, AnalysisResult, ExpertResult, ReviewResult } from '../../types';
import { cleanJsonString } from '../../utils';
import { MANAGER_SYSTEM_PROMPT, MANAGER_REVIEW_SYSTEM_PROMPT } from './prompts';

export const executeManagerAnalysis = async (
  ai: any,
  model: ModelOption,
  query: string,
  context: string,
  budget: number
): Promise<AnalysisResult> => {
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

  const analysisResp = await ai.models.generateContent({
    model: model,
    contents: `Context:\n${context}\n\nCurrent Query: "${query}"`,
    config: {
      systemInstruction: MANAGER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: managerSchema,
      thinkingConfig: { 
         includeThoughts: true, 
         thinkingBudget: budget 
      }
    }
  });

  const rawText = analysisResp.text || '{}';
  const cleanText = cleanJsonString(rawText);
  
  try {
    const analysisJson = JSON.parse(cleanText) as AnalysisResult;
    if (!analysisJson.experts || !Array.isArray(analysisJson.experts)) {
       throw new Error("Invalid schema structure");
    }
    return analysisJson;
  } catch (e) {
    console.error("JSON Parse Error:", e, rawText);
    return { thought_process: "Direct processing.", experts: [] };
  }
};

export const executeManagerReview = async (
  ai: any,
  model: ModelOption,
  query: string,
  currentExperts: ExpertResult[],
  budget: number
): Promise<ReviewResult> => {
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

  const expertOutputs = currentExperts.map(e => 
    `--- [Round ${e.round}] Expert: ${e.role} ---\nOutput: ${e.content?.slice(0, 2000)}...`
  ).join('\n\n');

  const content = `User Query: "${query}"\n\nCurrent Expert Outputs:\n${expertOutputs}`;

  const resp = await ai.models.generateContent({
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
  });

  const rawText = resp.text || '{}';
  const cleanText = cleanJsonString(rawText);

  try {
    return JSON.parse(cleanText) as ReviewResult;
  } catch (e) {
    console.error("Review JSON Parse Error:", e);
    // Fallback: Assume satisfied if JSON fails to avoid infinite loops due to format errors
    return { satisfied: true, critique: "JSON Error, proceeding to synthesis." };
  }
};