import type { ReactNode } from 'react';

interface DefaultLayoutProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
}

export default function DefaultLayout({ children, header, footer }: DefaultLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
            {header && (
                <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: 'var(--color-background, #ffffff)' }}>
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
                <footer className="border-t mt-auto" style={{ backgroundColor: 'var(--color-background, #ffffff)' }}>
                    <div className="mx-auto px-4 py-6" style={{ maxWidth: 'var(--container-width, 1280px)' }}>
                        {footer}
                    </div>
                </footer>
            )}
        </div>
    );
}
