import { useState } from 'react';

export default function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        setTimeout(() => {
            setStatus('success');
            setEmail('');
        }, 1000);
    };

    return (
        <div className="artisancms-newsletter">
            <h4 className="mb-2 text-sm font-semibold text-white">
                Restez informe
            </h4>
            <p className="mb-4 text-sm text-slate-400">
                Recevez les dernieres mises a jour et fonctionnalites.
            </p>
            {status === 'success' ? (
                <p className="text-sm text-emerald-400">
                    Merci ! Vous etes inscrit.
                </p>
            ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {status === 'loading' ? '...' : "S'inscrire"}
                    </button>
                </form>
            )}
        </div>
    );
}
