import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { ChevronRight, Check, Zap, Triangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import InstallLayout from './partials/InstallLayout';

interface Stack {
    id: string;
    name: string;
    description: string;
    features: string[];
    available: boolean;
    recommended: boolean;
    badge: string;
}

interface Props {
    stacks: Stack[];
    currentStack: string | null;
}

export default function Stack({ stacks, currentStack }: Props) {
    const [selected, setSelected] = useState<string>(currentStack ?? 'laravel');
    const [processing, setProcessing] = useState(false);

    const handleContinue = () => {
        setProcessing(true);
        router.post(route('install.stack.store'), { stack: selected }, {
            onFinish: () => setProcessing(false),
        });
    };

    const getStackIcon = (id: string) => {
        if (id === 'laravel') {
            return <Zap className="h-8 w-8 text-indigo-600" />;
        }
        return <Triangle className="h-8 w-8 text-gray-400" />;
    };

    return (
        <InstallLayout step={1} totalSteps={7}>
            <Head title="Installation - Choix du stack" />

            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Choisissez votre stack technique
                </h1>
                <p className="mt-2 text-gray-500">
                    Sélectionnez le stack backend et frontend pour votre installation.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {stacks.map((stack) => (
                    <Card
                        key={stack.id}
                        className={cn(
                            'relative cursor-pointer transition-all duration-200',
                            selected === stack.id && stack.available
                                ? 'ring-2 ring-indigo-600 border-indigo-600'
                                : 'hover:border-gray-300',
                            !stack.available && 'opacity-60 cursor-not-allowed'
                        )}
                        onClick={() => {
                            if (stack.available) {
                                setSelected(stack.id);
                            }
                        }}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                {getStackIcon(stack.id)}
                                {stack.recommended ? (
                                    <Badge variant="default">Recommandé</Badge>
                                ) : (
                                    <Badge variant="secondary">{stack.badge}</Badge>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {stack.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {stack.description}
                            </p>

                            <ul className="space-y-2">
                                {stack.features.map((feature, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2 text-sm text-gray-600"
                                    >
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {selected === stack.id && stack.available && (
                                <div className="absolute top-3 right-3">
                                    <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                    Les deux stacks partagent les mêmes composants React : page builder, blocs, thèmes et UI.
                </p>
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleContinue}
                    disabled={processing || !selected}
                    size="lg"
                >
                    Continuer
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </InstallLayout>
    );
}
