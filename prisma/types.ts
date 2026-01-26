
export type ModelOption = 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'custom' | string;
export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';
export type ApiProvider = 'google' | 'openai' | 'deepseek' | 'anthropic' | 'xai' | 'mistral' | 'custom';

export type CustomModel = {
  id: string;
  name: string; // The Actual Model ID (e.g., 'gpt-4o')
  displayName?: string; // Friendly name for UI (e.g., 'My GPT-4')
  provider: ApiProvider;
  apiKey?: string;
  baseUrl?: string;
};

export type ExpertConfig = {
  id: string;
  role: string;
  description: string;
  temperature: number;
  prompt: string;
};

export type ExpertResult = ExpertConfig & {
  status: 'pending' | 'thinking' | 'completed' | 'error';
  content?: string;
  thoughts?: string; 
  thoughtProcess?: string; 
  startTime?: number;
  endTime?: number;
  round?: number; // Track which iteration this expert belongs to
};

export type AnalysisResult = {
  thought_process: string;
  experts: Omit<ExpertConfig, 'id'>[];
};

export type ReviewResult = {
  satisfied: boolean;
  critique: string;
  next_round_strategy?: string;
  refined_experts?: Omit<ExpertConfig, 'id'>[];
};

export type AppState = 'idle' | 'analyzing' | 'experts_working' | 'reviewing' | 'synthesizing' | 'completed';

export type AppConfig = {
  planningLevel: ThinkingLevel;
  expertLevel: ThinkingLevel;
  synthesisLevel: ThinkingLevel;
  customApiKey?: string;
  customBaseUrl?: string;
  enableCustomApi?: boolean;
  enableRecursiveLoop?: boolean;
  apiProvider?: ApiProvider;
  customModels?: CustomModel[];
};

export type MessageAttachment = {
  id: string;
  type: 'image' | 'pdf' | 'video' | 'audio' | 'document';
  name?: string;
  mimeType: string;
  data: string; // Base64 string
  url?: string; // For display
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: MessageAttachment[];
  // DeepThink Artifacts (only for model messages)
  analysis?: AnalysisResult | null;
  experts?: ExpertResult[];
  synthesisThoughts?: string;
  isThinking?: boolean;
  totalDuration?: number; // Total time in ms
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  model: ModelOption;
};
