import { type DesignToken } from './types';

export default function resolveTokenDisplay(token: DesignToken): string {
    const v = token.value;
    switch (token.category) {
        case 'color':
            return v.hex ?? v.value ?? '#000';
        case 'typography':
            return v.fontSize ?? v.value ?? '1rem';
        case 'spacing':
            return `${v.value ?? '0'}${v.unit ?? 'rem'}`;
        case 'shadow':
        case 'button':
            return v.value ?? '';
        case 'border':
            if (v.width) return `${v.width} ${v.style ?? 'solid'} ${v.color ?? '#000'}`;
            return v.value ?? '';
        default:
            return v.value ?? JSON.stringify(v);
    }
}
