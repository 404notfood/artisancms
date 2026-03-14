import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import type { CookiePreferences } from '@/types/cms';

interface CookieCategoryProps {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

function CookieCategory({ label, description, checked, disabled, onCheckedChange }: CookieCategoryProps) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    {disabled && (
                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                            Toujours actif
                        </span>
                    )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
            </div>
            <Switch
                checked={checked}
                disabled={disabled}
                onCheckedChange={onCheckedChange}
                aria-label={label}
            />
        </div>
    );
}

interface CookiePreferencesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (preferences: CookiePreferences) => void;
}

export default function CookiePreferencesModal({ open, onOpenChange, onSave }: CookiePreferencesModalProps) {
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);

    const handleSave = () => {
        onSave({
            necessary: true,
            analytics,
            marketing,
            consented_at: new Date().toISOString(),
        });
    };

    const handleAcceptAll = () => {
        onSave({
            necessary: true,
            analytics: true,
            marketing: true,
            consented_at: new Date().toISOString(),
        });
    };

    const handleRejectAll = () => {
        onSave({
            necessary: true,
            analytics: false,
            marketing: false,
            consented_at: new Date().toISOString(),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Preferences de cookies</DialogTitle>
                    <DialogDescription>
                        Choisissez les categories de cookies que vous acceptez.
                        Les cookies necessaires ne peuvent pas etre desactives car ils
                        sont indispensables au fonctionnement du site.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-2">
                    <CookieCategory
                        label="Necessaires"
                        description="Ces cookies sont indispensables au fonctionnement du site. Ils permettent la navigation, la securite et les fonctionnalites de base."
                        checked={true}
                        disabled={true}
                    />

                    <CookieCategory
                        label="Analytiques"
                        description="Ces cookies nous aident a comprendre comment les visiteurs interagissent avec le site en collectant des informations de maniere anonyme."
                        checked={analytics}
                        onCheckedChange={setAnalytics}
                    />

                    <CookieCategory
                        label="Marketing"
                        description="Ces cookies sont utilises pour suivre les visiteurs sur les sites web afin de proposer des publicites pertinentes."
                        checked={marketing}
                        onCheckedChange={setMarketing}
                    />
                </div>

                <DialogFooter>
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRejectAll}
                        >
                            Tout refuser
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleSave}
                            >
                                Enregistrer mes choix
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleAcceptAll}
                            >
                                Tout accepter
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
