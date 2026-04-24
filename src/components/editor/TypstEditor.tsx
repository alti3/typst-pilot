import { useRef, useCallback, useEffect, useMemo } from 'react';
import Editor, { DiffEditor, Monaco, OnMount, DiffOnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Check, RotateCcw } from 'lucide-react';
import { parseDiffFromFile } from '@pierre/diffs';
import { Button } from '@/components/ui/button';

interface TypstEditorProps {
  content: string;
  onChange: (value: string) => void;
  pendingSuggestion?: {
    originalContent: string;
    suggestedAt: number;
  };
  onKeepSuggestion?: () => void;
  onRejectSuggestion?: () => void;
}

// Typst language definition
const TYPST_LANGUAGE_ID = 'typst';
const THEME_NAME = 'typst-pilot';

function parseHslVariable(value: string): { h: number; s: number; l: number; a: number } | null {
  const [hslPart, alphaPart] = value.trim().split('/').map((part) => part.trim());
  const [h, s, l] = hslPart.split(/\s+/);
  if (!h || !s || !l) return null;

  return {
    h: Number(h),
    s: Number(s.replace('%', '')),
    l: Number(l.replace('%', '')),
    a: alphaPart ? Number(alphaPart) : 1,
  };
}

function hslToHex(value: string): string {
  const parsed = parseHslVariable(value);
  if (!parsed) return '#000000';

  const s = parsed.s / 100;
  const l = parsed.l / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((parsed.h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] = (() => {
    if (parsed.h < 60) return [c, x, 0];
    if (parsed.h < 120) return [x, c, 0];
    if (parsed.h < 180) return [0, c, x];
    if (parsed.h < 240) return [0, x, c];
    if (parsed.h < 300) return [x, 0, c];
    return [c, 0, x];
  })();

  const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, '0');
  const alpha = parsed.a < 1 ? Math.round(parsed.a * 255).toString(16).padStart(2, '0') : '';
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}${alpha}`;
}

function getThemeColor(styles: CSSStyleDeclaration, name: string): string {
  return hslToHex(styles.getPropertyValue(name));
}

function defineMonacoTheme(monaco: Monaco) {
  const styles = getComputedStyle(document.documentElement);
  const background = getThemeColor(styles, '--editor-background');
  const foreground = getThemeColor(styles, '--editor-foreground');
  const mutedForeground = getThemeColor(styles, '--muted-foreground');
  const border = getThemeColor(styles, '--border');
  const currentLine = getThemeColor(styles, '--editor-current-line');
  const selection = getThemeColor(styles, '--editor-selection');
  const primary = getThemeColor(styles, '--primary');
  const success = getThemeColor(styles, '--success');
  const destructive = getThemeColor(styles, '--destructive');
  const isDark = document.documentElement.classList.contains('dark');

  monaco.editor.defineTheme(THEME_NAME, {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: isDark ? '93c5fd' : '1d4ed8' },
      { token: 'function', foreground: isDark ? 'fde68a' : '92400e' },
      { token: 'string', foreground: isDark ? 'fca5a5' : 'b91c1c' },
      { token: 'number', foreground: isDark ? '86efac' : '15803d' },
      { token: 'comment', foreground: mutedForeground.slice(1), fontStyle: 'italic' },
      { token: 'keyword.heading', foreground: isDark ? 'f9a8d4' : 'be185d', fontStyle: 'bold' },
      { token: 'tag', foreground: isDark ? 'c4b5fd' : '6d28d9' },
      { token: 'variable.reference', foreground: isDark ? '7dd3fc' : '0369a1' },
      { token: 'string.math', foreground: isDark ? 'bef264' : '4d7c0f' },
      { token: 'string.raw', foreground: isDark ? 'fdba74' : 'c2410c' },
    ],
    colors: {
      'editor.background': background,
      'editor.foreground': foreground,
      'editorGutter.background': background,
      'editorLineNumber.foreground': getThemeColor(styles, '--editor-line-number'),
      'editorLineNumber.activeForeground': mutedForeground,
      'editor.lineHighlightBackground': currentLine,
      'editor.selectionBackground': selection,
      'editor.inactiveSelectionBackground': selection,
      'editorCursor.foreground': primary,
      'editorWhitespace.foreground': border,
      'editorBracketHighlight.foreground1': primary,
      'editorBracketHighlight.foreground2': mutedForeground,
      'editorBracketHighlight.foreground3': foreground,
      'diffEditor.insertedTextBackground': `${success}33`,
      'diffEditor.removedTextBackground': `${destructive}33`,
      'diffEditor.insertedLineBackground': `${success}1f`,
      'diffEditor.removedLineBackground': `${destructive}1f`,
      'diffEditor.diagonalFill': border,
      'diffEditor.border': border,
      'editorOverviewRuler.addedForeground': success,
      'editorOverviewRuler.deletedForeground': destructive,
      'editorOverviewRuler.modifiedForeground': primary,
      'scrollbarSlider.background': `${mutedForeground}33`,
      'scrollbarSlider.hoverBackground': `${mutedForeground}55`,
      'scrollbarSlider.activeBackground': `${mutedForeground}77`,
    },
  });

  monaco.editor.setTheme(THEME_NAME);
}

function registerTypstLanguage(monaco: Monaco) {
  defineMonacoTheme(monaco);

  // Check if already registered
  if (monaco.languages.getLanguages().some((lang) => lang.id === TYPST_LANGUAGE_ID)) {
    return;
  }

  // Register language
  monaco.languages.register({ id: TYPST_LANGUAGE_ID, extensions: ['.typ'] });

  // Token provider for syntax highlighting
  monaco.languages.setMonarchTokensProvider(TYPST_LANGUAGE_ID, {
    defaultToken: '',
    tokenPostfix: '.typ',

    keywords: [
      'set', 'show', 'let', 'import', 'include', 'if', 'else', 'for', 'while',
      'break', 'continue', 'return', 'not', 'and', 'or', 'in', 'as', 'none', 'auto',
    ],

    operators: [
      '=', '+=', '-=', '*=', '/=', '==', '!=', '<', '>', '<=', '>=',
      '+', '-', '*', '/', '%', '=>', '..', '..',
    ],

    symbols: new RegExp('[=><!~?:&|+*/^%-]+'),

    tokenizer: {
      root: [
        // Comments
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],

        // Headings
        [/^=+\s.*$/, 'keyword.heading'],

        // Labels
        [/<[a-zA-Z_][a-zA-Z0-9_-]*>/, 'tag'],

        // References
        [/@[a-zA-Z_][a-zA-Z0-9_-]*/, 'variable.reference'],

        // Math mode
        [/\$/, 'string.math', '@math'],

        // Raw/code blocks
        [/```\w*/, 'string.raw', '@codeblock'],
        [/`[^`]*`/, 'string.raw'],

        // Markup
        [/\*[^*]+\*/, 'markup.bold'],
        [/_[^_]+_/, 'markup.italic'],

        // Strings
        [/"/, 'string', '@string'],

        // Numbers
        [/\d+(\.\d+)?/, 'number'],

        // Function calls
        [/#[a-zA-Z_][a-zA-Z0-9_]*/, 'function'],

        // Keywords
        [/[a-zA-Z_][a-zA-Z0-9_]*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        }],

        // Operators
        [/@symbols/, {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        }],

        // Brackets
        [/[{}()[\]]/, '@brackets'],

        // Whitespace
        [/\s+/, 'white'],
      ],

      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],

      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],

      math: [
        [/[^$]+/, 'string.math'],
        [/\$/, 'string.math', '@pop'],
      ],

      codeblock: [
        [/```/, 'string.raw', '@pop'],
        [/[^`]+/, 'string.raw'],
      ],
    },
  });

  // Language configuration
  monaco.languages.setLanguageConfiguration(TYPST_LANGUAGE_ID, {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '*', close: '*' },
      { open: '_', close: '_' },
      { open: '$', close: '$' },
      { open: '`', close: '`' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '*', close: '*' },
      { open: '_', close: '_' },
    ],
  });
}

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
  lineNumbers: 'on',
  minimap: { enabled: true },
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  padding: { top: 16 },
  cursorBlinking: 'smooth',
  smoothScrolling: true,
  renderLineHighlight: 'line',
  renderWhitespace: 'selection',
  bracketPairColorization: { enabled: true },
};

const reviewEditorOptions: editor.IDiffEditorConstructionOptions = {
  ...editorOptions,
  renderSideBySide: false,
  originalEditable: false,
  ignoreTrimWhitespace: false,
  renderOverviewRuler: true,
  diffWordWrap: 'on',
  padding: { top: 48 },
};

export function TypstEditor({
  content,
  onChange,
  pendingSuggestion,
  onKeepSuggestion,
  onRejectSuggestion,
}: TypstEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const diffModelDisposableRef = useRef<{ dispose: () => void } | null>(null);
  const pendingHunkCount = useMemo(() => {
    if (!pendingSuggestion || pendingSuggestion.originalContent === content) return 0;

    try {
      return parseDiffFromFile(
        { name: 'active.typ', contents: pendingSuggestion.originalContent, lang: 'typst' },
        { name: 'active.typ', contents: content, lang: 'typst' }
      ).hunks.length;
    } catch {
      return 0;
    }
  }, [content, pendingSuggestion]);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    registerTypstLanguage(monaco);
    
    // Set the language for the model
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, TYPST_LANGUAGE_ID);
    }
  }, []);

  const handleDiffEditorMount: DiffOnMount = useCallback((diffEditor, monaco) => {
    diffEditorRef.current = diffEditor;
    registerTypstLanguage(monaco);

    const originalModel = diffEditor.getOriginalEditor().getModel();
    const modifiedModel = diffEditor.getModifiedEditor().getModel();
    if (originalModel) monaco.editor.setModelLanguage(originalModel, TYPST_LANGUAGE_ID);
    if (modifiedModel) {
      monaco.editor.setModelLanguage(modifiedModel, TYPST_LANGUAGE_ID);
      diffModelDisposableRef.current?.dispose();
      diffModelDisposableRef.current = modifiedModel.onDidChangeContent(() => {
        onChange(modifiedModel.getValue());
      });
    }
  }, [onChange]);

  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  // Update content when it changes externally
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== content) {
        editorRef.current.setValue(content);
      }
    }
  }, [content]);

  useEffect(() => {
    return () => {
      diffModelDisposableRef.current?.dispose();
    };
  }, []);

  if (pendingSuggestion) {
    return (
      <div className="relative h-full min-h-0">
        <div className="absolute right-4 top-2 z-50 flex items-center gap-2 rounded-md border border-border bg-background/95 px-2 py-1 shadow-sm">
          <span className="mr-1 hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">
            {pendingHunkCount > 0 ? `${pendingHunkCount} suggested change${pendingHunkCount === 1 ? '' : 's'}` : 'Reviewing AI changes'}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-2"
            onClick={onRejectSuggestion}
            disabled={!onRejectSuggestion}
          >
            <RotateCcw className="h-4 w-4" />
            Reject
          </Button>
          <Button
            size="sm"
            className="h-8 gap-2"
            onClick={onKeepSuggestion}
            disabled={!onKeepSuggestion}
          >
            <Check className="h-4 w-4" />
            Keep
          </Button>
        </div>
        <DiffEditor
          key={pendingSuggestion.suggestedAt}
          height="100%"
          language={TYPST_LANGUAGE_ID}
          original={pendingSuggestion.originalContent}
          modified={content}
          onMount={handleDiffEditorMount}
          theme={THEME_NAME}
          options={reviewEditorOptions}
        />
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      defaultLanguage={TYPST_LANGUAGE_ID}
      value={content}
      onChange={handleChange}
      onMount={handleEditorMount}
      theme={THEME_NAME}
      options={editorOptions}
    />
  );
}
