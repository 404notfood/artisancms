import type { BlockSettingsProps } from '../block-registry';

export default function CheckoutFormSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="showOrderSummary"
                    checked={block.props.showOrderSummary !== false}
                    onChange={(e) => onUpdate({ showOrderSummary: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <label htmlFor="showOrderSummary" className="text-sm font-medium text-gray-700">Afficher le resume de commande</label>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="requireAccount"
                    checked={block.props.requireAccount === true}
                    onChange={(e) => onUpdate({ requireAccount: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <label htmlFor="requireAccount" className="text-sm font-medium text-gray-700">Compte obligatoire</label>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL des CGV</label>
                <input
                    type="text"
                    value={(block.props.termsUrl as string) || ''}
                    onChange={(e) => onUpdate({ termsUrl: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="https://..."
                />
            </div>
        </div>
    );
}
