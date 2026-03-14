import type { BlockRendererProps } from '../block-registry';

export default function MapRenderer({ block }: BlockRendererProps) {
    const address = (block.props.address as string) || '';
    const lat = (block.props.lat as number) || 48.8566;
    const lng = (block.props.lng as number) || 2.3522;
    const zoom = (block.props.zoom as number) || 14;
    const height = (block.props.height as string) || '400px';
    const provider = (block.props.provider as string) || 'openstreetmap';

    const getMapUrl = () => {
        if (provider === 'google') {
            if (address) {
                return `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(address)}`;
            }
            return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
        }
        // OpenStreetMap (default)
        const bbox = 0.01 * (20 - zoom);
        return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - bbox},${lat - bbox},${lng + bbox},${lat + bbox}&layer=mapnik&marker=${lat},${lng}`;
    };

    return (
        <div className="w-full rounded overflow-hidden border" style={{ height }}>
            <iframe
                src={getMapUrl()}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={address || 'Carte'}
            />
            {address && (
                <noscript>
                    <p className="p-4 text-sm text-gray-600">{address}</p>
                </noscript>
            )}
        </div>
    );
}
