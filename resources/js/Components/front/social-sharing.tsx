import { useCallback, useState } from 'react';
import { Tooltip } from '@/Components/ui/tooltip';
import type { SocialSharingProps } from '@/types/cms';

interface ShareButtonProps {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
}

function ShareButton({ label, onClick, children, className }: ShareButtonProps) {
    return (
        <Tooltip content={label}>
            <button
                type="button"
                onClick={onClick}
                aria-label={label}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${className ?? ''}`}
            >
                {children}
            </button>
        </Tooltip>
    );
}

/** Facebook icon */
function FacebookIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

/** Twitter/X icon */
function TwitterIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

/** LinkedIn icon */
function LinkedInIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    );
}

/** Email icon */
function EmailIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

/** Copy link icon */
function CopyIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
}

/** Checkmark icon for "copied" state */
function CheckIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function openShareWindow(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
}

export default function SocialSharing({
    url,
    title,
    description,
    direction = 'horizontal',
}: SocialSharingProps) {
    const [copied, setCopied] = useState(false);

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description ?? '');

    const handleFacebook = useCallback(() => {
        openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
    }, [encodedUrl]);

    const handleTwitter = useCallback(() => {
        openShareWindow(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`);
    }, [encodedUrl, encodedTitle]);

    const handleLinkedIn = useCallback(() => {
        openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`);
    }, [encodedUrl]);

    const handleEmail = useCallback(() => {
        const body = description ? `${encodedDescription}%20${encodedUrl}` : encodedUrl;
        window.location.href = `mailto:?subject=${encodedTitle}&body=${body}`;
    }, [encodedUrl, encodedTitle, encodedDescription, description]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [url]);

    const containerClass = direction === 'vertical'
        ? 'flex flex-col items-center gap-2'
        : 'flex flex-row items-center gap-2';

    return (
        <div className={containerClass} role="group" aria-label="Partager">
            <ShareButton
                label="Partager sur Facebook"
                onClick={handleFacebook}
                className="hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
            >
                <FacebookIcon />
            </ShareButton>

            <ShareButton
                label="Partager sur X (Twitter)"
                onClick={handleTwitter}
                className="hover:border-gray-800 hover:bg-gray-50 hover:text-gray-900"
            >
                <TwitterIcon />
            </ShareButton>

            <ShareButton
                label="Partager sur LinkedIn"
                onClick={handleLinkedIn}
                className="hover:border-blue-700 hover:bg-blue-50 hover:text-blue-700"
            >
                <LinkedInIcon />
            </ShareButton>

            <ShareButton
                label="Partager par email"
                onClick={handleEmail}
                className="hover:border-red-400 hover:bg-red-50 hover:text-red-500"
            >
                <EmailIcon />
            </ShareButton>

            <Tooltip content={copied ? 'Copie !' : 'Copier le lien'}>
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={copied ? 'Lien copie' : 'Copier le lien'}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                        copied
                            ? 'border-green-400 bg-green-50 text-green-600'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-green-400 hover:bg-green-50 hover:text-green-600'
                    }`}
                >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
            </Tooltip>
        </div>
    );
}
