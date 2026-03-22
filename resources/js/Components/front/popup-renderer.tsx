import { useEffect, useState, useCallback } from 'react';
import BlockRenderer from './block-renderer';
import { X } from 'lucide-react';
import type { BlockNode } from '@/types/cms';

interface PopupData {
    id: number;
    name: string;
    title: string;
    content: BlockNode[] | string;
    type: string;
    trigger: string;
    trigger_value: string | number;
    display_frequency: string;
    style: Record<string, unknown> | null;
    cta_text?: string;
    cta_url?: string;
}

interface PopupRendererProps {
    popups: PopupData[];
}

const STORAGE_PREFIX = 'artisan_popup_';

function hasSeenPopup(id: number, frequency: string): boolean {
    try {
        const key = `${STORAGE_PREFIX}${id}`;
        const val = localStorage.getItem(key);
        if (!val) return false;
        if (frequency === 'once') return true;
        if (frequency === 'session') return sessionStorage.getItem(key) === '1';
        if (frequency === 'daily') {
            const stored = Number(val);
            return Date.now() - stored < 86400000;
        }
        return false;
    } catch {
        return false;
    }
}

function markSeen(id: number, frequency: string): void {
    try {
        const key = `${STORAGE_PREFIX}${id}`;
        localStorage.setItem(key, String(Date.now()));
        if (frequency === 'session') {
            sessionStorage.setItem(key, '1');
        }
    } catch {
        // ignore
    }
}

function PopupModal({ popup, onClose }: { popup: PopupData; onClose: () => void }) {
    const blocks = Array.isArray(popup.content) ? popup.content : [];
    const style = popup.style ?? {};

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div
                className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300"
                style={{
                    backgroundColor: style.backgroundColor as string,
                    maxWidth: style.maxWidth as string,
                }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                {popup.title && (
                    <div className="px-6 pt-6 pb-2">
                        <h2 className="text-xl font-bold text-gray-900">{popup.title}</h2>
                    </div>
                )}

                <div className="px-6 py-4">
                    {blocks.length > 0 ? (
                        blocks.map((block) => (
                            <BlockRenderer key={block.id} block={block} />
                        ))
                    ) : typeof popup.content === 'string' ? (
                        <div dangerouslySetInnerHTML={{ __html: popup.content }} />
                    ) : null}
                </div>

                {popup.cta_text && popup.cta_url && (
                    <div className="px-6 pb-6">
                        <a
                            href={popup.cta_url}
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            {popup.cta_text}
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PopupRenderer({ popups }: PopupRendererProps) {
    const [activePopup, setActivePopup] = useState<PopupData | null>(null);

    const closePopup = useCallback(() => {
        if (activePopup) {
            markSeen(activePopup.id, activePopup.display_frequency);
        }
        setActivePopup(null);
    }, [activePopup]);

    useEffect(() => {
        if (popups.length === 0) return;

        // Filter already-seen popups
        const eligible = popups.filter((p) => !hasSeenPopup(p.id, p.display_frequency));
        if (eligible.length === 0) return;

        const popup = eligible[0];

        if (popup.trigger === 'delay') {
            const delay = Number(popup.trigger_value) || 3;
            const timer = setTimeout(() => setActivePopup(popup), delay * 1000);
            return () => clearTimeout(timer);
        }

        if (popup.trigger === 'scroll') {
            const pct = Number(popup.trigger_value) || 50;
            const handler = () => {
                const scrollPct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
                if (scrollPct >= pct) {
                    setActivePopup(popup);
                    window.removeEventListener('scroll', handler);
                }
            };
            window.addEventListener('scroll', handler, { passive: true });
            return () => window.removeEventListener('scroll', handler);
        }

        if (popup.trigger === 'exit_intent') {
            const handler = (e: MouseEvent) => {
                if (e.clientY <= 5) {
                    setActivePopup(popup);
                    document.removeEventListener('mouseleave', handler);
                }
            };
            document.addEventListener('mouseleave', handler);
            return () => document.removeEventListener('mouseleave', handler);
        }

        // Default: show immediately
        setActivePopup(popup);
    }, [popups]);

    if (!activePopup) return null;

    return <PopupModal popup={activePopup} onClose={closePopup} />;
}
