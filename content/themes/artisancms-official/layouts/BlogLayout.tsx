import type { ReactNode } from 'react';

interface BlogLayoutProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    sidebar?: ReactNode;
}

export default function BlogLayout({ children, header, footer, sidebar }: BlogLayoutProps) {
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
                    <div className="flex gap-12" style={{ flexDirection: 'var(--sidebar-position, right)' === 'left' ? 'row-reverse' : 'row' }}>
                        <div className="flex-1 min-w-0" style={{ maxWidth: 'var(--content-width, 65ch)' }}>
                            {children}
                        </div>
                        {sidebar && (
                            <aside className="hidden lg:block w-72 shrink-0">
                                {sidebar}
                            </aside>
                        )}
                    </div>
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
