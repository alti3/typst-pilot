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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Settings
          </DialogTitle>
          <DialogDescription>
            Configure your LLM provider and API key for AI-powered editing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={settings.provider}
              onValueChange={(v) => handleProviderChange(v as AISettings['provider'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="model">Model</Label>
            {settings.provider === 'custom' ? (
              <Input
                id="model"
                value={settings.model}
                onChange={(e) => onUpdateSettings({ model: e.target.value })}
                placeholder="Enter model name"
              />
            ) : (
              <Select
                value={settings.model}
                onValueChange={(v) => onUpdateSettings({ model: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Custom Base URL */}
          {settings.provider === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                value={settings.baseUrl || ''}
                onChange={(e) => onUpdateSettings({ baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
              />
            </div>
          )}

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="apiKey"
                type="password"
                value={settings.apiKey}
                onChange={(e) => onUpdateSettings({ apiKey: e.target.value })}
                placeholder="Enter your API key"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-2">
            <Button
              onClick={testConnection}
              variant="outline"
              disabled={testStatus === 'testing'}
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </Button>
            {testStatus === 'success' && (
              <span className="flex items-center gap-1 text-sm text-success">
                <Check className="h-4 w-4" />
                Connected
              </span>
            )}
            {testStatus === 'error' && (
              <span className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {testError}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
