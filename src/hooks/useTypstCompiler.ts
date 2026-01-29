import { useState, useCallback, useRef, useEffect } from 'react';
import { CompilationResult } from '@/types/editor';

export function useTypstCompiler() {
  const [isCompiling, setIsCompiling] = useState(false);
  const [result, setResult] = useState<CompilationResult | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const compilerRef = useRef<any>(null);
  const prevUrlRef = useRef<string | null>(null);

  // Cleanup previous PDF URL
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  const compile = useCallback(async (content: string) => {
    setIsCompiling(true);
    
    try {
      // Dynamic import of typst.ts compiler
      const { createTypstCompiler } = await import('@myriaddreamin/typst.ts');
      
      // Initialize compiler if not already done
      if (!compilerRef.current) {
        compilerRef.current = createTypstCompiler();
        await compilerRef.current.init();
      }
      
      // Add the main file content
      compilerRef.current.addSource('/main.typ', content);
      
      // Compile to PDF
      const pdfResult = await compilerRef.current.compile({
        mainFilePath: '/main.typ',
        format: 'pdf',
      });
      
      if (!pdfResult.result) {
        throw new Error(pdfResult.diagnostics?.map((d: any) => d.message).join('\n') || 'Compilation failed');
      }
      
      // Cleanup previous URL
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
      
      // Create blob URL for PDF
      const blob = new Blob([pdfResult.result], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      prevUrlRef.current = url;
      
      setPdfUrl(url);
      setResult({
        success: true,
        pdf: pdfResult.result,
      });
    } catch (error) {
      console.error('Compilation error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compilation error',
      });
    } finally {
      setIsCompiling(false);
    }
  }, []);

  return {
    compile,
    isCompiling,
    result,
    pdfUrl,
  };
}
