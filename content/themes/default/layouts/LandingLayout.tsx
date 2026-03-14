import type { ReactNode } from 'react';

interface LandingLayoutProps {
    children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
    return (
        <div className="min-h-screen" style={{ fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
            <main className="w-full">
                {children}
            </main>
        </div>
    );
}
