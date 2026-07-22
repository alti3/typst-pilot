import { useState, useCallback, useRef, useEffect } from 'react';
import { CompilationResult, TypstFile } from '@/types/editor';
import type { TypstCompiler } from '@myriaddreamin/typst.ts/compiler';

export function useTypstCompiler() {
  const [isCompiling, setIsCompiling] = useState(false);
  const [result, setResult] = useState<CompilationResult | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const compilerRef = useRef<TypstCompiler | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  // Cleanup previous PDF URL
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  const compile = useCallback(async (filesOrContent: TypstFile[] | string, mainFilePath = 'main.typ') => {
    setIsCompiling(true);
    
    try {
      // Initialize compiler if not already done
      if (!compilerRef.current) {
        // Dynamic import keeps the compiler/wasm chunk lazy-loaded.
        const [{ createTypstCompiler }, { default: compilerWasmUrl }] = await Promise.all([
          import('@myriaddreamin/typst.ts/compiler'),
          import('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url'),
        ]);
        compilerRef.current = createTypstCompiler();
        await compilerRef.current.init({
          beforeBuild: [],
          getModule: () => compilerWasmUrl,
        });
      }

      const files = typeof filesOrContent === 'string'
        ? [{ path: mainFilePath, content: filesOrContent }]
        : filesOrContent;

      await compilerRef.current.reset();
      for (const file of files) {
        compilerRef.current.addSource(`/${file.path}`, file.content);
      }
      
      // Compile to PDF
      const { CompileFormatEnum } = await import('@myriaddreamin/typst.ts/compiler');
      const pdfResult = await compilerRef.current.compile({
        mainFilePath: `/${mainFilePath}`,
        format: CompileFormatEnum.pdf,
      });
      
      if (!pdfResult.result) {
        throw new Error(
          pdfResult.diagnostics
            ?.map((diagnostic) =>
              typeof diagnostic === 'string' ? diagnostic : diagnostic.message,
            )
            .join('\n') || 'Compilation failed',
        );
      }
      
      // Cleanup previous URL
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
      
      // Create blob URL for PDF
      const blob = new Blob([Uint8Array.from(pdfResult.result)], { type: 'application/pdf' });
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
