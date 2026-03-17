import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import {
    CheckCircle,
    Circle,
    FileText,
    Image,
    Menu,
    Palette,
    Settings,
    Globe,
    ArrowRight,
    Sparkles,
} from 'lucide-react';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    href: string;
    completed: boolean;
    icon: typeof FileText;
}

interface OnboardingProps {
    steps: Array<{
        id: string;
        title: string;
        description: string;
        href: string;
        completed: boolean;
    }>;
    completionPercentage: number;
}

const STEP_ICONS: Record<string, typeof FileText> = {
    create_page: FileText,
    upload_media: Image,
    create_menu: Menu,
    choose_theme: Palette,
    configure_settings: Settings,
    setup_seo: Globe,
};

export default function OnboardingIndex({ steps, completionPercentage }: OnboardingProps) {
    const stepsWithIcons: OnboardingStep[] = steps.map((step) => ({
        ...step,
        icon: STEP_ICONS[step.id] ?? Circle,
    }));

    const allDone = completionPercentage >= 100;

    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">Prise en main</h1>}
        >
            <Head title="Prise en main" />

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Progress */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Sparkles className="h-6 w-6 text-indigo-500" />
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {allDone ? 'Felicitations !' : 'Bienvenue sur ArtisanCMS'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {allDone
                                        ? 'Vous avez complete toutes les etapes de configuration.'
                                        : 'Completez ces etapes pour bien demarrer.'}
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-right">
                            {completionPercentage}% complete
                        </p>
                    </CardContent>
                </Card>

                {/* Steps */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Checklist de demarrage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        {stepsWithIcons.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <Link
                                    key={step.id}
                                    href={step.href}
                                    className={cn(
                                        'flex items-center gap-4 rounded-lg px-4 py-3 transition-colors group',
                                        step.completed
                                            ? 'bg-emerald-50/50 hover:bg-emerald-50'
                                            : 'hover:bg-gray-50',
                                    )}
                                >
                                    <div className="shrink-0">
                                        {step.completed ? (
                                            <CheckCircle className="h-6 w-6 text-emerald-500" />
                                        ) : (
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 text-xs font-bold text-gray-400">
                                                {index + 1}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            'text-sm font-medium',
                                            step.completed ? 'text-emerald-700' : 'text-gray-900',
                                        )}>
                                            {step.title}
                                        </p>
                                        <p className="text-xs text-gray-500">{step.description}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                </Link>
                            );
                        })}
                    </CardContent>
                </Card>

                {allDone && (
                    <div className="text-center">
                        <Button asChild>
                            <Link href="/admin">Aller au tableau de bord</Link>
                        </Button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
