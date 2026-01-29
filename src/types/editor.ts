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
    models: [
      'gpt-5.2',
      'gpt-5.2-pro',
      'gpt-5.1',
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-nano',
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'gpt-4o',
      'gpt-4o-mini',
      'o3',
      'o3-mini',
      'o4-mini',
    ],
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-5-20251101'],
    baseUrl: 'https://api.anthropic.com/v1',
  },
  google: {
    name: 'Google',
    models: [
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  openrouter: {
    name: 'OpenRouter',
    models: [
      'openrouter/auto',
      'openai/gpt-5.2',
      'openai/gpt-5.2-pro',
      'openai/gpt-5.1',
      'openai/gpt-5',
      'openai/gpt-5-mini',
      'openai/gpt-5-nano',
      'openai/gpt-4.1',
      'openai/gpt-4.1-mini',
      'openai/gpt-4.1-nano',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/o3',
      'openai/o3-mini',
      'openai/o4-mini',
      'anthropic/claude-opus-4.5',
      'anthropic/claude-sonnet-4.5',
      'anthropic/claude-haiku-4.5',
      'google/gemini-3-pro-preview',
      'google/gemini-3-flash-preview',
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash',
      'google/gemini-2.5-flash-lite',
    ],
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
