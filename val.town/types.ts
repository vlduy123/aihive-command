export interface Integration {
  id: string;
  name: string; // 'ahrefs'|'ga4'|'gsc'|'linkedin'|'outlook'|'wordpress'|'youtube'|'producthunt'
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  extra_config?: string; // JSON string
  connected_at?: string;
  updated_at?: string;
}

export interface LLMConfig {
  id: string;
  provider: 'anthropic' | 'openai' | 'custom';
  api_key: string;
  endpoint?: string;
  model: string;
  updated_at?: string;
}

export interface Agent {
  id: string;
  name: string;
  workspace: 'marketing' | 'sales';
  description: string;
  system_prompt: string;
  tools: string; // JSON array string
  model?: string;
  enabled: number; // 0 or 1
  created_at: string;
  updated_at: string;
  created_by: 'user' | 'ai';
}

export interface Conversation {
  id: string;
  agent_id?: string;
  workspace: string;
  messages: string; // JSON array string
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  agent_id?: string;
  workspace: string;
  title: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  input?: string;
  output?: string;
  created_at: string;
  completed_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}
