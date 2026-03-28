import { useCallback, useEffect, useRef, useState } from 'react';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: 'css' | 'js' | 'html';
    height?: string;
    placeholder?: string;
}

const LANG_LABELS: Record<string, string> = {
    css: 'CSS',
    js: 'JavaScript',
    html: 'HTML',
};

export default function CodeEditor({
    value,
    onChange,
    language,
    height = '400px',
    placeholder,
}: CodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const [lineCount, setLineCount] = useState(1);

    const updateLineCount = useCallback((text: string) => {
        const count = text.split('\n').length;
        setLineCount(Math.max(count, 1));
    }, []);

    useEffect(() => {
        updateLineCount(value);
    }, [value, updateLineCount]);

    function syncScroll() {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Tab key: insert 2 spaces
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            onChange(newValue);
            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            });
        }

        // Enter key: auto-indent
        if (e.key === 'Enter') {
            e.preventDefault();
            const start = textarea.selectionStart;
            const currentLine = value.substring(0, start).split('\n').pop() || '';
            const indent = currentLine.match(/^(\s*)/)?.[1] || '';

            // Add extra indent after { or :
            const trimmed = currentLine.trimEnd();
            const extra = trimmed.endsWith('{') || trimmed.endsWith(':') ? '  ' : '';

            const insertion = '\n' + indent + extra;
            const newValue = value.substring(0, start) + insertion + value.substring(textarea.selectionEnd);
            onChange(newValue);
            requestAnimationFrame(() => {
                const pos = start + insertion.length;
                textarea.selectionStart = textarea.selectionEnd = pos;
            });
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        onChange(e.target.value);
    }

    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);
    const charCount = value.length;
    const actualLines = value.split('\n').length;

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {LANG_LABELS[language] || language.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {actualLines} ligne{actualLines !== 1 ? 's' : ''} &middot; {charCount} car.
                </span>
            </div>

            {/* Editor area */}
            <div className="relative flex" style={{ height }}>
                {/* Line numbers */}
                <div
                    ref={lineNumbersRef}
                    className="shrink-0 select-none overflow-hidden border-r border-gray-200 bg-gray-50 py-3 text-right dark:border-gray-700 dark:bg-gray-800/50"
                    style={{ width: '3.5rem' }}
                    aria-hidden="true"
                >
                    {lineNumbers.map((n) => (
                        <div
                            key={n}
                            className="px-2 text-xs leading-[1.375rem] text-gray-400 dark:text-gray-500"
                        >
                            {n}
                        </div>
                    ))}
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onScroll={syncScroll}
                    placeholder={placeholder}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="flex-1 resize-none bg-white p-3 font-mono text-sm leading-[1.375rem] text-gray-900 outline-none placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-600"
                    style={{ tabSize: 2 }}
                />
            </div>
        </div>
    );
}
