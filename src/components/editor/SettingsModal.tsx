import { useState } from 'react';
import { Settings, Key, Check, AlertCircle } from 'lucide-react';
import { AISettings, LLM_PROVIDERS } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SettingsModalProps {
  settings: AISettings;
  onUpdateSettings: (updates: Partial<AISettings>) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

import { useState } from 'react';
import { Settings, Key, Check, AlertCircle, ShieldCheck, Cpu } from 'lucide-react';
import { AISettings, LLM_PROVIDERS } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface SettingsModalProps {
  settings: AISettings;
  onUpdateSettings: (updates: Partial<AISettings>) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsModal({
  settings,
  onUpdateSettings,
  trigger,
  open,
  onOpenChange,
}: SettingsModalProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const provider = LLM_PROVIDERS[settings.provider];
  const models = settings.provider === 'custom' 
    ? [] 
    : provider.models;

  const handleProviderChange = (newProvider: AISettings['provider']) => {
    const newProviderConfig = LLM_PROVIDERS[newProvider];
    onUpdateSettings({
      provider: newProvider,
      model: newProviderConfig.models[0] || '',
      baseUrl: newProvider === 'custom' ? '' : undefined,
    });
  };

  const testConnection = async () => {
    if (!settings.apiKey) {
      setTestError('Please enter an API key');
      setTestStatus('error');
      return;
    }

    setTestStatus('testing');
    setTestError(null);

    try {
      const baseUrl = settings.baseUrl || LLM_PROVIDERS[settings.provider].baseUrl;
      
      // Simple test request based on provider
      if (settings.provider === 'anthropic') {
        const response = await fetch(`${baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: settings.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
      } else if (settings.provider === 'google') {
        const response = await fetch(
          `${baseUrl}/models/${settings.model}:generateContent?key=${settings.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
      } else {
        // OpenAI-compatible
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
          },
          body: JSON.stringify({
            model: settings.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
      }

      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Connection failed');
      setTestStatus('error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-border shadow-2xl">
        <div className="bg-primary/5 p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">AI Configuration</DialogTitle>
                <DialogDescription className="text-sm">
                  Connect your favorite LLM provider.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 pt-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider</Label>
              <Select
                value={settings.provider}
                onValueChange={(v) => handleProviderChange(v as AISettings['provider'])}
              >
                <SelectTrigger className="rounded-xl bg-muted/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(LLM_PROVIDERS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model</Label>
              {settings.provider === 'custom' ? (
                <div className="relative">
                  <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="model"
                    value={settings.model}
                    onChange={(e) => onUpdateSettings({ model: e.target.value })}
                    placeholder="e.g. gpt-4"
                    className="pl-9 rounded-xl bg-muted/30 border-border/50"
                  />
                </div>
              ) : (
                <Select
                  value={settings.model}
                  onValueChange={(v) => onUpdateSettings({ model: v })}
                >
                  <SelectTrigger className="rounded-xl bg-muted/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Custom Base URL */}
          {settings.provider === 'custom' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="baseUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base URL</Label>
              <Input
                id="baseUrl"
                value={settings.baseUrl || ''}
                onChange={(e) => onUpdateSettings({ baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
                className="rounded-xl bg-muted/30 border-border/50"
              />
            </div>
          )}

          <Separator className="bg-border/50" />

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Key</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="apiKey"
                type="password"
                value={settings.apiKey}
                onChange={(e) => onUpdateSettings({ apiKey: e.target.value })}
                placeholder="Enter your API key"
                className="pl-9 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2 px-1">
              <ShieldCheck className="h-3 w-3 text-success" />
              <p className="text-[10px] text-muted-foreground">
                Your key is stored locally and never sent to our servers.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <Button
              onClick={testConnection}
              variant="outline"
              disabled={testStatus === 'testing'}
              className="rounded-xl gap-2 flex-1"
            >
              {testStatus === 'testing' ? (
                <>
                  <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            
            {testStatus === 'success' && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-success animate-in fade-in slide-in-from-right-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Connected
              </div>
            )}
            
            {testStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-destructive animate-in fade-in slide-in-from-right-2 max-w-[150px] truncate">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {testError || 'Failed'}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="bg-muted/30 p-4 border-t border-border/50">
          <Button onClick={() => onOpenChange?.(false)} className="rounded-xl px-8 shadow-sm">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

