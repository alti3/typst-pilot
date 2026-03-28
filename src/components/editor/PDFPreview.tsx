import { useRef } from 'react';
import { Play, Loader2, AlertCircle, FileText, Download, Maximize2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface PDFPreviewProps {
  pdfUrl: string | null;
  isCompiling: boolean;
  error?: string | null;
  onCompile: () => void;
}

export function PDFPreview({ pdfUrl, isCompiling, error, onCompile }: PDFPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'document.pdf';
      link.click();
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/20 relative">
      {/* Preview Toolbar */}
      <div className="h-10 px-4 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Preview</span>
          {isCompiling && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-medium bg-primary/10 text-primary border-none animate-pulse">
              Syncing...
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={onCompile}
            disabled={isCompiling}
            title="Refresh Preview"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isCompiling && "animate-spin")} />
          </Button>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={handleDownload}
            disabled={!pdfUrl}
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            title="Full Screen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden relative">
        {error ? (
          <div className="h-full flex items-center justify-center p-8 bg-background/50">
            <div className="text-center space-y-4 max-w-md animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Compilation Failed</h3>
              <div className="text-sm text-muted-foreground bg-destructive/5 border border-destructive/10 p-4 rounded-xl overflow-auto max-h-[300px] text-left font-mono scrollbar-none">
                {error}
              </div>
              <Button onClick={onCompile} variant="outline" size="sm" className="rounded-xl">
                Try Again
              </Button>
            </div>
          </div>
        ) : pdfUrl ? (
          <div className="w-full h-full bg-[#525659] overflow-hidden">
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-background/50">
            <div className="text-center space-y-4 max-w-[240px] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-medium">Ready to render</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your Typst document will appear here once you start writing or click compile.
              </p>
              <Button onClick={onCompile} disabled={isCompiling} className="w-full rounded-xl shadow-md gap-2">
                {isCompiling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rendering...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Render Preview
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Success Indicator - Subtle floating badge when updated */}
      {pdfUrl && !isCompiling && !error && (
        <div className="absolute top-4 right-4 animate-out fade-out fill-mode-forwards delay-1000 duration-500">
          <Badge className="bg-success/10 text-success border-success/20 pointer-events-none px-2 py-0.5 text-[10px]">
            Updated
          </Badge>
        </div>
      )}
    </div>
  );
}
