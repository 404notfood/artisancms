import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import type { BlockRendererProps } from '../block-registry';
import { useBuilderStore } from '@/stores/builder-store';

function responsiveProps(props: Record<string, unknown>, viewport: string) {
    return {
        ...props,
        ...((props.responsive as Record<string, Record<string, unknown>> | undefined)?.[viewport] ?? {}),
    };
}

export default function SectionRenderer({ block, children, isEditing }: BlockRendererProps) {
    const viewport = useBuilderStore((state) => state.viewport);
    const effectiveProps = responsiveProps((block.props ?? block.settings ?? {}) as Record<string, unknown>, viewport);
    const {
        backgroundColor,
        backgroundImage,
        borderColor,
        borderRadius,
        borderWidth,
        boxShadow,
        color,
        textAlign,
        paddingTop = 40,
        paddingBottom = 40,
        paddingLeft = 20,
        paddingRight = 20,
        maxWidth,
        centered,
    } = effectiveProps as Record<string, string | number | boolean>;

    const { isOver, setNodeRef } = useDroppable({
        id: `container:${block.id}`,
        data: {
            type: 'container-drop-zone',
            parentId: block.id,
            blockType: block.type,
        },
        disabled: !isEditing,
    });

    const hasChildren = Boolean(children);
    const effectiveMaxWidth = maxWidth ? `${maxWidth}px` : 'var(--container-width, 1280px)';
    const shouldWrap = centered !== false;

    const content = (
        <div
            ref={setNodeRef}
            className={`relative rounded-xl transition-all ${isEditing ? 'min-h-[104px] outline outline-1 outline-offset-[-1px] outline-transparent' : ''} ${isOver ? 'bg-blue-50/70 outline-blue-300 ring-4 ring-blue-100' : ''}`}
        >
            {hasChildren ? (
                <>
                    {children}
                    {isEditing && (
                        <div className={`mt-3 flex items-center justify-center rounded-lg border border-dashed px-3 py-2 text-xs font-semibold transition ${isOver ? 'border-blue-400 bg-white text-blue-700' : 'border-slate-200 bg-slate-50/80 text-slate-400 opacity-0 group-hover/block:opacity-100'}`}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Deposer ici pour ajouter a la section
                        </div>
                    )}
                </>
            ) : (
                isEditing && (
                    <div className={`flex min-h-[104px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${isOver ? 'border-blue-400 bg-white text-blue-700 shadow-sm' : 'border-slate-300 bg-slate-50/80 text-slate-500'}`}>
                        <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${isOver ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-400 shadow-sm ring-1 ring-slate-200'}`}>
                            <Plus className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold">Deposez un bloc dans cette section</span>
                        <span className="mt-1 text-xs text-slate-400">Texte, image, bouton, grille ou formulaire</span>
                    </div>
                )
            )}
        </div>
    );

    const inner = shouldWrap ? (
        <div style={{ maxWidth: effectiveMaxWidth, margin: '0 auto', width: '100%' }}>
            {content}
        </div>
    ) : content;

    return (
        <div
            className="w-full min-h-[80px]"
            style={{
                backgroundColor: (backgroundColor as string) || undefined,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderColor: (borderColor as string) || undefined,
                borderRadius: borderRadius ? `${borderRadius}px` : undefined,
                borderStyle: borderWidth ? 'solid' : undefined,
                borderWidth: borderWidth ? `${borderWidth}px` : undefined,
                boxShadow: (boxShadow as string) || undefined,
                color: (color as string) || undefined,
                textAlign: (textAlign as 'left' | 'center' | 'right' | undefined) || undefined,
                paddingTop: `${paddingTop}px`,
                paddingBottom: `${paddingBottom}px`,
                paddingLeft: `${paddingLeft}px`,
                paddingRight: `${paddingRight}px`,
            }}
        >
            {inner}
        </div>
    );
}
