import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { BlockRendererProps } from '../block-registry';
import { useBuilderStore, flattenTree } from '@/stores/builder-store';

interface TocHeading {
    id: string;
    text: string;
    level: number;
    anchor: string;
}

interface TocTreeNode extends TocHeading {
    children: TocTreeNode[];
}

/** Generate a URL-safe anchor slug from heading text. */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/** Extract headings from the builder store block tree. */
function extractHeadings(blocks: unknown[], maxDepth: number): TocHeading[] {
    const flat = flattenTree(blocks as import('@/types/cms').BlockNode[]);
    const headings: TocHeading[] = [];

    for (const block of flat) {
        if (block.type !== 'heading') continue;
        const level = Number(block.props.level) || 2;
        if (level < 2 || level > maxDepth) continue;
        const text = (block.props.text as string) || (block.props.content as string) || '';
        if (!text.trim()) continue;
        const anchor = slugify(text) || `heading-${block.id}`;
        headings.push({ id: block.id, text, level, anchor });
    }
    return headings;
}

/** Build a nested tree structure from flat headings (h2 nests h3, etc.). */
function buildTree(headings: TocHeading[]): TocTreeNode[] {
    const root: TocTreeNode[] = [];
    const stack: TocTreeNode[] = [];

    for (const h of headings) {
        const node: TocTreeNode = { ...h, children: [] };
        while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
            stack.pop();
        }
        if (stack.length === 0) {
            root.push(node);
        } else {
            stack[stack.length - 1].children.push(node);
        }
        stack.push(node);
    }
    return root;
}

export default function TocRenderer({ block, isEditing }: BlockRendererProps) {
    const {
        title = 'Sommaire',
        maxDepth = 3,
        style = 'bullet',
        showTitle = true,
    } = block.props as {
        title?: string;
        maxDepth?: number;
        style?: 'numbered' | 'bullet' | 'plain';
        showTitle?: boolean;
    };

    const blocks = useBuilderStore((s) => s.blocks);
    const headings = useMemo(() => extractHeadings(blocks, Number(maxDepth)), [blocks, maxDepth]);
    const tree = useMemo(() => buildTree(headings), [headings]);
    const [activeAnchor, setActiveAnchor] = useState<string>('');
    const navRef = useRef<HTMLElement>(null);

    // Inject anchor IDs onto heading DOM elements & observe for active state
    useEffect(() => {
        if (isEditing) return;
        if (headings.length === 0) return;

        // Set IDs on heading elements in the page
        for (const h of headings) {
            const el = document.querySelector(`[data-block-id="${h.id}"]`);
            if (!el) continue;
            const headingEl = el.querySelector('h1, h2, h3, h4, h5, h6') ?? el;
            headingEl.id = h.anchor;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveAnchor(entry.target.id);
                        break;
                    }
                }
            },
            { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 },
        );

        for (const h of headings) {
            const el = document.getElementById(h.anchor);
            if (el) observer.observe(el);
        }

        return () => observer.disconnect();
    }, [headings, isEditing]);

    const handleClick = useCallback(
        (e: React.MouseEvent, anchor: string) => {
            if (isEditing) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            const target = document.getElementById(anchor);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveAnchor(anchor);
            }
        },
        [isEditing],
    );

    const listClass =
        style === 'numbered' ? 'list-decimal' : style === 'bullet' ? 'list-disc' : 'list-none';

    function renderNodes(nodes: TocTreeNode[], depth = 0) {
        if (nodes.length === 0) return null;
        const Tag = style === 'numbered' ? 'ol' : 'ul';
        return (
            <Tag className={`${listClass} ${depth === 0 ? 'pl-4' : 'pl-5'} space-y-1`} role="list">
                {nodes.map((node) => (
                    <li key={node.id}>
                        <a
                            href={`#${node.anchor}`}
                            onClick={(e) => handleClick(e, node.anchor)}
                            className={`
                                text-sm transition-colors duration-150 hover:text-indigo-600
                                ${activeAnchor === node.anchor
                                    ? 'text-indigo-600 font-semibold'
                                    : 'text-gray-600'
                                }
                            `}
                        >
                            {node.text}
                        </a>
                        {node.children.length > 0 && renderNodes(node.children, depth + 1)}
                    </li>
                ))}
            </Tag>
        );
    }

    // Empty state in builder
    if (headings.length === 0) {
        return (
            <nav ref={navRef} className="toc-block rounded-lg border bg-gray-50/50 p-4" aria-label="Table des matieres">
                {showTitle && title && (
                    <h3 className="text-base font-semibold text-gray-800 mb-2">{title}</h3>
                )}
                <p className="text-xs italic text-gray-400">
                    Ajoutez des blocs Titre (H2-H{maxDepth}) pour generer automatiquement le sommaire.
                </p>
            </nav>
        );
    }

    return (
        <nav
            ref={navRef}
            className="toc-block rounded-lg border bg-gray-50/50 p-4"
            aria-label="Table des matieres"
            role="navigation"
        >
            {showTitle && title && (
                <h3 className="text-base font-semibold text-gray-800 mb-3">{title}</h3>
            )}
            {renderNodes(tree)}
        </nav>
    );
}
