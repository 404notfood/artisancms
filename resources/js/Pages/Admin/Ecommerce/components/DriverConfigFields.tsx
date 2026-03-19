const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
const labelClass = 'block text-sm font-medium text-gray-700';

interface DriverConfigFieldsProps {
    driver: string;
    config: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

export default function DriverConfigFields({ driver, config, onChange }: DriverConfigFieldsProps) {
    if (driver === 'stripe') {
        return (
            <div className="space-y-3">
                <div>
                    <label className={labelClass}>Cle publique (Publishable Key)</label>
                    <input
                        type="text"
                        value={config.stripe_publishable_key || ''}
                        onChange={(e) => onChange('stripe_publishable_key', e.target.value)}
                        className={inputClass}
                        placeholder="pk_..."
                    />
                </div>
                <div>
                    <label className={labelClass}>Cle secrete (Secret Key)</label>
                    <input
                        type="password"
                        value={config.stripe_secret_key || ''}
                        onChange={(e) => onChange('stripe_secret_key', e.target.value)}
                        className={inputClass}
                        placeholder="sk_..."
                    />
                </div>
                <div>
                    <label className={labelClass}>Webhook Secret</label>
                    <input
                        type="password"
                        value={config.stripe_webhook_secret || ''}
                        onChange={(e) => onChange('stripe_webhook_secret', e.target.value)}
                        className={inputClass}
                        placeholder="whsec_..."
                    />
                </div>
            </div>
        );
    }

    if (driver === 'paypal') {
        return (
            <div className="space-y-3">
                <div>
                    <label className={labelClass}>Client ID</label>
                    <input
                        type="text"
                        value={config.paypal_client_id || ''}
                        onChange={(e) => onChange('paypal_client_id', e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Secret</label>
                    <input
                        type="password"
                        value={config.paypal_secret || ''}
                        onChange={(e) => onChange('paypal_secret', e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Mode</label>
                    <select
                        value={config.paypal_mode || 'sandbox'}
                        onChange={(e) => onChange('paypal_mode', e.target.value)}
                        className={inputClass}
                    >
                        <option value="sandbox">Sandbox (test)</option>
                        <option value="live">Live (production)</option>
                    </select>
                </div>
            </div>
        );
    }

    if (driver === 'bank_transfer') {
        return (
            <div className="space-y-3">
                <div>
                    <label className={labelClass}>Nom de la banque</label>
                    <input
                        type="text"
                        value={config.bank_name || ''}
                        onChange={(e) => onChange('bank_name', e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>IBAN</label>
                        <input
                            type="text"
                            value={config.bank_iban || ''}
                            onChange={(e) => onChange('bank_iban', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>BIC</label>
                        <input
                            type="text"
                            value={config.bank_bic || ''}
                            onChange={(e) => onChange('bank_bic', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Titulaire du compte</label>
                    <input
                        type="text"
                        value={config.bank_holder || ''}
                        onChange={(e) => onChange('bank_holder', e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>
        );
    }

    if (driver === 'cod') {
        return (
            <div>
                <label className={labelClass}>Instructions pour le client</label>
                <textarea
                    value={config.instructions || ''}
                    onChange={(e) => onChange('instructions', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Le paiement sera collecte a la livraison..."
                />
            </div>
        );
    }

    return null;
}
