import { useState, useRef, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import SocialSharing from '@/Components/front/social-sharing';

interface ShareCountProps {
    url: string;
    title: string;
    description?: string;
    image?: string;
}

/** Share icon (arrow coming out of a box) */
function ShareIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
    );
}

export default function ShareCount({ url, title, description, image }: ShareCountProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!open) return;

        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    return (
        <div className="relative inline-block" ref={containerRef}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-haspopup="true"
                className="gap-1.5 text-gray-600 hover:text-gray-900"
            >
                <ShareIcon />
                <span>Partager</span>
            </Button>

            {/* Dropdown popover */}
            {open && (
                <div
                    className="absolute right-0 top-full z-50 mt-2 animate-in fade-in-0 zoom-in-95"
                    role="menu"
                >
                    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                        <p className="mb-2 text-xs font-medium text-gray-500">
                            Partager cet article
                        </p>
                        <SocialSharing
                            url={url}
                            title={title}
                            description={description}
                            image={image}
                            direction="horizontal"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
