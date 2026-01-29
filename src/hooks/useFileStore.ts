import { useState, useCallback, useEffect } from 'react';
import { TypstFile, FileStore, DEFAULT_TYPST_CONTENT } from '@/types/editor';

const STORAGE_KEY = 'typst-editor-files';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function loadFromStorage(): FileStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load files from storage:', e);
  }
  
  // Create default file
  const defaultFile: TypstFile = {
    id: generateId(),
    name: 'main.typ',
    content: DEFAULT_TYPST_CONTENT,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  return {
    files: [defaultFile],
    activeFileId: defaultFile.id,
  };
}

function saveToStorage(store: FileStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save files to storage:', e);
  }
}

export function useFileStore() {
  const [store, setStore] = useState<FileStore>(loadFromStorage);

  // Save to storage whenever store changes
  useEffect(() => {
    saveToStorage(store);
  }, [store]);

  const files = store.files;
  const activeFileId = store.activeFileId;
  const activeFile = files.find(f => f.id === activeFileId) || null;

  const createFile = useCallback((name: string = 'untitled.typ') => {
    const newFile: TypstFile = {
      id: generateId(),
      name,
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setStore(prev => ({
      files: [...prev.files, newFile],
      activeFileId: newFile.id,
    }));
    
    return newFile;
  }, []);

  const deleteFile = useCallback((id: string) => {
    setStore(prev => {
      const newFiles = prev.files.filter(f => f.id !== id);
      let newActiveId = prev.activeFileId;
      
      if (prev.activeFileId === id) {
        newActiveId = newFiles.length > 0 ? newFiles[0].id : null;
      }
      
      return {
        files: newFiles,
        activeFileId: newActiveId,
      };
    });
  }, []);

  const renameFile = useCallback((id: string, newName: string) => {
    setStore(prev => ({
      ...prev,
      files: prev.files.map(f => 
        f.id === id ? { ...f, name: newName, updatedAt: Date.now() } : f
      ),
    }));
  }, []);

  const updateFileContent = useCallback((id: string, content: string) => {
    setStore(prev => ({
      ...prev,
      files: prev.files.map(f => 
        f.id === id ? { ...f, content, updatedAt: Date.now() } : f
      ),
    }));
  }, []);

  const setActiveFile = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      activeFileId: id,
    }));
  }, []);

  return {
    files,
    activeFile,
    activeFileId,
    createFile,
    deleteFile,
    renameFile,
    updateFileContent,
    setActiveFile,
  };
}
