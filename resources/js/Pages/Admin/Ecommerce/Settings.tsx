import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import type { EcommerceSettingsData, PaymentMethodData } from '@/types/cms';
import StoreSettingsForm from './components/StoreSettingsForm';
import PaymentMethodsSection from './components/PaymentMethodsSection';

interface EcommerceSettingsProps {
    settings: EcommerceSettingsData;
    paymentMethods: (PaymentMethodData & { config?: Record<string, string> })[];
}

export default function EcommerceSettings({ settings, paymentMethods }: EcommerceSettingsProps) {
    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900">Parametres Boutique</h1>
            }
        >
            <Head title="Parametres Boutique" />

            <div className="mx-auto max-w-2xl space-y-6">
                <StoreSettingsForm settings={settings} />
                <PaymentMethodsSection paymentMethods={paymentMethods} />
            </div>
        </AdminLayout>
    );
}
