import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import type { Editor } from '@tiptap/react';

/**
 * Build the standard TipTap extension set shared by both the full editor
 * and the inline bubble-menu editor.
 */
export function buildTipTapExtensions(placeholder?: string) {
    return [
        StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TextStyle,
        Color,
        Link.configure({ openOnClick: false }),
        Underline,
        Placeholder.configure({ placeholder: placeholder || 'Saisissez votre texte...' }),
    ];
}

/** Toggle a link on/off using a browser prompt. */
export function toggleLink(editor: Editor): void {
    if (editor.isActive('link')) {
        editor.chain().focus().unsetLink().run();
        return;
    }
    const url = window.prompt('URL du lien:');
    if (url) {
        editor.chain().focus().setLink({ href: url }).run();
    }
}

/** Open a native color picker and apply the chosen color. */
export function pickColor(editor: Editor): void {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = '#000000';
    input.addEventListener('input', (e) => {
        editor.chain().focus().setColor((e.target as HTMLInputElement).value).run();
    });
    input.click();
}
