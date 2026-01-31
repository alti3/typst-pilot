import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader2, Sparkles, Copy, Check, Bot, User, Wand2 } from 'lucide-react';
import { ChatMessage } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
} from '@/components/ai-elements/prompt-input';

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

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSubmit = (text: string) => {
    if (text.trim() && !isLoading) {
      onSendMessage(text.trim());
      setInput('');
    }
  };

  const extractTypstCode = (content: string): string | null => {
    const match = content.match(/```(?:typst)?\n([\s\S]*?)```/);
    return match ? match[1] : null;
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isConfigured) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-muted/30 border-t border-border">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">Setup AI Assistant</h3>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-[280px]">
          Configure your API keys to unlock AI-powered Typst generation and assistance.
        </p>
        <Button onClick={onOpenSettings} className="gap-2 shadow-sm px-6 rounded-xl">
          Open Settings
          <Wand2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/50 border-t border-border">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI Assistant</span>
        </div>
        {messages.length > 0 && (
          <Button
            onClick={onClearMessages}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-primary/40" />
              </div>
              <h4 className="font-medium text-sm mb-1">How can I help you?</h4>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                I can help you write formulas, tables, or entire documents.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const typstCode = msg.role === 'assistant' ? extractTypstCode(msg.content) : null;
              
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <Avatar className={cn(
                    "h-8 w-8 shrink-0",
                    msg.role === 'user' ? "bg-primary" : "bg-muted"
                  )}>
                    <AvatarFallback className="text-[10px]">
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted text-foreground rounded-tl-none"
                    )}>
                      <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
                      
                      {typstCode && onApplyCode && (
                        <div className="mt-3 flex items-center gap-1.5 pt-3 border-t border-border/20">
                          <Button
                            size="sm"
                            variant={msg.role === 'user' ? "secondary" : "default"}
                            onClick={() => onApplyCode(typstCode)}
                            className="h-7 text-[11px] font-medium px-3 rounded-lg"
                          >
                            <Wand2 className="h-3 w-3 mr-1.5" />
                            Apply Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(typstCode, msg.id)}
                            className="h-7 w-7 p-0 rounded-lg hover:bg-background/20"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {isLoading && (
            <div className="flex gap-3 animate-pulse">
              <Avatar className="h-8 w-8 shrink-0 bg-muted">
                <AvatarFallback>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-tl-none max-w-[80%] flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 p-2 rounded-lg bg-destructive/10 text-destructive text-[11px] font-medium flex items-center gap-2">
          <Trash2 className="h-3 w-3" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 pt-2">
        <PromptInput
          onSubmit={({ text }) => handleSubmit(text)}
          className="bg-muted/50 rounded-2xl border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
        >
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI to help with your Typst doc..."
              className="min-h-[50px] max-h-[150px] resize-none border-none focus-visible:ring-0 bg-transparent py-3 text-sm placeholder:text-muted-foreground/50"
              disabled={isLoading}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputSubmit
              status={isLoading ? "submitted" : undefined}
              disabled={!input.trim() || isLoading}
            />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-[10px] text-center text-muted-foreground/50">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

