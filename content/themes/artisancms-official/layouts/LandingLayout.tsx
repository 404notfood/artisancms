import type { ReactNode } from 'react';

interface LandingLayoutProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
}

export default function LandingLayout({ children, header, footer }: LandingLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
            {header && (
                <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{
                    backgroundColor: 'transparent',
                }}>
                    <div className="mx-auto px-6 py-5" style={{ maxWidth: 'var(--container-width, 1280px)' }}>
                        {header}
                    </div>
                </header>
            )}

            <main className="flex-1 w-full">
                {children}
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
