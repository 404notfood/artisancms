import { useState } from 'react';

interface AnnouncementBarData {
    id: number;
    message: string;
    link_text?: string;
    link_url?: string;
    bg_color: string;
    text_color: string;
    position: 'top' | 'bottom';
    dismissible: boolean;
}

interface AnnouncementBarProps {
    announcement: AnnouncementBarData | null;
}

export function AnnouncementBar({ announcement }: AnnouncementBarProps) {
    const [dismissed, setDismissed] = useState(false);

    if (!announcement || dismissed) return null;

    // Check localStorage for previously dismissed
    const storageKey = `announcement_dismissed_${announcement.id}`;
    if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) {
        return null;
    }

    function handleDismiss() {
        setDismissed(true);
        if (announcement) {
            localStorage.setItem(`announcement_dismissed_${announcement.id}`, '1');
        }
    }

    const isTop = announcement.position === 'top';

    return (
        <div
            className={`relative z-40 ${isTop ? '' : 'fixed bottom-0 left-0 right-0'}`}
            style={{
                backgroundColor: announcement.bg_color,
                color: announcement.text_color,
            }}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2.5 text-sm">
                <span>{announcement.message}</span>
                {announcement.link_text && announcement.link_url && (
                    <a
                        href={announcement.link_url}
                        className="font-semibold underline underline-offset-2 hover:opacity-80"
                        style={{ color: announcement.text_color }}
                    >
                        {announcement.link_text}
                    </a>
                )}
                {announcement.dismissible && (
                    <button
                        onClick={handleDismiss}
                        className="ml-2 rounded-full p-1 hover:opacity-70 transition-opacity"
                        aria-label="Fermer"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
