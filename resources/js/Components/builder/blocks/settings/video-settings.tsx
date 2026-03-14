import type { BlockSettingsProps } from '../block-registry';

export default function VideoSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de la video</label>
                <input type="text" value={(block.props.url as string) || ''} onChange={(e) => onUpdate({ url: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ratio</label>
                <select value={(block.props.aspectRatio as string) || '16/9'} onChange={(e) => onUpdate({ aspectRatio: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="16/9">16:9</option>
                    <option value="4/3">4:3</option>
                    <option value="1/1">1:1</option>
                </select>
            </div>
        </div>
    );
}
