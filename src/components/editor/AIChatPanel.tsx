import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { ChatMessage } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AIChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onClearMessages: () => void;
  onApplyCode?: (code: string) => void;
  isConfigured: boolean;
  onOpenSettings: () => void;
}

export function AIChatPanel({
  messages,
  isLoading,
  error,
  onSendMessage,
  onClearMessages,
  onApplyCode,
  isConfigured,
  onOpenSettings,
}: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const extractTypstCode = (content: string): string | null => {
    const match = content.match(/```typst\n([\s\S]*?)```/);
    return match ? match[1] : null;
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isConfigured) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-panel border-t border-panel-border">
        <Sparkles className="h-8 w-8 text-primary mb-3" />
        <p className="text-sm text-muted-foreground text-center mb-3">
          Configure your AI provider to start chatting
        </p>
        <Button onClick={onOpenSettings} size="sm">
          Open Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-panel border-t border-panel-border">
      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center space-y-2">
              <Sparkles className="h-6 w-6 mx-auto text-primary/50" />
              <p>Ask me about Typst syntax or request content</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const typstCode = msg.role === 'assistant' ? extractTypstCode(msg.content) : null;
              
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'rounded-lg p-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-chat-user ml-8'
                      : 'bg-chat-assistant mr-4'
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  
                  {typstCode && onApplyCode && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onApplyCode(typstCode)}
                        className="text-xs"
                      >
                        Apply to Editor
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(typstCode, msg.id)}
                        className="text-xs"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error display */}
      {error && (
        <div className="px-3 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-panel-border">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Typst syntax or request content..."
            className="min-h-[60px] max-h-[120px] resize-none text-sm"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-1">
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-8 w-8"
            >
              <Send className="h-4 w-4" />
            </Button>
            {messages.length > 0 && (
              <Button
                onClick={onClearMessages}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
