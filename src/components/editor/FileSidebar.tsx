import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { FileTree as FileTreeView, useFileTree } from '@pierre/trees/react';
import type { ContextMenuItem, ContextMenuOpenContext } from '@pierre/trees';
import { Check, FilePlus, FolderOpen, FolderPlus, Pencil, Trash2, X } from 'lucide-react';
import { TypstDirectory, TypstFile } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FileSidebarProps {
  files: TypstFile[];
  directories: TypstDirectory[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string, directoryPath?: string) => void;
  onCreateDirectory: (name: string, parentPath?: string) => void;
  onDeleteFile: (id: string) => void;
  onDeleteDirectory: (path: string) => void;
  onRenameFile: (id: string, newPath: string) => void;
  onRenameDirectory: (oldPath: string, newPath: string) => void;
  onMovePath: (sourcePath: string, targetDirectoryPath: string | null) => void;
}

type DraftKind = 'file' | 'directory';
type DeleteTarget = { kind: 'directory' | 'file'; name: string; path: string } | null;
type TreeStyle = CSSProperties & Record<`--${string}`, string>;

const CONTEXT_MENU_WIDTH = 176;
const CONTEXT_MENU_HEIGHT = 190;

const treeStyle: TreeStyle = {
  height: '100%',
  '--trees-accent-override': 'hsl(var(--sidebar-primary))',
  '--trees-bg-override': 'hsl(var(--sidebar-background))',
  '--trees-bg-muted-override': 'hsl(var(--sidebar-accent))',
  '--trees-border-color-override': 'hsl(var(--sidebar-border))',
  '--trees-fg-muted-override': 'hsl(var(--muted-foreground))',
  '--trees-fg-override': 'hsl(var(--sidebar-foreground))',
  '--trees-focus-ring-color-override': 'hsl(var(--sidebar-ring))',
  '--trees-font-family-override': 'inherit',
  '--trees-search-bg-override': 'hsl(var(--background))',
  '--trees-search-fg-override': 'hsl(var(--foreground))',
  '--trees-selected-bg-override': 'hsl(var(--sidebar-accent))',
  '--trees-selected-fg-override': 'hsl(var(--sidebar-accent-foreground))',
  '--trees-selected-focused-border-color-override': 'hsl(var(--sidebar-ring))',
};

function directoryLabel(path: string): string {
  return path.replace(/\/$/, '').split('/').pop() || path;
}

function parentDirectory(path: string): string {
  const normalized = path.replace(/\/$/, '');
  const index = normalized.lastIndexOf('/');
  return index >= 0 ? `${normalized.slice(0, index + 1)}` : '';
}

function fileNameWithDefaultExtension(value: string): string {
  const name = value.trim();
  if (!name) return '';
  return name.includes('.') ? name : `${name}.typ`;
}

function getContextMenuPosition(context: ContextMenuOpenContext) {
  const left = Math.min(
    Math.max(8, context.anchorRect.left),
    window.innerWidth - CONTEXT_MENU_WIDTH - 8
  );
  const top = Math.min(
    Math.max(8, context.anchorRect.bottom + 4),
    window.innerHeight - CONTEXT_MENU_HEIGHT - 8
  );

  return { left, top };
}

interface ProjectTreeContextMenuProps {
  item: ContextMenuItem;
  context: ContextMenuOpenContext;
  onCreateDirectory: (parentPath: string) => void;
  onCreateFile: (parentPath: string) => void;
  onDelete: () => void;
  onRename: () => void;
}

function ProjectTreeContextMenu({
  item,
  context,
  onCreateDirectory,
  onCreateFile,
  onDelete,
  onRename,
}: ProjectTreeContextMenuProps) {
  const parentPath = item.kind === 'directory' ? item.path : parentDirectory(item.path);
  const position = getContextMenuPosition(context);

  const runAction = (action: () => void) => {
    context.close({ restoreFocus: false });
    action();
  };

  return createPortal(
    <div
      data-file-tree-context-menu-root="true"
      className="fixed z-50 min-w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
      style={position}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start gap-2 px-2"
        onClick={() => runAction(onRename)}
      >
        <Pencil className="size-3.5" />
        Rename
      </Button>
      {item.kind === 'directory' && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start gap-2 px-2"
            onClick={() => runAction(() => onCreateFile(item.path))}
          >
            <FilePlus className="size-3.5" />
            New file
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start gap-2 px-2"
            onClick={() => runAction(() => onCreateDirectory(item.path))}
          >
            <FolderPlus className="size-3.5" />
            New folder
          </Button>
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start gap-2 px-2 text-destructive hover:text-destructive"
        onClick={() => runAction(onDelete)}
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>
      {item.kind === 'file' && (
        <div className="px-2 pb-1 pt-1 text-[11px] text-muted-foreground">
          In {parentPath || 'project root'}
        </div>
      )}
    </div>,
    document.body
  );
}

export function FileSidebar({
  files,
  directories,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCreateDirectory,
  onDeleteFile,
  onDeleteDirectory,
  onRenameFile,
  onRenameDirectory,
  onMovePath,
}: FileSidebarProps) {
  const activeFile = files.find((file) => file.id === activeFileId) || null;
  const filePaths = useMemo(() => files.map((file) => file.path), [files]);
  const directoryPaths = useMemo(() => directories.map((directory) => directory.path), [directories]);
  const paths = useMemo(
    () => [...directoryPaths, ...filePaths].sort(),
    [directoryPaths, filePaths]
  );
  const filesRef = useRef(files);
  const onSelectFileRef = useRef(onSelectFile);
  const onRenameFileRef = useRef(onRenameFile);
  const onRenameDirectoryRef = useRef(onRenameDirectory);
  const onMovePathRef = useRef(onMovePath);

  useEffect(() => {
    filesRef.current = files;
    onSelectFileRef.current = onSelectFile;
    onRenameFileRef.current = onRenameFile;
    onRenameDirectoryRef.current = onRenameDirectory;
    onMovePathRef.current = onMovePath;
  }, [files, onMovePath, onRenameDirectory, onRenameFile, onSelectFile]);

  const { model } = useFileTree({
    composition: {
      contextMenu: {
        buttonVisibility: 'always',
        enabled: true,
        triggerMode: 'both',
      },
    },
    dragAndDrop: {
      onDropComplete: (event) => {
        const targetPath = event.target.kind === 'directory' ? event.target.directoryPath : null;
        event.draggedPaths.forEach((path) => onMovePathRef.current(path, targetPath));
      },
    },
    flattenEmptyDirectories: true,
    initialExpansion: 'open',
    initialSelectedPaths: activeFile ? [activeFile.path] : [],
    paths,
    renaming: {
      onRename: (event) => {
        if (event.isFolder) {
          onRenameDirectoryRef.current(event.sourcePath, event.destinationPath);
          return;
        }

        const file = filesRef.current.find((item) => item.path === event.sourcePath);
        if (file) onRenameFileRef.current(file.id, event.destinationPath);
      },
    },
    search: true,
    onSelectionChange: (selectedPaths) => {
      const selectedPath = selectedPaths[selectedPaths.length - 1];
      const file = filesRef.current.find((item) => item.path === selectedPath);
      if (file) onSelectFileRef.current(file.id);
    },
  });

  const [draft, setDraft] = useState<{ kind: DraftKind; parentPath: string } | null>(null);
  const [draftName, setDraftName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  useEffect(() => {
    model.resetPaths(paths, { initialExpandedPaths: directoryPaths });
  }, [directoryPaths, model, paths]);

  useEffect(() => {
    if (!activeFile) return;
    model.focusPath(activeFile.path);
    model.getItem(activeFile.path)?.select();
  }, [activeFile, model]);

  const startDraft = (kind: DraftKind, parentPath = '') => {
    setDraft({ kind, parentPath });
    setDraftName('');
  };

  const submitDraft = () => {
    if (!draft || !draftName.trim()) return;

    if (draft.kind === 'file') {
      onCreateFile(fileNameWithDefaultExtension(draftName), draft.parentPath);
    } else {
      onCreateDirectory(draftName.trim(), draft.parentPath);
    }

    setDraft(null);
    setDraftName('');
  };

  const renderContextMenu = (item: ContextMenuItem, context: ContextMenuOpenContext) => {
    const file = files.find((entry) => entry.path === item.path);

    return (
      <ProjectTreeContextMenu
        item={item}
        context={context}
        onCreateDirectory={(parentPath) => startDraft('directory', parentPath)}
        onCreateFile={(parentPath) => startDraft('file', parentPath)}
        onDelete={() => setDeleteTarget({ kind: item.kind, name: file?.name || directoryLabel(item.path), path: item.path })}
        onRename={() => model.startRenaming(item.path)}
      />
    );
  };

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar/50">
      <div className="flex items-center justify-between border-b border-sidebar-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-4 text-sidebar-foreground/70" />
          <span className="text-[11px] font-bold uppercase text-sidebar-foreground/70">
            Explorer
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => startDraft('file')}
            aria-label="Create file"
          >
            <FilePlus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => startDraft('directory')}
            aria-label="Create folder"
          >
            <FolderPlus className="size-4" />
          </Button>
        </div>
      </div>

      {draft && (
        <div className="border-b border-sidebar-border/50 p-2">
          <div className="flex items-center gap-1 rounded-md bg-sidebar-accent/50 p-1.5">
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={draft.kind === 'file' ? 'filename.typ' : 'folder name'}
              className="h-7 flex-1 border-none bg-transparent p-1 text-xs focus-visible:ring-0"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitDraft();
                if (event.key === 'Escape') setDraft(null);
              }}
            />
            <Button variant="ghost" size="icon" className="size-7" onClick={submitDraft} aria-label="Confirm create">
              <Check className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setDraft(null)} aria-label="Cancel create">
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1">
        {paths.length > 0 ? (
          <FileTreeView
            model={model}
            renderContextMenu={renderContextMenu}
            className="block h-full"
            style={treeStyle}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <FolderOpen className="mb-2 size-8" />
            <p className="text-sm">No project files</p>
            <Button variant="link" className="mt-1 h-auto p-0" onClick={() => startDraft('file')}>
              Create a file
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.kind}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {deleteTarget?.name} will be permanently deleted
              {deleteTarget?.kind === 'directory' ? ', including files inside it.' : '.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.kind === 'directory') {
                  onDeleteDirectory(deleteTarget.path);
                } else {
                  const file = files.find((entry) => entry.path === deleteTarget.path);
                  if (file) onDeleteFile(file.id);
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
