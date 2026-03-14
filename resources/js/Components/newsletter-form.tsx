import { useState, FormEvent } from 'react';

interface NewsletterFormProps {
    className?: string;
    compact?: boolean;
}

export default function NewsletterForm({ className = '', compact = false }: NewsletterFormProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

            const response = await fetch('/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                setMessage(data.message || 'Inscription r\u00e9ussie !');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.message || 'Une erreur est survenue.');
            }
        } catch {
            setStatus('error');
            setMessage('Une erreur est survenue. Veuillez r\u00e9essayer.');
        }
    };

    if (status === 'success') {
        return (
            <div className={`${className}`}>
                <div className="flex items-center gap-2 text-emerald-600 text-sm">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{message}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`${className}`}>
            <form onSubmit={handleSubmit} className={`flex ${compact ? 'gap-2' : 'flex-col sm:flex-row gap-2'}`}>
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Votre adresse email"
                    required
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        status === 'error' ? 'border-red-300' : ''
                    }`}
                    disabled={status === 'loading'}
                />
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {status === 'loading' ? 'Envoi...' : 'S\'abonner'}
                </button>
            </form>
            {status === 'error' && message && (
                <p className="text-xs text-red-600 mt-1">{message}</p>
            )}
        </div>
    );
}
