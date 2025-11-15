// Agent type definitions
export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: AgentSuggestion[];
}

export interface AgentSuggestion {
  type: 'add_block' | 'update_param' | 'fix_error' | 'optimize' | 'explain';
  title: string;
  description: string;
  action?: () => void;
  data?: any;
}

export interface AgentContext {
  currentTransaction: any;
  errors: string[];
  warnings: string[];
  blocks: any[];
}

