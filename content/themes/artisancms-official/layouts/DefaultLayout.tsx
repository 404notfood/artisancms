import type { ReactNode } from 'react';

interface DefaultLayoutProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
}

export default function DefaultLayout({ children, header, footer }: DefaultLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)' }}>
            {header && (
                <header className="sticky top-0 z-50 transition-all duration-300" style={{
                    backgroundColor: 'var(--header-background-color, #0f172a)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <div className="mx-auto px-6 py-4" style={{ maxWidth: 'var(--container-width, 1280px)' }}>
                        {header}
                    </div>
                </header>
            )}

            <main className="flex-1">
                <div className="mx-auto px-6 py-12" style={{ maxWidth: 'var(--container-width, 1280px)' }}>
                    {children}
                </div>
            </main>

            {footer && (
                <footer className="mt-auto" style={{
                    backgroundColor: 'var(--footer-background-color, #0f172a)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <div className="mx-auto px-6 py-12" style={{ maxWidth: 'var(--container-width, 1280px)' }}>
                        {footer}
                    </div>
                </footer>
            )}
        </div>
    );
}
