import { useState, useCallback } from 'react';
import { ChatMessage, AISettings, LLM_PROVIDERS } from '@/types/editor';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

interface UseAIChatOptions {
  settings: AISettings;
  currentContent: string;
  onApplyEdit?: (newContent: string) => void;
}

export function useAIChat({ settings, currentContent, onApplyEdit }: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!settings.apiKey) {
      setError('Please configure your API key in settings');
      return;
    }

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const provider = LLM_PROVIDERS[settings.provider];
      const baseUrl = settings.baseUrl || provider.baseUrl;

      const systemPrompt = `You are a helpful AI assistant for a Typst document editor. You can help users with:
1. Typst syntax and formatting questions
2. Generating content (text, tables, equations, code blocks)
3. Editing and improving their document

Current document content:
\`\`\`typst
${currentContent}
\`\`\`

When providing Typst code, wrap it in \`\`\`typst code blocks.
If the user asks you to edit or modify the document, provide the complete updated content wrapped in \`\`\`typst blocks.`;

      let response: Response;
      let assistantContent = '';

      if (settings.provider === 'anthropic') {
        // Anthropic API format
        response = await fetch(`${baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: settings.model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
              ...messages.map(m => ({
                role: m.role,
                content: m.content,
              })),
              { role: 'user', content: userMessage },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        assistantContent = data.content[0].text;
      } else if (settings.provider === 'google') {
        // Google Gemini API format
        response = await fetch(
          `${baseUrl}/models/${settings.model}:generateContent?key=${settings.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: systemPrompt + '\n\n' + userMessage }],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        assistantContent = data.candidates[0].content.parts[0].text;
      } else {
        // OpenAI-compatible API format (OpenAI, OpenRouter, Custom)
        response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map(m => ({
                role: m.role,
                content: m.content,
              })),
              { role: 'user', content: userMessage },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        assistantContent = data.choices[0].message.content;
      }

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Check if there's Typst code to apply
      const typstMatch = assistantContent.match(/```typst\n([\s\S]*?)```/);
      if (typstMatch && onApplyEdit) {
        // Don't auto-apply, let user decide
      }
    } catch (err) {
      console.error('AI Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  }, [settings, currentContent, messages, onApplyEdit]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
