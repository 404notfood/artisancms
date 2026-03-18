export default function SocialIcon({ platform, url, color }: { platform: string; url: string; color: string }) {
    if (!url) return null;

    const icons: Record<string, string> = {
        facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
        twitter: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
        instagram: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7.5 2h9A5.5 5.5 0 0122 7.5v9a5.5 5.5 0 01-5.5 5.5h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2z',
        linkedin: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z',
        github: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
        youtube: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29.94 29.94 0 001 11.75a29.94 29.94 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29.94 29.94 0 00.46-5.25 29.94 29.94 0 00-.46-5.33zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z',
        tiktok: 'M9 12a4 4 0 104 4V4a5 5 0 005 5',
        dribbble: 'M12 2a10 10 0 110 20 10 10 0 010-20zM2.05 13a10 10 0 007.54 8.46c-.28-2.6.16-5.62 1.41-8.46H2.05zM21.95 13h-8.95c-1.25 2.84-1.69 5.86-1.41 8.46A10 10 0 0021.95 13zM12 2a10 10 0 00-9.95 11h8.95a18.5 18.5 0 011-11zm0 0a18.5 18.5 0 00-1 11h8.95A10 10 0 0012 2z',
    };

    const d = icons[platform];
    if (!d) return null;

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70" style={{ color }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
            </svg>
        </a>
    );
}
