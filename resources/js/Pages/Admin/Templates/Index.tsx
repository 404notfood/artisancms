import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { LayoutTemplate, Upload, Loader2, ChevronLeft, ChevronRight, Type, Palette, Settings2, Sparkles } from 'lucide-react';
import { useState, useCallback } from 'react';
import WizardStepTypography from './wizard/WizardStepTypography';
import WizardStepAnimations from './wizard/WizardStepAnimations';
import { DEFAULT_TYPOGRAPHY_CONFIG, type TypographyConfig } from './wizard/constants/typography-presets';
import { DEFAULT_ANIMATION_CONFIG, type AnimationConfig } from './wizard/constants/animation-presets';
import { type Template, type TemplateDetails, type WizardStep } from './components/types';
import TemplateCard from './components/TemplateCard';
import WizardProgressBar from './components/WizardProgressBar';
import WizardStepSummary from './components/WizardStepSummary';
import WizardStepColors from './components/WizardStepColors';
import WizardStepOptions from './components/WizardStepOptions';

interface Props {
    templates: Record<string, Template>;
    categories: Record<string, Template[]>;
}

const WIZARD_STEPS: WizardStep[] = [
    { id: 1, label: 'Template', icon: LayoutTemplate },
    { id: 2, label: 'Typographie', icon: Type },
    { id: 3, label: 'Couleurs', icon: Palette },
    { id: 4, label: 'Animations', icon: Sparkles },
    { id: 5, label: 'Options', icon: Settings2 },
];

const TOTAL_STEPS = WIZARD_STEPS.length;

export default function TemplatesIndex({ templates }: Props) {
    const [installing, setInstalling] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [details, setDetails] = useState<TemplateDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [step, setStep] = useState(1);
    const [typographyConfig, setTypographyConfig] = useState<TypographyConfig>(DEFAULT_TYPOGRAPHY_CONFIG);
    const [primaryColor, setPrimaryColor] = useState('#4f46e5');
    const [headingColor, setHeadingColor] = useState('#1e1b4b');
    const [textColor, setTextColor] = useState('#374151');
    const [animationConfig, setAnimationConfig] = useState<AnimationConfig>(DEFAULT_ANIMATION_CONFIG);
    const [selectedPages, setSelectedPages] = useState<string[]>([]);
    const [installMenus, setInstallMenus] = useState(true);
    const [installSettings, setInstallSettings] = useState(false);
    const [installTheme, setInstallTheme] = useState(true);
    const [overwrite, setOverwrite] = useState(false);
    const [includeLegalPages, setIncludeLegalPages] = useState(true);

    const templateList = Object.values(templates);

    const openInstallModal = useCallback((template: Template) => {
        setSelectedTemplate(template);
        setDetails(null);
        setStep(1);
        setTypographyConfig(DEFAULT_TYPOGRAPHY_CONFIG);
        setPrimaryColor('#4f46e5');
        setHeadingColor('#1e1b4b');
        setTextColor('#374151');
        setAnimationConfig(DEFAULT_ANIMATION_CONFIG);
        setSelectedPages([]);
        setInstallMenus(true);
        setInstallSettings(false);
        setInstallTheme(true);
        setOverwrite(false);
        setIncludeLegalPages(true);
        setModalOpen(true);
        setLoadingDetails(true);

        const pagesUrl = route('admin.templates.pages', { slug: template.slug });
        fetch(pagesUrl, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(res => res.json())
            .then((data: TemplateDetails) => {
                setDetails(data);
                setSelectedPages(data.pages.map(p => p.id));
                if (data.theme_summary?.primary_color) {
                    setPrimaryColor(data.theme_summary.primary_color);
                }
            })
            .catch(() => setDetails(null))
            .finally(() => setLoadingDetails(false));
    }, []);

    const togglePage = useCallback((pageId: string) => {
        setSelectedPages(prev =>
            prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId]
        );
    }, []);

    const selectAllPages = useCallback(() => {
        if (details) setSelectedPages(details.pages.map(p => p.id));
    }, [details]);

    const selectNoPages = useCallback(() => {
        setSelectedPages([]);
    }, []);

    const handleInstall = useCallback(() => {
        if (!selectedTemplate) return;
        setInstalling(selectedTemplate.slug);
        setModalOpen(false);

        router.post(route('admin.templates.install', { slug: selectedTemplate.slug }), {
            pages: selectedPages,
            install_menus: installMenus,
            install_settings: installSettings,
            install_theme: installTheme,
            overwrite,
            heading_font: typographyConfig.headingFont,
            body_font: typographyConfig.bodyFont,
            primary_color: primaryColor,
            heading_color: headingColor,
            text_color: textColor,
            include_legal_pages: includeLegalPages,
            typography_preset: typographyConfig.presetId,
            typography_config: JSON.stringify(typographyConfig),
            animation_preset: animationConfig.presetId,
            animation_config: JSON.stringify(animationConfig.config),
        }, {
            onFinish: () => setInstalling(null),
        });
    }, [selectedTemplate, selectedPages, installMenus, installSettings, installTheme, overwrite, typographyConfig, primaryColor, headingColor, textColor, includeLegalPages, animationConfig]);

    const selectedCount = selectedPages.length;
    const canGoPrev = step > 1;
    const isLastStep = step === TOTAL_STEPS;

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5" />
                    Templates de sites
                </h1>
            }
        >
            <Head title="Templates" />

            {templateList.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <LayoutTemplate className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Aucun template disponible</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Placez des templates dans <code className="bg-gray-100 px-1 rounded">content/templates/</code>
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templateList.map(template => (
                        <TemplateCard
                            key={template.slug}
                            template={template}
                            installing={installing === template.slug}
                            onInstall={openInstallModal}
                        />
                    ))}
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[680px] flex flex-col max-h-[90vh] overflow-hidden p-0">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
                        <DialogHeader>
                            <DialogTitle>
                                Installer &laquo;{selectedTemplate?.name}&raquo;
                            </DialogTitle>
                        </DialogHeader>
                        <WizardProgressBar steps={WIZARD_STEPS} currentStep={step} onStepClick={setStep} />
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {loadingDetails ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : !details ? (
                            <p className="text-sm text-red-500 py-8 text-center">
                                Impossible de charger les details du template.
                            </p>
                        ) : (
                            <>
                                {step === 1 && <WizardStepSummary template={selectedTemplate} details={details} />}
                                {step === 2 && (
                                    <WizardStepTypography
                                        config={typographyConfig}
                                        onChange={setTypographyConfig}
                                        headingColor={headingColor}
                                        textColor={textColor}
                                    />
                                )}
                                {step === 3 && (
                                    <WizardStepColors
                                        primaryColor={primaryColor}
                                        headingColor={headingColor}
                                        textColor={textColor}
                                        onPrimaryChange={setPrimaryColor}
                                        onHeadingChange={setHeadingColor}
                                        onTextChange={setTextColor}
                                    />
                                )}
                                {step === 4 && (
                                    <WizardStepAnimations config={animationConfig} onChange={setAnimationConfig} />
                                )}
                                {step === 5 && (
                                    <WizardStepOptions
                                        details={details}
                                        selectedPages={selectedPages}
                                        installMenus={installMenus}
                                        installSettings={installSettings}
                                        installTheme={installTheme}
                                        overwrite={overwrite}
                                        includeLegalPages={includeLegalPages}
                                        onTogglePage={togglePage}
                                        onSelectAll={selectAllPages}
                                        onSelectNone={selectNoPages}
                                        onInstallMenusChange={setInstallMenus}
                                        onInstallSettingsChange={setInstallSettings}
                                        onInstallThemeChange={setInstallTheme}
                                        onOverwriteChange={setOverwrite}
                                        onIncludeLegalPagesChange={setIncludeLegalPages}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-between sm:justify-between px-6 py-4 border-t border-gray-100 shrink-0">
                        <div>
                            {canGoPrev && (
                                <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Precedent
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setModalOpen(false)}>
                                Annuler
                            </Button>
                            {isLastStep ? (
                                <Button onClick={handleInstall} disabled={!details || selectedCount === 0}>
                                    <Upload className="h-4 w-4 mr-1" />
                                    Installer ({selectedCount})
                                </Button>
                            ) : (
                                <Button onClick={() => setStep(s => s + 1)} disabled={!details}>
                                    Suivant
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
