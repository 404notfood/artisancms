/**
 * Paste from Word / Google Docs → CMS block conversion.
 *
 * Usage dans le canvas builder :
 * canvas.addEventListener('paste', (e) => {
 *   const blocks = handlePaste(e);
 *   if (blocks) { e.preventDefault(); store.insertBlocks(blocks); }
 * });
 */
import type { BlockNode } from '@/types/cms';

const genId = (): string =>
    `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// ─── HTML cleaning ───────────────────────────────────────────────────

/** Strip Microsoft Office / Word artefacts. */
export function cleanWordHtml(html: string): string {
    return html
        .replace(/<!\[if[^]*?<!\[endif\]>/gi, '')
        .replace(/<\/?[ovwm]:[^>]*>/gi, '')
        .replace(/\s*mso-[^;:"']+:[^;:"']+;?/gi, '')
        .replace(/\s*class=["']Mso[^"']*["']/gi, '')
        .replace(/\s*style=["']\s*["']/gi, '')
        .replace(/<xml[^>]*>[^]*?<\/xml>/gi, '')
        .replace(/<style[^>]*>[^]*?<\/style>/gi, '')
        .replace(/<!--\[if[^]*?endif\]-->/gi, '')
        .replace(/<!--.*?-->/g, '');
}

/** Strip Google Docs artefacts. */
export function cleanGoogleDocsHtml(html: string): string {
    return html
        .replace(/<b\s+style="font-weight:\s*normal;?"[^>]*>([\s\S]*?)<\/b>/gi, '$1')
        .replace(/\s*id="(kix-|docs-internal)[^"]*"/gi, '')
        .replace(/\s*data-[\w-]+="[^"]*"/gi, '')
        .replace(
            /\s*style="(?:color:\s*#000000;?\s*|font-weight:\s*400;?\s*|font-style:\s*normal;?\s*|text-decoration:\s*none;?\s*)+"/gi,
            '',
        )
        .replace(/<span\s*>([\s\S]*?)<\/span>/gi, '$1');
}

/** Detect source, clean, and normalize. */
function cleanHtml(raw: string): string {
    let h = raw;
    if (/class="?Mso|mso-|<o:p>|<w:/.test(h)) h = cleanWordHtml(h);
    if (/id="docs-internal|data-docs-|docs-internal-guid/.test(h)) h = cleanGoogleDocsHtml(h);
    return h
        .replace(/[\r\n]+/g, '\n')
        .replace(/<p[^>]*>\s*(&nbsp;|\u00A0)?\s*<\/p>/gi, '')
        .replace(/&nbsp;|\u00A0/g, ' ')
        .trim();
}

// ─── DOM helpers ─────────────────────────────────────────────────────

const txt = (el: Element): string => (el.textContent ?? '').trim();

const ALLOWED_INLINE = new Set(['STRONG', 'B', 'EM', 'I', 'A', 'CODE', 'U', 'S', 'SUB', 'SUP', 'BR']);

function sanitizedInnerHtml(el: Element): string {
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll('*').forEach((child) => {
        if (!ALLOWED_INLINE.has(child.tagName)) {
            child.replaceWith(document.createTextNode(child.textContent ?? ''));
        } else {
            [...child.attributes].forEach((a) => {
                if (!(child.tagName === 'A' && a.name === 'href')) child.removeAttribute(a.name);
            });
        }
    });
    return clone.innerHTML.trim();
}

function parseTable(el: Element): { headers: string[]; rows: string[][] } {
    const headers: string[] = [];
    const rows: string[][] = [];
    const thead = el.querySelector('thead');
    if (thead) thead.querySelectorAll('th, td').forEach((c) => headers.push(txt(c)));
    el.querySelectorAll('tbody > tr, :scope > tr').forEach((tr, i) => {
        if (!thead && i === 0) {
            tr.querySelectorAll('th, td').forEach((c) => headers.push(txt(c)));
            return;
        }
        const row: string[] = [];
        tr.querySelectorAll('td, th').forEach((c) => row.push(txt(c)));
        if (row.length) rows.push(row);
    });
    return { headers, rows };
}

// ─── Element → BlockNode ─────────────────────────────────────────────

function toBlock(el: Element): BlockNode | null {
    const tag = el.tagName;

    // Headings h1-h6
    if (/^H[1-6]$/.test(tag)) {
        const text = txt(el);
        return text ? { id: genId(), type: 'heading', props: { text, level: +tag[1], alignment: 'left' } } : null;
    }
    // Lists
    if (tag === 'UL' || tag === 'OL') {
        const items = Array.from(el.querySelectorAll(':scope > li')).map(txt).filter(Boolean);
        return items.length
            ? { id: genId(), type: 'list', props: { items, style: tag === 'OL' ? 'numbered' : 'bullet', spacing: 'normal' } }
            : null;
    }
    // Blockquote
    if (tag === 'BLOCKQUOTE') {
        const text = txt(el);
        return text ? { id: genId(), type: 'blockquote', props: { text, author: '', source: '', style: 'bordered' } } : null;
    }
    // Standalone image
    if (tag === 'IMG') {
        const src = el.getAttribute('src') ?? '';
        return src ? { id: genId(), type: 'image', props: { src, alt: el.getAttribute('alt') ?? '', width: '100%', objectFit: 'cover' } } : null;
    }
    // Table
    if (tag === 'TABLE') {
        const { headers, rows } = parseTable(el);
        return (headers.length || rows.length)
            ? { id: genId(), type: 'table', props: { headers, rows, striped: true, bordered: true, caption: '' } }
            : null;
    }
    // Pre / code
    if (tag === 'PRE') {
        const code = txt(el);
        return code ? { id: genId(), type: 'code-block', props: { code, language: 'text', showLineNumbers: false } } : null;
    }
    // Paragraph / div → text block (or image if only wrapping an <img>)
    if (tag === 'P' || tag === 'DIV') {
        const img = el.querySelector(':scope > img');
        if (img && txt(el) === txt(img)) return toBlock(img);
        const html = sanitizedInnerHtml(el);
        return html ? { id: genId(), type: 'text', props: { content: `<p>${html}</p>`, alignment: 'left' } } : null;
    }
    return null;
}

// ─── Public API ──────────────────────────────────────────────────────

/** Parse an HTML string (from clipboard) into BlockNode[]. */
export function parseClipboardHtml(html: string): BlockNode[] {
    const container = document.createElement('div');
    container.innerHTML = cleanHtml(html);

    const blocks: BlockNode[] = [];
    for (const child of Array.from(container.children)) {
        const block = toBlock(child);
        if (block) blocks.push(block);
    }
    // Fallback: raw text → single text block
    if (!blocks.length) {
        const plain = container.textContent?.trim();
        if (plain) blocks.push({ id: genId(), type: 'text', props: { content: `<p>${plain}</p>`, alignment: 'left' } });
    }
    return blocks;
}

/** Handle a native ClipboardEvent. Returns blocks or null. */
export function handlePaste(event: ClipboardEvent): BlockNode[] | null {
    const cd = event.clipboardData;
    if (!cd) return null;

    if (cd.types.includes('text/html')) {
        const blocks = parseClipboardHtml(cd.getData('text/html'));
        return blocks.length ? blocks : null;
    }
    if (cd.types.includes('text/plain')) {
        const text = cd.getData('text/plain').trim();
        if (!text) return null;
        return text.split(/\n{2,}/).filter(Boolean).map((p) => ({
            id: genId(), type: 'text', props: { content: `<p>${p.trim()}</p>`, alignment: 'left' },
        }));
    }
    return null;
}
