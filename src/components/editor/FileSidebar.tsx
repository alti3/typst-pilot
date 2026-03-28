import { useState } from 'react';
import { File, FilePlus, Trash2, Edit2, Check, X, FolderOpen } from 'lucide-react';
import { TypstFile } from '@/types/editor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
}

export function FileSidebar({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}: FileSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newFileName.trim()) {
      const name = newFileName.endsWith('.typ') ? newFileName : `${newFileName}.typ`;
      onCreateFile(name);
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      const name = editName.endsWith('.typ') ? editName : `${editName}.typ`;
      onRenameFile(id, name);
      setEditingId(null);
      setEditName('');
    }
  };

  const startEditing = (file: TypstFile) => {
    setEditingId(file.id);
    setEditName(file.name.replace('.typ', ''));
  };

  return (
    <div className="h-full flex flex-col bg-sidebar/50 border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-sidebar-foreground/70" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-sidebar-foreground/70">
            Explorer
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-all rounded-md"
          onClick={() => setIsCreating(true)}
        >
          <FilePlus className="h-4 w-4" />
        </Button>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* New file input */}
          {isCreating && (
            <div className="flex items-center gap-1 p-2 bg-sidebar-accent/50 rounded-md mb-1 animate-in slide-in-from-top-1 duration-200">
              <File className="h-4 w-4 text-primary shrink-0" />
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename"
                className="h-7 text-xs bg-transparent border-none focus-visible:ring-0 p-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
              />
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-primary/10 hover:text-primary"
                  onClick={handleCreate}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setIsCreating(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* File items */}
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                'group flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 relative overflow-hidden',
                activeFileId === file.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
              onClick={() => editingId !== file.id && onSelectFile(file.id)}
            >
              {activeFileId === file.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />
              )}
              
              <File className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                activeFileId === file.id ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60"
              )} />
              
              {editingId === file.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-6 text-xs bg-transparent border-none focus-visible:ring-0 p-0 flex-1"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(file.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(file.id);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-background/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(file);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(file.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {files.length === 0 && !isCreating && (
            <div className="flex flex-col items-center justify-center p-8 text-center opacity-40">
              <File className="h-8 w-8 mb-2" />
              <p className="text-xs">No files yet</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file <span className="font-semibold text-foreground">"{files.find(f => f.id === deleteConfirmId)?.name}"</span> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={() => {
                if (deleteConfirmId) {
                  onDeleteFile(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Delete File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
