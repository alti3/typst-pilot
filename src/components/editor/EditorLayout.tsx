import { useState, useCallback, useEffect, useRef } from 'react';
import { Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import { FileSidebar } from './FileSidebar';
import { TypstEditor } from './TypstEditor';
import { PDFPreview } from './PDFPreview';
import { AIChatPanel } from './AIChatPanel';
import { SettingsModal } from './SettingsModal';
import { useFileStore } from '@/hooks/useFileStore';
import { useAISettings } from '@/hooks/useAISettings';
import { useTypstCompiler } from '@/hooks/useTypstCompiler';
import { useAIChat } from '@/hooks/useAIChat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EditorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const {
    files,
    activeFile,
    activeFileId,
    createFile,
    deleteFile,
    renameFile,
    updateFileContent,
    setActiveFile,
  } = useFileStore();

  const { settings, updateSettings, isConfigured } = useAISettings();
  const { compile, isCompiling, result, pdfUrl } = useTypstCompiler();
  
  const handleApplyCode = useCallback((code: string) => {
    if (activeFileId) {
      updateFileContent(activeFileId, code);
    }
  }, [activeFileId, updateFileContent]);

  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    sendMessage,
    clearMessages,
  } = useAIChat({
    settings,
    currentContent: activeFile?.content || '',
    onApplyEdit: handleApplyCode,
  });

  // Auto-compile on content change (debounced)
  const compileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (activeFile?.content) {
      if (compileTimeoutRef.current) {
        clearTimeout(compileTimeoutRef.current);
      }
      compileTimeoutRef.current = setTimeout(() => {
        compile(activeFile.content);
      }, 1000);
    }
    
    return () => {
      if (compileTimeoutRef.current) {
        clearTimeout(compileTimeoutRef.current);
      }
    };
  }, [activeFile?.content, compile]);

  const handleContentChange = useCallback((content: string) => {
    if (activeFileId) {
      updateFileContent(activeFileId, content);
    }
  }, [activeFileId, updateFileContent]);

  const handleCompile = useCallback(() => {
    if (activeFile?.content) {
      compile(activeFile.content);
    }
  }, [activeFile?.content, compile]);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          'h-full border-r border-panel-border transition-all duration-200',
          sidebarOpen ? 'w-[14%] min-w-[200px]' : 'w-0'
        )}
      >
        {sidebarOpen && (
          <FileSidebar
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFile}
            onCreateFile={createFile}
            onDeleteFile={deleteFile}
            onRenameFile={renameFile}
          />
        )}
      </div>

      {/* Editor Panel */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        {/* Header */}
        <div className="h-10 flex items-center justify-between px-2 border-b border-panel-border bg-panel shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            {activeFile && (
              <span className="text-sm text-muted-foreground font-mono">
                {activeFile.name}
              </span>
            )}
          </div>
          <SettingsModal
            settings={settings}
            onUpdateSettings={updateSettings}
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        {/* Editor + Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Monaco Editor - 80% height */}
          <div className="h-[80%] min-h-0">
            {activeFile ? (
              <TypstEditor
                content={activeFile.content}
                onChange={handleContentChange}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Select or create a file to start editing</p>
              </div>
            )}
          </div>

          {/* AI Chat Panel - 20% height */}
          <div className="h-[20%] min-h-[120px]">
            <AIChatPanel
              messages={messages}
              isLoading={isChatLoading}
              error={chatError}
              onSendMessage={sendMessage}
              onClearMessages={clearMessages}
              onApplyCode={handleApplyCode}
              isConfigured={isConfigured}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* PDF Preview Panel */}
      <div className="w-[43%] h-full border-l border-panel-border">
        <PDFPreview
          pdfUrl={pdfUrl}
          isCompiling={isCompiling}
          error={result?.success === false ? result.error : null}
          onCompile={handleCompile}
        />
      </div>
    </div>
  );
}
