import { useCallback, useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Tooltip } from '@/Components/ui/tooltip';

interface FullscreenToggleProps {
    className?: string;
}

export default function FullscreenToggle({ className }: FullscreenToggleProps) {
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggle = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                toggle();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [toggle]);

    const Icon = isFullscreen ? Minimize2 : Maximize2;
    const label = isFullscreen ? 'Quitter le plein écran' : 'Plein écran (Ctrl+Shift+F)';

    return (
        <Tooltip content={label} side="bottom">
            <button
                type="button"
                onClick={toggle}
                className={`p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors ${className ?? ''}`}
                aria-label={label}
            >
                <Icon className="h-4 w-4" />
            </button>
        </Tooltip>
    );
}
