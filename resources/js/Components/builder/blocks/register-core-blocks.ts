import { registerBlock } from './block-registry';
import { CORE_BLOCKS } from './core-block-defs';

let registered = false;

/**
 * Register all core blocks into the block registry.
 * Idempotent -- safe to call multiple times.
 */
export function registerCoreBlocks(): void {
    if (registered) return;
    registered = true;

    for (const def of CORE_BLOCKS) {
        registerBlock(def.slug, {
            renderer: def.renderer,
            settings: def.settings,
            label: def.label,
            icon: def.icon,
            category: def.category,
        });
    }
}
