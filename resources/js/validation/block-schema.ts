import { z } from 'zod';

// --- Base block node schema (recursive) ---

const baseBlockSchema = z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    props: z.record(z.string(), z.unknown()).default({}),
});

type BlockSchemaType = z.infer<typeof baseBlockSchema> & {
    children?: BlockSchemaType[];
};

export const blockNodeSchema: z.ZodType<BlockSchemaType> = baseBlockSchema.extend({
    children: z.lazy(() => z.array(blockNodeSchema)).optional(),
});

// --- Props schemas per block type ---

export const sectionPropsSchema = z.object({
    fullWidth: z.boolean().optional(),
    backgroundColor: z.string().optional(),
    paddingTop: z.string().optional(),
    paddingBottom: z.string().optional(),
});

export const gridPropsSchema = z.object({
    columns: z.number().int().min(1).max(12).optional(),
    gap: z.string().optional(),
});

export const headingPropsSchema = z.object({
    text: z.string().default(''),
    level: z.number().int().min(1).max(6).default(2),
    alignment: z.enum(['left', 'center', 'right']).optional(),
});

export const textPropsSchema = z.object({
    html: z.string().default(''),
});

export const imagePropsSchema = z.object({
    src: z.string().default(''),
    alt: z.string().default(''),
    width: z.number().optional(),
    height: z.number().optional(),
    objectFit: z.enum(['cover', 'contain', 'fill', 'none']).optional(),
});

export const buttonPropsSchema = z.object({
    text: z.string().default('Button'),
    url: z.string().default('#'),
    variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).optional(),
    size: z.enum(['sm', 'md', 'lg']).optional(),
    target: z.enum(['_self', '_blank']).optional(),
});

export const heroPropsSchema = z.object({
    title: z.string().default(''),
    subtitle: z.string().optional(),
    buttonText: z.string().optional(),
    buttonUrl: z.string().optional(),
    backgroundImage: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    overlay: z.boolean().optional(),
});

export const spacerPropsSchema = z.object({
    height: z.string().default('40px'),
});

export const dividerPropsSchema = z.object({
    style: z.enum(['solid', 'dashed', 'dotted']).optional(),
    color: z.string().optional(),
    width: z.string().optional(),
});

export const videoPropsSchema = z.object({
    url: z.string().default(''),
    autoplay: z.boolean().optional(),
    controls: z.boolean().optional(),
    loop: z.boolean().optional(),
    muted: z.boolean().optional(),
});

// --- Registry of props schemas by block type ---

const propsSchemaRegistry: Record<string, z.ZodType> = {
    section: sectionPropsSchema,
    grid: gridPropsSchema,
    heading: headingPropsSchema,
    text: textPropsSchema,
    image: imagePropsSchema,
    button: buttonPropsSchema,
    'hero-section': heroPropsSchema,
    hero: heroPropsSchema,
    spacer: spacerPropsSchema,
    divider: dividerPropsSchema,
    video: videoPropsSchema,
};

// --- Block tree validation ---

export interface ValidationError {
    blockId: string;
    blockType: string;
    path: string;
    message: string;
}

export function validateBlockTree(blocks: unknown): {
    valid: boolean;
    errors: ValidationError[];
} {
    const errors: ValidationError[] = [];

    const result = z.array(blockNodeSchema).safeParse(blocks);
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push({
                blockId: 'root',
                blockType: 'tree',
                path: issue.path.join('.'),
                message: issue.message,
            });
        }
        return { valid: false, errors };
    }

    // Deep-validate props per block type
    function validateNode(node: BlockSchemaType): void {
        const propsSchema = propsSchemaRegistry[node.type];
        if (propsSchema) {
            const propsResult = propsSchema.safeParse(node.props);
            if (!propsResult.success) {
                for (const issue of propsResult.error.issues) {
                    errors.push({
                        blockId: node.id,
                        blockType: node.type,
                        path: `props.${issue.path.join('.')}`,
                        message: issue.message,
                    });
                }
            }
        }

        if (node.children) {
            for (const child of node.children) {
                validateNode(child);
            }
        }
    }

    for (const block of result.data) {
        validateNode(block);
    }

    return { valid: errors.length === 0, errors };
}
