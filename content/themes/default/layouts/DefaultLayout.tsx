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
                <header className="sticky top-0 z-50" style={{
                    backgroundColor: 'var(--header-background-color, var(--color-background, #ffffff))',
                    borderBottom: '1px solid var(--color-border, #e2e8f0)',
                }}>
                    <div className="mx-auto px-4 py-4" style={{ maxWidth: 'var(--container-width, 1280px)' }}>
                        {header}
                    </div>
                </header>
            )}

            <main className="flex-1">
                <div className="mx-auto px-4 py-8" style={{ maxWidth: 'var(--container-width, 1280px)' }}>
                    {children}
                </div>
            </main>

            {footer && (
                <footer className="mt-auto" style={{
                    backgroundColor: 'var(--footer-background-color, var(--color-surface, #f8fafc))',
                    borderTop: '1px solid var(--color-border, #e2e8f0)',
                }}>
                    <div className="mx-auto px-4 py-6" style={{ maxWidth: 'var(--container-width, 1280px)' }}>
                        {footer}
                    </div>
                </footer>
            )}
        </div>
    );
}
