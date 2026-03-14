import type { BlockRendererProps } from '../block-registry';

export default function FormBlockRenderer({ block }: BlockRendererProps) {
    const formSlug = (block.props.formSlug as string) || '';
    const formId = block.props.formId as number | undefined;
    const style = (block.props.style as string) || 'default';

    if (!formSlug && !formId) {
        return (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">Aucun formulaire sélectionné</p>
                <p className="text-xs mt-1">Configurez un formulaire dans les paramètres du bloc</p>
            </div>
        );
    }

    const styleClasses: Record<string, string> = {
        default: 'border border-gray-200 rounded-lg p-6',
        card: 'bg-white shadow-md rounded-lg p-8',
        minimal: 'py-4',
    };

    return (
        <div className={styleClasses[style] || styleClasses.default}>
            <div className="flex items-center justify-center gap-3 text-gray-500">
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                    />
                </svg>
                <div>
                    <p className="font-medium text-gray-700">
                        Formulaire : {formSlug || `#${formId}`}
                    </p>
                    <p className="text-xs text-gray-400">
                        Le formulaire s'affichera sur le site publié
                    </p>
                </div>
            </div>
        </div>
    );
}
