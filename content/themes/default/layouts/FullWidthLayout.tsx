import type { ReactNode } from 'react';

interface FullWidthLayoutProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
}

export default function FullWidthLayout({ children, header, footer }: FullWidthLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)' }}>
            {header && (
                <header className="sticky top-0 z-50" style={{
                    backgroundColor: 'var(--header-background-color, var(--color-background, #ffffff))',
                    borderBottom: '1px solid var(--color-border, #e2e8f0)',
                }}>
                    <div className="px-4 py-4">
                        {header}
                    </div>
                </header>
            )}

            <main className="flex-1 w-full">
                {children}
            </main>

            {footer && (
                <footer className="mt-auto" style={{
                    backgroundColor: 'var(--footer-background-color, var(--color-surface, #f8fafc))',
                    borderTop: '1px solid var(--color-border, #e2e8f0)',
                }}>
                    <div className="px-4 py-6">
                        {footer}
                    </div>
                </footer>
            )}
        </div>
    );
}
