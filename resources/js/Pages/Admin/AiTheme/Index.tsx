import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { Sparkles, Loader2, Check, Palette } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface ActiveTheme {
    slug: string;
    name: string;
}

interface GeneratedColors {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    text?: string;
}

interface GeneratedFonts {
    heading?: string;
    body?: string;
}

interface SuggestedPage {
    type: string;
    title: string;
    description: string;
}

interface GeneratedTheme {
    theme_name: string;
    colors: GeneratedColors;
    fonts: GeneratedFonts;
    css_variables: Record<string, string>;
    suggested_pages: SuggestedPage[];
    tokens_used: number;
}

interface Props {
    activeTheme: ActiveTheme | null;
    industries: SelectOption[];
    styles: SelectOption[];
}

export default function AiThemeIndex({ activeTheme, industries, styles }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';

    const [prompt, setPrompt] = useState('');
    const [industry, setIndustry] = useState('');
    const [style, setStyle] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#4f46e5');
    const [secondaryColor, setSecondaryColor] = useState('#64748b');
    const [generating, setGenerating] = useState(false);
    const [applying, setApplying] = useState(false);
    const [result, setResult] = useState<GeneratedTheme | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [applied, setApplied] = useState(false);

    const handleGenerate = async (e: FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        setError(null);
        setResult(null);
        setApplied(false);

        try {
            const response = await fetch(`/${prefix}/ai-theme/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
                    ),
                },
                body: JSON.stringify({
                    prompt,
                    industry: industry || null,
                    style: style || null,
                    primary_color: primaryColor || null,
                    secondary_color: secondaryColor || null,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || 'Une erreur est survenue lors de la generation.');
                return;
            }

            setResult(data.data);
        } catch {
            setError('Impossible de contacter le serveur. Verifiez que le plugin AI Assistant est actif.');
        } finally {
            setGenerating(false);
        }
    };

    const handleApply = async () => {
        if (!result || !activeTheme) return;

        setApplying(true);
        setError(null);

        try {
            const response = await fetch(`/${prefix}/ai-theme/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
                    ),
                },
                body: JSON.stringify({
                    theme_slug: activeTheme.slug,
                    generated_data: result,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || 'Impossible d\'appliquer le theme.');
                return;
            }

            setApplied(true);
        } catch {
            setError('Erreur lors de l\'application du theme.');
        } finally {
            setApplying(false);
        }
    };

    const colorEntries = result?.colors ? Object.entries(result.colors) : [];

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Theme Generator
                </h1>
            }
        >
            <Head title="AI Theme Generator" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Decrivez votre site</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <Label htmlFor="prompt">Description du site *</Label>
                                <Textarea
                                    id="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ex: Un site pour un restaurant gastronomique parisien, ambiance chaleureuse et raffinee..."
                                    rows={4}
                                    required
                                    minLength={10}
                                    maxLength={1000}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="industry">Secteur</Label>
                                    <Select
                                        id="industry"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                    >
                                        <option value="">-- Choisir --</option>
                                        {industries.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="style">Style</Label>
                                    <Select
                                        id="style"
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                    >
                                        <option value="">-- Choisir --</option>
                                        {styles.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="primary_color">Couleur principale</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="color"
                                            id="primary_color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="h-9 w-12 p-1 cursor-pointer"
                                        />
                                        <Input
                                            type="text"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="flex-1"
                                            pattern="^#[0-9a-fA-F]{6}$"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="secondary_color">Couleur secondaire</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="color"
                                            id="secondary_color"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="h-9 w-12 p-1 cursor-pointer"
                                        />
                                        <Input
                                            type="text"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="flex-1"
                                            pattern="^#[0-9a-fA-F]{6}$"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={generating || prompt.length < 10}
                                className="w-full gap-2"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generation en cours...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Generer le theme
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Right: Preview */}
                <div className="space-y-6">
                    {result && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="h-5 w-5" />
                                        {result.theme_name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Color palette */}
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Palette de couleurs</Label>
                                        <div className="flex gap-2">
                                            {colorEntries.map(([name, hex]) => (
                                                <div key={name} className="text-center">
                                                    <div
                                                        className="w-12 h-12 rounded-lg border shadow-sm"
                                                        style={{ backgroundColor: hex }}
                                                        title={`${name}: ${hex}`}
                                                    />
                                                    <span className="text-xs text-gray-500 mt-1 block">{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Fonts */}
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Typographie</Label>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <span className="text-gray-500">Titres</span>
                                                <p className="font-semibold">{result.fonts.heading || '-'}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <span className="text-gray-500">Corps</span>
                                                <p className="font-semibold">{result.fonts.body || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Suggested pages */}
                                    {result.suggested_pages.length > 0 && (
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">Pages suggerees</Label>
                                            <ul className="space-y-2">
                                                {result.suggested_pages.map((page, i) => (
                                                    <li
                                                        key={i}
                                                        className="bg-gray-50 rounded-lg p-3 text-sm"
                                                    >
                                                        <span className="font-medium">{page.title}</span>
                                                        <span className="text-gray-400 ml-2 text-xs uppercase">{page.type}</span>
                                                        <p className="text-gray-500 mt-0.5">{page.description}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Tokens used */}
                                    <p className="text-xs text-gray-400">
                                        Tokens utilises : {result.tokens_used}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Apply button */}
                            {activeTheme && (
                                <Button
                                    onClick={handleApply}
                                    disabled={applying || applied}
                                    className="w-full gap-2"
                                    variant={applied ? 'outline' : 'default'}
                                >
                                    {applying ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Application en cours...
                                        </>
                                    ) : applied ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Applique au theme "{activeTheme.name}"
                                        </>
                                    ) : (
                                        <>
                                            <Palette className="h-4 w-4" />
                                            Appliquer au theme "{activeTheme.name}"
                                        </>
                                    )}
                                </Button>
                            )}

                            {!activeTheme && (
                                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
                                    Aucun theme actif. Activez un theme avant d'appliquer les modifications.
                                </div>
                            )}
                        </>
                    )}

                    {!result && !generating && (
                        <Card>
                            <CardContent className="py-12 text-center text-gray-400">
                                <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>Decrivez votre site et laissez l'IA generer un theme personnalise.</p>
                            </CardContent>
                        </Card>
                    )}

                    {generating && (
                        <Card>
                            <CardContent className="py-12 text-center text-gray-400">
                                <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin opacity-50" />
                                <p>L'IA analyse votre description et genere un theme...</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
