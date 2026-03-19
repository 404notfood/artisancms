interface LivePreviewProps {
    data: Record<string, string | boolean>;
}

export default function LivePreview({ data }: LivePreviewProps) {
    return (
        <div className="flex-1 bg-gray-100 relative">
            <iframe
                src="/"
                className="w-full h-full border-0"
                title="Live preview"
                ref={(el) => {
                    if (!el) return;
                    try {
                        const doc = el.contentDocument;
                        if (!doc) return;
                        let style = doc.getElementById('theme-preview-vars');
                        if (!style) {
                            style = doc.createElement('style');
                            style.id = 'theme-preview-vars';
                            doc.head.appendChild(style);
                        }
                        const vars = Object.entries(data)
                            .filter(([, v]) => typeof v === 'string' && v !== '')
                            .map(([k, v]) => {
                                const dotIdx = k.indexOf('.');
                                if (dotIdx === -1) return '';
                                const section = k.substring(0, dotIdx);
                                const key = k.substring(dotIdx + 1);
                                const prefixes: Record<string, string> = {
                                    colors: '--color-',
                                    fonts: '--font-',
                                    layout: '--',
                                    header: '--header-',
                                    footer: '--footer-',
                                    global_styles: '--global-',
                                };
                                const prefix = prefixes[section];
                                if (!prefix) return '';
                                if (String(v).startsWith('/') || String(v).startsWith('http')) return '';
                                return `${prefix}${key.replace(/_/g, '-')}: ${v};`;
                            })
                            .filter(Boolean)
                            .join('\n  ');
                        style.textContent = `:root {\n  ${vars}\n}`;
                    } catch {
                        // Cross-origin or not loaded yet
                    }
                }}
            />
            <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-500 shadow-sm border">
                Apercu en direct
            </div>
        </div>
    );
}
