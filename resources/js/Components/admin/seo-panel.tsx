import { useState } from 'react';
import { ChevronDown, ChevronRight, Search, AlertTriangle, CheckCircle2, Info, Globe } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SeoFields {
    meta_title: string;
    meta_description: string;
    og_image: string;
    meta_robots: string;
    canonical_url: string;
    focus_keyword: string;
}

interface SeoPanelProps {
    data: SeoFields;
    errors?: Partial<Record<keyof SeoFields, string>>;
    onChange: (field: keyof SeoFields, value: string) => void;
    pageTitle: string;
    pageSlug: string;
    pageUrl?: string;
    onImageUpload?: (file: File) => void;
}

// ─── Score calculation ──────────────────────────────────────────────────────

interface SeoCheck {
    label: string;
    status: 'good' | 'warning' | 'error';
    message: string;
}

function computeSeoChecks(data: SeoFields, pageTitle: string): SeoCheck[] {
    const checks: SeoCheck[] = [];
    const title = data.meta_title || pageTitle;
    const desc = data.meta_description;
    const keyword = data.focus_keyword.toLowerCase().trim();

    // Title
    if (!title) {
        checks.push({ label: 'Titre SEO', status: 'error', message: 'Aucun titre défini' });
    } else if (title.length < 30) {
        checks.push({ label: 'Titre SEO', status: 'warning', message: `Trop court (${title.length}/60). Visez 50-60 caractères` });
    } else if (title.length > 60) {
        checks.push({ label: 'Titre SEO', status: 'warning', message: `Trop long (${title.length}/60). Sera tronqué dans Google` });
    } else {
        checks.push({ label: 'Titre SEO', status: 'good', message: `Longueur optimale (${title.length}/60)` });
    }

    // Description
    if (!desc) {
        checks.push({ label: 'Meta description', status: 'error', message: 'Aucune description définie. Google en génèrera une automatiquement' });
    } else if (desc.length < 120) {
        checks.push({ label: 'Meta description', status: 'warning', message: `Trop courte (${desc.length}/160). Visez 120-160 caractères` });
    } else if (desc.length > 160) {
        checks.push({ label: 'Meta description', status: 'warning', message: `Trop longue (${desc.length}/160). Sera tronquée` });
    } else {
        checks.push({ label: 'Meta description', status: 'good', message: `Longueur optimale (${desc.length}/160)` });
    }

    // Focus keyword
    if (keyword) {
        const titleLower = title.toLowerCase();
        const descLower = desc.toLowerCase();

        if (titleLower.includes(keyword)) {
            checks.push({ label: 'Mot-clé dans le titre', status: 'good', message: 'Le mot-clé apparaît dans le titre' });
        } else {
            checks.push({ label: 'Mot-clé dans le titre', status: 'warning', message: 'Le mot-clé n\'apparaît pas dans le titre' });
        }

        if (descLower.includes(keyword)) {
            checks.push({ label: 'Mot-clé dans la description', status: 'good', message: 'Le mot-clé apparaît dans la description' });
        } else {
            checks.push({ label: 'Mot-clé dans la description', status: 'warning', message: 'Le mot-clé n\'apparaît pas dans la description' });
        }
    } else {
        checks.push({ label: 'Mot-clé cible', status: 'warning', message: 'Aucun mot-clé cible défini' });
    }

    // OG Image
    if (data.og_image) {
        checks.push({ label: 'Image de partage', status: 'good', message: 'Image OG définie pour les réseaux sociaux' });
    } else {
        checks.push({ label: 'Image de partage', status: 'warning', message: 'Aucune image OG. Les partages sociaux seront moins attractifs' });
    }

    // Meta robots
    if (data.meta_robots.includes('noindex')) {
        checks.push({ label: 'Indexation', status: 'warning', message: 'Cette page ne sera PAS indexée par Google' });
    }

    return checks;
}

function getScoreFromChecks(checks: SeoCheck[]): { score: number; color: string; label: string } {
    const total = checks.length;
    const good = checks.filter((c) => c.status === 'good').length;
    const errors = checks.filter((c) => c.status === 'error').length;
    const pct = total > 0 ? Math.round((good / total) * 100) : 0;

    if (errors > 0 || pct < 40) return { score: pct, color: 'text-red-500', label: 'Mauvais' };
    if (pct < 70) return { score: pct, color: 'text-amber-500', label: 'Moyen' };
    return { score: pct, color: 'text-green-500', label: 'Bon' };
}

// ─── SERP Preview ───────────────────────────────────────────────────────────

function SerpPreview({ title, description, url }: { title: string; description: string; url: string }) {
    const displayTitle = title || 'Titre de la page';
    const displayDesc = description || 'Ajoutez une meta description pour contrôler ce qui apparaît dans les résultats de recherche.';
    const displayUrl = url || 'https://votre-site.com/page';

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Aperçu Google</p>
            <div className="space-y-0.5">
                <p className="text-sm text-green-700 truncate">{displayUrl}</p>
                <h3 className="text-lg font-normal text-[#1a0dab] leading-tight line-clamp-1 cursor-pointer hover:underline">
                    {displayTitle.length > 60 ? displayTitle.slice(0, 57) + '...' : displayTitle}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {displayDesc.length > 160 ? displayDesc.slice(0, 157) + '...' : displayDesc}
                </p>
            </div>
        </div>
    );
}

// ─── Status icon ────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: SeoCheck['status'] }) {
    if (status === 'good') return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
}

// ─── META ROBOTS OPTIONS ────────────────────────────────────────────────────

const META_ROBOTS_OPTIONS = [
    { value: 'index, follow', label: 'Index, Follow (par défaut)' },
    { value: 'noindex, follow', label: 'Noindex, Follow' },
    { value: 'index, nofollow', label: 'Index, Nofollow' },
    { value: 'noindex, nofollow', label: 'Noindex, Nofollow' },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SeoPanel({ data, errors, onChange, pageTitle, pageSlug, pageUrl, onImageUpload }: SeoPanelProps) {
    const [open, setOpen] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const checks = computeSeoChecks(data, pageTitle);
    const score = getScoreFromChecks(checks);
    const effectiveUrl = pageUrl || `/${pageSlug}`;

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            {/* Header with score */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
            >
                <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-gray-400" />
                    <h2 className="text-base font-semibold text-gray-900">SEO</h2>
                    <span className={`text-sm font-medium ${score.color}`}>
                        {score.score}% — {score.label}
                    </span>
                </div>
                {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            </button>

            {open && (
                <div className="border-t border-gray-100 px-6 pb-6 pt-4 space-y-5">
                    {/* SERP Preview */}
                    <SerpPreview
                        title={data.meta_title || pageTitle}
                        description={data.meta_description}
                        url={effectiveUrl}
                    />

                    {/* Focus keyword */}
                    <div>
                        <label htmlFor="seo_focus_keyword" className="mb-1 block text-sm font-medium text-gray-700">
                            Mot-clé cible
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                id="seo_focus_keyword"
                                type="text"
                                value={data.focus_keyword}
                                onChange={(e) => onChange('focus_keyword', e.target.value)}
                                placeholder="Ex: artisancms alternative wordpress"
                                className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Meta title */}
                    <div>
                        <label htmlFor="seo_meta_title" className="mb-1 block text-sm font-medium text-gray-700">
                            Titre SEO
                        </label>
                        <input
                            id="seo_meta_title"
                            type="text"
                            value={data.meta_title}
                            onChange={(e) => onChange('meta_title', e.target.value)}
                            placeholder={pageTitle}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            maxLength={70}
                        />
                        <div className="mt-1 flex items-center justify-between">
                            <CharCounter current={(data.meta_title || pageTitle).length} min={30} max={60} />
                            {errors?.meta_title && <p className="text-xs text-red-600">{errors.meta_title}</p>}
                        </div>
                    </div>

                    {/* Meta description */}
                    <div>
                        <label htmlFor="seo_meta_description" className="mb-1 block text-sm font-medium text-gray-700">
                            Meta description
                        </label>
                        <textarea
                            id="seo_meta_description"
                            value={data.meta_description}
                            onChange={(e) => onChange('meta_description', e.target.value)}
                            rows={3}
                            placeholder="Décrivez le contenu de cette page en 120-160 caractères..."
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            maxLength={200}
                        />
                        <div className="mt-1 flex items-center justify-between">
                            <CharCounter current={data.meta_description.length} min={120} max={160} />
                            {errors?.meta_description && <p className="text-xs text-red-600">{errors.meta_description}</p>}
                        </div>
                    </div>

                    {/* OG Image */}
                    <div>
                        <label htmlFor="seo_og_image" className="mb-1 block text-sm font-medium text-gray-700">
                            Image de partage (Open Graph)
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="seo_og_image"
                                type="text"
                                value={data.og_image}
                                onChange={(e) => onChange('og_image', e.target.value)}
                                placeholder="/storage/images/og-image.jpg"
                                className="block flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {onImageUpload && (
                                <label className="flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                                    Parcourir
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) onImageUpload(file);
                                        }}
                                    />
                                </label>
                            )}
                        </div>
                        {data.og_image && (
                            <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                                <img src={data.og_image} alt="OG Preview" className="h-32 w-full object-cover" />
                            </div>
                        )}
                        <p className="mt-1 text-xs text-gray-400">Recommandé : 1200x630px. Utilisé sur Facebook, Twitter, LinkedIn...</p>
                    </div>

                    {/* SEO Score Checks */}
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                        <h3 className="mb-3 text-sm font-medium text-gray-700">Analyse SEO</h3>
                        <div className="space-y-2">
                            {checks.map((check) => (
                                <div key={check.label} className="flex items-start gap-2">
                                    <StatusIcon status={check.status} />
                                    <div className="min-w-0">
                                        <span className="text-sm font-medium text-gray-700">{check.label}</span>
                                        <span className="text-sm text-gray-500"> — {check.message}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                    >
                        {showAdvanced ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        Options avancées
                    </button>

                    {showAdvanced && (
                        <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                            {/* Meta robots */}
                            <div>
                                <label htmlFor="seo_meta_robots" className="mb-1 block text-sm font-medium text-gray-700">
                                    <Globe className="mr-1 inline h-4 w-4" />
                                    Directives robots
                                </label>
                                <select
                                    id="seo_meta_robots"
                                    value={data.meta_robots}
                                    onChange={(e) => onChange('meta_robots', e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    {META_ROBOTS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {data.meta_robots.includes('noindex') && (
                                    <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 p-2.5">
                                        <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700">
                                            Cette page ne sera pas indexée par les moteurs de recherche et n'apparaîtra pas dans les résultats Google.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Canonical URL */}
                            <div>
                                <label htmlFor="seo_canonical_url" className="mb-1 block text-sm font-medium text-gray-700">
                                    URL canonique
                                </label>
                                <input
                                    id="seo_canonical_url"
                                    type="url"
                                    value={data.canonical_url}
                                    onChange={(e) => onChange('canonical_url', e.target.value)}
                                    placeholder="Laisser vide pour utiliser l'URL actuelle"
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <p className="mt-1 text-xs text-gray-400">
                                    Indiquer une URL canonique différente si ce contenu existe aussi à une autre adresse.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function CharCounter({ current, min, max }: { current: number; min: number; max: number }) {
    let color = 'text-gray-400';
    if (current > 0 && current < min) color = 'text-amber-500';
    if (current >= min && current <= max) color = 'text-green-500';
    if (current > max) color = 'text-red-500';

    return (
        <span className={`text-xs ${color}`}>
            {current}/{max} caractères
        </span>
    );
}
