import { Link, usePage } from '@inertiajs/react';
import { useBuilderStore } from '@/stores/builder-store';
import { ArrowLeft, Monitor, Tablet, Smartphone, Undo2, Redo2, Save, Globe } from 'lucide-react';
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
    const { viewport, setViewport, undo, redo, canUndo, canRedo, isDirty } = useBuilderStore();

    return (
        <div className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0 z-50">
            {/* Left */}
            <div className="flex items-center gap-3">
                <Link href={`/${prefix}/pages`} className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="h-6 w-px bg-gray-200" />
                <h1 className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{title}</h1>
                {isDirty && <span className="w-2 h-2 rounded-full bg-orange-400" title="Non sauvegarde" />}
            </div>

            {/* Center - viewport */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {([
                    { id: 'desktop' as const, Icon: Monitor },
                    { id: 'tablet' as const, Icon: Tablet },
                    { id: 'mobile' as const, Icon: Smartphone },
                ]).map(({ id, Icon }) => (
                    <button
                        key={id}
                        onClick={() => setViewport(id)}
                        className={`p-1.5 rounded-md transition-colors ${viewport === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Icon className="w-4 h-4" />
                    </button>
                ))}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                <button onClick={undo} disabled={!canUndo()} className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                    <Undo2 className="w-4 h-4" />
                </button>
                <button onClick={redo} disabled={!canRedo()} className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                    <Redo2 className="w-4 h-4" />
                </button>
                <div className="h-6 w-px bg-gray-200" />
                <button onClick={onSave} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    Sauvegarder
                </button>
                <button onClick={onPublish} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    <Globe className="w-4 h-4" />
                    Publier
                </button>
            </div>
        </div>
    );
}
