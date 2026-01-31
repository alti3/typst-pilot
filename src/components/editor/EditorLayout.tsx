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

import { useState, useCallback, useEffect, useRef } from 'react';
import { Settings, PanelLeftClose, PanelLeft, Share2, Download, Play } from 'lucide-react';
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background text-foreground">
      {/* Modern Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">T</span>
            </div>
            <h1 className="font-semibold tracking-tight hidden sm:block">Typst Pilot</h1>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>
            
            {activeFile && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 border border-border/50">
                <span className="text-sm font-medium">
                  {activeFile.name}
                </span>
                {isCompiling && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] animate-pulse">
                    Compiling...
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCompile} disabled={isCompiling} size="sm" className="gap-2 shadow-sm">
            <Play className={cn("h-4 w-4", isCompiling && "animate-spin")} />
            Compile
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <SettingsModal
            settings={settings}
            onUpdateSettings={updateSettings}
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            trigger={
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="h-5 w-5" />
              </Button>
            }
          />
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar Panel */}
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
                <FileSidebar
                  files={files}
                  activeFileId={activeFileId}
                  onSelectFile={setActiveFile}
                  onCreateFile={createFile}
                  onDeleteFile={deleteFile}
                  onRenameFile={renameFile}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Main Content Area */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Editor Panel */}
              <ResizablePanel defaultSize={75} minSize={40}>
                <div className="h-full flex flex-col bg-editor">
                  {activeFile ? (
                    <TypstEditor
                      content={activeFile.content}
                      onChange={handleContentChange}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                        <PanelLeft className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-1">No file selected</h3>
                      <p className="max-w-[240px] text-sm">Select or create a file from the sidebar to start writing your Typst document.</p>
                    </div>
                  )}
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* AI Chat Panel */}
              <ResizablePanel defaultSize={25} minSize={15}>
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
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* PDF Preview Panel */}
          <ResizablePanel defaultSize={40} minSize={20}>
            <PDFPreview
              pdfUrl={pdfUrl}
              isCompiling={isCompiling}
              error={result?.success === false ? result.error : null}
              onCompile={handleCompile}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}

