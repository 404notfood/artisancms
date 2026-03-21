import { useForm, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Save, X } from 'lucide-react';
import { type DesignToken } from './types';

interface EditTokenFormProps {
    token?: DesignToken;
    category: string;
    onClose: () => void;
}

export default function EditTokenForm({ token, category, onClose }: EditTokenFormProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const isEdit = !!token;
    const form = useForm({
        name: token?.name ?? '',
        slug: token?.slug ?? '',
        category,
        value: token?.value ?? (category === 'color' ? { hex: '#000000' } : { value: '' }),
        order: token?.order ?? 0,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            form.put(`/admin/design-tokens/${token.id}`, { onSuccess: onClose });
        } else {
            form.post(`/${prefix}/design-tokens`, { onSuccess: onClose });
        }
    };

    return (
        <form onSubmit={submit} className="bg-gray-50 rounded-lg p-4 border space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{isEdit ? 'Modifier' : 'Nouveau'} token</h4>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs">Nom</Label>
                    <Input
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>
                <div>
                    <Label className="text-xs">Slug</Label>
                    <Input
                        value={form.data.slug}
                        onChange={(e) => form.setData('slug', e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Auto-genere"
                    />
                </div>
            </div>

            {category === 'color' && (
                <div>
                    <Label className="text-xs">Couleur (hex)</Label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={form.data.value.hex ?? '#000000'}
                            onChange={(e) => form.setData('value', { hex: e.target.value })}
                            className="h-8 w-10 cursor-pointer rounded border"
                        />
                        <Input
                            value={form.data.value.hex ?? ''}
                            onChange={(e) => form.setData('value', { hex: e.target.value })}
                            className="h-8 text-sm font-mono"
                        />
                    </div>
                </div>
            )}

            {category === 'typography' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">Font Size</Label>
                        <Input
                            value={form.data.value.fontSize ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, fontSize: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="1rem"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Font Weight</Label>
                        <Input
                            value={form.data.value.fontWeight ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, fontWeight: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="400"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Line Height</Label>
                        <Input
                            value={form.data.value.lineHeight ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, lineHeight: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="1.5"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Font Family</Label>
                        <Input
                            value={form.data.value.fontFamily ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, fontFamily: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="inherit"
                        />
                    </div>
                </div>
            )}

            {category === 'spacing' && (
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Label className="text-xs">Valeur</Label>
                        <Input
                            value={form.data.value.value ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, value: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="1"
                        />
                    </div>
                    <div className="w-20">
                        <Label className="text-xs">Unite</Label>
                        <select
                            value={form.data.value.unit ?? 'rem'}
                            onChange={(e) => form.setData('value', { ...form.data.value, unit: e.target.value })}
                            className="h-8 w-full rounded border text-sm px-2"
                        >
                            <option value="rem">rem</option>
                            <option value="px">px</option>
                            <option value="em">em</option>
                        </select>
                    </div>
                </div>
            )}

            {(category === 'shadow' || category === 'button') && (
                <div>
                    <Label className="text-xs">Valeur CSS</Label>
                    <Input
                        value={form.data.value.value ?? ''}
                        onChange={(e) => form.setData('value', { value: e.target.value })}
                        className="h-8 text-sm font-mono"
                    />
                </div>
            )}

            {category === 'border' && (
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <Label className="text-xs">Largeur</Label>
                        <Input
                            value={form.data.value.width ?? form.data.value.value ?? ''}
                            onChange={(e) => {
                                const v = { ...form.data.value };
                                if (v.width !== undefined) {
                                    v.width = e.target.value;
                                } else {
                                    v.value = e.target.value;
                                }
                                form.setData('value', v);
                            }}
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Style</Label>
                        <Input
                            value={form.data.value.style ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, style: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="solid"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Couleur</Label>
                        <Input
                            value={form.data.value.color ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, color: e.target.value })}
                            className="h-8 text-sm"
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Annuler
                </Button>
                <Button type="submit" size="sm" disabled={form.processing} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    {isEdit ? 'Modifier' : 'Creer'}
                </Button>
            </div>
        </form>
    );
}
