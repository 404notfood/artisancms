import { ComponentType } from 'react';
import type { BlockNode } from '@/types/cms';

export interface BlockRendererProps {
    block: BlockNode;
    isSelected: boolean;
    isEditing: boolean;
    onUpdate?: (props: Partial<BlockNode['props']>) => void;
    children?: React.ReactNode;
}

export interface BlockSettingsProps {
    block: BlockNode;
    onUpdate: (props: Partial<BlockNode['props']>) => void;
}

interface BlockRegistryEntry {
    renderer: ComponentType<BlockRendererProps>;
    settings: ComponentType<BlockSettingsProps>;
    label: string;
    icon: string;
    category: 'layout' | 'content' | 'media' | 'data' | 'interactive' | 'marketing';
}

const registry = new Map<string, BlockRegistryEntry>();

export function registerBlock(slug: string, entry: BlockRegistryEntry) {
    registry.set(slug, entry);
}

export function getBlock(slug: string): BlockRegistryEntry | undefined {
    return registry.get(slug);
}

export function getAllBlocks(): [string, BlockRegistryEntry][] {
    return Array.from(registry.entries());
}

export function getBlocksByCategory(category: string): [string, BlockRegistryEntry][] {
    return getAllBlocks().filter(([, entry]) => entry.category === category);
}
