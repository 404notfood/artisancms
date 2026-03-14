import type { ReactNode } from 'react';

interface FullWidthLayoutProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
}

export default function FullWidthLayout({ children, header, footer }: FullWidthLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
            {header && (
                <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: 'var(--color-background, #ffffff)' }}>
                    <div className="px-4 py-4">
                        {header}
                    </div>
                </header>
            )}

            <main className="flex-1 w-full">
                {children}
            </main>

            {footer && (
                <footer className="border-t mt-auto" style={{ backgroundColor: 'var(--color-background, #ffffff)' }}>
                    <div className="px-4 py-6">
                        {footer}
                    </div>
                </footer>
            )}
        </div>
    );
}
