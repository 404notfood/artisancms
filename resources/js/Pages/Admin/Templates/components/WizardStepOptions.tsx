import { Switch } from '@/Components/ui/switch';
import { Label } from '@/Components/ui/label';
import { Check } from 'lucide-react';
import { type TemplateDetails } from './types';

interface WizardStepOptionsProps {
    details: TemplateDetails;
    selectedPages: string[];
    installMenus: boolean;
    installSettings: boolean;
    installTheme: boolean;
    overwrite: boolean;
    includeLegalPages: boolean;
    onTogglePage: (pageId: string) => void;
    onSelectAll: () => void;
    onSelectNone: () => void;
    onInstallMenusChange: (value: boolean) => void;
    onInstallSettingsChange: (value: boolean) => void;
    onInstallThemeChange: (value: boolean) => void;
    onOverwriteChange: (value: boolean) => void;
    onIncludeLegalPagesChange: (value: boolean) => void;
}

export default function WizardStepOptions({
    details,
    selectedPages,
    installMenus,
    installSettings,
    installTheme,
    overwrite,
    includeLegalPages,
    onTogglePage,
    onSelectAll,
    onSelectNone,
    onInstallMenusChange,
    onInstallSettingsChange,
    onInstallThemeChange,
    onOverwriteChange,
    onIncludeLegalPagesChange,
}: WizardStepOptionsProps) {
    const selectedCount = selectedPages.length;

    return (
        <div className="space-y-5">
            {/* Pages selection */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">
                        Pages ({selectedCount}/{details.pages.length})
                    </h3>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onSelectAll}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            Tout
                        </button>
                        <span className="text-xs text-gray-300">|</span>
                        <button
                            type="button"
                            onClick={onSelectNone}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            Aucune
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {details.pages.map(page => {
                        const isSelected = selectedPages.includes(page.id);
                        return (
                            <button
                                key={page.id}
                                type="button"
                                onClick={() => onTogglePage(page.id)}
                                className={`text-left border rounded-lg p-3 transition-colors ${
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0">
                                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                            {page.title}
                                        </p>
                                        <p className={`text-xs truncate ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                            /{page.slug}
                                        </p>
                                        <p className={`text-xs mt-1 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                                            {page.blocks_count} blocs
                                        </p>
                                    </div>
                                    <div className={`shrink-0 w-4 h-4 rounded border mt-0.5 flex items-center justify-center ${
                                        isSelected
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-gray-300'
                                    }`}>
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Toggles */}
            <div className="border-t pt-4 space-y-4">
                {/* Legal pages toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="legal-pages" className="text-sm">Generer les pages legales</Label>
                        <p className="text-xs text-gray-400">
                            Mentions legales, Confidentialite, Cookies
                        </p>
                    </div>
                    <Switch id="legal-pages" checked={includeLegalPages} onCheckedChange={onIncludeLegalPagesChange} />
                </div>

                {details.menus.length > 0 && (
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="install-menus" className="text-sm">Importer les menus</Label>
                            <p className="text-xs text-gray-400">
                                {details.menus.map(m => `${m.name} (${m.items_count} items)`).join(', ')}
                            </p>
                        </div>
                        <Switch id="install-menus" checked={installMenus} onCheckedChange={onInstallMenusChange} />
                    </div>
                )}

                {details.has_settings && (
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="install-settings" className="text-sm">Appliquer les parametres</Label>
                            <p className="text-xs text-gray-400">Nom du site, description, etc.</p>
                        </div>
                        <Switch id="install-settings" checked={installSettings} onCheckedChange={onInstallSettingsChange} />
                    </div>
                )}

                {details.has_theme_overrides && (
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="install-theme" className="text-sm">Appliquer le theme</Label>
                        </div>
                        <Switch id="install-theme" checked={installTheme} onCheckedChange={onInstallThemeChange} />
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="overwrite" className="text-sm">Remplacer le contenu existant</Label>
                        <p className="text-xs text-gray-400">Ecrase les pages/menus avec le meme slug</p>
                    </div>
                    <Switch id="overwrite" checked={overwrite} onCheckedChange={onOverwriteChange} />
                </div>
            </div>
        </div>
    );
}
