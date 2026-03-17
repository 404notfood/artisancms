import { useState } from 'react';
import type { BlockSettingsProps } from '../block-registry';
import AnimationPicker, { type AnimationConfig, DEFAULT_ANIMATION } from '../../animation-picker';

type TabId = 'style' | 'animation';

export default function SectionSettings({ block, onUpdate }: BlockSettingsProps) {
    const [tab, setTab] = useState<TabId>('style');
    const animation = (block.props.animation as AnimationConfig) ?? DEFAULT_ANIMATION;

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[
                    { id: 'style' as TabId, label: 'Style' },
                    { id: 'animation' as TabId, label: 'Animation' },
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'style' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Couleur de fond</label>
                        <input type="color" value={(block.props.backgroundColor as string) || '#ffffff'} onChange={(e) => onUpdate({ backgroundColor: e.target.value })} className="w-full h-10 rounded border cursor-pointer" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image de fond (URL)</label>
                        <input type="text" value={(block.props.backgroundImage as string) || ''} onChange={(e) => onUpdate({ backgroundImage: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="https://..." />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Padding haut</label>
                            <input type="number" value={Number(block.props.paddingTop) || 40} onChange={(e) => onUpdate({ paddingTop: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Padding bas</label>
                            <input type="number" value={Number(block.props.paddingBottom) || 40} onChange={(e) => onUpdate({ paddingBottom: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Padding gauche</label>
                            <input type="number" value={Number(block.props.paddingLeft) || 20} onChange={(e) => onUpdate({ paddingLeft: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Padding droite</label>
                            <input type="number" value={Number(block.props.paddingRight) || 20} onChange={(e) => onUpdate({ paddingRight: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-sm" />
                        </div>
                    </div>
                </>
            )}

            {tab === 'animation' && (
                <AnimationPicker
                    value={animation}
                    onChange={(anim) => onUpdate({ animation: anim })}
                />
            )}
        </div>
    );
}
