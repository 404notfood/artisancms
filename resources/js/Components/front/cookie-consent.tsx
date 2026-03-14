import { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import type { SharedProps, CookieConsentConfig, CookiePreferences } from '@/types/cms';
import CookiePreferencesModal from '@/Components/front/cookie-preferences';

const STORAGE_KEY = 'artisan_cookie_consent';

interface CookieConsentBannerProps {
    /** Override config from Inertia shared data */
    config?: Partial<CookieConsentConfig>;
}

function getStoredConsent(): CookiePreferences | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored) as CookiePreferences;
    } catch {
        return null;
    }
}

function storeConsent(preferences: CookiePreferences): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export default function CookieConsentBanner({ config: configOverride }: CookieConsentBannerProps) {
    const { cookie_consent: sharedConfig } = usePage<SharedProps>().props;
    const config: CookieConsentConfig = { ...sharedConfig, ...configOverride };

    const [visible, setVisible] = useState(false);
    const [animate, setAnimate] = useState(false);
    const [preferencesOpen, setPreferencesOpen] = useState(false);

    useEffect(() => {
        if (!config.enabled) return;

        const existing = getStoredConsent();
        if (!existing) {
            // Small delay so the page loads first
            const timer = setTimeout(() => {
                setVisible(true);
                // Trigger animation after mount
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setAnimate(true);
                    });
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [config.enabled]);

    const dismiss = useCallback((preferences: CookiePreferences) => {
        storeConsent(preferences);
        setAnimate(false);
        // Wait for slide-out animation before removing from DOM
        setTimeout(() => setVisible(false), 300);
    }, []);

    const handleAcceptAll = useCallback(() => {
        dismiss({
            necessary: true,
            analytics: true,
            marketing: true,
            consented_at: new Date().toISOString(),
        });
    }, [dismiss]);

    const handleRejectAll = useCallback(() => {
        dismiss({
            necessary: true,
            analytics: false,
            marketing: false,
            consented_at: new Date().toISOString(),
        });
    }, [dismiss]);

    const handleInfoOk = useCallback(() => {
        dismiss({
            necessary: true,
            analytics: false,
            marketing: false,
            consented_at: new Date().toISOString(),
        });
    }, [dismiss]);

    const handleSavePreferences = useCallback((preferences: CookiePreferences) => {
        dismiss(preferences);
        setPreferencesOpen(false);
    }, [dismiss]);

    if (!visible || !config.enabled) return null;

    const isBottom = config.position === 'bottom';
    const isTop = config.position === 'top';

    const slideClass = isBottom
        ? animate ? 'translate-y-0' : 'translate-y-full'
        : animate ? 'translate-y-0' : '-translate-y-full';

    const positionClass = isBottom ? 'bottom-0' : 'top-0';

    return (
        <>
            {/* Semi-transparent backdrop */}
            <div
                className={`fixed inset-0 z-[9998] bg-black/20 transition-opacity duration-300 ${
                    animate ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden="true"
            />

            {/* Banner */}
            <div
                role="dialog"
                aria-label="Consentement aux cookies"
                aria-modal="false"
                className={`fixed left-0 right-0 ${positionClass} z-[9999] transform transition-transform duration-300 ease-in-out ${slideClass}`}
            >
                <div className="mx-auto max-w-5xl px-4 py-4">
                    <div className="rounded-xl border border-gray-200 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            {/* Message */}
                            <div className="flex-1">
                                <p className="text-sm leading-relaxed text-gray-700">
                                    Ce site utilise des cookies pour ameliorer votre experience.{' '}
                                    <a
                                        href={config.privacy_url}
                                        className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
                                    >
                                        Politique de confidentialite
                                    </a>
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                {config.type === 'opt-in' && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setPreferencesOpen(true)}
                                        >
                                            Personnaliser
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleRejectAll}
                                        >
                                            Refuser
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={handleAcceptAll}
                                        >
                                            Accepter
                                        </Button>
                                    </>
                                )}

                                {config.type === 'opt-out' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleRejectAll}
                                            className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700"
                                        >
                                            Refuser les cookies
                                        </button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={handleAcceptAll}
                                        >
                                            OK
                                        </Button>
                                    </>
                                )}

                                {config.type === 'info-only' && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleInfoOk}
                                    >
                                        J&apos;ai compris
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preferences modal */}
            {preferencesOpen && (
                <CookiePreferencesModal
                    open={preferencesOpen}
                    onOpenChange={setPreferencesOpen}
                    onSave={handleSavePreferences}
                />
            )}
        </>
    );
}
