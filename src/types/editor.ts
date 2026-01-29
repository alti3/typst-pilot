export interface TypstFile {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface FileStore {
  files: TypstFile[];
  activeFileId: string | null;
}

export interface AISettings {
  provider: 'openai' | 'anthropic' | 'google' | 'openrouter' | 'custom';
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface CompilationResult {
  success: boolean;
  pdf?: Uint8Array;
  error?: string;
  warnings?: string[];
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'openai',
  model: 'gpt-4o',
  apiKey: '',
};

export const LLM_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    baseUrl: 'https://api.anthropic.com/v1',
  },
  google: {
    name: 'Google',
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  openrouter: {
    name: 'OpenRouter',
    models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro-1.5'],
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  custom: {
    name: 'Custom',
    models: [],
    baseUrl: '',
  },
} as const;

export const DEFAULT_TYPST_CONTENT = `#set page(paper: "a4")
#set text(font: "New Computer Modern", size: 11pt)

= Welcome to Typst

This is a simple Typst document. Start editing to see the live preview!

== Features

- *Bold text* and _italic text_
- #link("https://typst.app")[Links]
- Math equations: $sum_(k=1)^n k = (n(n+1))/2$

== Code Example

\`\`\`rust
fn main() {
    println!("Hello, Typst!");
}
\`\`\`
`;
