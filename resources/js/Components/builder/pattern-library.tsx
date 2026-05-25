import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useBuilderStore } from '@/stores/builder-store';
import { nanoid } from 'nanoid';
import { Layers, LayoutTemplate, Sparkles, Trash2 } from 'lucide-react';
import type { BlockNode, SharedProps } from '@/types/cms';

interface PatternData {
    id: number;
    name: string;
    slug: string;
    content: BlockNode[];
    category: string;
    is_synced: boolean;
    is_builtin?: boolean;
    description?: string;
    creator?: { name: string };
}

function block(type: string, props: Record<string, unknown> = {}, children: BlockNode[] = []): BlockNode {
    const customResponsive = props.responsive as Record<string, Record<string, unknown>> | undefined;
    const shouldMobileCenter = props.mobileCenter !== false && ['heading', 'text', 'button'].includes(type);
    const cleanProps = { ...props };
    delete cleanProps.mobileCenter;
    const mobileDefaults = shouldMobileCenter
        ? type === 'button'
            ? { align: 'center', fullWidth: true, size: props.size || 'md' }
            : { alignment: 'center', textAlign: 'center' }
        : {};

    return {
        id: nanoid(),
        type,
        props: {
            ...cleanProps,
            responsive: {
                ...(customResponsive ?? {}),
                mobile: {
                    ...mobileDefaults,
                    ...(customResponsive?.mobile ?? {}),
                },
            },
        },
        children,
    };
}

function section(children: BlockNode[], props: Record<string, unknown> = {}): BlockNode {
    const customResponsive = props.responsive as Record<string, Record<string, unknown>> | undefined;

    return block('section', {
        paddingTop: 72,
        paddingBottom: 72,
        paddingLeft: 24,
        paddingRight: 24,
        centered: true,
        ...props,
        responsive: {
            tablet: {
                paddingTop: 56,
                paddingBottom: 56,
                paddingLeft: 20,
                paddingRight: 20,
                ...(customResponsive?.tablet ?? {}),
            },
            mobile: {
                paddingTop: 32,
                paddingBottom: 32,
                paddingLeft: 16,
                paddingRight: 16,
                ...(customResponsive?.mobile ?? {}),
            },
        },
    }, children);
}

function row(children: BlockNode[], props: Record<string, unknown> = {}): BlockNode {
    const customResponsive = props.responsive as Record<string, Record<string, unknown>> | undefined;

    return block('row', {
        gap: 24,
        verticalAlign: 'center',
        ...props,
        responsive: {
            tablet: {
                gap: 18,
                ...(customResponsive?.tablet ?? {}),
            },
            mobile: {
                gap: 14,
                ...(customResponsive?.mobile ?? {}),
            },
        },
    }, children);
}

function column(span: number, children: BlockNode[], props: Record<string, unknown> = {}): BlockNode {
    const customResponsive = props.responsive as Record<string, Record<string, unknown>> | undefined;
    const tabletSpan = span <= 3 ? 6 : span >= 5 ? 12 : 6;

    return block('column', {
        span,
        padding: 16,
        minHeight: 120,
        ...props,
        responsive: {
            tablet: {
                span: tabletSpan,
                padding: 14,
                ...(customResponsive?.tablet ?? {}),
            },
            mobile: {
                span: 12,
                padding: 10,
                minHeight: Math.min(Number(props.minHeight) || 120, typeSafeMinHeight(props.minHeight)),
                ...(customResponsive?.mobile ?? {}),
            },
        },
    }, children);
}

function typeSafeMinHeight(value: unknown): number {
    return Number(value) > 240 ? 220 : 120;
}

const BUILT_IN_PATTERNS: PatternData[] = [
    {
        id: -1,
        name: 'Hero 2 colonnes',
        slug: 'builtin-hero-split',
        category: 'Hero',
        is_synced: false,
        is_builtin: true,
        description: 'Titre, texte, CTA et visuel a droite.',
        content: [
            section([
                row([
                    column(6, [
                        block('heading', { level: 1, text: 'Construisez une page claire et efficace' }),
                        block('text', { content: '<p>Presentez votre offre avec un message court, un benefice fort et un appel a l action visible.</p>' }),
                        block('button', { text: 'Commencer', variant: 'primary', size: 'lg' }),
                    ]),
                    column(6, [
                        block('image', { alt: 'Visuel principal', width: '100%' }),
                    ], { backgroundColor: '#f8fafc', minHeight: 320 }),
                ]),
            ], { paddingTop: 84, paddingBottom: 84 }),
        ],
    },
    {
        id: -2,
        name: 'Features 3 colonnes',
        slug: 'builtin-features-3',
        category: 'Contenu',
        is_synced: false,
        is_builtin: true,
        description: 'Une section titre + trois arguments.',
        content: [
            section([
                row([
                    column(12, [
                        block('heading', { level: 2, text: 'Tout ce dont vous avez besoin', alignment: 'center' }),
                        block('text', { content: '<p>Expliquez rapidement pourquoi votre solution est simple, fiable et agreable a utiliser.</p>', alignment: 'center' }),
                    ], { minHeight: 80 }),
                ]),
                row([
                    column(4, [
                        block('heading', { level: 3, text: 'Rapide' }),
                        block('text', { content: '<p>Un parcours fluide pour aller de l idee a la publication.</p>' }),
                    ], { backgroundColor: '#f8fafc' }),
                    column(4, [
                        block('heading', { level: 3, text: 'Flexible' }),
                        block('text', { content: '<p>Composez vos sections avec lignes, colonnes et blocs reutilisables.</p>' }),
                    ], { backgroundColor: '#f8fafc' }),
                    column(4, [
                        block('heading', { level: 3, text: 'Propre' }),
                        block('text', { content: '<p>Gardez une structure lisible et facile a modifier.</p>' }),
                    ], { backgroundColor: '#f8fafc' }),
                ], { verticalAlign: 'stretch' }),
            ]),
        ],
    },
    {
        id: -3,
        name: 'CTA centree',
        slug: 'builtin-centered-cta',
        category: 'Conversion',
        is_synced: false,
        is_builtin: true,
        description: 'Bloc final avec titre, texte et bouton.',
        content: [
            section([
                row([
                    column(12, [
                        block('heading', { level: 2, text: 'Pret a passer a la suite ?', alignment: 'center' }),
                        block('text', { content: '<p>Ajoutez une phrase courte qui donne envie de cliquer sans noyer le visiteur.</p>', alignment: 'center' }),
                        block('button', { text: 'Nous contacter', variant: 'primary', size: 'lg', align: 'center' }),
                    ], { backgroundColor: '#0f172a', minHeight: 260, padding: 40 }),
                ]),
            ], { paddingTop: 56, paddingBottom: 56 }),
        ],
    },
    {
        id: -4,
        name: 'FAQ simple',
        slug: 'builtin-faq-simple',
        category: 'Contenu',
        is_synced: false,
        is_builtin: true,
        description: 'Intro + questions en colonne.',
        content: [
            section([
                row([
                    column(5, [
                        block('heading', { level: 2, text: 'Questions frequentes' }),
                        block('text', { content: '<p>Repondez aux objections principales avant le passage a l action.</p>' }),
                    ]),
                    column(7, [
                        block('accordion', {
                            items: [
                                { title: 'Comment demarrer ?', content: 'Ajoutez vos contenus, adaptez les styles, puis publiez.' },
                                { title: 'Puis-je modifier la mise en page ?', content: 'Oui, les sections, lignes et colonnes restent editables.' },
                                { title: 'Est-ce responsive ?', content: 'La structure est prete pour les prochains reglages responsive.' },
                            ],
                        }),
                    ]),
                ], { verticalAlign: 'start' }),
            ]),
        ],
    },
    {
        id: -5,
        name: 'Bandeau confiance',
        slug: 'builtin-trust-band',
        category: 'Conversion',
        is_synced: false,
        is_builtin: true,
        description: 'Chiffres ou preuves sociales en 4 colonnes.',
        content: [
            section([
                row([
                    column(3, [block('heading', { level: 3, text: '+120' }), block('text', { content: '<p>Projets livres</p>' })], { minHeight: 90 }),
                    column(3, [block('heading', { level: 3, text: '98%' }), block('text', { content: '<p>Clients satisfaits</p>' })], { minHeight: 90 }),
                    column(3, [block('heading', { level: 3, text: '24h' }), block('text', { content: '<p>Support reactif</p>' })], { minHeight: 90 }),
                    column(3, [block('heading', { level: 3, text: '4.9/5' }), block('text', { content: '<p>Note moyenne</p>' })], { minHeight: 90 }),
                ], { verticalAlign: 'stretch' }),
            ], { paddingTop: 40, paddingBottom: 40 }),
        ],
    },
    {
        id: -6,
        name: 'Layout 30 / 70',
        slug: 'builtin-layout-30-70',
        category: 'Mise en page',
        is_synced: false,
        is_builtin: true,
        description: 'Une section avec colonne etendue a droite.',
        content: [
            section([
                row([
                    column(4, [block('heading', { level: 2, text: 'Titre de section' })]),
                    column(8, [block('text', { content: '<p>Ajoutez ici votre contenu principal : texte, images, formulaires ou cartes.</p>' })]),
                ], { verticalAlign: 'start' }),
            ]),
        ],
    },
    {
        id: -7,
        name: 'Page landing complete',
        slug: 'builtin-page-landing',
        category: 'Pages',
        is_synced: false,
        is_builtin: true,
        description: 'Hero, preuves, features et CTA final.',
        content: [
            section([
                row([
                    column(7, [
                        block('heading', { level: 1, text: 'Une offre claire, une page qui convertit' }),
                        block('text', { content: '<p>Expliquez votre promesse principale avec un message direct et une action evidente.</p>' }),
                        block('button', { text: 'Demander une demo', variant: 'primary', size: 'lg' }),
                    ], { padding: 20, minHeight: 300 }),
                    column(5, [block('image', { alt: 'Apercu produit', width: '100%' })], { backgroundColor: '#f8fafc', borderRadius: 18, minHeight: 320 }),
                ]),
            ], { paddingTop: 88, paddingBottom: 72 }),
            section([
                row([
                    column(3, [block('heading', { level: 3, text: '10k+' }), block('text', { content: '<p>Utilisateurs</p>' })]),
                    column(3, [block('heading', { level: 3, text: '99%' }), block('text', { content: '<p>Satisfaction</p>' })]),
                    column(3, [block('heading', { level: 3, text: '24/7' }), block('text', { content: '<p>Disponibilite</p>' })]),
                    column(3, [block('heading', { level: 3, text: '4.8/5' }), block('text', { content: '<p>Note moyenne</p>' })]),
                ], { verticalAlign: 'stretch' }),
            ], { paddingTop: 32, paddingBottom: 32, backgroundColor: '#f8fafc' }),
            section([
                row([
                    column(12, [
                        block('heading', { level: 2, text: 'Pourquoi ca marche', alignment: 'center' }),
                        block('text', { content: '<p>Trois arguments forts, faciles a lire et directement relies aux attentes du visiteur.</p>', alignment: 'center' }),
                    ], { minHeight: 80 }),
                ]),
                row([
                    column(4, [block('heading', { level: 3, text: 'Simple' }), block('text', { content: '<p>Une structure lisible pour comprendre vite.</p>' })], { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' }),
                    column(4, [block('heading', { level: 3, text: 'Credible' }), block('text', { content: '<p>Des preuves au bon endroit pour rassurer.</p>' })], { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' }),
                    column(4, [block('heading', { level: 3, text: 'Actionnable' }), block('text', { content: '<p>Un CTA clair a chaque moment important.</p>' })], { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' }),
                ], { verticalAlign: 'stretch' }),
            ]),
            section([
                row([
                    column(12, [
                        block('heading', { level: 2, text: 'Pret a avancer ?', alignment: 'center' }),
                        block('button', { text: 'Nous contacter', variant: 'primary', align: 'center' }),
                    ], { backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 20, padding: 40, minHeight: 220 }),
                ]),
            ], { paddingTop: 56, paddingBottom: 64 }),
        ],
    },
    {
        id: -8,
        name: 'Page service',
        slug: 'builtin-page-service',
        category: 'Pages',
        is_synced: false,
        is_builtin: true,
        description: 'Presentation service, benefices, process et FAQ.',
        content: [
            section([
                row([
                    column(6, [
                        block('heading', { level: 1, text: 'Nom du service' }),
                        block('text', { content: '<p>Decrivez le resultat concret que vous apportez, pour qui, et en combien de temps.</p>' }),
                        block('button', { text: 'Obtenir un devis', variant: 'primary' }),
                    ]),
                    column(6, [block('image', { alt: 'Service', width: '100%' })], { backgroundColor: '#f1f5f9', minHeight: 280 }),
                ]),
            ], { paddingTop: 80, paddingBottom: 64 }),
            section([
                row([
                    column(4, [block('heading', { level: 3, text: 'Diagnostic' }), block('text', { content: '<p>On clarifie le besoin et les priorites.</p>' })]),
                    column(4, [block('heading', { level: 3, text: 'Execution' }), block('text', { content: '<p>On livre par etapes avec validations.</p>' })]),
                    column(4, [block('heading', { level: 3, text: 'Optimisation' }), block('text', { content: '<p>On mesure puis on ameliore.</p>' })]),
                ], { verticalAlign: 'stretch' }),
            ], { backgroundColor: '#f8fafc' }),
            section([
                row([
                    column(5, [block('heading', { level: 2, text: 'Questions utiles' })]),
                    column(7, [
                        block('accordion', {
                            items: [
                                { title: 'Combien de temps faut-il ?', content: 'La duree depend du perimetre, mais le process est decoupe en etapes claires.' },
                                { title: 'Que dois-je fournir ?', content: 'Les objectifs, vos contenus existants et les contraintes importantes.' },
                                { title: 'Comment demarrer ?', content: 'Contactez-nous avec quelques details et nous revenons vers vous rapidement.' },
                            ],
                        }),
                    ]),
                ], { verticalAlign: 'start' }),
            ]),
        ],
    },
    {
        id: -9,
        name: 'Page contact',
        slug: 'builtin-page-contact',
        category: 'Pages',
        is_synced: false,
        is_builtin: true,
        description: 'Intro, coordonnees, formulaire et carte.',
        content: [
            section([
                row([
                    column(12, [
                        block('heading', { level: 1, text: 'Contactez-nous', alignment: 'center' }),
                        block('text', { content: '<p>Une question, un projet, une demande precise ? Envoyez-nous un message.</p>', alignment: 'center' }),
                    ], { minHeight: 120 }),
                ]),
                row([
                    column(5, [
                        block('heading', { level: 2, text: 'Coordonnees' }),
                        block('text', { content: '<p>Email : contact@example.com<br>Telephone : 01 23 45 67 89<br>Adresse : 10 rue Exemple, Paris</p>' }),
                    ], { backgroundColor: '#f8fafc', borderRadius: 16, padding: 28 }),
                    column(7, [block('contact-form', { title: 'Votre message' })], { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 28 }),
                ], { verticalAlign: 'stretch' }),
                row([
                    column(12, [block('map', { height: 320 })], { minHeight: 320, backgroundColor: '#f1f5f9', borderRadius: 16 }),
                ]),
            ], { paddingTop: 72, paddingBottom: 72 }),
        ],
    },
];

function reassignIds(blocks: BlockNode[]): BlockNode[] {
    return blocks.map((item) => ({
        ...item,
        id: nanoid(),
        children: item.children?.length ? reassignIds(item.children) : [],
    }));
}

function PatternPreview({ slug }: { slug: string }) {
    if (slug.includes('page')) {
        return (
            <div className="h-20 space-y-1.5 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
                <div className="grid h-7 grid-cols-[1.2fr_0.8fr] gap-1.5">
                    <div className="rounded bg-white p-1 ring-1 ring-slate-200">
                        <div className="mb-1 h-1.5 w-10 rounded bg-slate-900" />
                        <div className="h-1 w-14 rounded bg-slate-300" />
                    </div>
                    <div className="rounded bg-slate-200" />
                </div>
                <div className="grid h-5 grid-cols-3 gap-1.5">
                    {[0, 1, 2].map((item) => <div key={item} className="rounded bg-white ring-1 ring-slate-200" />)}
                </div>
                <div className="h-5 rounded bg-slate-900" />
            </div>
        );
    }

    if (slug.includes('hero')) {
        return (
            <div className="grid h-16 grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
                <div className="space-y-1.5">
                    <div className="h-2 w-10 rounded bg-slate-900" />
                    <div className="h-1.5 w-16 rounded bg-slate-300" />
                    <div className="h-1.5 w-12 rounded bg-slate-300" />
                    <div className="mt-2 h-4 w-12 rounded bg-indigo-500" />
                </div>
                <div className="rounded-md border border-dashed border-slate-300 bg-white" />
            </div>
        );
    }

    if (slug.includes('features')) {
        return (
            <div className="h-16 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
                <div className="mx-auto mb-2 h-2 w-20 rounded bg-slate-900" />
                <div className="grid grid-cols-3 gap-1.5">
                    {[0, 1, 2].map((item) => (
                        <div key={item} className="h-9 rounded-md bg-white ring-1 ring-slate-200" />
                    ))}
                </div>
            </div>
        );
    }

    if (slug.includes('cta')) {
        return (
            <div className="flex h-16 flex-col items-center justify-center rounded-lg bg-slate-900 p-2 ring-1 ring-slate-200">
                <div className="mb-1.5 h-2 w-20 rounded bg-white" />
                <div className="mb-2 h-1.5 w-24 rounded bg-slate-500" />
                <div className="h-3.5 w-14 rounded bg-indigo-500" />
            </div>
        );
    }

    if (slug.includes('faq')) {
        return (
            <div className="grid h-16 grid-cols-[0.8fr_1.2fr] gap-2 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
                <div className="space-y-1.5">
                    <div className="h-2 w-12 rounded bg-slate-900" />
                    <div className="h-1.5 w-16 rounded bg-slate-300" />
                </div>
                <div className="space-y-1">
                    {[0, 1, 2].map((item) => (
                        <div key={item} className="h-3 rounded bg-white ring-1 ring-slate-200" />
                    ))}
                </div>
            </div>
        );
    }

    if (slug.includes('trust')) {
        return (
            <div className="grid h-16 grid-cols-4 gap-1.5 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
                {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="rounded-md bg-white p-1 ring-1 ring-slate-200">
                        <div className="mb-1 h-2 rounded bg-slate-900" />
                        <div className="h-1.5 rounded bg-slate-300" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid h-16 grid-cols-[0.7fr_1.3fr] gap-2 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
            <div className="rounded-md bg-white ring-1 ring-slate-200" />
            <div className="rounded-md bg-white ring-1 ring-slate-200" />
        </div>
    );
}

export default function PatternLibrary() {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [savedPatterns, setSavedPatterns] = useState<PatternData[]>([]);
    const [savedCategories, setSavedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetch(`/${prefix}/block-patterns`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then((response) => response.json())
            .then((data) => {
                setSavedPatterns(data.patterns ?? []);
                setSavedCategories(data.categories ?? []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [prefix]);

    const allPatterns = useMemo(() => [...BUILT_IN_PATTERNS, ...savedPatterns], [savedPatterns]);
    const categories = useMemo(() => {
        return Array.from(new Set([...BUILT_IN_PATTERNS.map((pattern) => pattern.category), ...savedCategories])).sort();
    }, [savedCategories]);

    const insertPattern = (pattern: PatternData) => {
        const freshBlocks = reassignIds(pattern.content);
        const store = useBuilderStore.getState();

        store.pushHistory();
        useBuilderStore.setState((state) => {
            for (const item of freshBlocks) {
                state.blocks.push(item);
            }
            state.isDirty = true;
        });
    };

    const deletePattern = (pattern: PatternData) => {
        if (pattern.is_builtin) return;
        if (!confirm('Supprimer ce pattern ?')) return;

        fetch(`/${prefix}/block-patterns/${pattern.id}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
            },
            credentials: 'same-origin',
        }).then(() => {
            setSavedPatterns((current) => current.filter((item) => item.id !== pattern.id));
        });
    };

    const filtered = filter
        ? allPatterns.filter((pattern) => pattern.category === filter)
        : allPatterns;

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
                        <Sparkles className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-950">Sections predefinies</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Inserez une section complete, puis ajustez les textes, images et colonnes.
                        </p>
                    </div>
                </div>
            </div>

            {categories.length > 1 && (
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => setFilter('')}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${!filter ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
                    >
                        Tout ({allPatterns.length})
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setFilter(category)}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${filter === category ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                </div>
            )}

            {filtered.length > 0 ? (
                <div className="space-y-2">
                    {filtered.map((pattern) => (
                        <div
                            key={pattern.id}
                            className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                        >
                            <PatternPreview slug={pattern.slug} />
                            <div className="mt-3 flex items-start gap-3">
                                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${pattern.is_builtin ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {pattern.is_builtin ? <LayoutTemplate className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-slate-900">{pattern.name}</p>
                                        {pattern.is_builtin && (
                                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
                                                Pret
                                            </span>
                                        )}
                                        {pattern.is_builtin && (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">
                                                Responsive
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                        {pattern.description || `${Array.isArray(pattern.content) ? pattern.content.length : 0} blocs`}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-[11px] font-medium text-slate-400">{pattern.category}</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => insertPattern(pattern)}
                                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                                    >
                                        Inserer
                                    </button>
                                    {!pattern.is_builtin && (
                                        <button
                                            onClick={() => deletePattern(pattern)}
                                            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-400">
                    <Layers className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm">Aucun pattern dans cette categorie</p>
                </div>
            )}
        </div>
    );
}
