import type { BlockRendererProps } from '../block-registry';

export default function ButtonRenderer({ block }: BlockRendererProps) {
    const text = (block.props.text as string) || 'Bouton';
    const variant = (block.props.variant as string) || 'primary';
    const size = (block.props.size as string) || 'md';

    const variantClasses: Record<string, string> = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    };

    const sizeClasses: Record<string, string> = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-7 py-3.5 text-lg',
    };

    return (
        <button
            type="button"
            className={`rounded font-medium transition-colors ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md}`}
        >
            {text}
        </button>
    );
}
