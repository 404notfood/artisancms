import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useRef } from 'react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Link as LinkIcon,
    List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, Palette,
} from 'lucide-react';
import { buildTipTapExtensions, toggleLink, pickColor } from './tiptap-shared';

interface TipTapEditorProps {
    content: string;
    onUpdate: (html: string) => void;
    placeholder?: string;
}

export default function TipTapEditor({ content, onUpdate, placeholder }: TipTapEditorProps) {
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const editor = useEditor({
        extensions: buildTipTapExtensions(placeholder),
        content,
        onUpdate: ({ editor }) => {
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onUpdate(editor.getHTML());
            }, 150);
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content]);

    useEffect(() => {
        return () => clearTimeout(debounceRef.current);
    }, []);

    if (!editor) return null;

    const btn = (active: boolean) =>
        `p-1.5 rounded transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`;

    return (
        <div className="tiptap-editor border rounded-md overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-0.5 p-1.5 border-b bg-gray-50">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Gras">
                    <Bold className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Italique">
                    <Italic className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="Souligne">
                    <UnderlineIcon className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="Barre">
                    <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => toggleLink(editor)} className={btn(editor.isActive('link'))} title="Lien">
                    <LinkIcon className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-0.5 self-center" />

                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="Liste a puces">
                    <List className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Liste numerotee">
                    <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="Citation">
                    <Quote className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-0.5 self-center" />

                <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btn(editor.isActive({ textAlign: 'left' }))} title="Aligner a gauche">
                    <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btn(editor.isActive({ textAlign: 'center' }))} title="Centrer">
                    <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btn(editor.isActive({ textAlign: 'right' }))} title="Aligner a droite">
                    <AlignRight className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-0.5 self-center" />

                <button type="button" onClick={() => pickColor(editor)} className={btn(false)} title="Couleur du texte">
                    <Palette className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Editor content */}
            <div className="p-3 prose prose-sm max-w-none">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
