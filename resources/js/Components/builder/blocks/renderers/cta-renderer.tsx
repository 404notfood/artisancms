import type { BlockRendererProps } from '../block-registry';

export default function CtaRenderer({ block }: BlockRendererProps) {
    const title = (block.props.title as string) || 'Titre de l\'appel à l\'action';
    const description = (block.props.description as string) || '';
    const buttonText = (block.props.buttonText as string) || '';
    const buttonUrl = (block.props.buttonUrl as string) || '#';
    const buttonVariant = (block.props.buttonVariant as string) || 'primary';
    const backgroundColor = (block.props.backgroundColor as string) || '#1e40af';
    const textColor = (block.props.textColor as string) || '#ffffff';
    const align = (block.props.align as string) || 'center';

    const buttonClasses: Record<string, string> = {
        primary: 'bg-white text-gray-900 hover:bg-gray-100',
        secondary: 'bg-gray-800 text-white hover:bg-gray-900',
        outline: 'border-2 border-white text-white hover:bg-white/10',
    };

    return (
        <div
            className={`w-full px-8 py-12 rounded-lg text-${align}`}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-3">{title}</h2>
                {description && (
                    <p className="text-lg opacity-90 mb-6">{description}</p>
                )}
                {buttonText && (
                    <a
                        href={buttonUrl}
                        className={`inline-block px-6 py-3 rounded font-medium transition-colors ${buttonClasses[buttonVariant] || buttonClasses.primary}`}
                    >
                        {buttonText}
                    </a>
                )}
            </div>
        </div>
    );
}
