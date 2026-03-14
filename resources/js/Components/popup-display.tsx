import { useEffect, useState, useCallback } from 'react';
import { usePage } from '@inertiajs/react';

interface PopupData {
    id: number;
    name: string;
    title: string | null;
    content: string | null;
    type: 'modal' | 'banner' | 'slide-in';
    trigger: 'page_load' | 'exit_intent' | 'scroll' | 'delay';
    trigger_value: string | null;
    display_frequency: 'always' | 'once' | 'once_per_session';
    cta_text: string | null;
    cta_url: string | null;
    style: { backgroundColor?: string; textColor?: string } | null;
}

function getStorageKey(popupId: number): string {
    return `artisancms_popup_${popupId}_dismissed`;
}

function shouldShowPopup(popup: PopupData): boolean {
    if (popup.display_frequency === 'always') return true;

    const key = getStorageKey(popup.id);

    if (popup.display_frequency === 'once') {
        return !localStorage.getItem(key);
    }

    if (popup.display_frequency === 'once_per_session') {
        return !sessionStorage.getItem(key);
    }

    return true;
}

function markDismissed(popup: PopupData): void {
    const key = getStorageKey(popup.id);

    if (popup.display_frequency === 'once') {
        localStorage.setItem(key, '1');
    } else if (popup.display_frequency === 'once_per_session') {
        sessionStorage.setItem(key, '1');
    }
}

function PopupRenderer({ popup, onClose }: { popup: PopupData; onClose: () => void }) {
    const bgColor = popup.style?.backgroundColor ?? '#ffffff';
    const textColor = popup.style?.textColor ?? '#1f2937';

    if (popup.type === 'banner') {
        return (
            <div
                className="fixed top-0 left-0 right-0 z-[9999] shadow-md"
                style={{ backgroundColor: bgColor, color: textColor }}
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        {popup.title && (
                            <span className="font-semibold text-sm">{popup.title}</span>
                        )}
                        {popup.content && (
                            <span
                                className="text-sm"
                                dangerouslySetInnerHTML={{ __html: popup.content }}
                            />
                        )}
                        {popup.cta_text && popup.cta_url && (
                            <a
                                href={popup.cta_url}
                                className="px-3 py-1 rounded text-xs font-medium whitespace-nowrap"
                                style={{ backgroundColor: textColor, color: bgColor }}
                            >
                                {popup.cta_text}
                            </a>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-current opacity-60 hover:opacity-100 text-lg leading-none"
                        aria-label="Fermer"
                    >
                        &times;
                    </button>
                </div>
            </div>
        );
    }

    if (popup.type === 'slide-in') {
        return (
            <div
                className="fixed bottom-4 right-4 z-[9999] rounded-lg shadow-xl max-w-sm w-full animate-in slide-in-from-bottom-5"
                style={{ backgroundColor: bgColor, color: textColor }}
            >
                <div className="p-4">
                    <div className="flex justify-end mb-1">
                        <button
                            onClick={onClose}
                            className="text-current opacity-60 hover:opacity-100 text-sm leading-none"
                            aria-label="Fermer"
                        >
                            &times;
                        </button>
                    </div>
                    {popup.title && (
                        <h4 className="font-semibold text-base mb-1">{popup.title}</h4>
                    )}
                    {popup.content && (
                        <div
                            className="text-sm mb-3"
                            dangerouslySetInnerHTML={{ __html: popup.content }}
                        />
                    )}
                    {popup.cta_text && popup.cta_url && (
                        <a
                            href={popup.cta_url}
                            className="inline-block px-4 py-2 rounded text-sm font-medium"
                            style={{ backgroundColor: textColor, color: bgColor }}
                        >
                            {popup.cta_text}
                        </a>
                    )}
                </div>
            </div>
        );
    }

    // Modal (default)
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />
            {/* Content */}
            <div
                className="relative rounded-lg shadow-xl max-w-md w-full mx-4 animate-in zoom-in-95"
                style={{ backgroundColor: bgColor, color: textColor }}
            >
                <div className="p-6">
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={onClose}
                            className="text-current opacity-60 hover:opacity-100 text-xl leading-none"
                            aria-label="Fermer"
                        >
                            &times;
                        </button>
                    </div>
                    {popup.title && (
                        <h3 className="font-semibold text-lg mb-2">{popup.title}</h3>
                    )}
                    {popup.content && (
                        <div
                            className="text-sm mb-4"
                            dangerouslySetInnerHTML={{ __html: popup.content }}
                        />
                    )}
                    {popup.cta_text && popup.cta_url && (
                        <a
                            href={popup.cta_url}
                            className="inline-block px-5 py-2.5 rounded text-sm font-medium"
                            style={{ backgroundColor: textColor, color: bgColor }}
                        >
                            {popup.cta_text}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PopupDisplay() {
    const { popups = [] } = usePage().props as unknown as { popups: PopupData[] };
    const [visiblePopups, setVisiblePopups] = useState<Set<number>>(new Set());

    const showPopup = useCallback((popupId: number) => {
        setVisiblePopups(prev => new Set(prev).add(popupId));
    }, []);

    const closePopup = useCallback((popup: PopupData) => {
        markDismissed(popup);
        setVisiblePopups(prev => {
            const next = new Set(prev);
            next.delete(popup.id);
            return next;
        });
    }, []);

    useEffect(() => {
        if (!popups || popups.length === 0) return;

        const cleanups: (() => void)[] = [];

        popups.forEach(popup => {
            if (!shouldShowPopup(popup)) return;

            switch (popup.trigger) {
                case 'page_load':
                    showPopup(popup.id);
                    break;

                case 'delay': {
                    const delayMs = (parseInt(popup.trigger_value ?? '3', 10) || 3) * 1000;
                    const timer = setTimeout(() => showPopup(popup.id), delayMs);
                    cleanups.push(() => clearTimeout(timer));
                    break;
                }

                case 'scroll': {
                    const threshold = parseInt(popup.trigger_value ?? '50', 10) || 50;
                    let triggered = false;
                    const handler = () => {
                        if (triggered) return;
                        const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                        if (scrollPercentage >= threshold) {
                            triggered = true;
                            showPopup(popup.id);
                        }
                    };
                    window.addEventListener('scroll', handler, { passive: true });
                    cleanups.push(() => window.removeEventListener('scroll', handler));
                    break;
                }

                case 'exit_intent': {
                    let triggered = false;
                    const handler = (e: MouseEvent) => {
                        if (triggered) return;
                        if (e.clientY <= 0) {
                            triggered = true;
                            showPopup(popup.id);
                        }
                    };
                    document.addEventListener('mouseleave', handler);
                    cleanups.push(() => document.removeEventListener('mouseleave', handler));
                    break;
                }
            }
        });

        return () => cleanups.forEach(fn => fn());
    }, [popups, showPopup]);

    if (!popups || popups.length === 0) return null;

    return (
        <>
            {popups
                .filter(p => visiblePopups.has(p.id))
                .map(popup => (
                    <PopupRenderer
                        key={popup.id}
                        popup={popup}
                        onClose={() => closePopup(popup)}
                    />
                ))}
        </>
    );
}
