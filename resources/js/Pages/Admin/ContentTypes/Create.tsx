import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import ContentTypeForm from './ContentTypeForm';

export default function ContentTypeCreate() {
    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">Nouveau type de contenu</h1>}
        >
            <Head title="Nouveau type de contenu" />
            <ContentTypeForm />
        </AdminLayout>
    );
}
