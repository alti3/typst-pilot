import { useState, useCallback, useEffect } from 'react';
import { AISettings, DEFAULT_AI_SETTINGS } from '@/types/editor';

const STORAGE_KEY = 'typst-editor-ai-settings';

function loadFromStorage(): AISettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load AI settings from storage:', e);
  }
  return DEFAULT_AI_SETTINGS;
}

function saveToStorage(settings: AISettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save AI settings to storage:', e);
  }
}

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(loadFromStorage);

  useEffect(() => {
    saveToStorage(settings);
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const isConfigured = settings.apiKey.length > 0;

  return {
    settings,
    updateSettings,
    isConfigured,
  };
}
