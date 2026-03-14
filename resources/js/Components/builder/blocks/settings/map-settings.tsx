import type { BlockSettingsProps } from '../block-registry';

export default function MapSettings({ block, onUpdate }: BlockSettingsProps) {
    const address = (block.props.address as string) || '';
    const lat = (block.props.lat as number) || 48.8566;
    const lng = (block.props.lng as number) || 2.3522;
    const zoom = (block.props.zoom as number) || 14;
    const height = (block.props.height as string) || '400px';
    const provider = (block.props.provider as string) || 'openstreetmap';

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                <select value={provider} onChange={(e) => onUpdate({ provider: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="openstreetmap">OpenStreetMap</option>
                    <option value="google">Google Maps</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" value={address} onChange={(e) => onUpdate({ address: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="123 Rue de Paris, 75001 Paris" />
            </div>
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input type="number" step="0.0001" value={lat} onChange={(e) => onUpdate({ lat: parseFloat(e.target.value) || 0 })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input type="number" step="0.0001" value={lng} onChange={(e) => onUpdate({ lng: parseFloat(e.target.value) || 0 })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zoom ({zoom})</label>
                <input type="range" min={1} max={20} value={zoom} onChange={(e) => onUpdate({ zoom: parseInt(e.target.value) })} className="w-full" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hauteur</label>
                <input type="text" value={height} onChange={(e) => onUpdate({ height: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="400px" />
            </div>
        </div>
    );
}
