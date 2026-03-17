import { useEffect, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';

interface FullscreenToggleProps {
    className?: string;
}

export default function FullscreenToggle({ className }: FullscreenToggleProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handler = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const toggle = () => {
        if (isFullscreen) {
            document.exitFullscreen().catch(() => {});
        } else {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    };

    // Keyboard shortcut F11
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'F11') {
                e.preventDefault();
                toggle();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isFullscreen]);

    return (
        <button
            type="button"
            onClick={toggle}
            className={`p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors ${className ?? ''}`}
            title={isFullscreen ? 'Quitter le plein ecran' : 'Plein ecran'}
        >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
    );
}
