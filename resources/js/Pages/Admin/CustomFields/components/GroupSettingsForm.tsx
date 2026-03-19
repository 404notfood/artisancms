import { appliesToOptions } from './types';

interface GroupSettingsFormProps {
    name: string;
    slug: string;
    description: string;
    applies_to: string[];
    position: string;
    active?: boolean;
    errors: Record<string, string>;
    showActive?: boolean;
    nameInputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    onNameChange: (value: string) => void;
    onSlugChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onToggleAppliesTo: (value: string) => void;
    onPositionChange: (value: string) => void;
    onActiveChange?: (value: boolean) => void;
}

export function GroupSettingsForm({
    name,
    slug,
    description,
    applies_to,
    position,
    active,
    errors,
    showActive = false,
    nameInputProps,
    onNameChange,
    onSlugChange,
    onDescriptionChange,
    onToggleAppliesTo,
    onPositionChange,
    onActiveChange,
}: GroupSettingsFormProps) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Paramètres du groupe</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nom du groupe
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                        {...nameInputProps}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                        Slug
                    </label>
                    <input
                        id="slug"
                        type="text"
                        value={slug}
                        onChange={(e) => onSlugChange(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                    />
                    {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        S'applique à
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {appliesToOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onToggleAppliesTo(option.value)}
                                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                                    applies_to.includes(option.value)
                                        ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    {errors.applies_to && (
                        <p className="mt-1 text-sm text-red-600">{errors.applies_to}</p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="position"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Position dans l'éditeur
                    </label>
                    <select
                        id="position"
                        value={position}
                        onChange={(e) => onPositionChange(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="normal">Normal (sous le contenu)</option>
                        <option value="side">Barre latérale</option>
                    </select>
                </div>
            </div>

            {showActive && onActiveChange && (
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) => onActiveChange(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Groupe actif
                    </label>
                </div>
            )}
        </div>
    );
}
