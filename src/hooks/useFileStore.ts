import { useState, useCallback, useEffect } from 'react';
import { TypstDirectory, TypstFile, FileStore, DEFAULT_TYPST_CONTENT } from '@/types/editor';

const STORAGE_KEY = 'typst-editor-files';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function cleanPath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')
    .trim();
}

function normalizeFilePath(path: string): string {
  const cleaned = cleanPath(path).replace(/\/+$/, '');
  return cleaned || 'untitled.typ';
}

function normalizeDirectoryPath(path: string): string {
  const cleaned = cleanPath(path).replace(/\/+$/, '');
  return cleaned ? `${cleaned}/` : '';
}

function basename(path: string): string {
  return normalizeFilePath(path).split('/').pop() || path;
}

function joinPath(directoryPath: string, name: string): string {
  const directory = normalizeDirectoryPath(directoryPath);
  return normalizeFilePath(`${directory}${name}`);
}

function ensureUniqueFilePath(path: string, files: TypstFile[]): string {
  const normalized = normalizeFilePath(path);
  const used = new Set(files.map((file) => file.path));
  if (!used.has(normalized)) return normalized;

  const slashIndex = normalized.lastIndexOf('/');
  const directory = slashIndex >= 0 ? `${normalized.slice(0, slashIndex + 1)}` : '';
  const filename = slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
  const dotIndex = filename.lastIndexOf('.');
  const stem = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  const extension = dotIndex > 0 ? filename.slice(dotIndex) : '';

  let index = 2;
  let candidate = `${directory}${stem}-${index}${extension}`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${directory}${stem}-${index}${extension}`;
  }

  return candidate;
}

function ensureUniqueDirectoryPath(path: string, directories: TypstDirectory[]): string {
  const normalized = normalizeDirectoryPath(path);
  const used = new Set(directories.map((directory) => directory.path));
  if (!normalized || !used.has(normalized)) return normalized;

  const withoutSlash = normalized.slice(0, -1);
  const slashIndex = withoutSlash.lastIndexOf('/');
  const parent = slashIndex >= 0 ? `${withoutSlash.slice(0, slashIndex + 1)}` : '';
  const dirname = slashIndex >= 0 ? withoutSlash.slice(slashIndex + 1) : withoutSlash;

  let index = 2;
  let candidate = `${parent}${dirname}-${index}/`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${parent}${dirname}-${index}/`;
  }

  return candidate;
}

function parentDirectories(path: string): TypstDirectory[] {
  const segments = normalizeFilePath(path).split('/').slice(0, -1);
  return segments.map((_, index) => ({
    id: generateId(),
    path: `${segments.slice(0, index + 1).join('/')}/`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
}

function normalizeStore(store: Partial<FileStore>): FileStore {
  const files = (store.files || []).map((file) => {
    const path = normalizeFilePath(file.path || file.name);
    return {
      ...file,
      name: basename(path),
      path,
    };
  });

  const directoriesByPath = new Map<string, TypstDirectory>();
  for (const directory of store.directories || []) {
    const path = normalizeDirectoryPath(directory.path);
    if (path) directoriesByPath.set(path, { ...directory, path });
  }
  for (const file of files) {
    for (const directory of parentDirectories(file.path)) {
      if (!directoriesByPath.has(directory.path)) directoriesByPath.set(directory.path, directory);
    }
  }

  return {
    files,
    directories: [...directoriesByPath.values()],
    activeFileId: files.some((file) => file.id === store.activeFileId) ? store.activeFileId || null : files[0]?.id || null,
  };
}

function loadFromStorage(): FileStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return normalizeStore(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Failed to load files from storage:', e);
  }
  
  // Create default file
  const defaultFile: TypstFile = {
    id: generateId(),
    name: 'main.typ',
    path: 'main.typ',
    content: DEFAULT_TYPST_CONTENT,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  return {
    files: [defaultFile],
    directories: [],
    activeFileId: defaultFile.id,
  };
}

function serializeStoreForStorage(store: FileStore): FileStore {
  return {
    ...store,
    files: store.files.map(({ pendingSuggestion, ...file }) => ({
      ...file,
      content: pendingSuggestion ? pendingSuggestion.originalContent : file.content,
    })),
  };
}

function saveToStorage(store: FileStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeStoreForStorage(store)));
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
  const directories = store.directories;
  const activeFileId = store.activeFileId;
  const activeFile = files.find(f => f.id === activeFileId) || null;

  const createFile = useCallback((name: string = 'untitled.typ', directoryPath = '') => {
    const path = ensureUniqueFilePath(joinPath(directoryPath, name), files);
    const newFile: TypstFile = {
      id: generateId(),
      name: basename(path),
      path,
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setStore(prev => ({
      ...prev,
      files: [...prev.files, newFile],
      activeFileId: newFile.id,
    }));
    
    return newFile;
  }, [files]);

  const createDirectory = useCallback((name: string = 'folder', parentPath = '') => {
    const path = ensureUniqueDirectoryPath(`${normalizeDirectoryPath(parentPath)}${name}`, directories);
    if (!path) return null;

    const newDirectory: TypstDirectory = {
      id: generateId(),
      path,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setStore(prev => ({
      ...prev,
      directories: [...prev.directories, newDirectory],
    }));

    return newDirectory;
  }, [directories]);

  const deleteFile = useCallback((id: string) => {
    setStore(prev => {
      const newFiles = prev.files.filter(f => f.id !== id);
      let newActiveId = prev.activeFileId;
      
      if (prev.activeFileId === id) {
        newActiveId = newFiles.length > 0 ? newFiles[0].id : null;
      }
      
      return {
        ...prev,
        files: newFiles,
        activeFileId: newActiveId,
      };
    });
  }, []);

  const deleteDirectory = useCallback((path: string) => {
    const directoryPath = normalizeDirectoryPath(path);
    setStore(prev => {
      const newFiles = prev.files.filter(file => !file.path.startsWith(directoryPath));
      const newDirectories = prev.directories.filter(directory => directory.path !== directoryPath && !directory.path.startsWith(directoryPath));
      const newActiveId = newFiles.some(file => file.id === prev.activeFileId) ? prev.activeFileId : newFiles[0]?.id || null;

      return {
        files: newFiles,
        directories: newDirectories,
        activeFileId: newActiveId,
      };
    });
  }, []);

  const renameFile = useCallback((id: string, newPath: string) => {
    setStore(prev => {
      const currentFile = prev.files.find(file => file.id === id);
      if (!currentFile) return prev;

      const parentPath = currentFile.path.includes('/') ? currentFile.path.slice(0, currentFile.path.lastIndexOf('/') + 1) : '';
      const requestedPath = newPath.includes('/') ? newPath : `${parentPath}${newPath}`;
      const path = ensureUniqueFilePath(requestedPath, prev.files.filter(file => file.id !== id));

      return {
        ...prev,
        files: prev.files.map(f => 
          f.id === id ? { ...f, name: basename(path), path, updatedAt: Date.now() } : f
        ),
      };
    });
  }, []);

  const renameDirectory = useCallback((oldPath: string, newPath: string) => {
    setStore(prev => {
      const sourcePath = normalizeDirectoryPath(oldPath);
      const parentPath = sourcePath.slice(0, -1).includes('/') ? sourcePath.slice(0, sourcePath.slice(0, -1).lastIndexOf('/') + 1) : '';
      const requestedPath = newPath.includes('/') ? newPath : `${parentPath}${newPath}`;
      const destinationPath = ensureUniqueDirectoryPath(requestedPath, prev.directories.filter(directory => directory.path !== sourcePath));
      if (!sourcePath || !destinationPath || sourcePath === destinationPath) return prev;

      return {
        ...prev,
        directories: prev.directories.map(directory =>
          directory.path === sourcePath || directory.path.startsWith(sourcePath)
            ? { ...directory, path: `${destinationPath}${directory.path.slice(sourcePath.length)}`, updatedAt: Date.now() }
            : directory
        ),
        files: prev.files.map(file =>
          file.path.startsWith(sourcePath)
            ? { ...file, path: `${destinationPath}${file.path.slice(sourcePath.length)}`, updatedAt: Date.now() }
            : file
        ).map(file => ({ ...file, name: basename(file.path) })),
      };
    });
  }, []);

  const movePath = useCallback((sourcePath: string, targetDirectoryPath: string | null) => {
    const targetDirectory = normalizeDirectoryPath(targetDirectoryPath || '');

    setStore(prev => {
      const file = prev.files.find(item => item.path === normalizeFilePath(sourcePath));
      if (file) {
        const path = ensureUniqueFilePath(`${targetDirectory}${file.name}`, prev.files.filter(item => item.id !== file.id));
        return {
          ...prev,
          files: prev.files.map(item => item.id === file.id ? { ...item, path, updatedAt: Date.now() } : item),
        };
      }

      const directoryPath = normalizeDirectoryPath(sourcePath);
      const directory = prev.directories.find(item => item.path === directoryPath);
      if (!directory || directory.path === targetDirectory || targetDirectory.startsWith(directory.path)) return prev;

      const directoryName = directory.path.slice(0, -1).split('/').pop() || 'folder';
      const destinationPath = ensureUniqueDirectoryPath(`${targetDirectory}${directoryName}`, prev.directories.filter(item => item.path !== directory.path));

      return {
        ...prev,
        directories: prev.directories.map(item =>
          item.path === directory.path || item.path.startsWith(directory.path)
            ? { ...item, path: `${destinationPath}${item.path.slice(directory.path.length)}`, updatedAt: Date.now() }
            : item
        ),
        files: prev.files.map(item =>
          item.path.startsWith(directory.path)
            ? { ...item, path: `${destinationPath}${item.path.slice(directory.path.length)}`, updatedAt: Date.now() }
            : item
        ).map(item => ({ ...item, name: basename(item.path) })),
      };
    });
  }, []);

  const updateFileContent = useCallback((id: string, content: string) => {
    setStore(prev => ({
      ...prev,
      files: prev.files.map(f => 
        f.id === id ? { ...f, content, updatedAt: Date.now() } : f
      ),
    }));
  }, []);

  const beginSuggestedEdit = useCallback((id: string, content: string) => {
    setStore(prev => ({
      ...prev,
      files: prev.files.map(f => {
        if (f.id !== id) return f;

        return {
          ...f,
          content,
          pendingSuggestion: {
            originalContent: f.pendingSuggestion?.originalContent ?? f.content,
            suggestedAt: Date.now(),
          },
          updatedAt: Date.now(),
        };
      }),
    }));
  }, []);

  const keepSuggestedEdit = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      files: prev.files.map(({ pendingSuggestion, ...file }) => 
        file.id === id ? { ...file, updatedAt: Date.now() } : { ...file, pendingSuggestion }
      ),
    }));
  }, []);

  const rejectSuggestedEdit = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      files: prev.files.map(f => {
        if (f.id !== id || !f.pendingSuggestion) return f;

        const { pendingSuggestion, ...file } = f;
        return {
          ...file,
          content: pendingSuggestion.originalContent,
          updatedAt: Date.now(),
        };
      }),
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
    directories,
    activeFile,
    activeFileId,
    createFile,
    createDirectory,
    deleteFile,
    deleteDirectory,
    renameFile,
    renameDirectory,
    movePath,
    updateFileContent,
    beginSuggestedEdit,
    keepSuggestedEdit,
    rejectSuggestedEdit,
    setActiveFile,
  };
}
