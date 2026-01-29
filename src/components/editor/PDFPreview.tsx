import { useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PDFPreviewProps {
  pdfUrl: string | null;
  isCompiling: boolean;
  error?: string | null;
  onCompile: () => void;
}

export function PDFPreview({ pdfUrl, isCompiling, error, onCompile }: PDFPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="h-full flex flex-col bg-panel relative">
      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-destructive text-lg font-medium">Compilation Error</div>
              <pre className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-md overflow-auto max-h-64 text-left whitespace-pre-wrap">
                {error}
              </pre>
            </div>
          </div>
        ) : pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-4">
              <p>Click compile to generate PDF preview</p>
              <Button onClick={onCompile} disabled={isCompiling}>
                {isCompiling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Compiling...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Compile
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Compile Button */}
      <Button
        onClick={onCompile}
        disabled={isCompiling}
        className={cn(
          'absolute bottom-6 right-6 shadow-lg',
          'bg-primary/80 hover:bg-primary backdrop-blur-sm',
          'transition-all duration-200'
        )}
        size="lg"
      >
        {isCompiling ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Compiling...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Compile
          </>
        )}
      </Button>
    </div>
  );
}
