import { Link, usePage } from '@inertiajs/react';
import { useBuilderStore } from '@/stores/builder-store';
import { ArrowLeft, Monitor, Tablet, Smartphone, Undo2, Redo2, Save, Globe, Eye, EyeOff } from 'lucide-react';
import FullscreenToggle from '@/Components/builder/fullscreen-toggle';
import type { SharedProps } from '@/types/cms';

interface BuilderToolbarProps {
    title: string;
    onSave: () => void;
    onPublish: () => void;
    isSaving: boolean;
}

export default function BuilderToolbar({ title, onSave, onPublish, isSaving }: BuilderToolbarProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const { viewport, setViewport, undo, redo, canUndo, canRedo, isDirty, isPreviewMode, setPreviewMode } = useBuilderStore();

    return (
        <div className="h-16 shrink-0 border-b border-slate-200/80 bg-white/95 px-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur z-50">
            <div className="flex h-full items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <Link
                        href={`/${prefix}/pages`}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                        aria-label="Retour aux pages"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase text-slate-400">Builder</p>
                        <div className="flex min-w-0 items-center gap-2">
                            <h1 className="truncate text-sm font-semibold text-slate-950 max-w-[260px]">{title}</h1>
                            {isDirty && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    Non sauvegardé
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1 shadow-inner">
                    {([
                        { id: 'desktop' as const, Icon: Monitor, label: 'Desktop' },
                        { id: 'tablet' as const, Icon: Tablet, label: 'Tablette' },
                        { id: 'mobile' as const, Icon: Smartphone, label: 'Mobile' },
                    ]).map(({ id, Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setViewport(id)}
                            className={`grid h-8 w-9 place-items-center rounded-lg transition ${viewport === id ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'}`}
                            title={label}
                            aria-label={label}
                        >
                            <Icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={undo} disabled={!canUndo()} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30" title="Annuler">
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button onClick={redo} disabled={!canRedo()} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30" title="Rétablir">
                        <Redo2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPreviewMode(!isPreviewMode)}
                        className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${isPreviewMode ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
                        title={isPreviewMode ? 'Quitter l apercu' : 'Apercu'}
                    >
                        {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {isPreviewMode ? 'Quitter' : 'Apercu'}
                    </button>
                    <FullscreenToggle />
                    <div className="h-8 w-px bg-slate-200" />
                    <button onClick={onSave} disabled={isSaving} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50">
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                    <button onClick={onPublish} className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                        <Globe className="w-4 h-4" />
                        Publier
                    </button>
                </div>
            </div>
        </div>
    );
}
