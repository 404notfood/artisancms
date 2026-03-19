import { Head, Link, router } from '@inertiajs/react';

interface SocialAccountData {
    id: number;
    provider: string;
    provider_email: string | null;
    provider_name: string | null;
    provider_avatar: string | null;
    created_at: string;
}

interface SocialAccountsProps {
    accounts: SocialAccountData[];
    providers: string[];
}

const PROVIDER_LABELS: Record<string, string> = {
    google: 'Google',
    facebook: 'Facebook',
    github: 'GitHub',
};

const PROVIDER_COLORS: Record<string, string> = {
    google: 'bg-red-50 text-red-700 border-red-200',
    facebook: 'bg-blue-50 text-blue-700 border-blue-200',
    github: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function SocialAccounts({ accounts, providers }: SocialAccountsProps) {
    const linkedProviders = accounts.map((a) => a.provider);

    function handleUnlink(provider: string) {
        if (!confirm(`Delier votre compte ${PROVIDER_LABELS[provider] || provider} ?`)) return;
        router.delete(`/members/account/social/${provider}`);
    }

    return (
        <>
            <Head title="Comptes sociaux" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <h1 className="mb-8 text-2xl font-bold text-gray-900">Comptes sociaux</h1>

                <div className="space-y-4">
                    {providers.map((provider) => {
                        const account = accounts.find((a) => a.provider === provider);
                        const isLinked = !!account;

                        return (
                            <div
                                key={provider}
                                className={`flex items-center justify-between rounded-xl border p-5 ${PROVIDER_COLORS[provider] || 'bg-white border-gray-200'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                                        <span className="text-lg font-bold">{PROVIDER_LABELS[provider]?.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{PROVIDER_LABELS[provider] || provider}</p>
                                        {isLinked ? (
                                            <p className="text-sm opacity-75">{account.provider_email || account.provider_name || 'Connecte'}</p>
                                        ) : (
                                            <p className="text-sm opacity-60">Non connecte</p>
                                        )}
                                    </div>
                                </div>

                                {isLinked ? (
                                    <button
                                        onClick={() => handleUnlink(provider)}
                                        className="rounded-lg border border-current px-3 py-1.5 text-sm font-medium opacity-75 transition-opacity hover:opacity-100"
                                    >
                                        Delier
                                    </button>
                                ) : (
                                    <Link
                                        href={`/members/auth/social/${provider}`}
                                        className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                                    >
                                        Connecter
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
