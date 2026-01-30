import { useRef, useCallback, useEffect } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface TypstEditorProps {
  content: string;
  onChange: (value: string) => void;
}

// Typst language definition
const TYPST_LANGUAGE_ID = 'typst';
const THEME_NAME = 'typst-canvas-dark';

function registerTypstLanguage(monaco: Monaco) {
  // Check if already registered
  if (monaco.languages.getLanguages().some((lang) => lang.id === TYPST_LANGUAGE_ID)) {
    return;
  }

  // Define custom theme
  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '569cd6' },
      { token: 'function', foreground: 'dcdcaa' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
      { token: 'keyword.heading', foreground: 'e06c75', fontStyle: 'bold' },
      { token: 'tag', foreground: 'c678dd' },
      { token: 'variable.reference', foreground: '61afef' },
      { token: 'string.math', foreground: '98c379' },
      { token: 'string.raw', foreground: 'd19a66' },
    ],
    colors: {
      'editor.background': '#09090b', // Zinc 950
      'editor.foreground': '#fafafa', // Zinc 50
      'editorLineNumber.foreground': '#3f3f46', // Zinc 700
      'editorLineNumber.activeForeground': '#a1a1aa', // Zinc 400
      'editor.lineHighlightBackground': '#18181b', // Zinc 900
      'editor.selectionBackground': '#27272a', // Zinc 800
      'editor.inactiveSelectionBackground': '#18181b',
      'editorCursor.foreground': '#fafafa',
      'editorWhitespace.foreground': '#27272a',
      'editorBracketHighlight.foreground1': '#c678dd',
      'editorBracketHighlight.foreground2': '#61afef',
      'editorBracketHighlight.foreground3': '#98c379',
    }
  });

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

    symbols: /[=><!~?:&|+\-*\/\^%]+/,

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
        [/[{}()\[\]]/, '@brackets'],

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

export function TypstEditor({ content, onChange }: TypstEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    registerTypstLanguage(monaco);
    
    // Set the language for the model
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, TYPST_LANGUAGE_ID);
    }
  }, []);

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

  return (
    <Editor
      height="100%"
      defaultLanguage={TYPST_LANGUAGE_ID}
      value={content}
      onChange={handleChange}
      onMount={handleEditorMount}
      theme={THEME_NAME}
      options={{
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
      }}
    />
  );
}
