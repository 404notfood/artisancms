import { useState } from 'react';
import type { BlockSettingsProps } from '../block-registry';

interface Social {
    linkedin?: string;
    twitter?: string;
    email?: string;
}

interface Member {
    name: string;
    role: string;
    bio: string;
    avatar: string;
    social?: Social;
}

export default function TeamMembersSettings({ block, onUpdate }: BlockSettingsProps) {
    const members = (block.props.members as Member[]) || [];
    const columns = (block.props.columns as number) || 3;
    const style = (block.props.style as string) || 'card';

    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const updateMember = (index: number, field: string, value: string) => {
        const newMembers = [...members];
        newMembers[index] = { ...newMembers[index], [field]: value };
        onUpdate({ members: newMembers });
    };

    const updateSocial = (index: number, field: keyof Social, value: string) => {
        const newMembers = [...members];
        newMembers[index] = {
            ...newMembers[index],
            social: { ...newMembers[index].social, [field]: value },
        };
        onUpdate({ members: newMembers });
    };

    const addMember = () => {
        onUpdate({
            members: [...members, { name: '', role: '', bio: '', avatar: '', social: {} }],
        });
        setExpandedIndex(members.length);
    };

    const removeMember = (index: number) => {
        onUpdate({ members: members.filter((_, i) => i !== index) });
        setExpandedIndex(null);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colonnes</label>
                <select
                    value={columns}
                    onChange={(e) => onUpdate({ columns: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value={2}>2 colonnes</option>
                    <option value={3}>3 colonnes</option>
                    <option value={4}>4 colonnes</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select
                    value={style}
                    onChange={(e) => onUpdate({ style: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="card">Carte</option>
                    <option value="minimal">Minimal</option>
                    <option value="circle">Cercle</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Membres</label>
                <div className="space-y-2">
                    {members.map((member, i) => (
                        <div key={i} className="border rounded bg-gray-50">
                            <button
                                type="button"
                                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                                className="w-full px-3 py-2 text-sm text-left flex justify-between items-center"
                            >
                                <span>{member.name || `Membre ${i + 1}`}</span>
                                <span className="text-gray-400">{expandedIndex === i ? '\u25B2' : '\u25BC'}</span>
                            </button>
                            {expandedIndex === i && (
                                <div className="px-3 pb-3 space-y-2">
                                    <input
                                        type="text"
                                        value={member.name}
                                        onChange={(e) => updateMember(i, 'name', e.target.value)}
                                        className="w-full border rounded px-3 py-1.5 text-sm"
                                        placeholder="Nom"
                                    />
                                    <input
                                        type="text"
                                        value={member.role}
                                        onChange={(e) => updateMember(i, 'role', e.target.value)}
                                        className="w-full border rounded px-3 py-1.5 text-sm"
                                        placeholder="Rôle / Poste"
                                    />
                                    <textarea
                                        value={member.bio}
                                        onChange={(e) => updateMember(i, 'bio', e.target.value)}
                                        className="w-full border rounded px-3 py-1.5 text-sm"
                                        rows={2}
                                        placeholder="Biographie"
                                    />
                                    <input
                                        type="text"
                                        value={member.avatar}
                                        onChange={(e) => updateMember(i, 'avatar', e.target.value)}
                                        className="w-full border rounded px-3 py-1.5 text-sm"
                                        placeholder="URL de l'avatar"
                                    />
                                    <div className="pt-1">
                                        <span className="text-xs font-medium text-gray-500">Réseaux sociaux</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={member.social?.linkedin || ''}
                                        onChange={(e) => updateSocial(i, 'linkedin', e.target.value)}
                                        className="w-full border rounded px-3 py-1.5 text-sm"
                                        placeholder="URL LinkedIn"
                                    />
                                    <input
                                        type="text"
                                        value={member.social?.twitter || ''}
                                        onChange={(e) => updateSocial(i, 'twitter', e.target.value)}
                                        className="w-full border rounded px-3 py-1.5 text-sm"
                                        placeholder="URL Twitter / X"
                                    />
                                    <input
                                        type="email"
                                        value={member.social?.email || ''}
                                        onChange={(e) => updateSocial(i, 'email', e.target.value)}
                                        className="w-full border rounded px-3 py-1.5 text-sm"
                                        placeholder="Email"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMember(i)}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >
                                        Supprimer ce membre
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addMember}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                    + Ajouter un membre
                </button>
            </div>
        </div>
    );
}
