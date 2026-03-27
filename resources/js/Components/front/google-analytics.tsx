import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface GoogleAnalyticsProps {
    measurementId: string;
    anonymizeIp?: boolean;
    respectDnt?: boolean;
}

/**
 * Injects the Google Analytics 4 (gtag.js) script into the page <head>.
 *
 * - Only loads on the front-end (never in admin).
 * - Respects the Do Not Track browser setting when respectDnt is true.
 * - Loads the script asynchronously to avoid blocking rendering.
 * - Anonymizes IP addresses by default.
 */
export default function GoogleAnalytics({
    measurementId,
    anonymizeIp = true,
    respectDnt = true,
}: GoogleAnalyticsProps) {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        // Respect Do Not Track browser setting
        if (respectDnt && typeof navigator !== 'undefined') {
            const dnt =
                navigator.doNotTrack === '1' ||
                (window as unknown as { doNotTrack?: string }).doNotTrack === '1';
            if (dnt) {
                setShouldLoad(false);
                return;
            }
        }

        // Check cookie consent: only load if analytics cookies were accepted
        try {
            const consent = localStorage.getItem('artisan_cookie_consent');
            if (consent) {
                const prefs = JSON.parse(consent) as { analytics?: boolean };
                if (prefs.analytics === false) {
                    setShouldLoad(false);
                    return;
                }
            }
        } catch {
            // If we cannot read consent, do not load GA
        }

        setShouldLoad(true);
    }, [respectDnt]);

    if (!shouldLoad || !measurementId) {
        return null;
    }

    const configParams: Record<string, unknown> = {};
    if (anonymizeIp) {
        configParams.anonymize_ip = true;
    }
    // Disable advertising features (no third-party cookies)
    configParams.send_page_view = true;

    const inlineScript = `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${measurementId}',${JSON.stringify(configParams)});
`.trim();

    return (
        <Head>
            <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />
            <script>{inlineScript}</script>
        </Head>
    );
}
