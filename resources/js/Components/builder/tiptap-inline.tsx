import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Link as LinkIcon, Palette,
} from 'lucide-react';

interface TipTapInlineProps {
    content: string;
    onUpdate: (html: string) => void;
    className?: string;
    style?: CSSProperties;
}

export default function TipTapInline({ content, onUpdate, className, style }: TipTapInlineProps) {
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            Link.configure({ openOnClick: false }),
            Underline,
            Placeholder.configure({ placeholder: 'Saisissez votre texte...' }),
        ],
        content,
        onUpdate: ({ editor }) => {
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onUpdate(editor.getHTML());
            }, 150);
        },
        onSelectionUpdate: ({ editor }) => {
            updateBubblePosition(editor);
        },
    });

    const updateBubblePosition = useCallback((editorInstance: typeof editor) => {
        if (!editorInstance) return;
        const { from, to } = editorInstance.state.selection;
        if (from === to) {
            setBubblePos(null);
            return;
        }
        const view = editorInstance.view;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        setBubblePos({
            top: Math.min(start.top, end.top) - 45,
            left: (start.left + end.left) / 2,
        });
    }, []);

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, false);
        }
    }, [content]);

    useEffect(() => {
        return () => clearTimeout(debounceRef.current);
    }, []);

    if (!editor) return null;

    const toggleLink = () => {
        if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
            return;
        }
        const url = window.prompt('URL du lien:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const setColor = () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = '#000000';
        input.addEventListener('input', (e) => {
            editor.chain().focus().setColor((e.target as HTMLInputElement).value).run();
        });
        input.click();
    };

    const btn = (active: boolean) =>
        `p-1.5 rounded transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-white/80 hover:bg-white/20 hover:text-white'}`;

    const bubbleMenu = bubblePos && createPortal(
        <div
            ref={bubbleRef}
            className="fixed z-[9999] flex items-center gap-0.5 bg-gray-900 rounded-lg shadow-xl px-1.5 py-1 animate-in fade-in duration-150"
            style={{ top: bubblePos.top, left: bubblePos.left, transform: 'translateX(-50%)' }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Gras">
                <Bold className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Italique">
                <Italic className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="Souligné">
                <UnderlineIcon className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="Barré">
                <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-gray-600 mx-0.5" />
            <button type="button" onClick={toggleLink} className={btn(editor.isActive('link'))} title="Lien">
                <LinkIcon className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={setColor} className={btn(false)} title="Couleur">
                <Palette className="w-3.5 h-3.5" />
            </button>
        </div>,
        document.body,
    );

    return (
        <div className={`tiptap-inline ${className || ''}`} style={style}>
            {bubbleMenu}
            <EditorContent editor={editor} />
        </div>
    );
}
