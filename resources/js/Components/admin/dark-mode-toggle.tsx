import { useCallback, useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'artisan-theme';

function getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system';
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === 'light' || v === 'dark') return v;
    } catch {}
    return 'system';
}

function resolveEffective(theme: Theme): 'light' | 'dark' {
    if (theme !== 'system') return theme;
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(effective: 'light' | 'dark') {
    const cl = document.documentElement.classList;
    if (effective === 'dark') {
        cl.add('dark');
    } else {
        cl.remove('dark');
    }
}

const cycle: Theme[] = ['light', 'dark', 'system'];

export default function DarkModeToggle({ className }: { className?: string }) {
    const [theme, setTheme] = useState<Theme>(getStoredTheme);
    const effective = resolveEffective(theme);

    // Apply on mount and when theme changes
    useEffect(() => {
        applyTheme(effective);
    }, [effective]);

    // Persist
    useEffect(() => {
        try {
            if (theme === 'system') {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, theme);
            }
        } catch {}
    }, [theme]);

    // Listen to OS preference changes when in system mode
    useEffect(() => {
        if (theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [theme]);

    const next = useCallback(() => {
        setTheme((prev) => cycle[(cycle.indexOf(prev) + 1) % cycle.length]);
    }, []);

    const icon = theme === 'system'
        ? <Monitor className="h-[1.15rem] w-[1.15rem]" />
        : effective === 'dark'
            ? <Moon className="h-[1.15rem] w-[1.15rem]" />
            : <Sun className="h-[1.15rem] w-[1.15rem]" />;

    const label = theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Systeme';

    return (
        <button
            type="button"
            onClick={next}
            className={cn('dark-mode-toggle', className)}
            title={`Theme : ${label}`}
            aria-label={`Changer le theme (actuel : ${label})`}
        >
            {icon}
        </button>
    );
}
