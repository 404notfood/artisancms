import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X, type LucideIcon } from 'lucide-react';
import type { SharedProps } from '@/types/cms';

interface ToastItem {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

const TOAST_CONFIG: Record<ToastItem['type'], { icon: LucideIcon; bg: string; border: string; text: string }> = {
    success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
    error: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
};

let toastIdCounter = 0;

export default function FlashToasts({ flash }: { flash: SharedProps['flash'] }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        const incoming: ToastItem[] = [];
        for (const type of ['success', 'error', 'warning', 'info'] as const) {
            if (flash?.[type]) {
                incoming.push({ id: ++toastIdCounter, type, message: flash[type]! });
            }
        }
        if (incoming.length > 0) setToasts((prev) => [...prev, ...incoming]);
    }, [flash]);

    useEffect(() => {
        if (toasts.length === 0) return;
        const timer = setTimeout(() => setToasts((prev) => prev.slice(1)), 5000);
        return () => clearTimeout(timer);
    }, [toasts]);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
            {toasts.map((toast) => {
                const cfg = TOAST_CONFIG[toast.type];
                const Icon = cfg.icon;
                return (
                    <div
                        key={toast.id}
                        className={cn(
                            'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-5 fade-in duration-300',
                            cfg.bg, cfg.border,
                        )}
                    >
                        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', cfg.text)} />
                        <p className={cn('text-sm font-medium flex-1', cfg.text)}>{toast.message}</p>
                        <button onClick={() => dismiss(toast.id)} className={cn('shrink-0 hover:opacity-70', cfg.text)}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
