import { useState } from 'react';
import { File, FilePlus, Trash2, Edit2, Check, X } from 'lucide-react';
import { TypstFile } from '@/types/editor';
import { cn } from '@/lib/utils';
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
    <div className="h-full flex flex-col bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground">
          Files
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-sidebar-foreground hover:text-sidebar-accent-foreground"
          onClick={() => setIsCreating(true)}
        >
          <FilePlus className="h-4 w-4" />
        </Button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* New file input */}
        {isCreating && (
          <div className="flex items-center gap-1 p-1">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename"
              className="h-7 text-xs bg-sidebar-accent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleCreate}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setIsCreating(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* File items */}
        {files.map((file) => (
          <div
            key={file.id}
            className={cn(
              'group flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors',
              activeFileId === file.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
            onClick={() => editingId !== file.id && onSelectFile(file.id)}
          >
            <File className="h-4 w-4 shrink-0 text-primary" />
            
            {editingId === file.id ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-6 text-xs bg-sidebar-accent flex-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(file.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(file.id);
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm truncate flex-1">{file.name}</span>
                <div className="hidden group-hover:flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
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
                    className="h-5 w-5 text-destructive hover:text-destructive"
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
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  onDeleteFile(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
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
